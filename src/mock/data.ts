import type { User, Word, Sentence, DailyPlan, LearningStats, CheckInRecord } from '@/types'

// 延迟函数，模拟网络请求
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock 用户数据
export const mockUsers: User[] = [
  {
    id: 'user_001',
    email: 'test@example.com',
    nickname: '考研加油',
    examType: 'english1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-27T00:00:00Z'
  }
]

// Mock 单词数据
export const mockWords: Word[] = [
  {
    id: 'word_001',
    word: 'abandon',
    phonetic: '/əˈbændən/',
    meanings: [
      { partOfSpeech: 'v.', definition: '放弃；抛弃' },
      { partOfSpeech: 'n.', definition: '放纵；放任' }
    ],
    examples: [
      'They had to abandon their car in the snow.',
      'He abandoned himself to despair.'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'word_002',
    word: 'elaborate',
    phonetic: '/ɪˈlæbərət/',
    meanings: [
      { partOfSpeech: 'adj.', definition: '精心制作的；详尽的' },
      { partOfSpeech: 'v.', definition: '详细阐述' }
    ],
    examples: [
      'She made elaborate preparations for the party.',
      'Could you elaborate on this point?'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'word_003',
    word: 'phenomenon',
    phonetic: '/fəˈnɒmɪnən/',
    meanings: [
      { partOfSpeech: 'n.', definition: '现象；杰出的人' }
    ],
    examples: [
      'Globalization is a phenomenon of the 21st century.',
      'The Beatles were a phenomenon in popular music.'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'word_004',
    word: 'substantial',
    phonetic: '/səbˈstænʃəl/',
    meanings: [
      { partOfSpeech: 'adj.', definition: '大量的；实质性的' }
    ],
    examples: [
      'The report shows a substantial increase in profits.',
      'There is substantial evidence to support this theory.'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'word_005',
    word: 'controversy',
    phonetic: '/ˈkɒntrəvɜːsi/',
    meanings: [
      { partOfSpeech: 'n.', definition: '争论；争议' }
    ],
    examples: [
      'The new policy has caused much controversy.',
      'The book stirred up a lot of controversy.'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'word_006',
    word: 'comprehensive',
    phonetic: '/ˌkɒmprɪˈhensɪv/',
    meanings: [
      { partOfSpeech: 'adj.', definition: '综合的；全面的' }
    ],
    examples: [
      'We offer a comprehensive range of services.',
      'The book provides a comprehensive guide to the subject.'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'word_007',
    word: 'hypothesis',
    phonetic: '/haɪˈpɒθəsɪs/',
    meanings: [
      { partOfSpeech: 'n.', definition: '假设；假说' }
    ],
    examples: [
      'Scientists tested the hypothesis through experiments.',
      'This hypothesis has been proven wrong.'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'word_008',
    word: 'implement',
    phonetic: '/ˈɪmplɪment/',
    meanings: [
      { partOfSpeech: 'v.', definition: '实施；执行' },
      { partOfSpeech: 'n.', definition: '工具；器具' }
    ],
    examples: [
      'The government will implement new policies.',
      'Farm implements are expensive.'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'word_009',
    word: 'perspective',
    phonetic: '/pəˈspektɪv/',
    meanings: [
      { partOfSpeech: 'n.', definition: '观点；视角；透视法' }
    ],
    examples: [
      'Try to see things from a different perspective.',
      'The artist used perspective to create depth.'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'word_010',
    word: 'inevitable',
    phonetic: '/ɪnˈevɪtəbl/',
    meanings: [
      { partOfSpeech: 'adj.', definition: '不可避免的；必然的' }
    ],
    examples: [
      'Change is inevitable in life.',
      'The inevitable happened.'
    ],
    source: 'library',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

// Mock 长难句数据
export const mockSentences: Sentence[] = [
  {
    id: 'sentence_001',
    content: 'The fact that technology has progressed at such a remarkable pace over the past few decades has led to profound changes in the way we live, work, and communicate with one another.',
    translation: '技术在过去几十年以如此显著的速度进步，这一事实导致了我们生活、工作和相互交流方式的深刻变化。',
    analysis: '主句结构：The fact... has led to profound changes\n同位语从句：that technology has progressed...\n介词短语修饰：in the way we live, work, and communicate',
    source: '2020年真题',
    difficulty: 3,
    examType: 'english1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sentence_002',
    content: 'What makes the issue particularly complex is that the traditional boundaries between different disciplines have become increasingly blurred, making it difficult to determine where one field ends and another begins.',
    translation: '使这个问题特别复杂的是，不同学科之间的传统界限已经变得越来越模糊，这使得很难确定一个领域在哪里结束，另一个领域在哪里开始。',
    analysis: '主语从句：What makes the issue particularly complex\n表语从句：that the traditional boundaries...\n现在分词短语作结果状语：making it difficult to...',
    source: '2019年真题',
    difficulty: 4,
    examType: 'english1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sentence_003',
    content: 'It is widely acknowledged that education plays a crucial role in shaping individuals and societies, yet the debate over how best to achieve educational excellence continues to evolve.',
    translation: '人们普遍认为教育在塑造个人和社会方面起着至关重要的作用，然而关于如何最好地实现卓越教育的争论仍在不断发展。',
    analysis: '形式主语结构：It is widely acknowledged that...\n让步关系：... yet the debate...\n宾语从句：how best to achieve...',
    source: '2021年真题',
    difficulty: 2,
    examType: 'english2',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

// Mock 今日学习计划
export const mockDailyPlan: DailyPlan = {
  date: new Date().toISOString().split('T')[0],
  newWordsTarget: 40,
  reviewWordsTarget: 60,
  newWordsCompleted: 15,
  reviewWordsCompleted: 30,
  sentenceCompleted: false,
  estimatedMinutes: 35
}

// Mock 学习统计
export const mockStats: LearningStats = {
  totalWordsLearned: 520,
  totalSentencesCompleted: 28,
  consecutiveDays: 7,
  totalDays: 15,
  todayNewWords: 15,
  todayReviewWords: 30,
  todaySentences: 0,
  weeklyTrend: [
    { date: '2024-03-25', newWords: 40, reviewWords: 60, sentences: 1, minutes: 32 },
    { date: '2024-03-26', newWords: 35, reviewWords: 55, sentences: 1, minutes: 28 },
    { date: '2024-03-27', newWords: 42, reviewWords: 58, sentences: 1, minutes: 35 },
    { date: '2024-03-28', newWords: 38, reviewWords: 62, sentences: 1, minutes: 30 },
    { date: '2024-03-29', newWords: 40, reviewWords: 60, sentences: 1, minutes: 33 },
    { date: '2024-03-30', newWords: 45, reviewWords: 65, sentences: 1, minutes: 38 },
    { date: '2024-03-31', newWords: 15, reviewWords: 30, sentences: 0, minutes: 15 }
  ]
}

// Mock 打卡记录
export const mockCheckInRecords: CheckInRecord[] = [
  {
    id: 'checkin_001',
    userId: 'user_001',
    date: '2024-03-30',
    summary: {
      newWordsCompleted: 45,
      reviewWordsCompleted: 65,
      sentenceCompleted: true,
      errorBooksAdded: 1,
      completionRate: 100
    },
    createdAt: '2024-03-30T22:00:00Z'
  },
  {
    id: 'checkin_002',
    userId: 'user_001',
    date: '2024-03-29',
    summary: {
      newWordsCompleted: 40,
      reviewWordsCompleted: 60,
      sentenceCompleted: true,
      errorBooksAdded: 0,
      completionRate: 100
    },
    createdAt: '2024-03-29T21:30:00Z'
  }
]
