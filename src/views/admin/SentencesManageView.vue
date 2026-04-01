<template>
  <div class="manage-container">
    <div class="manage-header">
      <h1>长难句管理</h1>
      <button class="btn-primary" @click="showAddForm = true">新增长难句</button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索长难句..."
        class="search-input"
      />
      <select v-model="selectedDifficulty" class="filter-select">
        <option value="">全部难度</option>
        <option value="easy">简单</option>
        <option value="medium">中等</option>
        <option value="hard">困难</option>
      </select>
    </div>

    <!-- 长难句列表 -->
    <div class="sentences-table">
      <div class="table-header">
        <div class="col-sentence">长难句</div>
        <div class="col-difficulty">难度</div>
        <div class="col-translation">翻译</div>
        <div class="col-actions">操作</div>
      </div>
      <div v-if="filteredSentences.length" class="table-body">
        <div v-for="sentence in filteredSentences" :key="sentence.id" class="table-row">
          <div class="col-sentence">{{ sentence.sentence }}</div>
          <div class="col-difficulty">
            <span :class="['difficulty-badge', sentence.difficulty]">
              {{ difficultyText[sentence.difficulty] }}
            </span>
          </div>
          <div class="col-translation">{{ sentence.translation }}</div>
          <div class="col-actions">
            <button class="btn-small" @click="editSentence(sentence)">编辑</button>
            <button class="btn-small btn-danger" @click="deleteSentence(sentence.id)">删除</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        暂无长难句数据
      </div>
    </div>

    <!-- 新增/编辑表单 -->
    <div v-if="showAddForm" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingSentence ? '编辑长难句' : '新增长难句' }}</h2>
          <button class="btn-close" @click="closeForm">×</button>
        </div>
        <form @submit.prevent="saveSentence" class="form">
          <div class="form-group">
            <label>长难句</label>
            <textarea v-model="formData.sentence" required></textarea>
          </div>
          <div class="form-group">
            <label>翻译</label>
            <textarea v-model="formData.translation" required></textarea>
          </div>
          <div class="form-group">
            <label>语法分析</label>
            <textarea v-model="formData.analysis" placeholder="详细的语法分析"></textarea>
          </div>
          <div class="form-group">
            <label>难度</label>
            <select v-model="formData.difficulty" required>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
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

interface Sentence {
  id: string
  sentence: string
  translation: string
  analysis?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

const searchQuery = ref('')
const selectedDifficulty = ref('')
const showAddForm = ref(false)
const editingSentence = ref<Sentence | null>(null)

const difficultyText: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
}

const formData = ref({
  sentence: '',
  translation: '',
  analysis: '',
  difficulty: 'medium' as 'easy' | 'medium' | 'hard'
})

const sentences = ref<Sentence[]>([
  {
    id: '1',
    sentence: 'The increasing role of non-state actors in global governance has fundamentally altered the balance of power.',
    translation: '非国家行为体在全球治理中作用的增加从根本上改变了权力平衡。',
    analysis: '主句：The role has altered... 定语从句：of non-state actors',
    difficulty: 'hard'
  },
  {
    id: '2',
    sentence: 'What is particularly striking is that these changes have occurred simultaneously in multiple regions.',
    translation: '特别引人注目的是，这些变化同时发生在多个地区。',
    difficulty: 'medium'
  }
])

const filteredSentences = computed(() => {
  return sentences.value.filter(s => {
    const matchSearch = s.sentence.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                       s.translation.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchDifficulty = !selectedDifficulty.value || s.difficulty === selectedDifficulty.value
    return matchSearch && matchDifficulty
  })
})

const editSentence = (sentence: Sentence) => {
  editingSentence.value = sentence
  formData.value = { ...sentence }
  showAddForm.value = true
}

const closeForm = () => {
  showAddForm.value = false
  editingSentence.value = null
  formData.value = {
    sentence: '',
    translation: '',
    analysis: '',
    difficulty: 'medium'
  }
}

const saveSentence = () => {
  if (editingSentence.value) {
    // TODO: 调用 API 更新长难句
    // API 调用地点：PUT /api/admin/sentences/:id
    // 需要字段：sentence, translation, analysis, difficulty
    const index = sentences.value.findIndex(s => s.id === editingSentence.value!.id)
    if (index >= 0) {
      sentences.value[index] = { ...sentences.value[index], ...formData.value }
    }
  } else {
    // TODO: 调用 API 新增长难句
    // API 调用地点：POST /api/admin/sentences
    // 需要字段：sentence, translation, analysis, difficulty
    sentences.value.push({
      id: Date.now().toString(),
      ...formData.value
    })
  }
  closeForm()
}

const deleteSentence = (id: string) => {
  if (confirm('确定删除该长难句吗？')) {
    // TODO: 调用 API 删除长难句
    // API 调用地点：DELETE /api/admin/sentences/:id
    // 需要字段：无
    sentences.value = sentences.value.filter(s => s.id !== id)
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

.sentences-table {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1fr;
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
  grid-template-columns: 2fr 1fr 2fr 1fr;
  gap: 12px;
  padding: 15px;
  border-bottom: 1px solid var(--border);
  align-items: center;
  font-size: 14px;
}

.table-row:last-child {
  border-bottom: none;
}

.col-sentence {
  word-break: break-word;
  color: var(--foreground);
}

.difficulty-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-badge.easy {
  background: #dcfce7;
  color: #166534;
}

.difficulty-badge.medium {
  background: #fef08a;
  color: #713f12;
}

.difficulty-badge.hard {
  background: #fee2e2;
  color: #991b1b;
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
