<template>
  <div class="admin-page">
    <header class="admin-header">
      <h1>长难句管理</h1>
      <button @click="showAddModal = true" class="btn-primary">添加长难句</button>
    </header>

    <div class="search-bar">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索长难句..."
      >
      <select v-model="filterUnit" @change="filterSentences">
        <option value="">全部单元</option>
        <option v-for="n in 34" :key="n" :value="n">Unit {{ n }}</option>
      </select>
    </div>

    <div v-if="filteredSentences.length === 0" class="empty-state">
      <p>暂无长难句数据</p>
    </div>

    <div v-else class="sentence-list">
      <div v-for="sentence in filteredSentences" :key="sentence.id" class="sentence-item">
        <div class="sentence-content">
          <h3>{{ sentence.englishText.substring(0, 50) }}...</h3>
          <p class="en-text">{{ sentence.englishText }}</p>
          <p class="cn-text">中文: {{ sentence.chineseTranslation }}</p>
          <p class="analysis">{{ sentence.analysis.substring(0, 100) }}...</p>
        </div>
        <div class="unit-badge">Unit {{ sentence.unit }}</div>
        <div class="actions">
          <button @click="editSentence(sentence)" class="btn-edit">编辑</button>
          <button @click="deleteSentence(sentence.id)" class="btn-delete">删除</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑模态框 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingSentence ? '编辑长难句' : '添加长难句' }}</h2>
        
        <form @submit.prevent="saveSentence">
          <div class="form-group">
            <label>英文句子</label>
            <textarea v-model="formData.englishText" rows="4" required></textarea>
          </div>
          
          <div class="form-group">
            <label>中文翻译</label>
            <textarea v-model="formData.chineseTranslation" rows="3" required></textarea>
          </div>
          
          <div class="form-group">
            <label>语法分析</label>
            <textarea v-model="formData.analysis" rows="4" required></textarea>
          </div>
          
          <div class="form-group">
            <label>单元</label>
            <select v-model.number="formData.unit" required>
              <option v-for="n in 34" :key="n" :value="n">Unit {{ n }}</option>
            </select>
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

interface Sentence {
  id: string
  englishText: string
  chineseTranslation: string
  analysis: string
  unit: number
}

const sentences = ref<Sentence[]>([
  {
    id: '1',
    englishText: 'It is apparent that technological progress is accelerating at an unprecedented rate.',
    chineseTranslation: '显然，技术进步正在以前所未有的速度加快。',
    analysis: 'It is + 形容词 that 从句结构，表示某事是...的',
    unit: 1
  }
])

const showAddModal = ref(false)
const searchQuery = ref('')
const filterUnit = ref('')
const editingSentence = ref<Sentence | null>(null)

const formData = ref({
  englishText: '',
  chineseTranslation: '',
  analysis: '',
  unit: 1
})

const filteredSentences = computed(() => {
  return sentences.value.filter(sentence => {
    const matchesSearch = sentence.englishText.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesUnit = !filterUnit.value || sentence.unit === Number(filterUnit.value)
    return matchesSearch && matchesUnit
  })
})

const filterSentences = () => {
  // 过滤逻辑已在 computed 中实现
}

const editSentence = (sentence: Sentence) => {
  editingSentence.value = sentence
  formData.value = { ...sentence }
  showAddModal.value = true
}

const saveSentence = async () => {
  // API 调用地点：PATCH /api/admin/sentences/:id 或 POST /api/admin/sentences
  // 需要字段：englishText, chineseTranslation, analysis, unit
  
  if (editingSentence.value) {
    const index = sentences.value.findIndex(s => s.id === editingSentence.value?.id)
    if (index !== -1) {
      sentences.value[index] = {
        ...formData.value,
        id: editingSentence.value.id
      }
    }
  } else {
    const newSentence: Sentence = {
      id: Date.now().toString(),
      ...formData.value
    }
    sentences.value.push(newSentence)
  }
  
  closeModal()
}

const deleteSentence = (id: string) => {
  // API 调用地点：DELETE /api/admin/sentences/:id
  if (confirm('确定要删除这个长难句吗？')) {
    sentences.value = sentences.value.filter(s => s.id !== id)
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingSentence.value = null
  formData.value = {
    englishText: '',
    chineseTranslation: '',
    analysis: '',
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

.sentence-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sentence-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.sentence-content {
  flex: 1;
}

.sentence-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.en-text {
  font-size: 14px;
  color: #374151;
  margin: 0 0 6px 0;
  line-height: 1.5;
}

.cn-text {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 6px 0;
}

.analysis {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.unit-badge {
  background: #eff6ff;
  color: #0369a1;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin: 0 16px;
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
