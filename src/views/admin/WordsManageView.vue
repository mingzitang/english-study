<template>
  <div class="manage-container">
    <div class="manage-header">
      <h1>单词管理</h1>
      <button class="btn-primary" @click="showAddForm = true">新增单词</button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索单词..."
        class="search-input"
      />
      <select v-model="selectedCategory" class="filter-select">
        <option value="">全部分类</option>
        <option value="noun">名词</option>
        <option value="verb">动词</option>
        <option value="adj">形容词</option>
        <option value="adv">副词</option>
      </select>
    </div>

    <!-- 单词列表 -->
    <div class="words-table">
      <div class="table-header">
        <div class="col-word">单词</div>
        <div class="col-meaning">含义</div>
        <div class="col-category">分类</div>
        <div class="col-example">例句</div>
        <div class="col-actions">操作</div>
      </div>
      <div v-if="filteredWords.length" class="table-body">
        <div v-for="word in filteredWords" :key="word.id" class="table-row">
          <div class="col-word">{{ word.word }}</div>
          <div class="col-meaning">{{ word.meaning }}</div>
          <div class="col-category">
            <span class="category-badge">{{ word.category }}</span>
          </div>
          <div class="col-example">{{ word.example }}</div>
          <div class="col-actions">
            <button class="btn-small" @click="editWord(word)">编辑</button>
            <button class="btn-small btn-danger" @click="deleteWord(word.id)">删除</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        暂无单词数据
      </div>
    </div>

    <!-- 新增/编辑表单 -->
    <div v-if="showAddForm" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingWord ? '编辑单词' : '新增单词' }}</h2>
          <button class="btn-close" @click="closeForm">×</button>
        </div>
        <form @submit.prevent="saveWord" class="form">
          <div class="form-group">
            <label>单词</label>
            <input v-model="formData.word" type="text" required />
          </div>
          <div class="form-group">
            <label>含义</label>
            <input v-model="formData.meaning" type="text" required />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="formData.category" required>
              <option>noun</option>
              <option>verb</option>
              <option>adj</option>
              <option>adv</option>
            </select>
          </div>
          <div class="form-group">
            <label>例句</label>
            <textarea v-model="formData.example" required></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeForm">取消</button>
            <button type="submit" class="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Word {
  id: string
  word: string
  meaning: string
  category: string
  example: string
}

const searchQuery = ref('')
const selectedCategory = ref('')
const showAddForm = ref(false)
const editingWord = ref<Word | null>(null)

const formData = ref({
  word: '',
  meaning: '',
  category: 'noun',
  example: ''
})

const words = ref<Word[]>([
  {
    id: '1',
    word: 'abandon',
    meaning: '放弃',
    category: 'verb',
    example: 'He abandoned his plans.'
  },
  {
    id: '2',
    word: 'ability',
    meaning: '能力',
    category: 'noun',
    example: 'She has the ability to succeed.'
  }
])

const filteredWords = computed(() => {
  return words.value.filter(word => {
    const matchSearch = word.word.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                       word.meaning.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = !selectedCategory.value || word.category === selectedCategory.value
    return matchSearch && matchCategory
  })
})

const editWord = (word: Word) => {
  editingWord.value = word
  formData.value = { ...word }
  showAddForm.value = true
}

const closeForm = () => {
  showAddForm.value = false
  editingWord.value = null
  formData.value = {
    word: '',
    meaning: '',
    category: 'noun',
    example: ''
  }
}

const saveWord = () => {
  if (editingWord.value) {
    // TODO: 调用 API 更新单词
    // API 调用地点：PUT /api/admin/words/:id
    // 需要字段：word, meaning, category, example
    const index = words.value.findIndex(w => w.id === editingWord.value!.id)
    if (index >= 0) {
      words.value[index] = { ...words.value[index], ...formData.value }
    }
  } else {
    // TODO: 调用 API 新增单词
    // API 调用地点：POST /api/admin/words
    // 需要字段：word, meaning, category, example
    words.value.push({
      id: Date.now().toString(),
      ...formData.value
    })
  }
  closeForm()
}

const deleteWord = (id: string) => {
  if (confirm('确定删除该单词吗？')) {
    // TODO: 调用 API 删除单词
    // API 调用地点：DELETE /api/admin/words/:id
    // 需要字段：无
    words.value = words.value.filter(w => w.id !== id)
  }
}
</script>

<style scoped>
.manage-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.manage-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--foreground);
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input,
.filter-select {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--foreground);
  background: var(--background);
}

.search-input {
  flex: 1;
}

.filter-select {
  min-width: 120px;
}

.words-table {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 2fr 1fr;
  gap: 12px;
  padding: 15px;
  background: var(--background);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 13px;
  color: var(--muted-foreground);
}

.table-body {
  max-height: 500px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 2fr 1fr;
  gap: 12px;
  padding: 15px;
  border-bottom: 1px solid var(--border);
  align-items: center;
  font-size: 14px;
}

.table-row:last-child {
  border-bottom: none;
}

.category-badge {
  display: inline-block;
  padding: 4px 8px;
  background: var(--primary);
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted-foreground);
}

.col-actions {
  display: flex;
  gap: 8px;
}

.btn-primary,
.btn-small,
.btn-danger,
.btn-cancel {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-small {
  background: var(--background);
  border: 1px solid var(--border);
  color: var(--foreground);
}

.btn-small:hover {
  background: var(--muted-background);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
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
  background: var(--card);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--foreground);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--muted-foreground);
}

.form {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
  color: var(--foreground);
  background: var(--background);
  font-family: inherit;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel {
  background: var(--background);
  border: 1px solid var(--border);
  color: var(--foreground);
}

.btn-cancel:hover {
  background: var(--muted-background);
}
</style>
