<template>
  <div class="admin-page">
    <header class="admin-header">
      <h1>单词管理</h1>
      <button @click="showAddModal = true" class="btn-primary">添加单词</button>
    </header>

    <div class="search-bar">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索单词..."
        @input="filterWords"
      >
      <select v-model="filterDifficulty" @change="filterWords">
        <option value="">全部难度</option>
        <option value="easy">简单</option>
        <option value="medium">中等</option>
        <option value="hard">困难</option>
      </select>
    </div>

    <div v-if="filteredWords.length === 0" class="empty-state">
      <p>暂无单词数据</p>
    </div>

    <div v-else class="word-list">
      <div v-for="word in filteredWords" :key="word.id" class="word-item">
        <div class="word-content">
          <h3>{{ word.word }}</h3>
          <p class="pronunciation">{{ word.pronunciation }}</p>
          <p class="definition">{{ word.definition }}</p>
          <p class="example">例句: {{ word.example }}</p>
        </div>
        <div class="difficulty" :class="`difficulty-${word.difficulty}`">
          {{ getDifficultyLabel(word.difficulty) }}
        </div>
        <div class="actions">
          <button @click="editWord(word)" class="btn-edit">编辑</button>
          <button @click="deleteWord(word.id)" class="btn-delete">删除</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑模态框 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingWord ? '编辑单词' : '添加单词' }}</h2>
        
        <form @submit.prevent="saveWord">
          <div class="form-group">
            <label>单词</label>
            <input v-model="formData.word" type="text" required>
          </div>
          
          <div class="form-group">
            <label>发音</label>
            <input v-model="formData.pronunciation" type="text" placeholder="/ə'pɑːrənt/">
          </div>
          
          <div class="form-group">
            <label>中文定义</label>
            <textarea v-model="formData.definition" rows="3" required></textarea>
          </div>
          
          <div class="form-group">
            <label>例句</label>
            <textarea v-model="formData.example" rows="3" required></textarea>
          </div>
          
          <div class="form-group">
            <label>难度</label>
            <select v-model="formData.difficulty" required>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>单元</label>
            <input v-model="formData.unit" type="number" min="1" max="34">
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">取消</button>
            <button type="submit" class="btn-submit">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { definePageMeta } from '#app'

definePageMeta({
  layout: 'admin'
})

interface Word {
  id: string
  word: string
  pronunciation: string
  definition: string
  example: string
  difficulty: 'easy' | 'medium' | 'hard'
  unit: number
}

const words = ref<Word[]>([
  {
    id: '1',
    word: 'apparent',
    pronunciation: "/ə'pɑːrənt/",
    definition: '明显的，显然的',
    example: 'It is apparent that he is telling the truth.',
    difficulty: 'medium',
    unit: 1
  }
])

const showAddModal = ref(false)
const searchQuery = ref('')
const filterDifficulty = ref('')
const editingWord = ref<Word | null>(null)

const formData = ref({
  word: '',
  pronunciation: '',
  definition: '',
  example: '',
  difficulty: 'medium' as const,
  unit: 1
})

const filteredWords = computed(() => {
  return words.value.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         word.definition.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDifficulty = !filterDifficulty.value || word.difficulty === filterDifficulty.value
    return matchesSearch && matchesDifficulty
  })
})

const filterWords = () => {
  // 过滤逻辑已在 computed 中实现
}

const getDifficultyLabel = (difficulty: string) => {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

const editWord = (word: Word) => {
  editingWord.value = word
  formData.value = { ...word }
  showAddModal.value = true
}

const saveWord = async () => {
  // API 调用地点：PATCH /api/admin/words/:id 或 POST /api/admin/words
  // 需要字段：word, pronunciation, definition, example, difficulty, unit
  
  if (editingWord.value) {
    // 编辑现有单词
    const index = words.value.findIndex(w => w.id === editingWord.value?.id)
    if (index !== -1) {
      words.value[index] = {
        ...formData.value,
        id: editingWord.value.id
      }
    }
  } else {
    // 添加新单词
    const newWord: Word = {
      id: Date.now().toString(),
      ...formData.value
    }
    words.value.push(newWord)
  }
  
  closeModal()
}

const deleteWord = (id: string) => {
  // API 调用地点：DELETE /api/admin/words/:id
  if (confirm('确定要删除这个单词吗？')) {
    words.value = words.value.filter(w => w.id !== id)
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingWord.value = null
  formData.value = {
    word: '',
    pronunciation: '',
    definition: '',
    example: '',
    difficulty: 'medium',
    unit: 1
  }
}
</script>

<style scoped>
.admin-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.admin-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-bar input,
.search-bar select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.search-bar select {
  flex: 0 0 150px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.word-content {
  flex: 1;
}

.word-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.pronunciation {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.definition {
  font-size: 14px;
  color: #374151;
  margin: 4px 0;
}

.example {
  font-size: 13px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.difficulty {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin: 0 16px;
}

.difficulty-easy {
  background: #d1fae5;
  color: #065f46;
}

.difficulty-medium {
  background: #fef3c7;
  color: #92400e;
}

.difficulty-hard {
  background: #fee2e2;
  color: #991b1b;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-primary, .btn-edit, .btn-delete, .btn-cancel, .btn-submit {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-edit {
  background: #10b981;
  color: white;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #1f2937;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel {
  background: #e5e7eb;
  color: #374151;
}

.btn-submit {
  background: #3b82f6;
  color: white;
}
</style>
