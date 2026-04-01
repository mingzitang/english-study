// ==================== 用户相关类型 ====================

export interface User {
  id: string
  email: string
  nickname?: string
  avatar?: string
  examType: 'english1' | 'english2' // 英语一 / 英语二
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  dailyNewWords: number      // 每日新词数量: 10/40/80/100 或自定义
  dailyReviewWords: number   // 每日复习词数量: 20/60/100/200 或自定义
}

// ==================== 认证相关类型 ====================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  examType: 'english1' | 'english2'
}

export interface AuthResponse {
  user: User
  token: string
}

// ==================== 单词相关类型 ====================

export type WordMastery = 'known' | 'fuzzy' | 'unknown'  // 认识 / 模糊 / 不认识

export interface Word {
  id: string
  word: string
  phonetic?: string           // 音标
  meanings: WordMeaning[]     // 释义列表
  examples: string[]          // 例句
  source: 'library' | 'sentence' | 'manual'  // 来源：词库/长难句/手动添加
  sourceId?: string           // 来源ID（如来自哪个长难句）
  createdAt: string
}

export interface WordMeaning {
  partOfSpeech: string        // 词性
  definition: string          // 释义
}

export interface UserWordProgress {
  wordId: string
  userId: string
  mastery: WordMastery
  reviewCount: number         // 复习次数
  nextReviewDate: string      // 下次复习日期
  lastReviewDate?: string     // 上次复习日期
  isNew: boolean              // 是否是新词
}

// ==================== 长难句相关类型 ====================

export interface Sentence {
  id: string
  content: string             // 英文句子
  translation: string         // 参考译文
  analysis: string            // 句子主干拆解
  source?: string             // 来源（如真题年份）
  difficulty: 1 | 2 | 3 | 4 | 5  // 难度等级
  examType: 'english1' | 'english2'
  createdAt: string
}

export interface UserSentenceProgress {
  sentenceId: string
  userId: string
  userTranslation?: string    // 用户翻译
  aiAnalysis?: AIFeedback     // AI反馈
  isCorrect: boolean          // 是否正确
  attemptCount: number        // 尝试次数
  inErrorBook: boolean        // 是否在错题本中
  lastAttemptDate?: string
}

export interface AIFeedback {
  referenceTranslation: string     // 参考译文
  issues: string[]                 // 用户翻译中的问题点
  structureAnalysis: string        // 句子主干拆解
  shouldAddToErrorBook: boolean    // 是否建议加入错题本
  score: number                    // 评分 0-100
}

export interface TodaySentenceState {
  sentence: Sentence | null
  feedback: AIFeedback | null
}

export interface CustomWordInput {
  translation: string
  phonetic?: string
  partOfSpeech?: string
  examples?: string[]
}

export type AddWordResultStatus = 'added' | 'exists' | 'need_custom_info' | 'error'

export interface AddWordResult {
  status: AddWordResultStatus
  word: string
  message?: string
}

export interface WordLookupResult {
  found: boolean
  word: string
  source?: 'library' | 'custom'
  meanings: WordMeaning[]
  phonetic?: string
  message?: string
}

// ==================== 错题本相关类型 ====================

export interface ErrorBookItem {
  id: string
  sentenceId: string
  sentence: Sentence
  userId: string
  addedAt: string
  addedReason: 'auto' | 'ai_suggest' | 'manual'  // 自动/AI建议/手动添加
  reviewStatus: 'pending' | 'reviewed' | 'mastered'
  reviewCount: number
  nextReviewDate: string
}

// ==================== 生词本相关类型 ====================

export interface VocabularyBookItem {
  id: string
  wordId: string
  word: Word
  userId: string
  addedAt: string
  source: 'sentence' | 'manual'   // 来自长难句/手动添加
  sourceId?: string
  mastery: WordMastery
}

// ==================== 学习计划和统计相关类型 ====================

export interface DailyPlan {
  date: string
  newWordsTarget: number
  reviewWordsTarget: number
  newWordsCompleted: number
  reviewWordsCompleted: number
  sentenceCompleted: boolean
  estimatedMinutes: number
}

export interface LearningStats {
  totalWordsLearned: number
  totalSentencesCompleted: number
  consecutiveDays: number         // 连续打卡天数
  totalDays: number               // 总打卡天数
  todayNewWords: number
  todayReviewWords: number
  todaySentences: number
  weeklyTrend: DailyStats[]       // 近7日趋势
}

export interface DailyStats {
  date: string
  newWords: number
  reviewWords: number
  sentences: number
  minutes: number
}

export interface CheckInRecord {
  id: string
  userId: string
  date: string
  summary: DailySummary
  createdAt: string
}

export interface DailySummary {
  newWordsCompleted: number
  reviewWordsCompleted: number
  sentenceCompleted: boolean
  errorBooksAdded: number
  completionRate: number          // 完成率 0-100
}

// ==================== 后台管理相关类型 ====================

export interface WordCreateRequest {
  word: string
  phonetic?: string
  meanings: WordMeaning[]
  examples: string[]
}

export interface SentenceCreateRequest {
  content: string
  translation: string
  analysis: string
  source?: string
  difficulty: 1 | 2 | 3 | 4 | 5
  examType: 'english1' | 'english2'
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ==================== 筛选和排序类型 ====================

export interface WordFilter {
  mastery?: WordMastery
  source?: 'library' | 'sentence' | 'manual'
  sortBy?: 'date' | 'mastery' | 'word'
  sortOrder?: 'asc' | 'desc'
}

export interface SentenceFilter {
  difficulty?: 1 | 2 | 3 | 4 | 5
  reviewStatus?: 'pending' | 'reviewed' | 'mastered'
  sortBy?: 'date' | 'difficulty'
  sortOrder?: 'asc' | 'desc'
}
