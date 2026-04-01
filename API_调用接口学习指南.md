# API 调用接口学习指南（本项目实战版）

这份文档按你当前项目的真实代码来讲，目标是让你能看懂并自己扩展。

## 1. 总体调用链路

前端调用顺序：

1. 页面（View）触发事件
2. Pinia Store 处理状态和业务流程
3. API 层调用 Supabase
4. Store 更新状态，页面响应刷新

核心路径：

- 认证：`views/auth` -> `stores/auth.ts` -> `api/auth.ts`
- 学习：`views/*` -> `stores/learning.ts` -> `api/learning.ts`

## 2. Supabase 客户端初始化

`src/lib/supabase.ts` 做两件事：

- 校验 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- 返回单例客户端 `getSupabase()`

好处：所有请求都走同一个入口，后续更容易维护。

## 3. 认证接口实现（`authApi`）

文件：`src/api/auth.ts`

### 3.1 登录

- 调用 `signInWithPassword({ email, password })`
- 取 `session.access_token`
- 将 Supabase `user` 映射为项目自己的 `User`

### 3.2 注册

- 本地先校验 `password === confirmPassword`
- `signUp` 时将 `examType` 写入 `user_metadata.exam_type`
- 若开启邮箱验证且无 `session`，提示用户去邮箱验证

### 3.3 会话恢复

- `restoreSupabaseAuth()`：刷新后恢复登录态
- `subscribeSupabaseAuth()`：监听登录态变化（刷新 token / 登出）

## 4. 学习接口实现（`learningApi`）

文件：`src/api/learning.ts`

### 4.1 通用前置

大多数方法先执行：

- `auth.getUser()` 获取当前用户
- 读取 `profiles.exam_type` 判定英语一/二

### 4.2 单词模块

- `getTodayWords(type)`：组合 `words + user_word_progress + user_settings`
- `updateWordMastery`：`upsert user_word_progress`
- `addWordFromSentence`：写入 `words`、`user_word_progress`、`vocabulary_book`

### 4.3 长难句模块

- `getTodaySentence`：按 `exam_type` 获取句子
- `submitSentenceTranslation`：写 `user_sentence_progress`，低分自动加 `error_book`
- `addToErrorBook`：手动写入 `error_book`

### 4.4 计划、统计、打卡

- `getTodayPlan`：按当天进度聚合完成数
- `getStats`：累计统计 + 连续打卡 + 周趋势
- `checkIn`：`upsert checkin_records`（`user_id + date` 唯一）

### 4.5 错题本与生词本读取

- `getErrorBookItems`：`error_book` 联表 `sentences`
- `getVocabularyItems`：`vocabulary_book` 联表 `words`
- `getCheckInRecords`：读取 `checkin_records`

## 5. Store 层推荐写法

以 `stores/learning.ts` 为例：

1. action 开始：`loading = true`，清空 `error`
2. `await learningApi.xxx()`
3. 成功后写 state
4. 失败时设置错误提示
5. `finally` 关闭 loading

## 6. 页面层推荐写法

页面只做三件事：

- 收集输入
- 调用 store action
- 渲染状态

建议不在页面直接写 Supabase 查询（统一走 store/api）。

## 7. 新增功能时的标准步骤

1. 先改数据库（表/字段/RLS）
2. 再改 `types`
3. 再改 `api`
4. 再改 `store`
5. 最后改页面并验证

## 8. 常见排错

1. 查询为空：先检查 RLS 是否允许 `auth.uid()`
2. `upsert` 不生效：检查 `onConflict` 是否对应唯一索引
3. 统计异常：检查时间窗口（start/end）与时区
4. 登录异常：检查 Supabase Auth 的邮箱验证配置

---

你可以把这份文档当成后续功能开发模板：每次按“表 -> types -> api -> store -> view”的顺序推进，基本不会乱。
