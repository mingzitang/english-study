import type {
  Word,
  WordProgressKey,
  Sentence,
  DailyPlan,
  LearningStats,
  CheckInRecord,
  WordMastery,
  AIFeedback,
  ErrorBookItem,
  VocabularyBookItem,
  TodaySentenceState,
  CustomWordInput,
  AddWordResult,
  WordLookupResult
} from '@/types'
import { getSupabase } from '@/lib/supabase'

type WordRow = {
  id: string
  word: string
  phonetic: string | null
  meanings: unknown
  examples: unknown
  created_at: string
}

type SentenceRow = {
  id: string
  content: string
  translation: string
  analysis: string
  source: string | null
  difficulty: 1 | 2 | 3 | 4 | 5
  exam_type: 'english1' | 'english2'
  created_at: string
}

type PrivateVocabularyRow = {
  id: string
  user_id: string
  word_id?: string | null
  source: VocabularyBookItem['source']
  source_id?: string | null
  mastery: WordMastery
  added_at: string
  words?: WordRow | WordRow[] | null
  custom_word?: string | null
}

type UserCustomWordRow = {
  id: string
  user_id: string
  word: string
  phonetic: string | null
  meanings: unknown
  examples: unknown
  exam_type: 'english1' | 'english2' | 'both'
  created_at: string
  updated_at: string
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error
  } = await getSupabase().auth.getUser()
  if (error || !user) throw new Error('Please login first')
  return user.id
}

async function getExamType(userId: string): Promise<'english1' | 'english2'> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('exam_type')
    .eq('id', userId)
    .single()

  if (error || !data) return 'english1'
  return data.exam_type === 'english2' ? 'english2' : 'english1'
}

function mapWordRow(row: WordRow, source: Word['source'] = 'library', sourceId?: string): Word {
  const meanings = normalizeMeanings(row.meanings)
  const examples = Array.isArray(row.examples) ? (row.examples as string[]) : []

  return {
    id: row.id,
    word: row.word,
    phonetic: row.phonetic || undefined,
    meanings,
    examples,
    source,
    sourceId,
    createdAt: row.created_at
  }
}

function normalizeMeanings(raw: unknown): Word['meanings'] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const partOfSpeech =
        (typeof obj.partOfSpeech === 'string' ? obj.partOfSpeech : null) ||
        (typeof obj.pos === 'string' ? obj.pos : null) ||
        'other'
      const definition =
        (typeof obj.definition === 'string' ? obj.definition : null) ||
        (typeof obj.meaning === 'string' ? obj.meaning : null)
      if (!definition) return null
      return { partOfSpeech, definition }
    })
    .filter((x): x is Word['meanings'][number] => x !== null)
}

function mapSentenceRow(row: SentenceRow): Sentence {
  return {
    id: row.id,
    content: row.content,
    translation: row.translation,
    analysis: row.analysis,
    source: row.source || undefined,
    difficulty: row.difficulty,
    examType: row.exam_type,
    createdAt: row.created_at
  }
}

/**
 * 学习日：北京时间当日 05:00 至次日 05:00（与长难句日切一致）
 */
function getBeijingLearningDayBounds(now: Date = new Date()): {
  date: string
  startISO: string
  endISO: string
} {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const parts = fmt.formatToParts(now)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0'
  let y = parseInt(get('year'), 10)
  let m = parseInt(get('month'), 10)
  let d = parseInt(get('day'), 10)
  const hour = parseInt(get('hour'), 10)
  if (Number.isNaN(hour) || hour < 5) {
    const t = new Date(Date.UTC(y, m - 1, d))
    t.setUTCDate(t.getUTCDate() - 1)
    y = t.getUTCFullYear()
    m = t.getUTCMonth() + 1
    d = t.getUTCDate()
  }
  const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const startISO = new Date(`${date}T05:00:00+08:00`).toISOString()
  const end = new Date(new Date(`${date}T05:00:00+08:00`).getTime() + 24 * 60 * 60 * 1000)
  const endISO = end.toISOString()
  return { date, startISO, endISO }
}

/** 上一完整学习日 [昨日 05:00 北京, 今日 05:00 北京) 的 UTC 区间，用于「昨日不认识/模糊」 */
function getBeijingPreviousLearningDayWindow(now: Date = new Date()): { startISO: string; endISO: string } {
  const b = getBeijingLearningDayBounds(now)
  const endISO = b.startISO
  const startISO = new Date(new Date(endISO).getTime() - 24 * 60 * 60 * 1000).toISOString()
  return { startISO, endISO }
}

/** 某条 user_sentence_progress 是否算「今日已完成」（与分配句对齐时使用） */
function isSentenceProgressDoneToday(
  progress: { last_attempt_date: string | null; updated_at: string } | null,
  bounds: ReturnType<typeof getBeijingLearningDayBounds>
): boolean {
  if (!progress) return false
  const { date, startISO, endISO } = bounds
  if (progress.last_attempt_date === date) return true
  if (progress.updated_at >= startISO && progress.updated_at < endISO) return true
  return false
}

function addCalendarDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00.000Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** 当前 srs_step 下点击「认识」后，间隔多少天再复习 */
function daysAfterKnownMark(prevStep: number): number {
  switch (prevStep) {
    case 0:
      return 1
    case 1:
      return 2
    case 2:
      return 7
    case 3:
      return 15
    default:
      return 15
  }
}

function nextStepAfterKnown(prevStep: number): number {
  return Math.min(prevStep + 1, 4)
}

function wordProgressKeyString(w: Word): string {
  if (w.progressKey?.kind === 'library') return `l:${w.progressKey.wordId}`
  if (w.progressKey?.kind === 'custom') return `c:${w.progressKey.customWordId}`
  return `id:${w.id}`
}

function vocabularyItemToReviewWord(item: VocabularyBookItem): Word | null {
  if (item.wordId) {
    return {
      ...item.word,
      id: item.wordId,
      progressKey: { kind: 'library', wordId: item.wordId },
      learningMode: 'review'
    }
  }
  if (item.source === 'manual' && item.sourceId) {
    return {
      ...item.word,
      id: `custom-${item.sourceId}`,
      progressKey: { kind: 'custom', customWordId: item.sourceId },
      learningMode: 'review'
    }
  }
  return null
}

type ProgressRow = {
  word_id: string | null
  custom_word_id: string | null
  next_review_date: string | null
  last_rating: string | null
  last_rating_at: string | null
  srs_step: number | null
}

function isReviewDue(row: ProgressRow | undefined | null, todayDate: string): boolean {
  if (!row) return true
  if (!row.next_review_date) return true
  return row.next_review_date <= todayDate
}

/**
 * 读取 user_sentence_daily_assignment；若无则插入首条 sentences（与 sql/daily_sentence_assignment.sql 配套）
 */
async function getOrCreateAssignedSentenceId(
  userId: string,
  examType: 'english1' | 'english2',
  supabase: ReturnType<typeof getSupabase>
): Promise<string> {
  const { data: existing, error: readError } = await supabase
    .from('user_sentence_daily_assignment')
    .select('sentence_id')
    .eq('user_id', userId)
    .eq('exam_type', examType)
    .maybeSingle()

  if (readError) throw new Error(readError.message)
  if (existing?.sentence_id) return existing.sentence_id as string

  const { data: firstSentence, error: pickError } = await supabase
    .from('sentences')
    .select('id')
    .eq('exam_type', examType)
    .limit(1)
    .maybeSingle()

  if (pickError) throw new Error(pickError.message)
  if (!firstSentence?.id) throw new Error('No sentence available')

  const { error: insError } = await supabase.from('user_sentence_daily_assignment').insert({
    user_id: userId,
    exam_type: examType,
    sentence_id: firstSentence.id,
    last_refreshed_at: new Date().toISOString()
  })
  if (insError) throw new Error(insError.message)

  return firstSentence.id as string
}

function toAIFeedback(raw: unknown): AIFeedback | null {
  if (!raw || typeof raw !== 'object') return null
  const maybe = raw as Partial<AIFeedback>
  if (
    typeof maybe.referenceTranslation !== 'string' ||
    !Array.isArray(maybe.issues) ||
    typeof maybe.structureAnalysis !== 'string' ||
    typeof maybe.shouldAddToErrorBook !== 'boolean' ||
    typeof maybe.score !== 'number'
  ) {
    return null
  }
  return {
    referenceTranslation: maybe.referenceTranslation,
    issues: maybe.issues.filter((x): x is string => typeof x === 'string'),
    structureAnalysis: maybe.structureAnalysis,
    shouldAddToErrorBook: maybe.shouldAddToErrorBook,
    score: maybe.score
  }
}

async function wordFromProgressRow(
  supabase: ReturnType<typeof getSupabase>,
  examType: 'english1' | 'english2',
  row: ProgressRow
): Promise<Word | null> {
  if (row.word_id) {
    const { data, error } = await supabase
      .from('words')
      .select('id,word,phonetic,meanings,examples,created_at,exam_type')
      .eq('id', row.word_id)
      .maybeSingle()
    if (error || !data) return null
    const wr = data as WordRow & { exam_type?: string }
    const et = wr.exam_type
    if (et && et !== examType && et !== 'both') return null
    return {
      ...mapWordRow(wr, 'library'),
      progressKey: { kind: 'library', wordId: row.word_id },
      learningMode: 'review'
    }
  }
  if (row.custom_word_id) {
    const { data, error } = await supabase
      .from('user_custom_words')
      .select('id,user_id,word,phonetic,meanings,examples,exam_type,created_at,updated_at')
      .eq('id', row.custom_word_id)
      .maybeSingle()
    if (error || !data) return null
    const cw = data as UserCustomWordRow
    if (cw.exam_type !== examType && cw.exam_type !== 'both') return null
    return {
      id: `custom-${cw.id}`,
      word: cw.word,
      phonetic: cw.phonetic || undefined,
      meanings: normalizeMeanings(cw.meanings),
      examples: Array.isArray(cw.examples) ? (cw.examples as string[]) : [],
      source: 'manual',
      createdAt: cw.created_at,
      progressKey: { kind: 'custom', customWordId: cw.id },
      learningMode: 'review'
    }
  }
  return null
}

function progressRowForWord(w: Word, m: Map<string, ProgressRow>): ProgressRow | undefined {
  if (w.progressKey?.kind === 'library') return m.get(`l:${w.progressKey.wordId}`)
  if (w.progressKey?.kind === 'custom') return m.get(`c:${w.progressKey.customWordId}`)
  return undefined
}

async function computeReviewCandidates(
  userId: string,
  examType: 'english1' | 'english2',
  getVocabularyItems: () => Promise<VocabularyBookItem[]>
): Promise<Word[]> {
  const supabase = getSupabase()
  const bj = getBeijingLearningDayBounds()
  const todayDate = bj.date
  const prevWindow = getBeijingPreviousLearningDayWindow()

  const vocabItems = await getVocabularyItems()
  const candVocab: VocabularyBookItem[] = []
  const libIds = new Set<string>()
  const custIds = new Set<string>()
  for (const item of vocabItems) {
    if (item.wordId) libIds.add(item.wordId)
    else if (item.source === 'manual' && item.sourceId) custIds.add(item.sourceId)
  }

  let libExamOk = new Set<string>()
  if (libIds.size > 0) {
    const { data: examLib } = await supabase
      .from('words')
      .select('id,exam_type')
      .in('id', [...libIds])
    for (const r of examLib ?? []) {
      const row = r as { id: string; exam_type: string }
      if (row.exam_type === examType || row.exam_type === 'both') libExamOk.add(row.id)
    }
  }
  let custExamOk = new Set<string>()
  if (custIds.size > 0) {
    const { data: examCust } = await supabase
      .from('user_custom_words')
      .select('id,exam_type')
      .in('id', [...custIds])
    for (const r of examCust ?? []) {
      const row = r as { id: string; exam_type: string }
      if (row.exam_type === examType || row.exam_type === 'both') custExamOk.add(row.id)
    }
  }

  for (const item of vocabItems) {
    if (item.wordId) {
      if (libExamOk.has(item.wordId)) candVocab.push(item)
    } else if (item.source === 'manual' && item.sourceId) {
      if (custExamOk.has(item.sourceId)) candVocab.push(item)
    }
  }

  const vocabWords: Word[] = []
  for (const item of candVocab) {
    const w = vocabularyItemToReviewWord(item)
    if (w) vocabWords.push(w)
  }

  const vocabLibIds = [...new Set(vocabWords.filter(v => v.progressKey?.kind === 'library').map(v => (v.progressKey as Extract<WordProgressKey, { kind: 'library' }>).wordId))]
  const vocabCustIds = [...new Set(vocabWords.filter(v => v.progressKey?.kind === 'custom').map(v => (v.progressKey as Extract<WordProgressKey, { kind: 'custom' }>).customWordId))]

  const progressByKey = new Map<string, ProgressRow>()
  if (vocabLibIds.length > 0) {
    const { data: pl } = await supabase
      .from('user_word_progress')
      .select('word_id,custom_word_id,next_review_date,last_rating,last_rating_at,srs_step')
      .eq('user_id', userId)
      .in('word_id', vocabLibIds)
    for (const p of pl ?? []) {
      const row = p as ProgressRow
      if (row.word_id) progressByKey.set(`l:${row.word_id}`, row)
    }
  }
  if (vocabCustIds.length > 0) {
    const { data: pc } = await supabase
      .from('user_word_progress')
      .select('word_id,custom_word_id,next_review_date,last_rating,last_rating_at,srs_step')
      .eq('user_id', userId)
      .in('custom_word_id', vocabCustIds)
    for (const p of pc ?? []) {
      const row = p as ProgressRow
      if (row.custom_word_id) progressByKey.set(`c:${row.custom_word_id}`, row)
    }
  }

  const { data: yesterdayRows } = await supabase
    .from('user_word_progress')
    .select('word_id,custom_word_id,next_review_date,last_rating,last_rating_at,srs_step')
    .eq('user_id', userId)
    .gte('last_rating_at', prevWindow.startISO)
    .lt('last_rating_at', prevWindow.endISO)
    .in('last_rating', ['unknown', 'fuzzy'])

  const yesterdayKeys = new Set<string>()
  const yesterdayWords: Word[] = []
  for (const raw of yesterdayRows ?? []) {
    const row = raw as ProgressRow
    if (row.word_id) progressByKey.set(`l:${row.word_id}`, row)
    if (row.custom_word_id) progressByKey.set(`c:${row.custom_word_id}`, row)
    const w = await wordFromProgressRow(supabase, examType, row)
    if (w) {
      yesterdayKeys.add(wordProgressKeyString(w))
      yesterdayWords.push(w)
    }
  }

  const vocabDue: Word[] = []
  for (const w of vocabWords) {
    const row = progressRowForWord(w, progressByKey)
    if (isReviewDue(row, todayDate)) vocabDue.push(w)
  }

  const merged = new Map<string, Word>()
  for (const w of yesterdayWords) merged.set(wordProgressKeyString(w), w)
  for (const w of vocabDue) {
    const k = wordProgressKeyString(w)
    if (!merged.has(k)) merged.set(k, w)
  }

  const list = [...merged.values()]
  list.sort((a, b) => {
    const ay = yesterdayKeys.has(wordProgressKeyString(a)) ? 0 : 1
    const by = yesterdayKeys.has(wordProgressKeyString(b)) ? 0 : 1
    if (ay !== by) return ay - by
    const pa = progressRowForWord(a, progressByKey)?.next_review_date || '9999-12-31'
    const pb = progressRowForWord(b, progressByKey)?.next_review_date || '9999-12-31'
    return pa.localeCompare(pb)
  })

  return list
}

async function buildReviewWords(
  userId: string,
  examType: 'english1' | 'english2',
  getVocabularyItems: () => Promise<VocabularyBookItem[]>,
  limit: number
): Promise<Word[]> {
  const list = await computeReviewCandidates(userId, examType, getVocabularyItems)
  return list.slice(0, limit)
}

/** 词库中尚无学习进度的词数量（与 getTodayWords('new') 口径一致，用于首页动态目标上限） */
async function countNewWordsAvailable(
  userId: string,
  examType: 'english1' | 'english2',
  supabase: ReturnType<typeof getSupabase>
): Promise<number> {
  const { data: words, error: wordsError } = await supabase
    .from('words')
    .select('id')
    .in('exam_type', [examType, 'both'])
    .limit(300)
  if (wordsError) throw new Error(wordsError.message)
  const wordRows = (words ?? []) as { id: string }[]
  const wordIds = wordRows.map(w => w.id)
  if (wordIds.length === 0) return 0

  const { data: progressRows, error: progressError } = await supabase
    .from('user_word_progress')
    .select('word_id')
    .eq('user_id', userId)
    .in('word_id', wordIds)
  if (progressError) throw new Error(progressError.message)

  const progressSet = new Set((progressRows ?? []).map((p: { word_id: string }) => p.word_id))
  return wordRows.filter(w => !progressSet.has(w.id)).length
}

export const learningApi = {
  async lookupWord(word: string): Promise<WordLookupResult> {
    const userId = await getCurrentUserId()
    const examType = await getExamType(userId)
    const normalizedWord = word.trim().toLowerCase()
    const supabase = getSupabase()

    const { data: libraryRows, error: libraryError } = await supabase
      .from('words')
      .select('id,word,phonetic,meanings,examples,created_at')
      .in('exam_type', [examType, 'both'])
      .ilike('word', normalizedWord)
      .limit(1)
    if (libraryError) throw new Error(libraryError.message)
    if (libraryRows && libraryRows.length > 0) {
      const row = libraryRows[0] as WordRow
      return {
        found: true,
        word: row.word,
        source: 'library',
        meanings: normalizeMeanings(row.meanings),
        phonetic: row.phonetic || undefined
      }
    }

    const { data: customRows, error: customError } = await supabase
      .from('user_custom_words')
      .select('word,phonetic,meanings')
      .eq('user_id', userId)
      .ilike('word', normalizedWord)
      .limit(1)
    if (customError) throw new Error(customError.message)
    if (customRows && customRows.length > 0) {
      const row = customRows[0] as { word: string; phonetic: string | null; meanings: unknown }
      return {
        found: true,
        word: row.word,
        source: 'custom',
        meanings: normalizeMeanings(row.meanings),
        phonetic: row.phonetic || undefined
      }
    }

    return {
      found: false,
      word: normalizedWord,
      meanings: [],
      message: '词库暂无'
    }
  },

  async getTodayWords(type: 'new' | 'review'): Promise<Word[]> {
    const userId = await getCurrentUserId()
    const examType = await getExamType(userId)
    const supabase = getSupabase()

    const { data: settings } = await supabase
      .from('user_settings')
      .select('daily_new_words,daily_review_words')
      .eq('user_id', userId)
      .maybeSingle()

    const limit = type === 'new' ? (settings?.daily_new_words ?? 10) : (settings?.daily_review_words ?? 20)

    if (type === 'review') {
      return buildReviewWords(userId, examType, () => learningApi.getVocabularyItems(), limit)
    }

    const { data: words, error: wordsError } = await supabase
      .from('words')
      .select('id,word,phonetic,meanings,examples,created_at')
      .in('exam_type', [examType, 'both'])
      .limit(300)
    if (wordsError) throw new Error(wordsError.message)

    const wordRows = (words ?? []) as WordRow[]
    const wordIds = wordRows.map(w => w.id)
    if (wordIds.length === 0) return []

    const { data: progressRows, error: progressError } = await supabase
      .from('user_word_progress')
      .select('word_id,next_review_date')
      .eq('user_id', userId)
      .in('word_id', wordIds)
    if (progressError) throw new Error(progressError.message)

    const progressMap = new Map(
      (progressRows ?? []).map((p: { word_id: string; next_review_date: string | null }) => [p.word_id, p])
    )

    return wordRows
      .filter(w => !progressMap.has(w.id))
      .slice(0, limit)
      .map(w => ({
        ...mapWordRow(w, 'library'),
        progressKey: { kind: 'library', wordId: w.id } as const,
        learningMode: 'new' as const
      }))
  },

  async updateWordMastery(word: Word, mastery: WordMastery): Promise<void> {
    const userId = await getCurrentUserId()
    const supabase = getSupabase()
    const key: WordProgressKey = word.progressKey ?? { kind: 'library', wordId: word.id }
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toISOString()

    let q = supabase.from('user_word_progress').select('srs_step,review_count,source_id').eq('user_id', userId)
    if (key.kind === 'library') {
      q = q.eq('word_id', key.wordId).is('custom_word_id', null)
    } else {
      q = q.eq('custom_word_id', key.customWordId).is('word_id', null)
    }
    const { data: existing } = await q.maybeSingle()
    const prevStep = (existing as { srs_step?: number } | null)?.srs_step ?? 0
    const prevCount = (existing as { review_count?: number } | null)?.review_count ?? 0
    const existingSourceId = (existing as { source_id?: string | null } | null)?.source_id ?? null

    let nextStep = prevStep
    let nextReview: string
    if (mastery === 'known') {
      nextReview = addCalendarDays(today, daysAfterKnownMark(prevStep))
      nextStep = nextStepAfterKnown(prevStep)
    } else {
      nextStep = 0
      nextReview = addCalendarDays(today, 1)
    }

    const studyMode = word.learningMode === 'review' ? 'review' : 'new'

    const basePayload = {
      user_id: userId,
      mastery,
      review_count: prevCount + 1,
      next_review_date: nextReview,
      last_review_date: today,
      last_rating: mastery,
      last_rating_at: now,
      last_study_mode: studyMode,
      srs_step: nextStep,
      is_new: false,
      updated_at: now
    }

    if (key.kind === 'library') {
      const { error } = await supabase.from('user_word_progress').upsert(
        {
          ...basePayload,
          word_id: key.wordId,
          custom_word_id: null,
          source: 'library',
          source_id: existingSourceId
        },
        { onConflict: 'user_id,word_id' }
      )
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('user_word_progress').upsert(
        {
          ...basePayload,
          word_id: null,
          custom_word_id: key.customWordId,
          source: 'manual'
        },
        { onConflict: 'user_id,custom_word_id' }
      )
      if (error) throw new Error(error.message)
    }
  },

  async addWordFromSentence(word: string, sentenceId?: string, customInput?: CustomWordInput): Promise<AddWordResult> {
    const userId = await getCurrentUserId()
    const examType = await getExamType(userId)
    const normalizedWord = word.trim().toLowerCase()
    const supabase = getSupabase()
    const source = sentenceId ? 'sentence' : 'manual'

    const { data: existedCustomWords, error: existedCustomError } = await supabase
      .from('user_custom_words')
      .select('id,user_id,word,phonetic,meanings,examples,exam_type,created_at,updated_at')
      .eq('user_id', userId)
      .ilike('word', normalizedWord)
      .limit(1)
    if (existedCustomError) throw new Error(existedCustomError.message)
    const customWord = existedCustomWords && existedCustomWords.length > 0 ? (existedCustomWords[0] as UserCustomWordRow) : null

    // 受 RLS 限制，前端不直接插入 words，优先复用词库中已有单词
    const { data: existedWords, error: existedError } = await supabase
      .from('words')
      .select('id,word,phonetic,meanings,examples,created_at')
      .in('exam_type', [examType, 'both'])
      .ilike('word', normalizedWord)
      .limit(1)
    if (existedError) throw new Error(existedError.message)

    const libraryWord = existedWords && existedWords.length > 0 ? (existedWords[0] as WordRow) : null

    if (!libraryWord && !customWord) {
      if (!customInput?.translation?.trim()) {
        return {
          status: 'need_custom_info',
          word: normalizedWord,
          message: '请输入该单词的翻译后再加入生词本'
        }
      }
      const meanings = [{ partOfSpeech: customInput.partOfSpeech?.trim() || 'n.', definition: customInput.translation.trim() }]
      const examples = (customInput.examples || []).map(x => x.trim()).filter(Boolean)
      const { data: insertedCustom, error: insertCustomError } = await supabase
        .from('user_custom_words')
        .insert({
          user_id: userId,
          word: normalizedWord,
          phonetic: customInput.phonetic?.trim() || null,
          meanings,
          examples,
          exam_type: examType
        })
        .select('id,user_id,word,phonetic,meanings,examples,exam_type,created_at,updated_at')
        .single()
      if (insertCustomError && insertCustomError.code !== '23505') throw new Error(insertCustomError.message)

      const resolvedCustom = (insertedCustom as UserCustomWordRow | null) || (() => null)()
      let customId = resolvedCustom?.id
      if (!customId) {
        const { data: existedInsertedCustom, error: existedInsertedError } = await supabase
          .from('user_custom_words')
          .select('id,user_id,word,phonetic,meanings,examples,exam_type,created_at,updated_at')
          .eq('user_id', userId)
          .ilike('word', normalizedWord)
          .limit(1)
          .maybeSingle()
        if (existedInsertedError || !existedInsertedCustom) throw new Error(existedInsertedError?.message || '添加私有词失败')
        customId = (existedInsertedCustom as UserCustomWordRow).id
      }

      const { data: existedVocabByCustom } = await supabase
        .from('vocabulary_book')
        .select('id')
        .eq('user_id', userId)
        .eq('source', 'manual')
        .eq('source_id', customId)
        .limit(1)
      if (existedVocabByCustom && existedVocabByCustom.length > 0) {
        return { status: 'exists', word: normalizedWord, message: '该单词已在生词本中' }
      }

      const { error: insertVocabCustomError } = await supabase.from('vocabulary_book').insert({
        user_id: userId,
        word_id: null,
        source: 'manual',
        source_id: customId,
        mastery: 'unknown'
      })
      if (insertVocabCustomError && insertVocabCustomError.code !== '23505') throw new Error(insertVocabCustomError.message)

      await supabase.from('user_word_progress').upsert(
        {
          user_id: userId,
          word_id: null,
          custom_word_id: customId,
          mastery: 'unknown',
          srs_step: 0,
          review_count: 0,
          is_new: true,
          source: 'manual',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,custom_word_id' }
      )

      return { status: 'added', word: normalizedWord, message: '已添加到生词本' }
    }

    if (libraryWord) {
      const { data: existedVocabByWord } = await supabase
        .from('vocabulary_book')
        .select('id')
        .eq('user_id', userId)
        .eq('word_id', libraryWord.id)
        .limit(1)
      if (existedVocabByWord && existedVocabByWord.length > 0) {
        return { status: 'exists', word: normalizedWord, message: '该单词已在生词本中' }
      }

      await supabase.from('user_word_progress').upsert(
        {
          user_id: userId,
          word_id: libraryWord.id,
          mastery: 'unknown',
          srs_step: 0,
          review_count: 0,
          is_new: true,
          source,
          source_id: sentenceId ?? null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,word_id' }
      )

      const { error: vocabError } = await supabase.from('vocabulary_book').insert({
        user_id: userId,
        word_id: libraryWord.id,
        source,
        source_id: sentenceId ?? null,
        mastery: 'unknown'
      })
      if (vocabError && vocabError.code !== '23505') throw new Error(vocabError.message)
      return { status: 'added', word: normalizedWord, message: '已添加到生词本' }
    }

    // 在私有词库存在但公共词库不存在：按私有词加入生词本
    const { data: existedVocabByCustom } = await supabase
      .from('vocabulary_book')
      .select('id')
      .eq('user_id', userId)
      .eq('source', 'manual')
      .eq('source_id', customWord!.id)
      .limit(1)
    if (existedVocabByCustom && existedVocabByCustom.length > 0) {
      return { status: 'exists', word: normalizedWord, message: '该单词已在生词本中' }
    }
    const { error: insertVocabCustomError } = await supabase.from('vocabulary_book').insert({
      user_id: userId,
      word_id: null,
      source: 'manual',
      source_id: customWord!.id,
      mastery: 'unknown'
    })
    if (insertVocabCustomError && insertVocabCustomError.code !== '23505') throw new Error(insertVocabCustomError.message)

    await supabase.from('user_word_progress').upsert(
      {
        user_id: userId,
        word_id: null,
        custom_word_id: customWord!.id,
        mastery: 'unknown',
        srs_step: 0,
        review_count: 0,
        is_new: true,
        source: 'manual',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,custom_word_id' }
    )

    return { status: 'added', word: normalizedWord, message: '已添加到生词本' }
  },

  async getTodaySentence(): Promise<Sentence> {
    const userId = await getCurrentUserId()
    const examType = await getExamType(userId)
    const supabase = getSupabase()

    const sentenceId = await getOrCreateAssignedSentenceId(userId, examType, supabase)

    const { data, error } = await supabase
      .from('sentences')
      .select('id,content,translation,analysis,source,difficulty,exam_type,created_at')
      .eq('id', sentenceId)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('No sentence available')

    return mapSentenceRow(data as SentenceRow)
  },

  async getTodaySentenceState(): Promise<TodaySentenceState> {
    const userId = await getCurrentUserId()
    const examType = await getExamType(userId)
    const supabase = getSupabase()
    const bounds = getBeijingLearningDayBounds()

    const assignedSentenceId = await getOrCreateAssignedSentenceId(userId, examType, supabase)

    const { data: progress } = await supabase
      .from('user_sentence_progress')
      .select('sentence_id,ai_feedback,last_attempt_date,updated_at')
      .eq('user_id', userId)
      .eq('sentence_id', assignedSentenceId)
      .maybeSingle()

    const completedToday = isSentenceProgressDoneToday(progress, bounds)
    if (completedToday && progress) {
      const feedback = toAIFeedback(progress.ai_feedback)
      if (feedback) {
        const { data: sentenceData, error } = await supabase
          .from('sentences')
          .select('id,content,translation,analysis,source,difficulty,exam_type,created_at')
          .eq('id', assignedSentenceId)
          .single()
        if (!error && sentenceData) {
          return {
            sentence: mapSentenceRow(sentenceData as SentenceRow),
            feedback
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('sentences')
      .select('id,content,translation,analysis,source,difficulty,exam_type,created_at')
      .eq('id', assignedSentenceId)
      .single()
    if (error) throw new Error(error.message)
    if (!data) throw new Error('No sentence available')
    return {
      sentence: mapSentenceRow(data as SentenceRow),
      feedback: null
    }
  },

  async submitSentenceTranslation(sentenceId: string, translation: string): Promise<AIFeedback> {
    const userId = await getCurrentUserId()

    const { data: sentence, error: sentenceError } = await getSupabase()
      .from('sentences')
      .select('translation,analysis')
      .eq('id', sentenceId)
      .single()
    if (sentenceError || !sentence) throw new Error('Sentence not found')

    const score = Math.max(50, Math.min(95, Math.round((translation.trim().length / 80) * 100)))
    const feedback: AIFeedback = {
      referenceTranslation: sentence.translation,
      issues: score > 80 ? ['Translation is generally clear, refine details'] : ['Key meaning coverage is insufficient'],
      structureAnalysis: sentence.analysis,
      shouldAddToErrorBook: score < 70,
      score
    }

    const { error } = await getSupabase().from('user_sentence_progress').upsert(
      {
        user_id: userId,
        sentence_id: sentenceId,
        user_translation: translation,
        ai_feedback: feedback,
        is_correct: score >= 70,
        attempt_count: 1,
        in_error_book: score < 70,
        last_attempt_date: getBeijingLearningDayBounds().date,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,sentence_id' }
    )
    if (error) throw new Error(error.message)

    if (feedback.shouldAddToErrorBook) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await getSupabase().from('error_book').upsert(
        {
          user_id: userId,
          sentence_id: sentenceId,
          added_reason: 'ai_suggest',
          review_status: 'pending',
          review_count: 0,
          next_review_date: tomorrow.toISOString().slice(0, 10)
        },
        { onConflict: 'user_id,sentence_id' }
      )
    }

    return feedback
  },

  async addToErrorBook(sentenceId: string): Promise<void> {
    const userId = await getCurrentUserId()

    const { error } = await getSupabase().from('user_sentence_progress').upsert(
      {
        user_id: userId,
        sentence_id: sentenceId,
        in_error_book: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,sentence_id' }
    )
    if (error) throw new Error(error.message)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { error: errorBookError } = await getSupabase().from('error_book').upsert(
      {
        user_id: userId,
        sentence_id: sentenceId,
        added_reason: 'manual',
        review_status: 'pending',
        review_count: 0,
        next_review_date: tomorrow.toISOString().slice(0, 10)
      },
      { onConflict: 'user_id,sentence_id' }
    )
    if (errorBookError) throw new Error(errorBookError.message)
  },

  async getTodayPlan(): Promise<DailyPlan> {
    const userId = await getCurrentUserId()
    const examType = await getExamType(userId)
    const supabase = getSupabase()
    const bounds = getBeijingLearningDayBounds()
    const { date, startISO, endISO } = bounds

    const assignedSentenceId = await getOrCreateAssignedSentenceId(userId, examType, supabase)
    const { data: sentenceProgressForAssigned } = await supabase
      .from('user_sentence_progress')
      .select('last_attempt_date,updated_at')
      .eq('user_id', userId)
      .eq('sentence_id', assignedSentenceId)
      .maybeSingle()

    const sentenceCompleted = isSentenceProgressDoneToday(sentenceProgressForAssigned, bounds)

    const { data: settings } = await supabase
      .from('user_settings')
      .select('daily_new_words,daily_review_words')
      .eq('user_id', userId)
      .maybeSingle()

    const newWordsCap = settings?.daily_new_words ?? 40
    const reviewCap = settings?.daily_review_words ?? 60

    const dueReviewList = await computeReviewCandidates(userId, examType, () => learningApi.getVocabularyItems())
    const reviewWordsTarget = Math.min(reviewCap, dueReviewList.length)

    const availableNewCount = await countNewWordsAvailable(userId, examType, supabase)
    const newWordsTarget = Math.min(newWordsCap, availableNewCount)

    const { data: ratedToday } = await supabase
      .from('user_word_progress')
      .select('last_study_mode')
      .eq('user_id', userId)
      .gte('last_rating_at', startISO)
      .lt('last_rating_at', endISO)

    const newWordsCompleted = (ratedToday ?? []).filter(
      (x: { last_study_mode: string | null }) => x.last_study_mode === 'new'
    ).length
    const reviewWordsCompleted = (ratedToday ?? []).filter(
      (x: { last_study_mode: string | null }) => x.last_study_mode === 'review'
    ).length

    return {
      date,
      newWordsTarget,
      reviewWordsTarget,
      newWordsCompleted,
      reviewWordsCompleted,
      sentenceCompleted,
      estimatedMinutes: 30
    }
  },

  async getStats(): Promise<LearningStats> {
    const userId = await getCurrentUserId()
    const supabase = getSupabase()
    const { date: todayDate } = getBeijingLearningDayBounds()

    const { count: totalWordsLearned } = await supabase
      .from('user_word_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { count: totalSentencesCompleted } = await supabase
      .from('user_sentence_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_correct', true)

    const { data: checkins } = await supabase
      .from('checkin_records')
      .select('date,new_words_completed,review_words_completed,sentence_completed')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30)

    const allCheckins = checkins ?? []
    const checkinSet = new Set(allCheckins.map(c => c.date))
    let consecutiveDays = 0
    const cursor = new Date()
    while (true) {
      const key = cursor.toISOString().slice(0, 10)
      if (!checkinSet.has(key)) break
      consecutiveDays++
      cursor.setDate(cursor.getDate() - 1)
    }

    const todayCheckin = allCheckins.find(c => c.date === todayDate)
    const weeklyTrend = [...allCheckins]
      .slice(0, 7)
      .reverse()
      .map(c => ({
        date: c.date,
        newWords: c.new_words_completed,
        reviewWords: c.review_words_completed,
        sentences: c.sentence_completed ? 1 : 0,
        minutes: c.new_words_completed + c.review_words_completed + (c.sentence_completed ? 10 : 0)
      }))

    return {
      totalWordsLearned: totalWordsLearned ?? 0,
      totalSentencesCompleted: totalSentencesCompleted ?? 0,
      consecutiveDays,
      totalDays: allCheckins.length,
      todayNewWords: todayCheckin?.new_words_completed ?? 0,
      todayReviewWords: todayCheckin?.review_words_completed ?? 0,
      todaySentences: todayCheckin?.sentence_completed ? 1 : 0,
      weeklyTrend
    }
  },

  async getErrorBookItems(): Promise<ErrorBookItem[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await getSupabase()
      .from('error_book')
      .select(`
        id,
        user_id,
        sentence_id,
        added_at,
        added_reason,
        review_status,
        review_count,
        next_review_date,
        sentences (
          id,content,translation,analysis,source,difficulty,exam_type,created_at
        )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) throw new Error(error.message)

    const rows = (data ?? []) as Array<{
      id: string
      user_id: string
      sentence_id: string
      added_at: string
      added_reason: ErrorBookItem['addedReason']
      review_status: ErrorBookItem['reviewStatus']
      review_count: number
      next_review_date: string
      sentences: SentenceRow | SentenceRow[] | null
    }>

    return rows
      .map(row => {
        const sentence = Array.isArray(row.sentences) ? row.sentences[0] : row.sentences
        if (!sentence) return null
        return {
          id: row.id,
          sentenceId: row.sentence_id,
          sentence: mapSentenceRow(sentence),
          userId: row.user_id,
          addedAt: row.added_at,
          addedReason: row.added_reason,
          reviewStatus: row.review_status,
          reviewCount: row.review_count,
          nextReviewDate: row.next_review_date
        }
      })
      .filter((item): item is ErrorBookItem => item !== null)
  },

  async getVocabularyItems(): Promise<VocabularyBookItem[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await getSupabase()
      .from('vocabulary_book')
      .select(`
        *,
        words (
          id,word,phonetic,meanings,examples,created_at
        )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) throw new Error(error.message)

    const rows = (data ?? []) as PrivateVocabularyRow[]
    const customIds = rows
      .filter(row => !row.word_id && row.source === 'manual' && typeof row.source_id === 'string')
      .map(row => row.source_id as string)
    const customWordMap = new Map<string, UserCustomWordRow>()
    if (customIds.length > 0) {
      const { data: customWords, error: customWordsError } = await getSupabase()
        .from('user_custom_words')
        .select('id,user_id,word,phonetic,meanings,examples,exam_type,created_at,updated_at')
        .eq('user_id', userId)
        .in('id', customIds)
      if (customWordsError) throw new Error(customWordsError.message)
      for (const custom of customWords ?? []) {
        const row = custom as UserCustomWordRow
        customWordMap.set(row.id, row)
      }
    }

    const items: VocabularyBookItem[] = []
    for (const row of rows) {
      const word = Array.isArray(row.words) ? row.words[0] : row.words
      const customWord = row.source_id ? customWordMap.get(row.source_id) : undefined
      const fallbackWordText = customWord?.word || row.custom_word
      if (!word && !fallbackWordText) continue
      const fallbackMeanings: Word['meanings'] = word
        ? normalizeMeanings(word.meanings)
        : normalizeMeanings(customWord?.meanings)
      const fallbackExamples: string[] = word
        ? (Array.isArray(word.examples) ? (word.examples as string[]) : [])
        : (Array.isArray(customWord?.examples) ? (customWord?.examples as string[]) : [])
      const item: VocabularyBookItem = {
        id: row.id,
        wordId: row.word_id ?? '',
        word: word
          ? mapWordRow(word, row.source, row.source_id ?? undefined)
          : {
              id: row.word_id || `private-${row.id}`,
              word: fallbackWordText!,
              phonetic: customWord?.phonetic || undefined,
              meanings: fallbackMeanings,
              examples: fallbackExamples,
              source: row.source,
              sourceId: row.source_id ?? undefined,
              createdAt: row.added_at
            },
        userId: row.user_id,
        addedAt: row.added_at,
        source: row.source,
        mastery: row.mastery
      }
      if (row.source_id) item.sourceId = row.source_id
      items.push(item)
    }

    return items
  },

  async getVocabularyItemById(itemId: string): Promise<VocabularyBookItem | null> {
    const items = await this.getVocabularyItems()
    return items.find(item => item.id === itemId) || null
  },

  async getCheckInRecords(limit = 31): Promise<CheckInRecord[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await getSupabase()
      .from('checkin_records')
      .select('id,user_id,date,new_words_completed,review_words_completed,sentence_completed,error_books_added,completion_rate,created_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)

    return (data ?? []).map((row: {
      id: string
      user_id: string
      date: string
      new_words_completed: number
      review_words_completed: number
      sentence_completed: boolean
      error_books_added: number
      completion_rate: number
      created_at: string
    }) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      createdAt: row.created_at,
      summary: {
        newWordsCompleted: row.new_words_completed,
        reviewWordsCompleted: row.review_words_completed,
        sentenceCompleted: row.sentence_completed,
        errorBooksAdded: row.error_books_added,
        completionRate: row.completion_rate
      }
    }))
  },

  async checkIn(): Promise<void> {
    const userId = await getCurrentUserId()
    const examType = await getExamType(userId)
    const bounds = getBeijingLearningDayBounds()
    const { date, startISO, endISO } = bounds
    const supabase = getSupabase()

    const assignedSentenceId = await getOrCreateAssignedSentenceId(userId, examType, supabase)
    const { data: sentenceProgressForAssigned } = await supabase
      .from('user_sentence_progress')
      .select('last_attempt_date,updated_at')
      .eq('user_id', userId)
      .eq('sentence_id', assignedSentenceId)
      .maybeSingle()

    const sentenceCompleted = isSentenceProgressDoneToday(sentenceProgressForAssigned, bounds)

    const { data: settings } = await supabase
      .from('user_settings')
      .select('daily_new_words,daily_review_words')
      .eq('user_id', userId)
      .maybeSingle()

    const newWordsCap = settings?.daily_new_words ?? 40
    const reviewCap = settings?.daily_review_words ?? 60
    const dueReviewList = await computeReviewCandidates(userId, examType, () => learningApi.getVocabularyItems())
    const reviewTarget = Math.min(reviewCap, dueReviewList.length)
    const availableNewCount = await countNewWordsAvailable(userId, examType, supabase)
    const newTarget = Math.min(newWordsCap, availableNewCount)

    const { data: ratedToday } = await supabase
      .from('user_word_progress')
      .select('last_study_mode')
      .eq('user_id', userId)
      .gte('last_rating_at', startISO)
      .lt('last_rating_at', endISO)

    const newWordsCompleted = (ratedToday ?? []).filter(
      (x: { last_study_mode: string | null }) => x.last_study_mode === 'new'
    ).length
    const reviewWordsCompleted = (ratedToday ?? []).filter(
      (x: { last_study_mode: string | null }) => x.last_study_mode === 'review'
    ).length

    const { count: errorBooksAdded } = await supabase
      .from('error_book')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('added_at', startISO)
      .lt('added_at', endISO)

    const totalTarget = newTarget + reviewTarget
    const wordRate = totalTarget > 0 ? ((newWordsCompleted + reviewWordsCompleted) / totalTarget) * 80 : 0
    const sentenceRate = sentenceCompleted ? 20 : 0
    const completionRate = Math.max(0, Math.min(100, Math.round(wordRate + sentenceRate)))

    const { error } = await supabase.from('checkin_records').upsert(
      {
        user_id: userId,
        date,
        new_words_completed: newWordsCompleted,
        review_words_completed: reviewWordsCompleted,
        sentence_completed: sentenceCompleted,
        error_books_added: errorBooksAdded ?? 0,
        completion_rate: completionRate
      },
      { onConflict: 'user_id,date' }
    )

    if (error) throw new Error(error.message)
  }
}
