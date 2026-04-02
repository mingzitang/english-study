-- 单词复习 SRS：生词本 + 昨日标记为不认识/模糊 + 间隔 1/2/7/15 天
-- 在 Supabase SQL Editor 中执行；执行后前端复习队列与 updateWordMastery 才会按新规则写入。

-- 1) 进度表扩展
alter table public.user_word_progress
  add column if not exists srs_step integer not null default 0;

alter table public.user_word_progress
  add column if not exists last_rating text;

alter table public.user_word_progress
  add column if not exists last_rating_at timestamptz;

alter table public.user_word_progress
  add column if not exists last_study_mode text;

comment on column public.user_word_progress.last_study_mode is '最近一次学习场景：new=新词学习 review=复习（用于首页今日进度，避免仅加生词本误计）';

comment on column public.user_word_progress.srs_step is 'SRS 阶段 0–4：认识则递增；模糊/不认识归零';

comment on column public.user_word_progress.last_rating is '最近一次点击：known | fuzzy | unknown';

comment on column public.user_word_progress.last_rating_at is '最近一次评分时间（用于「昨日不认识」队列）';

-- 2) 支持仅私有词（无公共 words.id）一条进度：需允许 word_id 为空并增加 custom_word_id
alter table public.user_word_progress
  add column if not exists custom_word_id uuid references public.user_custom_words (id) on delete cascade;

-- 原 (user_id, word_id) 唯一约束在 word_id 可空时可能不适用于多行 null，改为部分唯一索引
alter table public.user_word_progress drop constraint if exists user_word_progress_user_id_word_id_key;

create unique index if not exists user_word_progress_user_word_id_unique
  on public.user_word_progress (user_id, word_id)
  where word_id is not null;

create unique index if not exists user_word_progress_user_custom_word_unique
  on public.user_word_progress (user_id, custom_word_id)
  where custom_word_id is not null;

alter table public.user_word_progress alter column word_id drop not null;

alter table public.user_word_progress drop constraint if exists user_word_progress_word_or_custom_chk;

alter table public.user_word_progress add constraint user_word_progress_word_or_custom_chk
  check (
    (word_id is not null and custom_word_id is null)
    or (word_id is null and custom_word_id is not null)
  );

-- RLS：若表上已有策略引用列，按需为 custom_word_id 调整（多数项目沿用 user_id 即可）
