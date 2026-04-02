import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Word,
  Sentence,
  UserWordProgress,
  DailyPlan,
  LearningStats,
  WordMastery,
  AIFeedback,
  TodaySentenceState,
  CustomWordInput,
  AddWordResult
} from '@/types'
import { learningApi } from '@/api/learning'

export const useLearningStore = defineStore('learning', () => {
  // State - 单词学习
  const currentWords = ref<Word[]>([])
  const currentWordIndex = ref(0)
  const wordProgress = ref<Map<string, UserWordProgress>>(new Map())
  
  // State - 长难句学习
  const todaySentence = ref<Sentence | null>(null)
  const sentenceAIFeedback = ref<AIFeedback | null>(null)
  
  // State - 学习计划
  const todayPlan = ref<DailyPlan | null>(null)
  const todayPlanLoaded = ref(false)
  const stats = ref<LearningStats | null>(null)
  
  // State - 加载状态
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const currentWord = computed(() => currentWords.value[currentWordIndex.value] || null)
  const hasNextWord = computed(() => currentWordIndex.value < currentWords.value.length - 1)
  const hasPrevWord = computed(() => currentWordIndex.value > 0)
  const wordsProgress = computed(() => {
    if (currentWords.value.length === 0) return 0
    return Math.round((currentWordIndex.value / currentWords.value.length) * 100)
  })
  const todayProgress = computed(() => {
    if (!todayPlan.value) return 0
    const { newWordsTarget, reviewWordsTarget, newWordsCompleted, reviewWordsCompleted, sentenceCompleted } = todayPlan.value
    const wordTotal = newWordsTarget + reviewWordsTarget
    const wordCompleted = newWordsCompleted + reviewWordsCompleted
    const sentenceWeight = 20 // 长难句占20%权重
    const wordWeight = 80

    const wordProgress =
      wordTotal > 0 ? (wordCompleted / wordTotal) * wordWeight : wordCompleted > 0 ? wordWeight : 0
    const sentenceProgress = sentenceCompleted ? sentenceWeight : 0

    return Math.round(wordProgress + sentenceProgress)
  })

  // Actions - 单词学习
  async function loadTodayWords(type: 'new' | 'review') {
    loading.value = true
    error.value = null
    try {
      const words = await learningApi.getTodayWords(type)
      currentWords.value = words
      currentWordIndex.value = 0
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载单词失败'
    } finally {
      loading.value = false
    }
  }

  function nextWord() {
    if (hasNextWord.value) {
      currentWordIndex.value++
    }
  }

  function prevWord() {
    if (hasPrevWord.value) {
      currentWordIndex.value--
    }
  }

  async function markWordMastery(word: Word, mastery: WordMastery) {
    try {
      await learningApi.updateWordMastery(word, mastery)

      const isNewSession = word.learningMode !== 'review'
      const progress = wordProgress.value.get(word.id) || {
        wordId: word.id,
        userId: '',
        mastery,
        reviewCount: 0,
        nextReviewDate: '',
        isNew: isNewSession
      }
      progress.mastery = mastery
      progress.reviewCount++
      wordProgress.value.set(word.id, progress)

      if (todayPlan.value) {
        if (progress.isNew) {
          todayPlan.value.newWordsCompleted++
        } else {
          todayPlan.value.reviewWordsCompleted++
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新单词状态失败'
    }
  }

  // Actions - 长难句学习
  async function loadTodaySentence() {
    loading.value = true
    error.value = null
    try {
      const state: TodaySentenceState = await learningApi.getTodaySentenceState()
      todaySentence.value = state.sentence
      sentenceAIFeedback.value = state.feedback
      if (state.feedback && todayPlan.value) {
        todayPlan.value.sentenceCompleted = true
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载长难句失败'
    } finally {
      loading.value = false
    }
  }

  async function submitTranslation(sentenceId: string, translation: string) {
    loading.value = true
    error.value = null
    try {
      const feedback = await learningApi.submitSentenceTranslation(sentenceId, translation)
      sentenceAIFeedback.value = feedback
      
      // 更新今日计划
      if (todayPlan.value) {
        todayPlan.value.sentenceCompleted = true
      }
      
      return feedback
    } catch (e) {
      error.value = e instanceof Error ? e.message : '提交翻译失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function addToErrorBook(sentenceId: string) {
    try {
      await learningApi.addToErrorBook(sentenceId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加到错题本失败'
    }
  }

  async function addWordFromSentence(word: string, sentenceId?: string, customInput?: CustomWordInput): Promise<AddWordResult> {
    try {
      return await learningApi.addWordFromSentence(word, sentenceId, customInput)
    } catch (e) {
      const message = e instanceof Error ? e.message : '添加生词失败'
      error.value = message
      return { status: 'error', word, message }
    }
  }

  // Actions - 学习计划和统计
  async function loadTodayPlan() {
    todayPlanLoaded.value = false
    loading.value = true
    try {
      const plan = await learningApi.getTodayPlan()
      todayPlan.value = plan
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载学习计划失败'
    } finally {
      todayPlanLoaded.value = true
      loading.value = false
    }
  }

  async function loadStats() {
    loading.value = true
    try {
      const data = await learningApi.getStats()
      stats.value = data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载统计数据失败'
    } finally {
      loading.value = false
    }
  }

  async function checkIn() {
    try {
      await learningApi.checkIn()
      // 刷新统计数据
      await loadStats()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '打卡失败'
    }
  }

  function reset() {
    currentWords.value = []
    currentWordIndex.value = 0
    todaySentence.value = null
    sentenceAIFeedback.value = null
  }

  return {
    // State
    currentWords,
    currentWordIndex,
    wordProgress,
    todaySentence,
    sentenceAIFeedback,
    todayPlan,
    todayPlanLoaded,
    stats,
    loading,
    error,
    // Getters
    currentWord,
    hasNextWord,
    hasPrevWord,
    wordsProgress,
    todayProgress,
    // Actions
    loadTodayWords,
    nextWord,
    prevWord,
    markWordMastery,
    loadTodaySentence,
    submitTranslation,
    addToErrorBook,
    addWordFromSentence,
    loadTodayPlan,
    loadStats,
    checkIn,
    reset
  }
})
