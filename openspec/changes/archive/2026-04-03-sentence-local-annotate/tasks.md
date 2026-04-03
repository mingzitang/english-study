## 1. Data model and lifecycle (frontend only)

- [x] 1.1 Define TypeScript types for highlight ranges `{ start: number; end: number; id: string }` and annotation items `{ id: string; wordKeysOrOffsets: ...; text: string }` aligned with `design.md`
- [x] 1.2 Hold state in `SentenceLearningView.vue` (or dedicated composable) with `onBeforeUnmount` / route leave cleanup so nothing persists remotely

## 2. Light-red constituent spans

- [x] 2.1 Implement sentence rendering from `sentence.content` using character offsets so highlights can wrap substrings without breaking existing logic
- [x] 2.2 Add UI mode toggle or equivalent (e.g. 「划成分」) to avoid conflicting with single-tap lookup; apply `bg-red-100`/design-token classes to highlight spans
- [x] 2.3 Support multiple non-persisted spans and a clear action to reset highlights for the session

## 3. Multi-select words and top annotation strip

- [x] 3.1 Extend token selection to allow multi-word selection for annotations (keyboard or explicit control per `design.md`)
- [x] 3.2 Add a sticky/top-fixed strip listing annotation cards (selected words + text input); allow delete per card
- [x] 3.3 Ensure annotations stay visible while navigating within the same view until unmount

## 4. Integration and regression

- [x] 4.1 Verify existing lookup / add-to-vocabulary flows when not in override mode; document behavior when in 「划成分」mode
- [x] 4.2 Manual test: leave page → return → highlights and notes are gone; no new network payloads for annotate data

## 5. Polish (optional)

- [x] 5.1 Mobile/touch: basic selection fallback or short note in UI if drag-select is desktop-first
