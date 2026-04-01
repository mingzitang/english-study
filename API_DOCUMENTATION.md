# 考研英语学习工具 - API 接口文档

## 项目概述
这份文档详细列出了所有前端需要调用的后端 API 接口。所有请求和响应都使用 JSON 格式。

---

## 认证接口

### 1. 用户登录
**请求方法**: `POST /api/auth/login`

**请求头**: 
```
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "user@example.com",  // 邮箱地址
  "password": "password123"      // 密码
}
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "username": "用户名",
    "token": "jwt_token",      // 登录后的认证令牌
    "refresh_token": "refresh_token",
    "created_at": "2024-03-31T10:00:00Z"
  }
}
```

**响应失败 (401)**:
```json
{
  "success": false,
  "error": "邮箱或密码错误"
}
```

---

### 2. 用户注册
**请求方法**: `POST /api/auth/register`

**请求头**: 
```
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "newuser@example.com",
  "username": "用户名",
  "password": "password123",
  "confirm_password": "password123"
}
```

**响应成功 (201)**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "newuser@example.com",
    "username": "用户名",
    "token": "jwt_token",
    "created_at": "2024-03-31T10:00:00Z"
  }
}
```

**响应失败 (400)**:
```json
{
  "success": false,
  "error": "邮箱已被注册"
}
```

---

### 3. 用户登出
**请求方法**: `POST /api/auth/logout`

**请求头**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**: 无

**响应成功 (200)**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

### 4. 刷新令牌
**请求方法**: `POST /api/auth/refresh`

**请求头**: 
```
Content-Type: application/json
```

**请求体**:
```json
{
  "refresh_token": "refresh_token_value"
}
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refresh_token": "new_refresh_token"
  }
}
```

---

## 学习数据接口

### 5. 获取今日单词
**请求方法**: `GET /api/learning/words/daily`

**请求头**: 
```
Authorization: Bearer {token}
```

**查询参数**: 无

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "words": [
      {
        "id": "word_id_1",
        "word": "apparent",
        "pronunciation": "/ə'pɑːrənt/",
        "definition": "明显的，显然的",
        "example": "It is apparent that he is telling the truth.",
        "difficulty": "medium",
        "unit": 1,
        "mastery_level": 0,
        "is_favorited": false
      }
    ],
    "total_count": 25,
    "completed_count": 12,
    "date": "2024-03-31"
  }
}
```

---

### 6. 获取全部单词列表
**请求方法**: `GET /api/learning/words`

**请求头**: 
```
Authorization: Bearer {token}
```

**查询参数**:
```
page: 1                 // 分页页码 (可选，默认1)
limit: 20               // 每页数量 (可选，默认20)
unit: 1                 // 单元号 1-34 (可选)
difficulty: medium      // 难度: easy/medium/hard (可选)
search: "apparent"      // 搜索关键词 (可选)
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "words": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 450,
      "total_pages": 23
    }
  }
}
```

---

### 7. 更新单词学习状态
**请求方法**: `PATCH /api/learning/words/:word_id/mastery`

**请求头**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**: `word_id` (URL 路径)

**请求体**:
```json
{
  "mastery_level": 2,      // 掌握级别: 0(未学)/1(学过)/2(掌握)/3(熟悉)
  "is_favorited": true     // 是否收藏 (可选)
}
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "word_id": "word_id_1",
    "mastery_level": 2,
    "is_favorited": true,
    "updated_at": "2024-03-31T10:00:00Z"
  }
}
```

---

### 8. 获取长难句列表
**请求方法**: `GET /api/learning/sentences`

**请求头**: 
```
Authorization: Bearer {token}
```

**查询参数**:
```
page: 1                 // 分页页码
limit: 20               // 每页数量
unit: 1                 // 单元号 1-34 (可选)
search: "keyword"       // 搜索关键词 (可选)
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "sentences": [
      {
        "id": "sentence_id_1",
        "english_text": "It is apparent that technological progress is accelerating...",
        "chinese_translation": "显然，技术进步正在加速...",
        "analysis": "语法分析内容...",
        "unit": 1,
        "mastery_level": 0,
        "is_bookmarked": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 340,
      "total_pages": 17
    }
  }
}
```

---

### 9. 获取单一长难句详情
**请求方法**: `GET /api/learning/sentences/:sentence_id`

**请求头**: 
```
Authorization: Bearer {token}
```

**请求参数**: `sentence_id` (URL 路径)

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "id": "sentence_id_1",
    "english_text": "It is apparent that...",
    "chinese_translation": "显然...",
    "analysis": "This is an 'It is + 形容词 that' structure...",
    "vocabulary_analysis": [
      {
        "word": "apparent",
        "definition": "明显的"
      }
    ],
    "unit": 1,
    "mastery_level": 0
  }
}
```

---

### 10. 更新长难句学习状态
**请求方法**: `PATCH /api/learning/sentences/:sentence_id/mastery`

**请求头**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**: `sentence_id` (URL 路径)

**请求体**:
```json
{
  "mastery_level": 1,      // 掌握级别
  "is_bookmarked": true    // 是否标记
}
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "sentence_id": "sentence_id_1",
    "mastery_level": 1,
    "is_bookmarked": true,
    "updated_at": "2024-03-31T10:00:00Z"
  }
}
```

---

### 11. 获取错题本
**请求方法**: `GET /api/learning/error-book`

**请求头**: 
```
Authorization: Bearer {token}
```

**查询参数**:
```
page: 1              // 分页页码
limit: 20            // 每页数量
type: question       // 类型: question/sentence (可选)
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "errors": [
      {
        "id": "error_id_1",
        "type": "question",
        "question_id": "q_1",
        "question_text": "Which word is...?",
        "user_answer": "wrong_answer",
        "correct_answer": "correct_answer",
        "explanation": "解释说明",
        "error_count": 2,
        "last_error_time": "2024-03-30T10:00:00Z",
        "added_time": "2024-03-29T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

---

### 12. 添加到错题本
**请求方法**: `POST /api/learning/error-book`

**请求头**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "type": "question",           // question 或 sentence
  "question_id": "q_1",         // 若 type 为 question
  "user_answer": "wrong_answer",
  "correct_answer": "correct",
  "explanation": "解释"
}
```

**响应成功 (201)**:
```json
{
  "success": true,
  "data": {
    "error_id": "error_id_1",
    "added_at": "2024-03-31T10:00:00Z"
  }
}
```

---

### 13. 从错题本删除
**请求方法**: `DELETE /api/learning/error-book/:error_id`

**请求头**: 
```
Authorization: Bearer {token}
```

**请求参数**: `error_id` (URL 路径)

**响应成功 (200)**:
```json
{
  "success": true,
  "message": "已删除"
}
```

---

### 14. 获取生词本
**请求方法**: `GET /api/learning/vocabulary`

**请求头**: 
```
Authorization: Bearer {token}
```

**查询参数**:
```
page: 1           // 分页页码
limit: 20         // 每页数量
sort: recent      // 排序: recent/frequent (可选)
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "vocabularies": [
      {
        "id": "vocab_id_1",
        "word": "apparent",
        "definition": "明显的",
        "example": "例句",
        "pronunciation": "/ə'pɑːrənt/",
        "times_seen": 5,
        "added_time": "2024-03-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 120,
      "total_pages": 6
    }
  }
}
```

---

## 用户数据接口

### 15. 获取用户个人信息
**请求方法**: `GET /api/user/profile`

**请求头**: 
```
Authorization: Bearer {token}
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "username": "用户名",
    "avatar_url": "https://...",
    "bio": "个人简介",
    "created_at": "2024-01-01T10:00:00Z",
    "last_login": "2024-03-31T10:00:00Z"
  }
}
```

---

### 16. 更新用户个人信息
**请求方法**: `PATCH /api/user/profile`

**请求头**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "新用户名",   // (可选)
  "bio": "新简介",         // (可选)
  "avatar_url": "https://"  // (可选)
}
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "username": "新用户名",
    "bio": "新简介",
    "updated_at": "2024-03-31T10:00:00Z"
  }
}
```

---

### 17. 获取用户学习统计
**请求方法**: `GET /api/user/stats`

**请求头**: 
```
Authorization: Bearer {token}
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "total_words_learned": 120,
    "words_mastered": 45,
    "sentences_learned": 80,
    "consecutive_days": 15,
    "total_study_time": 12.5,
    "current_streak": 5,
    "level": 8,
    "experience": 2450,
    "today_words": 8,
    "today_sentences": 3,
    "error_book_count": 25,
    "vocabulary_count": 120,
    "last_study_date": "2024-03-31T10:00:00Z"
  }
}
```

---

### 18. 获取学习进度数据
**请求方法**: `GET /api/user/progress`

**请求头**: 
```
Authorization: Bearer {token}
```

**查询参数**:
```
time_range: month   // week/month/all (可选，默认month)
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "progress_by_date": [
      {
        "date": "2024-03-31",
        "words_studied": 10,
        "sentences_studied": 3,
        "errors_fixed": 2,
        "study_time_minutes": 45
      }
    ],
    "unit_progress": [
      {
        "unit": 1,
        "total_words": 25,
        "mastered_words": 12,
        "total_sentences": 10,
        "mastered_sentences": 5,
        "completion_percentage": 68
      }
    ]
  }
}
```

---

### 19. 打卡记录
**请求方法**: `POST /api/user/checkin`

**请求头**: 
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "study_date": "2024-03-31",  // (可选，默认当前日期)
  "words_count": 10,            // 今日学习的单词数
  "sentences_count": 3,         // 今日学习的句子数
  "study_time_minutes": 45      // 今日学习时长（分钟）
}
```

**响应成功 (201)**:
```json
{
  "success": true,
  "data": {
    "checkin_id": "checkin_id_1",
    "date": "2024-03-31",
    "consecutive_days": 15,
    "reward_points": 50,
    "message": "恭喜！连续打卡15天！"
  }
}
```

---

### 20. 获取打卡历史
**请求方法**: `GET /api/user/checkins`

**请求头**: 
```
Authorization: Bearer {token}
```

**查询参数**:
```
page: 1           // 分页页码
limit: 30         // 每页数量
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "checkins": [
      {
        "id": "checkin_id_1",
        "date": "2024-03-31",
        "words_count": 10,
        "sentences_count": 3,
        "study_time_minutes": 45,
        "reward_points": 50
      }
    ],
    "current_streak": 15,
    "longest_streak": 28,
    "checkin_count": 142,
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 142,
      "total_pages": 5
    }
  }
}
```

---

## 后台管理接口

### 21. 获取所有单词 (管理员)
**请求方法**: `GET /api/admin/words`

**请求头**: 
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**查询参数**:
```
page: 1
limit: 50
search: ""
unit: ""
difficulty: ""
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "words": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 450,
      "total_pages": 9
    }
  }
}
```

---

### 22. 添加单词 (管理员)
**请求方法**: `POST /api/admin/words`

**请求头**: 
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**请求体**:
```json
{
  "word": "apparent",
  "pronunciation": "/ə'pɑːrənt/",
  "definition": "明显的，显然的",
  "example": "It is apparent that he is telling the truth.",
  "difficulty": "medium",
  "unit": 1
}
```

**响应成功 (201)**:
```json
{
  "success": true,
  "data": {
    "id": "word_id_1",
    "word": "apparent",
    "created_at": "2024-03-31T10:00:00Z"
  }
}
```

---

### 23. 编辑单词 (管理员)
**请求方法**: `PATCH /api/admin/words/:word_id`

**请求头**: 
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**请求参数**: `word_id` (URL 路径)

**请求体**: (所有字段都可选)
```json
{
  "word": "apparent",
  "pronunciation": "/ə'pɑːrənt/",
  "definition": "明显的，显然的",
  "example": "It is apparent that...",
  "difficulty": "medium",
  "unit": 1
}
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "id": "word_id_1",
    "updated_at": "2024-03-31T10:00:00Z"
  }
}
```

---

### 24. 删除单词 (管理员)
**请求方法**: `DELETE /api/admin/words/:word_id`

**请求头**: 
```
Authorization: Bearer {admin_token}
```

**请求参数**: `word_id` (URL 路径)

**响应成功 (200)**:
```json
{
  "success": true,
  "message": "单词已删除"
}
```

---

### 25. 添加长难句 (管理员)
**请求方法**: `POST /api/admin/sentences`

**请求头**: 
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**请求体**:
```json
{
  "english_text": "It is apparent that technological progress is accelerating...",
  "chinese_translation": "显然，技术进步正在加速...",
  "analysis": "This is an 'It is + adjective that' structure...",
  "unit": 1
}
```

**响应成功 (201)**:
```json
{
  "success": true,
  "data": {
    "id": "sentence_id_1",
    "created_at": "2024-03-31T10:00:00Z"
  }
}
```

---

### 26. 编辑长难句 (管理员)
**请求方法**: `PATCH /api/admin/sentences/:sentence_id`

**请求头**: 
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**请求参数**: `sentence_id` (URL 路径)

**请求体**:
```json
{
  "english_text": "...",
  "chinese_translation": "...",
  "analysis": "...",
  "unit": 1
}
```

**响应成功 (200)**:
```json
{
  "success": true,
  "data": {
    "id": "sentence_id_1",
    "updated_at": "2024-03-31T10:00:00Z"
  }
}
```

---

### 27. 删除长难句 (管理员)
**请求方法**: `DELETE /api/admin/sentences/:sentence_id`

**请求头**: 
```
Authorization: Bearer {admin_token}
```

**请求参数**: `sentence_id` (URL 路径)

**响应成功 (200)**:
```json
{
  "success": true,
  "message": "长难句已删除"
}
```

---

## 错误响应格式

所有 API 的错误响应统一格式如下：

### 401 未授权
```json
{
  "success": false,
  "error": "未授权，请先登录"
}
```

### 403 禁止访问
```json
{
  "success": false,
  "error": "没有权限访问此资源"
}
```

### 404 未找到
```json
{
  "success": false,
  "error": "请求的资源不存在"
}
```

### 422 验证错误
```json
{
  "success": false,
  "error": "输入验证失败",
  "details": {
    "email": "邮箱格式不正确",
    "password": "密码至少8个字符"
  }
}
```

### 500 服务器错误
```json
{
  "success": false,
  "error": "服务器错误，请稍后重试"
}
```

---

## 通用说明

### 认证方式
所有需要认证的接口都在请求头中包含 Bearer Token：
```
Authorization: Bearer {jwt_token}
```

### 分页参数
支持分页的接口响应中包含以下信息：
```json
"pagination": {
  "page": 1,           // 当前页码
  "limit": 20,         // 每页数量
  "total": 450,        // 总记录数
  "total_pages": 23    // 总页数
}
```

### 时间格式
所有时间戳均采用 ISO 8601 格式：`2024-03-31T10:00:00Z`

### 错误处理
所有响应都包含 `success` 字段，指示请求是否成功。前端应根据此字段判断请求结果。

### 请求超时
建议设置请求超时为 30 秒。

---

## Supabase 集成建议

当使用 Supabase 作为后端时，建议的数据库表结构：

1. **users** - 用户表
2. **words** - 单词库
3. **sentences** - 长难句库
4. **questions** - 题目库
5. **user_word_progress** - 用户单词学习进度
6. **user_sentence_progress** - 用户句子学习进度
7. **error_book** - 错题本记录
8. **vocabulary** - 生词本
9. **checkins** - 打卡记录
10. **learning_stats** - 学习统计

详细的数据库设计文档可根据需要单独生成。

