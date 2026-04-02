export { authApi } from './auth'
export { learningApi } from './learning'

/**
 * ==================== API 接口汇总文档 ====================
 * 
 * 本文件汇总所有需要后端实现的接口
 * 后期接入 Supabase 时，根据此文档创建对应的数据库表和 API
 * 
 * ==================== 数据库表设计建议 ====================
 * 
 * 1. users 表
 *    - id: uuid (primary key)
 *    - email: string (unique)
 *    - password_hash: string
 *    - nickname: string?
 *    - avatar: string?
 *    - exam_type: enum('english1', 'english2')
 *    - created_at: timestamp
 *    - updated_at: timestamp
 * 
 * 2. user_settings 表
 *    - id: uuid (primary key)
 *    - user_id: uuid (foreign key -> users)
 *    - daily_new_words: integer (default: 40)
 *    - daily_review_words: integer (default: 60)
 *    - created_at: timestamp
 *    - updated_at: timestamp
 * 
 * 3. words 表
 *    - id: uuid (primary key)
 *    - word: string
 *    - phonetic: string?
 *    - meanings: jsonb (数组，包含词性和释义)
 *    - examples: jsonb (数组，例句列表)
 *    - exam_type: enum('english1', 'english2', 'both')
 *    - created_at: timestamp
 * 
 * 4. user_word_progress 表
 *    - id: uuid (primary key)
 *    - user_id: uuid (foreign key -> users)
 *    - word_id: uuid (foreign key -> words，可与 custom_word_id 二选一)
 *    - custom_word_id: uuid? (foreign key -> user_custom_words，私有词进度)
 *    - mastery: enum('known', 'fuzzy', 'unknown')
 *    - srs_step: integer (0–4，SRS 阶段；认识递增，模糊/不认识归零)
 *    - last_rating: text? (最近一次按钮：known/fuzzy/unknown)
 *    - last_rating_at: timestamptz? (用于「昨日不认识/模糊」复习队列)
 *    - last_study_mode: text? (new | review，首页今日进度仅统计在学习页点击过掌握按钮的记录)
 *    - review_count: integer (default: 0)
 *    - next_review_date: date
 *    - last_review_date: date?
 *    - is_new: boolean (default: true)
 *    - source: enum('library', 'sentence', 'manual')
 *    - source_id: uuid?
 *    - created_at: timestamp
 *    - updated_at: timestamp
 *    （见 sql/word_review_srs.sql：部分唯一索引 user_id+word_id / user_id+custom_word_id）
 * 
 * 5. sentences 表
 *    - id: uuid (primary key)
 *    - content: text (英文句子)
 *    - translation: text (参考译文)
 *    - analysis: text (句子主干拆解)
 *    - source: string? (来源，如真题年份)
 *    - difficulty: integer (1-5)
 *    - exam_type: enum('english1', 'english2')
 *    - created_at: timestamp
 * 
 * 6. user_sentence_progress 表
 *    - id: uuid (primary key)
 *    - user_id: uuid (foreign key -> users)
 *    - sentence_id: uuid (foreign key -> sentences)
 *    - user_translation: text?
 *    - ai_feedback: jsonb?
 *    - is_correct: boolean
 *    - attempt_count: integer (default: 0)
 *    - in_error_book: boolean (default: false)
 *    - last_attempt_date: date?
 *    - created_at: timestamp
 *    - updated_at: timestamp
 * 
 * 7. error_book 表
 *    - id: uuid (primary key)
 *    - user_id: uuid (foreign key -> users)
 *    - sentence_id: uuid (foreign key -> sentences)
 *    - added_reason: enum('auto', 'ai_suggest', 'manual')
 *    - review_status: enum('pending', 'reviewed', 'mastered')
 *    - review_count: integer (default: 0)
 *    - next_review_date: date
 *    - added_at: timestamp
 * 
 * 8. vocabulary_book 表 (生词本)
 *    - id: uuid (primary key)
 *    - user_id: uuid (foreign key -> users)
 *    - word_id: uuid (foreign key -> words)
 *    - source: enum('sentence', 'manual')
 *    - source_id: uuid? (sentence_id)
 *    - mastery: enum('known', 'fuzzy', 'unknown')
 *    - added_at: timestamp
 * 
 * 9. checkin_records 表
 *    - id: uuid (primary key)
 *    - user_id: uuid (foreign key -> users)
 *    - date: date
 *    - new_words_completed: integer
 *    - review_words_completed: integer
 *    - sentence_completed: boolean
 *    - error_books_added: integer
 *    - completion_rate: integer (0-100)
 *    - created_at: timestamp
 * 
 * ==================== Supabase 集成注意事项 ====================
 * 
 * 1. 使用 Supabase Auth 处理用户认证
 * 2. 使用 Row Level Security (RLS) 确保数据安全
 * 3. 使用 Supabase Realtime 实现实时同步（可选）
 * 4. AI 反馈可通过 Supabase Edge Functions 调用 OpenAI API
 * 
 */
