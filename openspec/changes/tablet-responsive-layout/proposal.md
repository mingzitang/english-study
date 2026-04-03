## Why

学员端（背单词、长难句、打卡等）当前以 **手机竖屏** 为主：全宽单栏、底部固定导航、`viewport` 禁止缩放。平板（约 768px–1024px 有效宽度及横屏）上仍表现为「放大的手机」，**可读宽度与导航结构未利用大屏**；部分交互（密集按钮、划选与涂鸦）在平板上需要更稳妥的触控与留白。需要在 **不破坏现有手机体验** 的前提下，为平板引入断点级布局与可访问性调整。

## What Changes

- 为 **学员端壳层**（`MainLayout`、关键学习视图）增加 **Tailwind `md`/`lg`（或可配置断点）** 下的布局：如主内容 **最大阅读宽度 + 水平居中**、平板 **侧栏或顶栏导航替代/补充底栏**（具体方案见 design）。
- **统一触控与间距**：平板断点下适当增大可点区域或间距，避免误触；长难句等高密度操作区在宽屏下可放宽排版。
- **`viewport` / meta**：评估是否对平板放宽 `maximum-scale` / `user-scalable`，或采用更贴近 PWA/可访问性的策略（可与手机分支区分或渐进增强）。
- **横屏与分栏**（可选/二期）：在足够宽度下支持两栏或固定侧栏，减少垂直滚动。
- **无 BREAKING**：默认仍以手机为基准；平板为增强呈现，不删除现有路由与组件契约。

## Capabilities

### New Capabilities

- `tablet-responsive-layout`: 学员端在中大视口（以平板为主）下的响应式壳层、内容宽度、导航形态与 `viewport`/可访问性相关约束。

### Modified Capabilities

- （无）仓库 `openspec/specs/` 下暂无已合并主规格；若日后有「应用壳层」总规，可将本能力合并进去。

## Impact

- **前端**：`src/layouts/MainLayout.vue`、`BottomNav.vue`、`src/layouts/LearnLayout.vue`；核心视图如 `WordLearningView.vue`、`SentenceLearningView.vue`、`VocabularyView.vue` 等按需加断点与容器类；`index.html` meta。
- **样式**：以现有 Tailwind v4 为主，必要时 `globals.css` / 安全区变量。
- **API / 后端**：无。
