## Context

- 项目为 Vue 3 + Tailwind v4 的 Web 学员端；`MainLayout` / `LearnLayout` 以 **底栏 + 顶栏** 为主，`AdminLayout` 已在 `md:` 使用侧栏。
- `index.html` 使用 `maximum-scale=1.0, user-scalable=no`，利于「类 App」手机体验，但不利于 **平板阅读缩放与无障碍**。
- 学习页（长难句、单词等）大量 **pointer/gesture** 逻辑，大屏需避免过宽行宽导致难读或过密导致误触。

## Goals / Non-Goals

**Goals:**

- 在 **≥768px（`md`）** 视口下，学员端主流程 **布局合理**：主的内容区有 **最大宽度并居中**，利用横向留白；导航在平板横屏/竖屏下 **可用、可发现**。
- **不破坏 &lt;768px** 现有手机布局与交互为回归基线。
- 视口策略与 **无障碍** 方向对齐（允许缩放或至少文档化取舍）。

**Non-Goals:**

- 为 Android/iPad 分别写原生壳或独立应用商店包。
- 完全复刻桌面端复杂多窗布局；首期不做「任意窗口分屏」级特性。
- 管理端 `AdminLayout` 的重复改造（已具备 `md` 侧栏，仅在被明显问题时增量修）。

## Decisions

1. **断点语言**  
   - 与 Tailwind 默认一致：**`md` = 768px，`lg` = 1024px**。平板主要落在 `md`–`lg`；更宽可按 `lg` 微调留白。

2. **主内容宽度**  
   - 学员端 `MainLayout` 内 `RouterView` 外包一层 **`max-w-*`（建议 42–48rem）+ `mx-auto` + `w-full` + 水平 `px`**，仅在 `md:` 及以上生效；手机不加 max 或保持 `max-w-none`。

3. **导航形态（推荐首选方案）**  
   - **`md+`**：保留顶栏；**底栏改为非 fixed 或改为左侧竖向图标导航（`md:flex` + `w-14`–`w-56`）**，主区 `flex-1`；**或** 底栏保留但 `md:pb-6` 且底栏 `md:relative md:border-t-0` 改为贴底内嵌 —— 实现时选 **侵入最小** 且与设计一致的一种，在 tasks 中锁定一种并全仓统一。  
   - **备选**：仅加宽容器、**保留 fixed bottom nav**（实现快，平板仍略「手机」）。

4. **`LearnLayout`（返回栈学习页）**  
   - 与 `MainLayout` **同宽策略**（共用 wrapper 类或抽 `AppContentShell`），避免长难句页与首页宽度不一致。

5. **`viewport` meta**  
   - **推荐**调整为 `width=device-width, initial-scale=1`（**去掉** `maximum-scale=1.0, user-scalable=no`），以兼顾平板与 WCAG 缩放需求；若产品强制禁止缩放，须在 spec 中降级为「文档化例外」并保留风险提示。

6. **高密度学习视图**  
   - `SentenceLearningView` 等：在 `md+` 可为工具按钮行增加 `flex-wrap` / `gap` / `min-h-touch`（如 44px）类；**不强制**重交互逻辑，仅布局与安全间距。

7. **横屏**  
   - 依赖 flex + max-width；不单独写 orientation media 除非实测溢出；若侧栏方案选中，横屏自然受益。

## Risks / Trade-offs

- **[Risk]** 去掉 `user-scalable=no` 后部分用户双指缩放误触 → **缓解**：内容区 max-width 降低缩放需求；保留 `touch-action` 在绘制模式。  
- **[Risk]** 侧栏导航改动面大 → **缓解**：首版可先 **仅 max-width 居中 + 调整底栏内边距** ，侧栏放二期。  
- **[Risk]** `safe-area` 与侧栏叠加 → **缓解**：沿用现有 `safe-area-*` 工具类测 iPad。

## Migration Plan

- 纯前端；逐文件加响应式类；回归手机真机与 Chrome DevTools iPad 尺寸。  
- 回滚：revert 布局与 meta 即可。

## Resolved / 首期实施

1. **Viewport**：按 spec 推荐，去掉 `user-scalable=no` / `maximum-scale=1`，便于平板与无障碍缩放。  
2. **导航**：首期采用 **仅宽容器 + 保留 fixed 底栏**（`max-w-4xl` 与底栏内层对齐）；侧栏记入 tasks 二期。
