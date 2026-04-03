<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '@/stores/learning'
import type { CustomWordInput } from '@/types'
import { learningApi } from '@/api/learning'
import AppButton from '@/components/common/AppButton.vue'

/** 划成分：连续浅蓝底；批注：红色底边线（与划成分可叠放、线不被底遮挡） */
const CONSTITUENT_BG = 'rgba(186, 230, 253, 0.55)'
const CONSTITUENT_BG_SOFT = 'rgba(186, 230, 253, 0.45)'
const CONSTITUENT_BRIDGE_BG = 'rgba(186, 230, 253, 0.52)'
const NOTE_UNDER_SOLID = '2px solid rgb(220, 38, 38)'
const NOTE_UNDER_DASH = '2px dashed rgba(220, 38, 38, 0.82)'
const NOTE_UNDER_PAD_BOTTOM = '3px'

/** 本地划分（浅蓝底，不落库） */
type HighlightRange = { id: string; start: number; end: number }
type CharSpan = { start: number; end: number }
/** 批注锚在句中字符区间（可多段），不落库 */
type LocalAnnotation = { id: string; spans: CharSpan[]; text: string }

type SentencePiece =
  | { kind: 'word'; text: string; start: number; end: number; constituent: boolean }
  | { kind: 'space'; text: string; start: number; end: number; constituent: boolean }

type DoodlePoint = { nx: number; ny: number }
type DoodleStroke = { points: DoodlePoint[] }

const router = useRouter()
const learningStore = useLearningStore()

const sentenceInteractRef = ref<HTMLElement | null>(null)
const constituentMode = ref(false)
/** 批注选词：可与划成分同时开启；同时开时点/滑优先批注 */
const notePickMode = ref(false)
const highlights = ref<HighlightRange[]>([])
const annotations = ref<LocalAnnotation[]>([])
/** 批注选词：按句中位置区分同形词（如多个 the） */
const notePickSpans = ref<CharSpan[]>([])
const draftNoteText = ref('')
/** 词块 DOM（用于测量批注标签位置） */
const wordElRefs = new Map<string, HTMLElement>()
/** 每条批注标签的 fixed 样式（按多词合并矩形水平居中） */
const annotationBubbleStyles = ref<Record<string, Record<string, string>>>({})
let layoutAnnRaf = 0
/** 居中批注输入：打开时不可再选词 */
const noteDraftModalOpen = ref(false)
const expandedAnnotationId = ref<string | null>(null)
const suppressNextWordClick = ref(false)

/** 会话涂鸦：落画在原句卡片区域，不落库 */
const doodleMode = ref(false)
const doodleCardRef = ref<HTMLElement | null>(null)
const doodleCanvasRef = ref<HTMLCanvasElement | null>(null)
const doodleStrokes = ref<DoodleStroke[]>([])
let activeDoodlePoints: DoodlePoint[] | null = null
const canUndoDoodle = computed(() => doodleStrokes.value.length > 0)

/** 滑动选中（划成分 / 批注） */
let dragPointerId: number | null = null
type DragState = { anchor: CharSpan; last: CharSpan; startX: number; startY: number }
const dragState = ref<DragState | null>(null)
/** 滑动过程中预览区间（字符偏移） */
const dragPreviewLoHi = ref<{ lo: number; hi: number } | null>(null)
const DRAG_DISTANCE_PX = 10

const userTranslation = ref('')
const showAnalysis = ref(false)
const selectedWords = ref<string[]>([])
const addWordMessage = ref('')
const pendingWords = ref<string[]>([])
const showWordModal = ref(false)
const pendingWord = ref('')
const customTranslation = ref('')
const customPhonetic = ref('')
const customPartOfSpeech = ref('')
const customExamples = ref('')
const lookupVisible = ref(false)
const lookupLoading = ref(false)
const lookupWord = ref('')
const lookupPhonetic = ref('')
const lookupSource = ref('')
const lookupMeanings = ref<Array<{ partOfSpeech: string; definition: string }>>([])
const lookupMessage = ref('')

const sentence = computed(() => learningStore.todaySentence)
const feedback = computed(() => learningStore.sentenceAIFeedback)

const draftSnippet = computed(() => {
  const full = sentence.value?.content ?? ''
  return [...notePickSpans.value]
    .sort((a, b) => a.start - b.start)
    .map(s => full.slice(s.start, s.end))
    .filter(Boolean)
    .join(' ')
})
const isLoading = computed(() => learningStore.loading)
/** 避免首屏未加载完时把「无句子」当成「已完成」 */
const sentenceLoadState = ref<'pending' | 'loading' | 'done'>('pending')
const sentenceReady = computed(() => sentenceLoadState.value === 'done')

async function loadSentence() {
  sentenceLoadState.value = 'loading'
  try {
    await learningStore.loadTodaySentence()
  } finally {
    sentenceLoadState.value = 'done'
  }
}

function randomId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`
}

function mergedHighlightSpans(ranges: HighlightRange[]): { start: number; end: number }[] {
  const sorted = [...ranges].map(r => ({ start: r.start, end: r.end })).sort((a, b) => a.start - b.start)
  const out: { start: number; end: number }[] = []
  for (const r of sorted) {
    if (r.end <= r.start) continue
    if (out.length === 0) {
      out.push({ start: r.start, end: r.end })
      continue
    }
    const last = out[out.length - 1]
    if (r.start <= last.end) last.end = Math.max(last.end, r.end)
    else out.push({ start: r.start, end: r.end })
  }
  return out
}

function segmentsFromMerged(
  full: string,
  merged: { start: number; end: number }[]
): { text: string; highlighted: boolean }[] {
  if (!full) return []
  if (merged.length === 0) return [{ text: full, highlighted: false }]
  const out: { text: string; highlighted: boolean }[] = []
  let pos = 0
  for (const m of merged) {
    const s = Math.max(0, Math.min(m.start, full.length))
    const e = Math.max(s, Math.min(m.end, full.length))
    if (s > pos) out.push({ text: full.slice(pos, s), highlighted: false })
    if (e > s) out.push({ text: full.slice(s, e), highlighted: true })
    pos = e
  }
  if (pos < full.length) out.push({ text: full.slice(pos), highlighted: false })
  return out
}

function selRemove() {
  const sel = window.getSelection()
  sel?.removeAllRanges()
}

function clearHighlights() {
  highlights.value = []
  selRemove()
}

const segmentPieces = computed(() => {
  const full = sentence.value?.content ?? ''
  return segmentsFromMerged(full, mergedHighlightSpans(highlights.value))
})

/** 始终拆到词/空格，划成分区间用 constituent 标记，便于与批注重叠交互 */
const interactivePieces = computed((): SentencePiece[] => {
  const full = sentence.value?.content ?? ''
  if (!full) return []
  const segs = segmentPieces.value
  const out: SentencePiece[] = []
  let offset = 0
  for (const s of segs) {
    const parts = s.text.split(/(\s+)/)
    for (const part of parts) {
      if (!part) continue
      const start = offset
      offset += part.length
      const c = s.highlighted
      if (/^\s+$/.test(part)) out.push({ kind: 'space', text: part, start, end: offset, constituent: c })
      else out.push({ kind: 'word', text: part, start, end: offset, constituent: c })
    }
  }
  return out
})

function spanKey(sp: CharSpan) {
  return `${sp.start}-${sp.end}`
}

function spansEqual(a: CharSpan, b: CharSpan) {
  return a.start === b.start && a.end === b.end
}

function setWordElRef(p: SentencePiece, el: unknown) {
  if (p.kind !== 'word') return
  const k = spanKey({ start: p.start, end: p.end })
  if (el) wordElRefs.set(k, el as HTMLElement)
  else wordElRefs.delete(k)
}

function readSpanAttrs(el: HTMLElement): CharSpan | null {
  let s = el.dataset.spStart ?? el.getAttribute('data-sp-start')
  let e = el.dataset.spEnd ?? el.getAttribute('data-sp-end')
  if (s == null || s === '' || e == null || e === '') return null
  const start = Number(s)
  const end = Number(e)
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return { start, end }
}

function getCharSpanFromTarget(target: EventTarget | null): CharSpan | null {
  let el = target as HTMLElement | null
  const root = sentenceInteractRef.value
  while (el && el !== root) {
    const sp = readSpanAttrs(el)
    if (sp) return sp
    el = el.parentElement
  }
  return null
}

function collectWordsOverlapping(lo: number, hi: number): CharSpan[] {
  const out: CharSpan[] = []
  for (const p of interactivePieces.value) {
    if (p.kind !== 'word') continue
    if (p.start < hi && p.end > lo) out.push({ start: p.start, end: p.end })
  }
  return out
}

function openNoteDraftModal() {
  if (notePickSpans.value.length === 0) return
  noteDraftModalOpen.value = true
}

function closeNoteDraftModal() {
  noteDraftModalOpen.value = false
}

function toggleAnnotationExpand(id: string) {
  expandedAnnotationId.value = expandedAnnotationId.value === id ? null : id
}

function annotationDisplayText(a: LocalAnnotation) {
  const t = a.text.trim()
  return t ? t : '（无文字）'
}

function scheduleLayoutAnnotationBubbles() {
  if (layoutAnnRaf) cancelAnimationFrame(layoutAnnRaf)
  layoutAnnRaf = requestAnimationFrame(() => {
    layoutAnnRaf = 0
    layoutAnnotationBubbles()
  })
}

function layoutAnnotationBubbles() {
  const out: Record<string, Record<string, string>> = {}
  for (const a of annotations.value) {
    if (a.spans.length === 0) continue
    const sorted = [...a.spans].sort((x: CharSpan, y: CharSpan) => x.start - y.start)
    const rects: DOMRect[] = []
    for (const s of sorted) {
      const el = wordElRefs.get(spanKey(s))
      if (el) rects.push(el.getBoundingClientRect())
    }
    if (rects.length === 0) continue
    const left = Math.min(...rects.map(r => r.left))
    const right = Math.max(...rects.map(r => r.right))
    const top = Math.min(...rects.map(r => r.top))
    const centerX = (left + right) / 2
    // 贴近选区顶边、略向下，避免盖住上一行；水平对齐多词中心
    out[a.id] = {
      position: 'fixed',
      left: `${centerX}px`,
      top: `${top + 2}px`,
      transform: 'translate(-50%, calc(-100% + 6px))',
      zIndex: '25',
      maxWidth: 'min(18rem, calc(100vw - 16px))'
    }
  }
  annotationBubbleStyles.value = out
}

function onSentencePointerDown(e: PointerEvent) {
  if (doodleMode.value) return
  if (noteDraftModalOpen.value) return
  if (!constituentMode.value && !notePickMode.value) return
  const sp = getCharSpanFromTarget(e.target)
  if (!sp) return
  dragPointerId = e.pointerId
  dragState.value = { anchor: sp, last: sp, startX: e.clientX, startY: e.clientY }
  dragPreviewLoHi.value = { lo: sp.start, hi: sp.end }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onSentencePointerMove(e: PointerEvent) {
  if (dragPointerId == null || e.pointerId !== dragPointerId || !dragState.value) return
  const fromTarget = getCharSpanFromTarget(e.target as Node)
  if (fromTarget) {
    dragState.value.last = fromTarget
  } else {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const sp = getCharSpanFromTarget(el)
    if (sp) dragState.value.last = sp
  }
  const ds = dragState.value
  const lo = Math.min(ds.anchor.start, ds.last.start)
  const hi = Math.max(ds.anchor.end, ds.last.end)
  dragPreviewLoHi.value = { lo, hi }
}

function onSentencePointerUp(e: PointerEvent) {
  if (dragPointerId == null || e.pointerId !== dragPointerId || !dragState.value) return
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* released */
  }
  const ds = dragState.value
  dragPointerId = null
  dragState.value = null
  dragPreviewLoHi.value = null

  const dist = Math.hypot(e.clientX - ds.startX, e.clientY - ds.startY)
  const rangeChanged = ds.anchor.start !== ds.last.start || ds.anchor.end !== ds.last.end
  const isDrag = dist > DRAG_DISTANCE_PX || rangeChanged

  if (!isDrag) return

  suppressNextWordClick.value = true
  nextTick(() => {
    suppressNextWordClick.value = false
  })

  const lo = Math.min(ds.anchor.start, ds.last.start)
  const hi = Math.max(ds.anchor.end, ds.last.end)

  if (notePickMode.value) {
    const words = collectWordsOverlapping(lo, hi)
    for (const w of words) {
      if (!notePickSpans.value.some((s: CharSpan) => spansEqual(s, w))) {
        notePickSpans.value.push(w)
      }
    }
  } else if (constituentMode.value) {
    highlights.value.push({ id: randomId(), start: lo, end: hi })
  }
  selRemove()
}

function onSentencePointerCancel(e: PointerEvent) {
  if (dragPointerId != null && e.pointerId === dragPointerId) {
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* */
    }
    dragPointerId = null
    dragState.value = null
    dragPreviewLoHi.value = null
  }
}

function toggleConstituentRange(span: CharSpan) {
  const i = highlights.value.findIndex((h: HighlightRange) => h.start === span.start && h.end === span.end)
  if (i >= 0) highlights.value.splice(i, 1)
  else highlights.value.push({ id: randomId(), start: span.start, end: span.end })
}

function removeHighlightsOverlappingRange(start: number, end: number) {
  highlights.value = highlights.value.filter((h: HighlightRange) => !(h.start < end && h.end > start))
}

function toggleNoteSpan(span: CharSpan) {
  const i = notePickSpans.value.findIndex((s: CharSpan) => spansEqual(s, span))
  if (i >= 0) notePickSpans.value.splice(i, 1)
  else notePickSpans.value.push(span)
}

/** 该词块是否属于已保存批注（任意一段完全命中） */
function isWordInSavedAnnotation(p: SentencePiece & { kind: 'word' }) {
  return annotations.value.some((a: LocalAnnotation) =>
    a.spans.some((s: CharSpan) => s.start === p.start && s.end === p.end)
  )
}

function pieceOverlapsCharRange(p: SentencePiece, lo: number, hi: number) {
  return p.start < hi && p.end > lo
}

function neighborWordPieces(pi: number): [SentencePiece & { kind: 'word' } | null, SentencePiece & { kind: 'word' } | null] {
  const arr = interactivePieces.value
  let prev: (SentencePiece & { kind: 'word' }) | null = null
  for (let i = pi - 1; i >= 0; i--) {
    const x = arr[i]
    if (x.kind === 'word') {
      prev = x
      break
    }
  }
  let next: (SentencePiece & { kind: 'word' }) | null = null
  for (let i = pi + 1; i < arr.length; i++) {
    const x = arr[i]
    if (x.kind === 'word') {
      next = x
      break
    }
  }
  return [prev, next]
}

function wordsShareSavedAnnotation(
  a: SentencePiece & { kind: 'word' },
  b: SentencePiece & { kind: 'word' }
) {
  return annotations.value.some((ann: LocalAnnotation) => {
    const hasA = ann.spans.some((s: CharSpan) => spansEqual(s, { start: a.start, end: a.end }))
    const hasB = ann.spans.some((s: CharSpan) => spansEqual(s, { start: b.start, end: b.end }))
    return hasA && hasB
  })
}

function wordInNotePick(w: SentencePiece & { kind: 'word' }) {
  return notePickSpans.value.some((s: CharSpan) => spansEqual(s, { start: w.start, end: w.end }))
}

function wordInDragPreview(w: SentencePiece & { kind: 'word' }) {
  const prev = dragPreviewLoHi.value
  if (!prev || (!constituentMode.value && !notePickMode.value)) return false
  return pieceOverlapsCharRange(w, prev.lo, prev.hi)
}

/** 空格：划成分蓝底与批注红线可叠加，避免缝与错位 */
function spaceBridgeOverlay(pi: number): Record<string, string> {
  const arr = interactivePieces.value
  const p = arr[pi]
  if (!p || p.kind !== 'space') return {}
  const [wa, wb] = neighborWordPieces(pi)
  if (!wa || !wb) return {}

  let note: Record<string, string> | null = null
  if (wordInNotePick(wa) && wordInNotePick(wb)) {
    note = noteSpaceBridgeStyle(NOTE_UNDER_SOLID)
  } else if (isWordInSavedAnnotation(wa) && isWordInSavedAnnotation(wb) && wordsShareSavedAnnotation(wa, wb)) {
    note = noteSpaceBridgeStyle(NOTE_UNDER_SOLID)
  } else if (wordInDragPreview(wa) && wordInDragPreview(wb) && notePickMode.value) {
    note = noteSpaceBridgeStyle(NOTE_UNDER_DASH)
  }

  let con: Record<string, string> | null = null
  if (wa.constituent && wb.constituent) {
    con = { backgroundColor: CONSTITUENT_BRIDGE_BG, borderRadius: '0' }
  }
  if (wordInDragPreview(wa) && wordInDragPreview(wb) && constituentMode.value && !notePickMode.value) {
    con = { backgroundColor: CONSTITUENT_BG, borderRadius: '0' }
  }

  if (con && note) return { ...con, ...note }
  if (note) return note
  if (con) return con
  return {}
}

function noteSpaceBridgeStyle(borderBottom: string): Record<string, string> {
  return {
    borderBottom,
    paddingBottom: NOTE_UNDER_PAD_BOTTOM,
    boxSizing: 'border-box',
    borderRadius: '0'
  }
}

function cleanToken(raw: string) {
  return raw.replace(/[.,!?;:]/g, '').trim().toLowerCase()
}

function wordPieceClasses(p: SentencePiece & { kind: 'word' }) {
  const clean = cleanToken(p.text)
  const inNotePick = notePickSpans.value.some((s: CharSpan) => spansEqual(s, { start: p.start, end: p.end }))
  const vocabSel = !!(clean && selectedWords.value.includes(clean))
  const base: Record<string, boolean> = {
    'cursor-pointer hover:text-primary transition-colors': true,
    /** 水平无留白，避免蓝底块之间露出卡片底色形成「接缝」 */
    'px-0': true,
    'rounded-none': !(vocabSel || inNotePick)
  }
  if (inNotePick) {
    return {
      ...base,
      'rounded-none': true
    }
  }
  if (vocabSel) {
    return {
      ...base,
      'rounded px-0.5 bg-sky-100 text-sky-700': true,
      'rounded-none': false
    }
  }
  return base
}

/** 批注用底边线（不用 text-decoration，避免被同一元素上的浅蓝底盖住） */
function noteLineStyle(style: 'solid' | 'dashed'): Record<string, string> {
  return {
    borderBottom: style === 'dashed' ? NOTE_UNDER_DASH : NOTE_UNDER_SOLID,
    paddingBottom: NOTE_UNDER_PAD_BOTTOM,
    boxSizing: 'border-box'
  }
}

/** 划成分：连续浅蓝底（无圆角拼接）；批注：红色底边线 */
function wordOverlayStyle(p: SentencePiece & { kind: 'word' }) {
  const inNotePick = notePickSpans.value.some((s: CharSpan) => spansEqual(s, { start: p.start, end: p.end }))
  const prev = dragPreviewLoHi.value
  const inPreview =
    prev != null &&
    (constituentMode.value || notePickMode.value) &&
    pieceOverlapsCharRange(p, prev.lo, prev.hi)

  if (inNotePick) {
    const line = { ...noteLineStyle('solid'), borderRadius: '0' as const }
    if (p.constituent) return { ...line, backgroundColor: CONSTITUENT_BG_SOFT }
    return line
  }
  if (inPreview && notePickMode.value) {
    const line = { ...noteLineStyle('dashed'), borderRadius: '0' as const }
    if (p.constituent) return { ...line, backgroundColor: CONSTITUENT_BG_SOFT }
    return line
  }
  if (inPreview && constituentMode.value && !notePickMode.value) {
    return {
      backgroundColor: CONSTITUENT_BG,
      borderRadius: '0'
    }
  }
  if (isWordInSavedAnnotation(p)) {
    const line = noteLineStyle('solid')
    if (p.constituent) {
      return {
        ...line,
        backgroundColor: CONSTITUENT_BG_SOFT,
        borderRadius: '0'
      }
    }
    return { ...line, borderRadius: '0' }
  }
  if (p.constituent) {
    return {
      backgroundColor: CONSTITUENT_BG,
      borderRadius: '0'
    }
  }
  return {}
}

function constituentWordDragPreviewClass(p: SentencePiece & { kind: 'word' }) {
  const prev = dragPreviewLoHi.value
  if (!prev || !constituentMode.value || notePickMode.value) return {}
  if (!p.constituent || !pieceOverlapsCharRange(p, prev.lo, prev.hi)) return {}
  return { 'ring-2 ring-sky-400/50 ring-inset': true }
}

function getDoodlePaint() {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  return {
    stroke: dark ? 'rgba(248, 113, 113, 0.92)' : 'rgba(220, 38, 38, 0.88)',
    lineWidth: 2.25
  }
}

function pointerToNorm(e: PointerEvent): DoodlePoint | null {
  const canvas = doodleCanvasRef.value
  if (!canvas) return null
  const r = canvas.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return null
  return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height }
}

function drawDoodleStroke(
  ctx: CanvasRenderingContext2D,
  points: DoodlePoint[],
  w: number,
  h: number,
  strokeStyle: string,
  lineWidth: number
) {
  if (points.length === 0) return
  ctx.strokeStyle = strokeStyle
  ctx.fillStyle = strokeStyle
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (points.length === 1) {
    const x = points[0].nx * w
    const y = points[0].ny * h
    ctx.beginPath()
    ctx.arc(x, y, Math.max(lineWidth * 0.45, 0.8), 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(points[0].nx * w, points[0].ny * h)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].nx * w, points[i].ny * h)
  }
  ctx.stroke()
}

function resizeDoodleCanvasAndRedraw() {
  const canvas = doodleCanvasRef.value
  const card = doodleCardRef.value
  if (!canvas || !card || !doodleMode.value) return
  const w = Math.max(1, card.clientWidth)
  const h = Math.max(1, card.clientHeight)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const { stroke, lineWidth } = getDoodlePaint()
  for (const s of doodleStrokes.value) {
    drawDoodleStroke(ctx, s.points, w, h, stroke, lineWidth)
  }
  if (activeDoodlePoints && activeDoodlePoints.length > 0) {
    drawDoodleStroke(ctx, activeDoodlePoints, w, h, stroke, lineWidth)
  }
}

function toggleDoodleMode() {
  const next = !doodleMode.value
  if (next) {
    constituentMode.value = false
    notePickMode.value = false
    dragPointerId = null
    dragState.value = null
    dragPreviewLoHi.value = null
  }
  doodleMode.value = next
  nextTick(() => resizeDoodleCanvasAndRedraw())
}

function onDoodlePointerDown(e: PointerEvent) {
  if (!doodleMode.value) return
  e.preventDefault()
  e.stopPropagation()
  const n = pointerToNorm(e)
  if (!n) return
  activeDoodlePoints = [n]
  ;(e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId)
  resizeDoodleCanvasAndRedraw()
}

function onDoodlePointerMove(e: PointerEvent) {
  if (!doodleMode.value || !activeDoodlePoints) return
  e.preventDefault()
  const n = pointerToNorm(e)
  if (!n) return
  const last = activeDoodlePoints[activeDoodlePoints.length - 1]
  if (Math.hypot(n.nx - last.nx, n.ny - last.ny) < 0.0015) return
  activeDoodlePoints.push(n)
  resizeDoodleCanvasAndRedraw()
}

function onDoodlePointerUp(e: PointerEvent) {
  if (!doodleMode.value || !activeDoodlePoints) return
  e.preventDefault()
  e.stopPropagation()
  try {
    ;(e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId)
  } catch {
    /* */
  }
  const n = pointerToNorm(e)
  if (n) activeDoodlePoints.push(n)
  if (activeDoodlePoints.length > 0) {
    doodleStrokes.value.push({ points: [...activeDoodlePoints] })
  }
  activeDoodlePoints = null
  resizeDoodleCanvasAndRedraw()
}

function onDoodlePointerCancel(e: PointerEvent) {
  if (!activeDoodlePoints) return
  try {
    ;(e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId)
  } catch {
    /* */
  }
  activeDoodlePoints = null
  resizeDoodleCanvasAndRedraw()
}

let doodleResizeObserver: ResizeObserver | null = null
function teardownDoodleResizeObserver() {
  doodleResizeObserver?.disconnect()
  doodleResizeObserver = null
}
function attachDoodleResizeObserver() {
  teardownDoodleResizeObserver()
  const card = doodleCardRef.value
  if (!card || typeof ResizeObserver === 'undefined') return
  doodleResizeObserver = new ResizeObserver(() => {
    if (doodleMode.value) resizeDoodleCanvasAndRedraw()
  })
  doodleResizeObserver.observe(card)
}

function clearDoodleStrokesOnly() {
  doodleStrokes.value = []
  activeDoodlePoints = null
  resizeDoodleCanvasAndRedraw()
}

function undoDoodleStroke() {
  if (doodleStrokes.value.length === 0) return
  doodleStrokes.value.pop()
  activeDoodlePoints = null
  resizeDoodleCanvasAndRedraw()
}

/** 切句 / 卸载时清空涂鸦与会话笔迹 */
function resetDoodleSession() {
  doodleMode.value = false
  doodleStrokes.value = []
  activeDoodlePoints = null
  const canvas = doodleCanvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

function resetLocalAnnotationState() {
  resetDoodleSession()
  highlights.value = []
  annotations.value = []
  notePickSpans.value = []
  draftNoteText.value = ''
  wordElRefs.clear()
  noteDraftModalOpen.value = false
  expandedAnnotationId.value = null
  dragPointerId = null
  dragState.value = null
  dragPreviewLoHi.value = null
  annotationBubbleStyles.value = {}
  constituentMode.value = false
  notePickMode.value = false
  selRemove()
}

watch(notePickMode, (on: boolean) => {
  if (!on) {
    notePickSpans.value = []
    draftNoteText.value = ''
    noteDraftModalOpen.value = false
    expandedAnnotationId.value = null
  }
})

watch(
  () => sentence.value?.id,
  () => {
    resetLocalAnnotationState()
    nextTick(() => attachDoodleResizeObserver())
  }
)

watch(annotations, () => scheduleLayoutAnnotationBubbles(), { deep: true })

watch(interactivePieces, () => scheduleLayoutAnnotationBubbles(), { deep: true })

watch(sentenceReady, (ok: boolean) => {
  if (ok)
    nextTick(() => {
      scheduleLayoutAnnotationBubbles()
      attachDoodleResizeObserver()
    })
})

watch(doodleMode, (on: boolean) => {
  if (on) nextTick(() => attachDoodleResizeObserver())
})

function onWinScrollOrResize() {
  scheduleLayoutAnnotationBubbles()
  if (doodleMode.value) resizeDoodleCanvasAndRedraw()
}

onMounted(() => {
  loadSentence()
  window.addEventListener('scroll', onWinScrollOrResize, true)
  window.addEventListener('resize', onWinScrollOrResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onWinScrollOrResize, true)
  window.removeEventListener('resize', onWinScrollOrResize)
  if (layoutAnnRaf) cancelAnimationFrame(layoutAnnRaf)
  teardownDoodleResizeObserver()
  resetLocalAnnotationState()
})

async function submitTranslation() {
  if (!sentence.value || !userTranslation.value.trim()) return
  const result = await learningStore.submitTranslation(sentence.value.id, userTranslation.value)
  if (result != null) {
    resetDoodleSession()
    await nextTick()
    resizeDoodleCanvasAndRedraw()
  }
}

function toggleAnalysis() {
  showAnalysis.value = !showAnalysis.value
}

function selectWord(word: string) {
  if (selectedWords.value[0] === word) {
    selectedWords.value = []
    return
  }
  selectedWords.value = [word]
}

function confirmDraftNote() {
  if (notePickSpans.value.length === 0) return
  annotations.value.push({
    id: randomId(),
    spans: notePickSpans.value.map((s: CharSpan) => ({ ...s })),
    text: draftNoteText.value.trim()
  })
  notePickSpans.value = []
  draftNoteText.value = ''
  noteDraftModalOpen.value = false
  expandedAnnotationId.value = null
  nextTick(() => scheduleLayoutAnnotationBubbles())
}

function clearNotePickDraft() {
  notePickSpans.value = []
  draftNoteText.value = ''
  noteDraftModalOpen.value = false
}

function removeAnnotation(id: string) {
  annotations.value = annotations.value.filter((a: LocalAnnotation) => a.id !== id)
  if (expandedAnnotationId.value === id) expandedAnnotationId.value = null
  nextTick(() => scheduleLayoutAnnotationBubbles())
}

function onWordPieceClick(p: SentencePiece, e: MouseEvent) {
  if (doodleMode.value) {
    e.preventDefault()
    return
  }
  if (suppressNextWordClick.value) {
    e.preventDefault()
    return
  }
  if (noteDraftModalOpen.value) {
    e.preventDefault()
    return
  }
  if (p.kind !== 'word') return

  const cleanWord = cleanToken(p.text)
  if (!cleanWord) return

  if (notePickMode.value) {
    e.preventDefault()
    toggleNoteSpan({ start: p.start, end: p.end })
    return
  }
  if (constituentMode.value) {
    e.preventDefault()
    if (p.constituent && e.detail >= 2) {
      removeHighlightsOverlappingRange(p.start, p.end)
      return
    }
    toggleConstituentRange({ start: p.start, end: p.end })
    return
  }
  if (!feedback.value) {
    e.preventDefault()
    selectWord(cleanWord)
    return
  }
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    toggleNoteSpan({ start: p.start, end: p.end })
    return
  }
  void runWordLookup(cleanWord)
}

async function runWordLookup(cleanWord: string) {
  selectWord(cleanWord)
  lookupVisible.value = true
  lookupLoading.value = true
  lookupWord.value = cleanWord
  lookupPhonetic.value = ''
  lookupSource.value = ''
  lookupMeanings.value = []
  lookupMessage.value = ''
  try {
    const result = await learningApi.lookupWord(cleanWord)
    lookupWord.value = result.word
    lookupPhonetic.value = result.phonetic || ''
    lookupSource.value = result.source === 'custom' ? '私有词库' : result.source === 'library' ? '公共词库' : ''
    lookupMeanings.value = result.meanings
    lookupMessage.value = result.found ? '' : (result.message || '词库暂无')
  } catch {
    lookupMessage.value = '查询失败，请稍后重试'
  } finally {
    lookupLoading.value = false
  }
}

async function addSelectedWordsToVocabulary() {
  if (!sentence.value) return
  addWordMessage.value = ''
  pendingWords.value = [...selectedWords.value]
  while (pendingWords.value.length > 0) {
    const word = pendingWords.value.shift() as string
    const result = await learningStore.addWordFromSentence(word, sentence.value.id)
    if (result.status === 'need_custom_info') {
      openCustomWordModal(word)
      return
    }
    if (result.status === 'error') {
      addWordMessage.value = result.message || '添加生词失败'
      continue
    }
    addWordMessage.value = result.status === 'exists' ? `「${word}」已在生词本` : `已添加「${word}」`
  }
  selectedWords.value = []
}

function openCustomWordModal(word: string) {
  pendingWord.value = word
  customTranslation.value = ''
  customPhonetic.value = ''
  customPartOfSpeech.value = ''
  customExamples.value = ''
  showWordModal.value = true
}

function closeCustomWordModal() {
  showWordModal.value = false
}

async function submitCustomWord() {
  if (!sentence.value || !pendingWord.value || !customTranslation.value.trim()) return
  const payload: CustomWordInput = {
    translation: customTranslation.value.trim(),
    phonetic: customPhonetic.value.trim() || undefined,
    partOfSpeech: customPartOfSpeech.value.trim() || undefined,
    examples: customExamples.value
      .split('\n')
      .map((x: string) => x.trim())
      .filter(Boolean)
  }
  const result = await learningStore.addWordFromSentence(pendingWord.value, sentence.value.id, payload)
  if (result.status === 'error') {
    addWordMessage.value = result.message || '添加生词失败'
    return
  }
  addWordMessage.value = result.status === 'exists' ? `「${pendingWord.value}」已在生词本` : `已添加「${pendingWord.value}」`
  showWordModal.value = false
  const handledWord = pendingWord.value
  pendingWord.value = ''
  selectedWords.value = selectedWords.value.filter((w: string) => w !== handledWord)

  while (pendingWords.value.length > 0) {
    const word = pendingWords.value.shift() as string
    const nextResult = await learningStore.addWordFromSentence(word, sentence.value.id)
    if (nextResult.status === 'need_custom_info') {
      openCustomWordModal(word)
      return
    }
  }
}

async function addToErrorBook() {
  if (!sentence.value) return
  await learningStore.addToErrorBook(sentence.value.id)
}

function continueToNewWords() {
  router.push({ name: 'WordLearning', query: { type: 'new' } })
}

function goToSummary() {
  router.push({ name: 'DailySummary' })
}

</script>

<template>
  <div class="flex flex-col min-h-screen bg-background">
    <!-- 主内容 -->
    <div class="flex-1 overflow-auto">
      <!-- 加载状态（与 store.loading 解耦，避免首屏 isLoading 仍为 false 时误展示「已完成」） -->
      <div v-if="!sentenceReady" class="flex items-center justify-center min-h-[50vh]">
        <div class="text-center px-4">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p class="text-muted-foreground">加载中...</p>
        </div>
      </div>
      
      <!-- 句子内容 -->
      <div v-else-if="sentence" class="p-4 space-y-4">
        <div class="flex flex-wrap items-center gap-2 md:gap-3 touch-manipulation">
          <button
            type="button"
            class="text-xs px-3 py-1.5 md:py-2 md:min-h-10 rounded-lg border border-border bg-background hover:bg-secondary transition-colors"
            :class="constituentMode ? 'border-primary text-primary bg-primary/5' : ''"
            @click="constituentMode = !constituentMode"
          >
            {{ constituentMode ? '退出划成分' : '划成分' }}
          </button>
          <button
            v-if="constituentMode"
            type="button"
            class="text-xs px-3 py-1.5 md:py-2 md:min-h-10 rounded-lg border border-border text-muted-foreground hover:bg-secondary"
            @click="clearHighlights"
          >
            清除划分
          </button>
          <button
            type="button"
            class="text-xs px-3 py-1.5 md:py-2 md:min-h-10 rounded-lg border border-border bg-background hover:bg-secondary transition-colors"
            :class="notePickMode ? 'border-primary text-primary bg-primary/5' : ''"
            @click="notePickMode = !notePickMode"
          >
            {{ notePickMode ? '退出批注选词' : '批注选词' }}
          </button>
          <button
            v-if="notePickMode && !noteDraftModalOpen && notePickSpans.length > 0"
            type="button"
            class="text-xs px-3 py-1.5 md:py-2 md:min-h-10 rounded-lg border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-100"
            @click="openNoteDraftModal"
          >
            填写批注
          </button>
          <button
            type="button"
            class="text-xs px-3 py-1.5 md:py-2 md:min-h-10 rounded-lg border border-border bg-background hover:bg-secondary transition-colors"
            :class="doodleMode ? 'border-primary text-primary bg-primary/5' : ''"
            @click="toggleDoodleMode"
          >
            {{ doodleMode ? '退出涂鸦' : '涂鸦' }}
          </button>
          <template v-if="doodleMode">
            <button
              type="button"
              class="text-xs px-3 py-1.5 md:py-2 md:min-h-10 rounded-lg border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none"
              :disabled="!canUndoDoodle"
              @click="undoDoodleStroke"
            >
              撤回上一笔
            </button>
            <button
              type="button"
              class="text-xs px-3 py-1.5 md:py-2 md:min-h-10 rounded-lg border border-border text-muted-foreground hover:bg-secondary"
              @click="clearDoodleStrokesOnly"
            >
              清除涂鸦
            </button>
          </template>
        </div>
        <p v-if="doodleMode" class="text-xs text-muted-foreground -mt-2">
          涂鸦：可画至<strong>卡片圆角外框</strong>（含四周留白）；「撤回上一笔」「清除涂鸦」仅影响笔迹。退出后可再开划成分/批注。
        </p>
        <p v-else-if="constituentMode && !notePickMode" class="text-xs text-muted-foreground -mt-2">
          划成分：<strong>连续浅蓝底</strong>标出语法块；点/滑跨选有<strong>浅蓝预览</strong>；单击词加/取消划分；<strong>双击</strong>已划词可清除相交划分。此模式下不可查义。
        </p>
        <p v-else-if="notePickMode && !constituentMode" class="text-xs text-muted-foreground -mt-2">
          批注：选词以<strong>红色连线</strong>标示（滑动时红色虚线预览）→「填写批注」；已保存同样为红线、不铺底色。
        </p>
        <p v-else-if="constituentMode && notePickMode" class="text-xs text-muted-foreground -mt-2">
          <strong>划成分</strong>（连续浅蓝底）与<strong>批注</strong>（红色底边线）可同时用，红线不会被蓝底盖住。点/滑<strong>优先批注</strong>；关闭「批注选词」后再划成分。划成分下单击调划分、双击已划词可清相交划分。
        </p>
        <p v-else class="text-xs text-muted-foreground -mt-2">
          未提交翻译时点词只用于选生词、不弹释义；提交后可点词查义。电脑也可
          <kbd class="px-1 rounded bg-secondary text-[10px]">Ctrl</kbd> /
          <kbd class="px-1 rounded bg-secondary text-[10px]">⌘</kbd> 点多词批注。
        </p>

        <!-- 难度和来源 -->
        <div class="flex items-center gap-2 text-xs">
          <span class="px-2 py-1 bg-primary/10 text-primary rounded-full">
            难度 {{ sentence.difficulty }}
          </span>
          <span v-if="sentence.source" class="px-2 py-1 bg-secondary text-muted-foreground rounded-full">
            {{ sentence.source }}
          </span>
        </div>
        
        <!-- 英文句子：外层无 padding，canvas inset-0 铺满至圆角边框；内层 p-4 仅用于正文留白 -->
        <div
          ref="doodleCardRef"
          class="bg-card rounded-xl border border-border relative overflow-hidden"
        >
          <div class="relative z-[1] p-4">
            <p class="text-xs text-muted-foreground mb-2">英文原句</p>
            <p
              ref="sentenceInteractRef"
              class="text-foreground leading-relaxed text-lg relative overflow-visible [overflow-wrap:anywhere]"
              :class="[
                constituentMode || notePickMode ? 'touch-pan-y select-none' : '',
                dragState ? 'touch-none' : '',
                doodleMode ? 'pointer-events-none' : ''
              ]"
              style="-webkit-user-select: none; user-select: none"
              @pointerdown="onSentencePointerDown"
              @pointermove="onSentencePointerMove"
              @pointerup="onSentencePointerUp"
              @pointercancel="onSentencePointerCancel"
            >
              <template v-for="(p, pi) in interactivePieces" :key="`${p.kind}-${p.start}-${p.end}`">
                <span
                  v-if="p.kind === 'space'"
                  class="whitespace-pre select-none inline-block align-baseline"
                  :style="spaceBridgeOverlay(pi)"
                  >{{ p.text }}</span
                >
                <span
                  v-else
                  class="relative inline-block align-baseline max-w-full overflow-visible transition-shadow"
                  :class="[
                    wordPieceClasses(p),
                    constituentMode && p.constituent ? 'cursor-pointer' : '',
                    constituentWordDragPreviewClass(p)
                  ]"
                  :style="wordOverlayStyle(p)"
                  :data-sp-start="String(p.start)"
                  :data-sp-end="String(p.end)"
                  :ref="(el) => setWordElRef(p, el)"
                  @click="onWordPieceClick(p, $event)"
                  >{{ p.text }}</span
                >
              </template>
            </p>

            <!-- 生词选择提示 -->
            <p
              v-if="selectedWords.length > 0"
              class="text-xs text-muted-foreground mt-3"
              :class="doodleMode ? 'pointer-events-none' : ''"
            >
              已选择 {{ selectedWords.length }} 个生词
              <button
                @click="addSelectedWordsToVocabulary"
                class="text-primary font-medium ml-2"
              >
                加入生词本
              </button>
            </p>
            <p v-if="addWordMessage" class="text-xs mt-2 text-primary">
              {{ addWordMessage }}
            </p>

            <div
              v-if="lookupVisible"
              class="mt-3 relative"
              :class="doodleMode ? 'pointer-events-none' : ''"
            >
              <div class="absolute -top-2 left-6 w-3 h-3 bg-card border-l border-t border-border rotate-45" />
              <div class="bg-card border border-border rounded-xl p-3">
                <p class="text-xs text-muted-foreground mb-1">单词释义</p>
                <p class="text-sm font-semibold text-foreground">
                  {{ lookupWord }} <span v-if="lookupPhonetic" class="text-xs text-muted-foreground ml-1">{{ lookupPhonetic }}</span>
                </p>
                <p v-if="lookupSource" class="text-[11px] text-primary mt-1">{{ lookupSource }}</p>
                <p v-if="lookupLoading" class="text-xs text-muted-foreground mt-2">查询中...</p>
                <template v-else>
                  <p v-if="lookupMessage" class="text-xs text-muted-foreground mt-2">{{ lookupMessage }}</p>
                  <ul v-else class="mt-2 space-y-1">
                    <li v-for="(meaning, index) in lookupMeanings" :key="index" class="text-xs text-foreground">
                      <span class="text-primary mr-1">{{ meaning.partOfSpeech }}</span>{{ meaning.definition }}
                    </li>
                  </ul>
                </template>
              </div>
            </div>
          </div>
          <canvas
            v-show="doodleMode"
            ref="doodleCanvasRef"
            class="absolute inset-0 z-[2] touch-none select-none cursor-crosshair pointer-events-auto rounded-xl"
            aria-label="涂鸦画布"
            @pointerdown="onDoodlePointerDown"
            @pointermove="onDoodlePointerMove"
            @pointerup="onDoodlePointerUp"
            @pointercancel="onDoodlePointerCancel"
          />
        </div>
        
        <!-- 翻译输入区 (未提交时显示) -->
        <div v-if="!feedback" class="space-y-3">
          <div class="bg-card rounded-xl border border-border overflow-hidden">
            <textarea
              v-model="userTranslation"
              placeholder="请输入你的翻译..."
              rows="4"
              class="w-full p-4 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
            />
          </div>
          
          <AppButton
            @click="submitTranslation"
            block
            size="lg"
            :loading="isLoading"
            :disabled="!userTranslation.trim()"
          >
            提交翻译
          </AppButton>
        </div>
        
        <!-- AI 反馈区 (提交后显示) -->
        <div v-if="feedback" class="space-y-4">
          <!-- 评分 -->
          <!-- <div class="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 text-center">
            <p class="text-sm text-muted-foreground mb-1">翻译得分</p>
            <p class="text-4xl font-bold" :class="[
              feedback.score >= 80 ? 'text-accent' : 
              feedback.score >= 60 ? 'text-primary' : 
              'text-warning'
            ]">
              {{ feedback.score }}
            </p>
          </div> -->
          
          <!-- 参考译文 -->
          <div class="bg-card rounded-xl p-4 border border-border">
            <p class="text-xs text-muted-foreground mb-2">参考译文</p>
            <p class="text-foreground leading-relaxed">{{ feedback.referenceTranslation }}</p>
          </div>
          
          <!-- 问题点 -->
          <!-- <div v-if="feedback.issues.length > 0" class="bg-card rounded-xl p-4 border border-border">
            <p class="text-xs text-muted-foreground mb-2">问题反馈</p>
            <ul class="space-y-2">
              <li 
                v-for="(issue, index) in feedback.issues" 
                :key="index"
                class="flex items-start gap-2 text-sm text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-warning shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" x2="12" y1="8" y2="12"/>
                  <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                {{ issue }}
              </li>
            </ul>
          </div> -->
          
          <!-- 句子拆解 (可折叠) -->
          <div class="bg-card rounded-xl border border-border overflow-hidden">
            <button 
              @click="toggleAnalysis"
              class="w-full flex items-center justify-between p-4 text-left"
            >
              <span class="text-sm font-medium text-foreground">句子结构分析</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                class="text-muted-foreground transition-transform"
                :class="{ 'rotate-180': showAnalysis }"
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <div v-if="showAnalysis" class="px-4 pb-4 border-t border-border pt-3">
              <p class="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {{ feedback.structureAnalysis }}
              </p>
            </div>
          </div>
          
          <!-- 加入错题本建议 -->
          <div v-if="feedback.shouldAddToErrorBook" class="bg-destructive/5 rounded-xl p-4 border border-destructive/20">
            <div class="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-destructive shrink-0 mt-0.5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-foreground">建议加入错题本</p>
                <p class="text-xs text-muted-foreground mt-1">这个句子可能需要再练习一下</p>
              </div>
              <AppButton
                @click="addToErrorBook"
                size="sm"
                variant="outline"
              >
                加入
              </AppButton>
            </div>
          </div>
          
          <!-- 继续按钮 -->
          <div class="pt-2 space-y-3">
            <AppButton
              @click="continueToNewWords"
              block
              size="lg"
            >
              继续学习新词
            </AppButton>
            <AppButton
              @click="goToSummary"
              variant="ghost"
              block
            >
              查看今日总结
            </AppButton>
          </div>
        </div>
      </div>
      
      <!-- 加载失败 -->
      <div v-else-if="learningStore.error" class="flex items-center justify-center min-h-[50vh] px-4">
        <div class="text-center max-w-sm">
          <p class="text-sm text-destructive mb-4">{{ learningStore.error }}</p>
          <AppButton @click="loadSentence">重试</AppButton>
        </div>
      </div>
      
      <!-- 无句子（已学完或暂无分配） -->
      <div v-else class="flex items-center justify-center min-h-[50vh] px-4">
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-foreground mb-2">今日长难句已完成</h2>
          <p class="text-sm text-muted-foreground mb-6">继续保持学习节奏!</p>
          <AppButton @click="continueToNewWords">
            继续学习
          </AppButton>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="noteDraftModalOpen"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
        @click.self="closeNoteDraftModal"
      >
        <div
          class="w-full max-w-sm rounded-xl border-2 border-sky-200 bg-sky-50 p-3 shadow-2xl dark:border-sky-700 dark:bg-sky-950/95"
          @click.stop
        >
          <p class="text-xs font-medium text-sky-900 dark:text-sky-100">批注</p>
          <p class="mt-1 text-[11px] text-sky-800/90 dark:text-sky-200/90 line-clamp-3" :title="draftSnippet">
            已选：{{ draftSnippet }}
          </p>
          <textarea
            v-model="draftNoteText"
            rows="4"
            class="mt-2 w-full rounded-md border border-sky-200 bg-white/90 px-2 py-1.5 text-sm text-foreground placeholder:text-sky-600/50 dark:border-sky-800 dark:bg-sky-900/60 dark:placeholder:text-sky-400/40 resize-none focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="输入批注…"
          />
          <div class="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="text-xs text-muted-foreground px-2 py-1.5 rounded-md border border-transparent hover:bg-sky-100 dark:hover:bg-sky-900"
              @click="closeNoteDraftModal"
            >
              返回选词
            </button>
            <button
              type="button"
              class="text-xs text-muted-foreground px-2 py-1.5 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900"
              @click="clearNotePickDraft"
            >
              清空所选
            </button>
            <button
              type="button"
              class="text-xs rounded-md bg-sky-600 text-white px-3 py-1.5 hover:bg-sky-700"
              @click="confirmDraftNote"
            >
              保存批注
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <template v-for="a in annotations" :key="'ann-bubble-' + a.id">
        <div
          v-if="annotationBubbleStyles[a.id]"
          class="pointer-events-auto text-left [writing-mode:horizontal-tb]"
          :style="annotationBubbleStyles[a.id]"
        >
          <div
            class="relative inline-block max-w-[min(18rem,calc(100vw-1rem))] cursor-default select-none px-0.5"
            @click.stop="toggleAnnotationExpand(a.id)"
          >
            <span
              class="block whitespace-normal break-words text-[8px] font-normal leading-snug text-sky-900 dark:text-sky-100"
              >{{ annotationDisplayText(a) }}</span
            >
            <button
              v-if="expandedAnnotationId === a.id"
              type="button"
              class="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-border bg-background/95 px-0.5 text-sm font-light text-muted-foreground shadow active:text-destructive"
              aria-label="删除批注"
              @click.stop="removeAnnotation(a.id)"
            >
              ×
            </button>
          </div>
        </div>
      </template>
    </Teleport>

    <div
      v-if="showWordModal"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      @click.self="closeCustomWordModal"
    >
      <div class="w-full max-w-sm bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 class="text-base font-semibold text-foreground">补充单词信息</h3>
        <p class="text-xs text-muted-foreground">
          「{{ pendingWord }}」不在公共词库，请先补充翻译（必填）
        </p>
        <div class="space-y-2">
          <label class="text-xs text-muted-foreground">翻译（必填）</label>
          <input v-model="customTranslation" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="请输入中文释义" />
        </div>
        <div class="space-y-2">
          <label class="text-xs text-muted-foreground">音标（可选）</label>
          <input v-model="customPhonetic" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="如 /ˈwɜːd/" />
        </div>
        <div class="space-y-2">
          <label class="text-xs text-muted-foreground">词性（可选）</label>
          <input v-model="customPartOfSpeech" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="如 n. / v." />
        </div>
        <div class="space-y-2">
          <label class="text-xs text-muted-foreground">例句（可选，一行一个）</label>
          <textarea v-model="customExamples" rows="3" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" />
        </div>
        <div class="flex gap-2 pt-1">
          <AppButton variant="ghost" block @click="closeCustomWordModal">取消</AppButton>
          <AppButton block :disabled="!customTranslation.trim()" @click="submitCustomWord">保存并加入</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
