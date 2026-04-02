-- =============================================================================
-- 每日长难句分配：0 点若「当前句已做完」则换新句，未做完则保留原句
-- =============================================================================
-- 适用：Supabase (PostgreSQL)
--
-- 实现思路
-- 1) 表 user_sentence_daily_assignment：每个用户（按 exam_type）保存「当前分配」的 sentence_id
-- 2) 函数 refresh_daily_sentence_assignments()：在每天 0 点（建议用 pg_cron）执行
--    - 若该用户当前句在 user_sentence_progress 中已有记录（视为已提交/完成）→ 换一句
--    - 否则 → 不换 sentence_id
-- 3) 新用户：首次进入长难句页时，若尚无分配行，由前端或触发器插入首句（见文末「初始化」）
--
-- 注意
-- - Supabase pg_cron 使用 UTC。中国（北京时间）无夏令时：UTC+8。
--   北京时间每天 05:00 = 当天 UTC 21:00（前一自然日的 21:00 UTC 对应次日北京 05:00，见下方 cron）。
-- - 「完成」判定：本脚本以 user_sentence_progress 存在对应 (user_id, sentence_id) 行为准（与当前前端提交翻译一致）。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 分配表：一人一档（按 user_id + exam_type）
-- -----------------------------------------------------------------------------
create table if not exists public.user_sentence_daily_assignment (
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_type text not null check (exam_type in ('english1', 'english2')),
  sentence_id uuid not null references public.sentences (id) on delete restrict,
  last_refreshed_at timestamptz not null default now(),
  primary key (user_id, exam_type)
);

comment on table public.user_sentence_daily_assignment is '用户当前长难句分配；每日任务在「已完成当前句」时才换新句';

create index if not exists idx_user_sentence_daily_assignment_sentence
  on public.user_sentence_daily_assignment (sentence_id);

alter table public.user_sentence_daily_assignment enable row level security;

-- 用户只能读写自己的分配
create policy "users_select_own_sentence_assignment"
  on public.user_sentence_daily_assignment for select
  using (auth.uid() = user_id);

create policy "users_insert_own_sentence_assignment"
  on public.user_sentence_daily_assignment for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_sentence_assignment"
  on public.user_sentence_daily_assignment for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 服务角色 / 定时任务若需批量更新，可额外加 policy 或使用 service_role 调用 SECURITY DEFINER 函数（推荐后者）

-- -----------------------------------------------------------------------------
-- 2. 辅助：当前句是否已有进度（视为「已写完」）
-- -----------------------------------------------------------------------------
create or replace function public.sentence_is_completed_for_user(p_user_id uuid, p_sentence_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_sentence_progress usp
    where usp.user_id = p_user_id
      and usp.sentence_id = p_sentence_id
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. 为某用户选下一句（同 exam_type，尽量不与当前句相同；句子少时会重复）
-- -----------------------------------------------------------------------------
create or replace function public.pick_next_sentence_id(p_user_id uuid, p_exam_type text, p_exclude_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_next uuid;
begin
  select s.id into v_next
  from public.sentences s
  where s.exam_type = p_exam_type
    and (p_exclude_id is null or s.id <> p_exclude_id)
  order by random()
  limit 1;

  if v_next is null and p_exclude_id is not null then
    select s.id into v_next
    from public.sentences s
    where s.exam_type = p_exam_type
    order by random()
    limit 1;
  end if;

  return v_next;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. 每日 0 点（由 cron 调用）：仅对「当前句已完成」的用户换新句
-- -----------------------------------------------------------------------------
create or replace function public.refresh_daily_sentence_assignments()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_profile_exam text;
  v_next uuid;
begin
  for r in
    select a.user_id, a.exam_type, a.sentence_id
    from public.user_sentence_daily_assignment a
  loop
    if public.sentence_is_completed_for_user(r.user_id, r.sentence_id) then
      v_next := public.pick_next_sentence_id(r.user_id, r.exam_type, r.sentence_id);
      if v_next is not null then
        update public.user_sentence_daily_assignment
        set sentence_id = v_next,
            last_refreshed_at = now()
        where user_id = r.user_id
          and exam_type = r.exam_type;
      end if;
    end if;
  end loop;

  -- 可选：给「有 profiles 但尚无分配行」的用户补首句（避免只依赖前端）
  for r in
    select p.id as user_id,
           case when p.exam_type = 'english2' then 'english2' else 'english1' end as exam_type
    from public.profiles p
    where not exists (
      select 1
      from public.user_sentence_daily_assignment a
      where a.user_id = p.id
        and a.exam_type = case when p.exam_type = 'english2' then 'english2' else 'english1' end
    )
  loop
    v_next := public.pick_next_sentence_id(r.user_id, r.exam_type, null);
    if v_next is not null then
      insert into public.user_sentence_daily_assignment (user_id, exam_type, sentence_id)
      values (r.user_id, r.exam_type, v_next)
      on conflict (user_id, exam_type) do nothing;
    end if;
  end loop;
end;
$$;

comment on function public.refresh_daily_sentence_assignments() is
  '定时任务：已完成当前分配句子的用户换新句；未完成的保留原句。';

-- 允许通过 PostgREST（service_role）调用，供 GitHub Actions 等外部定时任务触发（勿暴露给 anon）
grant execute on function public.refresh_daily_sentence_assignments() to service_role;

-- -----------------------------------------------------------------------------
-- 5. pg_cron：北京时间每天 05:00 执行（Supabase pg_cron 为 UTC）
-- -----------------------------------------------------------------------------
-- 换算：北京时间 05:00 = UTC 前一日 21:00（因 UTC+8，5-8=-3 → 前一日 21:00 UTC）
-- cron 表达式（分 时 日 月 周）：每天 UTC 21:00 执行 = 对应「每个北京日历日的早晨 5 点」附近
--
-- 若曾用旧表达式创建过同名任务，请先取消再建（名称按你实际填写）：
--   select cron.unschedule(jobid) from cron.job where jobname = 'refresh-daily-sentences';
--
-- 创建任务（北京时间每日约 5:00 刷新一次）：
-- select cron.schedule(
--   'refresh-daily-sentences',
--   '0 21 * * *',
--   $$ select public.refresh_daily_sentence_assignments(); $$
-- );
--
-- 查看已注册任务：
-- select * from cron.job;
--
-- -----------------------------------------------------------------------------
-- 5b. 报错 relation "cron.job" does not exist
-- -----------------------------------------------------------------------------
-- 原因：未安装或未启用 pg_cron。部分 Supabase 套餐可能不提供数据库内 pg_cron。
--
-- 处理 A（若控制台支持）：
--   Dashboard → Database → Extensions → 搜索 pg_cron → Enable
--   然后再执行上面的 cron.schedule。
--
-- 处理 B（推荐替代）：用项目里 GitHub Actions 定时调用 RPC，不依赖 pg_cron：
--   见 .github/workflows/refresh-daily-sentences.yml
--   在仓库 Secrets 配置：
--     SUPABASE_URL（项目 URL）
--     SUPABASE_SERVICE_ROLE_KEY（仅用于此工作流，勿提交到代码）
--   北京时间 5:00 = cron 使用 UTC 21:00，工作流里已按此配置。

-- -----------------------------------------------------------------------------
-- 6. 前端 / API 配合说明（需在应用代码中修改）
-- -----------------------------------------------------------------------------
-- getTodaySentence / getTodaySentenceState 中查询句子时：
-- 1) 先 select sentence_id from user_sentence_daily_assignment where user_id = ? and exam_type = ?
-- 2) 若无行：insert 一条（pick_next_sentence_id 或第一条 sentences）再读
-- 3) 若有行：按 sentence_id 从 sentences 取全文
--
-- 这样用户白天看到的「今日句」与表里分配一致；定时任务只对「已完成」用户换句。
