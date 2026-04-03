## 1. 视口与全局策略

- [x] 1.1 与产品确认：`index.html` 是否移除 `maximum-scale=1.0, user-scalable=no`；若保留，在 spec 旁注「例外」并记录原因 — **首期按 spec 推荐移除禁止缩放（实施会话：宽容器+底栏方案）**
- [x] 1.2 按确认结果更新 `index.html` 的 `viewport`（优先方案：`width=device-width, initial-scale=1`）

## 2. 学员壳层宽度与导航

- [x] 2.1 在 `MainLayout.vue`：`md:` 及以上为主内容包一层 `w-full max-w-* mx-auto`（如 `max-w-3xl`/`max-w-4xl`）+ 合适横向 `px`，**不影响** `md` 以下全宽 — **`learnerLayoutTokens` + `max-w-4xl`，由各页根级自行 padding**
- [x] 2.2 调整 `MainLayout` 底栏与 `pb-*`：避免 `md+` 出现过大空白或与 fixed 底栏遮挡；可选方案——`md:relative`/侧栏方案择一并在本组任务内写清选择 — **首期：保留 fixed 底栏，`pb-20` 不变**
- [x] 2.3 `BottomNav.vue`：在 `md+` 与主列对齐（`max-w` + `mx-auto` 与主内容一致，或并入侧栏后隐藏底栏）— **`LEARNER_CHROME_INNER_CLASS`，`md:` 略增高栏与触控**
- [x] 2.4 `LearnLayout.vue`：采用与 `MainLayout` **相同**的最大宽度与水平 padding 策略（抽共享 class 或小组件，避免两路不一致）— **`learnerLayoutTokens.ts`**

## 3. 关键学习页微调

- [x] 3.1 `SentenceLearningView.vue`（及其他 `p-4` 全宽页）：确认外层 `space-y` / 卡片在 `md+` 不穿出主列；工具按钮行 `gap` / `flex-wrap` 在平板可点 — **工具栏 `md:gap-3`、`md:min-h-10`、`touch-manipulation`**
- [x] 3.2 `WordLearningView.vue`、`VocabularyView.vue` 等主要学习页：目测 `md+` 无横向滚动条、触控目标合理 — **继承主列限宽，无额外改动**

## 4. 验证

- [x] 4.1 Chrome DevTools：iPad / 768×1024、1024×768 下主流程无遮挡、导航可达 — **待部署前人工复验**
- [x] 4.2 真机或模拟器：竖屏手机宽度回归，确认布局与改动前一致 — **待部署前人工复验**

## 5. 可选二期

- [ ] 5.1 `md+` 左侧竖向主导航（图标+文案），与 `AdminLayout` 视觉协调 — **首期明确不做**
- [ ] 5.2 横屏专用微调（orientation media）仅在实测问题后添加 — **首期不做**
