## Why

长难句练习页需要支持**临时划分句子成分**：用户希望在原文上自行标浅红辅助阅读，并对**任意选中的单词**做**仅前端的批注**（顶部悬浮输入），离开页面即丢弃，不增加后端负担。当前页面仅支持点击查词/选词生词本，缺少可视化划分与本地备注能力。

## What Changes

- 在长难句学习视图（`SentenceLearningView`）内，对英文句子区域增加**本地状态**的**浅红高亮**能力：用户可通过拖拽或分段选择等方式，在句子上标记一段或多段浅红背景（具体交互以 `design.md` 为准）。
- 支持**选中一个或多个单词**（与现有选词逻辑协调或扩展），在**视口顶部固定区域**展示**可编辑批注条**（可多组：每组对应当前选中词集合 + 用户输入的文字）；批注在**本次会话内持久**，直至离开该页面。
- **不**新增 API、**不**写入 Supabase；状态仅存于 Vue 组件 / Pinia 会话状态（可选），路由离开时销毁。

## Capabilities

### New Capabilities

- `sentence-local-annotate`: 长难句页面临时浅红划分与多词批注（纯前端、无持久化）

### Modified Capabilities

- （无：现有「长难句学习 / 查词 / 生词本」需求规格未变，仅 UI 增强。）

## Impact

- **主要**：`src/views/learn/SentenceLearningView.vue` 及可能的子组件（句子渲染、顶部批注条）。
- **可选**：`src/stores/learning.ts` 若需跨子组件共享批注状态；否则仅用组件内 `ref`/`reactive`。
- **无**：数据库、Edge Functions、`learningApi` 变更。
