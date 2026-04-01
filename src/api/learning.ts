import type { 
  Word, 
  Sentence, 
  DailyPlan, 
  LearningStats, 
  WordMastery,
  AIFeedback
} from '@/types'
import { mockWords, mockSentences, mockDailyPlan, mockStats, delay } from '@/mock/data'

/**
 * 学习相关 API
 * 
 * 后端接口说明：
 * 
 * ==================== 单词相关 ====================
 * 
 * GET /api/words/today?type=new|review
 * 获取今日学习单词（新词或复习词）
 * 响应：{ code: number, message: string, data: Word[] }
 * 
 * POST /api/words/{wordId}/mastery
 * 更新单词掌握程度
 * 请求体：{ mastery: 'known' | 'fuzzy' | 'unknown' }
 * 响应：{ code: number, message: string }
 * 
 * POST /api/words/from-sentence
 * 从长难句添加生词
 * 请求体：{ word: string, sentenceId?: string }
 * 响应：{ code: number, message: string, data: Word }
 * 
 * ==================== 长难句相关 ====================
 * 
 * GET /api/sentences/today
 * 获取今日长难句
 * 响应：{ code: number, message: string, data: Sentence }
 * 
 * POST /api/sentences/{sentenceId}/translate
 * 提交翻译并获取 AI 反馈
 * 请求体：{ translation: string }
 * 响应：{ code: number, message: string, data: AIFeedback }
 * 
 * POST /api/sentences/{sentenceId}/error-book
 * 添加到错题本
 * 响应：{ code: number, message: string }
 * 
 * ==================== 学习计划相关 ====================
 * 
 * GET /api/plan/today
 * 获取今日学习计划
 * 响应：{ code: number, message: string, data: DailyPlan }
 * 
 * PUT /api/plan/settings
 * 更新学习计划设置
 * 请求体：{ dailyNewWords: number, dailyReviewWords: number }
 * 响应：{ code: number, message: string }
 * 
 * ==================== 统计相关 ====================
 * 
 * GET /api/stats
 * 获取学习统计
 * 响应：{ code: number, message: string, data: LearningStats }
 * 
 * POST /api/checkin
 * 完成打卡
 * 响应：{ code: number, message: string }
 */

const USE_MOCK = true

export const learningApi = {
  /**
   * 获取今日学习单词
   */
  async getTodayWords(type: 'new' | 'review'): Promise<Word[]> {
    if (USE_MOCK) {
      await delay(500)
      // 根据类型返回不同单词
      const count = type === 'new' ? 10 : 20
      return mockWords.slice(0, count)
    }
    throw new Error('未实现')
  },

  /**
   * 更新单词掌握程度
   */
  async updateWordMastery(wordId: string, mastery: WordMastery): Promise<void> {
    if (USE_MOCK) {
      await delay(200)
      console.log(`[Mock] 更新单词 ${wordId} 掌握程度为 ${mastery}`)
      return
    }
    throw new Error('未实现')
  },

  /**
   * 从长难句添加生词
   */
  async addWordFromSentence(word: string, sentenceId?: string): Promise<Word> {
    if (USE_MOCK) {
      await delay(300)
      console.log(`[Mock] 添加生词: ${word}, 来源句子: ${sentenceId}`)
      return {
        id: 'word_' + Date.now(),
        word,
        meanings: [{ partOfSpeech: 'n.', definition: '待补充' }],
        examples: [],
        source: 'sentence',
        sourceId: sentenceId,
        createdAt: new Date().toISOString()
      }
    }
    throw new Error('未实现')
  },

  /**
   * 获取今日长难句
   */
  async getTodaySentence(): Promise<Sentence> {
    if (USE_MOCK) {
      await delay(500)
      return mockSentences[0]
    }
    throw new Error('未实现')
  },

  /**
   * 提交翻译并获取 AI 反馈
   */
  async submitSentenceTranslation(sentenceId: string, translation: string): Promise<AIFeedback> {
    if (USE_MOCK) {
      await delay(1500) // 模拟 AI 处理时间
      console.log(`[Mock] 提交翻译: ${sentenceId}, 内容: ${translation}`)
      
      const sentence = mockSentences.find(s => s.id === sentenceId)
      return {
        referenceTranslation: sentence?.translation || '参考译文',
        issues: [
          '主语翻译不够准确',
          '时态处理有误'
        ],
        structureAnalysis: sentence?.analysis || '句子结构分析',
        shouldAddToErrorBook: true,
        score: 75
      }
    }
    throw new Error('未实现')
  },

  /**
   * 添加到错题本
   */
  async addToErrorBook(sentenceId: string): Promise<void> {
    if (USE_MOCK) {
      await delay(200)
      console.log(`[Mock] 添加到错题本: ${sentenceId}`)
      return
    }
    throw new Error('未实现')
  },

  /**
   * 获取今日学习计划
   */
  async getTodayPlan(): Promise<DailyPlan> {
    if (USE_MOCK) {
      await delay(300)
      return mockDailyPlan
    }
    throw new Error('未实现')
  },

  /**
   * 获取学习统计
   */
  async getStats(): Promise<LearningStats> {
    if (USE_MOCK) {
      await delay(400)
      return mockStats
    }
    throw new Error('未实现')
  },

  /**
   * 完成打卡
   */
  async checkIn(): Promise<void> {
    if (USE_MOCK) {
      await delay(300)
      console.log('[Mock] 完成打卡')
      return
    }
    throw new Error('未实现')
  }
}
