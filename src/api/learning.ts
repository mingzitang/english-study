import type {
  Word,
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
  AddWordResult
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

function getTodayBounds() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  return {
    date: start.toISOString().slice(0, 10),
    startISO: start.toISOString(),
    endISO: end.toISOString()
  }
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

export const learningApi = {
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

    const progressMap = new Map((progressRows ?? []).map((p: { word_id: string; next_review_date: string | null }) => [p.word_id, p]))

    if (type === 'new') {
      return wordRows
        .filter(w => !progressMap.has(w.id))
        .slice(0, limit)
        .map(w => mapWordRow(w, 'library'))
    }

    return wordRows
      .filter(w => progressMap.has(w.id))
      .sort((a, b) => {
        const pa = progressMap.get(a.id)
        const pb = progressMap.get(b.id)
        const da = pa?.next_review_date ? new Date(pa.next_review_date).getTime() : 0
        const db = pb?.next_review_date ? new Date(pb.next_review_date).getTime() : 0
        return da - db
      })
      .slice(0, limit)
      .map(w => mapWordRow(w, 'library'))
  },

  async updateWordMastery(wordId: string, mastery: WordMastery): Promise<void> {
    const userId = await getCurrentUserId()
    const days = mastery === 'known' ? 7 : mastery === 'fuzzy' ? 2 : 1
    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + days)

    const { error } = await getSupabase().from('user_word_progress').upsert(
      {
        user_id: userId,
        word_id: wordId,
        mastery,
        review_count: 1,
        next_review_date: nextReviewDate.toISOString().slice(0, 10),
        last_review_date: new Date().toISOString().slice(0, 10),
        is_new: false,
        source: 'library',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,word_id' }
    )
    if (error) throw new Error(error.message)
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
    return { status: 'added', word: normalizedWord, message: '已添加到生词本' }
  },

  async getTodaySentence(): Promise<Sentence> {
    const userId = await getCurrentUserId()
    const examType = await getExamType(userId)

    const { data, error } = await getSupabase()
      .from('sentences')
      .select('id,content,translation,analysis,source,difficulty,exam_type,created_at')
      .eq('exam_type', examType)
      .limit(1)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) throw new Error('No sentence available')

    return mapSentenceRow(data[0] as SentenceRow)
  },

  async getTodaySentenceState(): Promise<TodaySentenceState> {
    const userId = await getCurrentUserId()
    const supabase = getSupabase()
    const { date, startISO, endISO } = getTodayBounds()

    const { data: progressByDate } = await supabase
      .from('user_sentence_progress')
      .select('sentence_id,ai_feedback')
      .eq('user_id', userId)
      .eq('last_attempt_date', date)
      .order('updated_at', { ascending: false })
      .limit(1)

    const { data: progressByUpdatedAt } = await supabase
      .from('user_sentence_progress')
      .select('sentence_id,ai_feedback')
      .eq('user_id', userId)
      .gte('updated_at', startISO)
      .lt('updated_at', endISO)
      .order('updated_at', { ascending: false })
      .limit(1)

    const progress = (progressByDate && progressByDate[0]) || (progressByUpdatedAt && progressByUpdatedAt[0]) || null
    if (progress?.sentence_id) {
      const { data: sentenceData, error } = await supabase
        .from('sentences')
        .select('id,content,translation,analysis,source,difficulty,exam_type,created_at')
        .eq('id', progress.sentence_id)
        .single()
      if (!error && sentenceData) {
        return {
          sentence: mapSentenceRow(sentenceData as SentenceRow),
          feedback: toAIFeedback(progress.ai_feedback)
        }
      }
    }

    return {
      sentence: await this.getTodaySentence(),
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
        last_attempt_date: new Date().toISOString().slice(0, 10),
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
    const supabase = getSupabase()
    const { date, startISO, endISO } = getTodayBounds()

    const { data: settings } = await supabase
      .from('user_settings')
      .select('daily_new_words,daily_review_words')
      .eq('user_id', userId)
      .maybeSingle()

    const { data: todayWords } = await supabase
      .from('user_word_progress')
      .select('is_new')
      .eq('user_id', userId)
      .gte('updated_at', startISO)
      .lt('updated_at', endISO)

    const { data: todaySentenceByDate } = await supabase
      .from('user_sentence_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('last_attempt_date', date)
      .limit(1)

    const { data: todaySentenceByUpdatedAt } = await supabase
      .from('user_sentence_progress')
      .select('id')
      .eq('user_id', userId)
      .gte('updated_at', startISO)
      .lt('updated_at', endISO)
      .limit(1)

    const newWordsCompleted = (todayWords ?? []).filter((x: { is_new: boolean }) => x.is_new === false).length
    const reviewWordsCompleted = Math.max(0, (todayWords ?? []).length - newWordsCompleted)

    return {
      date,
      newWordsTarget: settings?.daily_new_words ?? 40,
      reviewWordsTarget: settings?.daily_review_words ?? 60,
      newWordsCompleted,
      reviewWordsCompleted,
      sentenceCompleted: Boolean(
        (todaySentenceByDate && todaySentenceByDate.length > 0) ||
        (todaySentenceByUpdatedAt && todaySentenceByUpdatedAt.length > 0)
      ),
      estimatedMinutes: 30
    }
  },

  async getStats(): Promise<LearningStats> {
    const userId = await getCurrentUserId()
    const supabase = getSupabase()
    const { date: todayDate } = getTodayBounds()

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
    const { date, startISO, endISO } = getTodayBounds()
    const supabase = getSupabase()

    const { data: todayWords } = await supabase
      .from('user_word_progress')
      .select('is_new')
      .eq('user_id', userId)
      .gte('updated_at', startISO)
      .lt('updated_at', endISO)

    const { data: todaySentenceByDate } = await supabase
      .from('user_sentence_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('last_attempt_date', date)
      .limit(1)

    const { data: todaySentenceByUpdatedAt } = await supabase
      .from('user_sentence_progress')
      .select('id')
      .eq('user_id', userId)
      .gte('updated_at', startISO)
      .lt('updated_at', endISO)
      .limit(1)

    const { data: settings } = await supabase
      .from('user_settings')
      .select('daily_new_words,daily_review_words')
      .eq('user_id', userId)
      .maybeSingle()

    const { count: errorBooksAdded } = await supabase
      .from('error_book')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('added_at', startISO)
      .lt('added_at', endISO)

    const newWordsCompleted = (todayWords ?? []).filter((x: { is_new: boolean }) => x.is_new === false).length
    const reviewWordsCompleted = Math.max(0, (todayWords ?? []).length - newWordsCompleted)
    const sentenceCompleted = Boolean(
      (todaySentenceByDate && todaySentenceByDate.length > 0) ||
      (todaySentenceByUpdatedAt && todaySentenceByUpdatedAt.length > 0)
    )

    const newTarget = settings?.daily_new_words ?? 40
    const reviewTarget = settings?.daily_review_words ?? 60
    const totalTarget = newTarget + reviewTarget
    const wordRate = totalTarget > 0 ? ((newWordsCompleted + reviewWordsCompleted) / totalTarget) * 80 : 80
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
