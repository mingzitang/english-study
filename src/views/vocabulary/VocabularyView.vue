<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { WordMastery, VocabularyBookItem, CustomWordInput } from '@/types'
import { learningApi } from '@/api/learning'
import FilterBar from '@/components/common/FilterBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()

// 筛选状态
const currentFilter = ref('all')
const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'unknown', label: '不认识' },
  { value: 'fuzzy', label: '模糊' },
  { value: 'known', label: '认识' }
]

type VocabularyViewItem = VocabularyBookItem['word'] & {
  vocabularyItemId: string
  mastery: WordMastery
  addedAt: string
}

const vocabularyItems = ref<VocabularyViewItem[]>([])
const loading = ref(false)
const actionMessage = ref('')
const showAddModal = ref(false)
const addStep = ref<1 | 2>(1)
const englishWord = ref('')
const customTranslation = ref('')
const customPhonetic = ref('')
const customPartOfSpeech = ref('')
const customExamples = ref('')

// 筛选后的列表
const filteredItems = computed(() => {
  if (currentFilter.value === 'all') {
    return vocabularyItems.value
  }
  return vocabularyItems.value.filter((item: VocabularyViewItem) => item.mastery === currentFilter.value)
})

// 获取掌握程度标签样式
function getMasteryClass(mastery: WordMastery) {
  const classes: Record<WordMastery, string> = {
    known: 'bg-accent/10 text-accent',
    fuzzy: 'bg-warning/10 text-warning',
    unknown: 'bg-destructive/10 text-destructive'
  }
  return classes[mastery]
}

function getMasteryLabel(mastery: WordMastery) {
  const labels: Record<WordMastery, string> = {
    known: '认识',
    fuzzy: '模糊',
    unknown: '不认识'
  }
  return labels[mastery]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

function goBack() {
  router.back()
}

function openDetail(id: string) {
  router.push({ name: 'VocabularyDetail', params: { id } })
}

onMounted(async () => {
  loading.value = true
  try {
    const list = await learningApi.getVocabularyItems()
    vocabularyItems.value = list.map(item => ({
      ...item.word,
      vocabularyItemId: item.id,
      mastery: item.mastery,
      addedAt: item.addedAt
    }))
  } finally {
    loading.value = false
  }
})

function resetAddForm() {
  addStep.value = 1
  englishWord.value = ''
  customTranslation.value = ''
  customPhonetic.value = ''
  customPartOfSpeech.value = ''
  customExamples.value = ''
}

function openAddModal() {
  actionMessage.value = ''
  resetAddForm()
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

async function refreshVocabularyList() {
  const list = await learningApi.getVocabularyItems()
  vocabularyItems.value = list.map(item => ({
    ...item.word,
    vocabularyItemId: item.id,
    mastery: item.mastery,
    addedAt: item.addedAt
  }))
}

async function submitEnglishCheck() {
  const word = englishWord.value.trim()
  if (!word) return
  const result = await learningApi.addWordFromSentence(word)
  if (result.status === 'need_custom_info') {
    addStep.value = 2
    return
  }
  actionMessage.value = result.message || (result.status === 'exists' ? '该单词已在生词本中' : '添加成功')
  await refreshVocabularyList()
  showAddModal.value = false
}

async function submitCustomAdd() {
  if (!englishWord.value.trim() || !customTranslation.value.trim()) return
  const payload: CustomWordInput = {
    translation: customTranslation.value.trim(),
    phonetic: customPhonetic.value.trim() || undefined,
    partOfSpeech: customPartOfSpeech.value.trim() || undefined,
    examples: customExamples.value
      .split('\n')
      .map((x: string) => x.trim())
      .filter(Boolean)
  }
  const result = await learningApi.addWordFromSentence(englishWord.value.trim(), undefined, payload)
  actionMessage.value = result.message || (result.status === 'exists' ? '该单词已在生词本中' : '添加成功')
  await refreshVocabularyList()
  showAddModal.value = false
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 bg-card border-b border-border safe-area-top">
      <div class="flex items-center h-12 px-4">
        <button 
          @click="goBack"
          class="w-10 h-10 flex items-center justify-center -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 class="flex-1 text-center text-base font-semibold text-foreground -ml-10">生词本</h1>
        <button
          @click="openAddModal"
          class="text-sm text-primary font-medium"
        >
          添加
        </button>
      </div>
    </header>
    
    <!-- 筛选栏 -->
    <div class="px-4 py-3 border-b border-border">
      <FilterBar 
        v-model="currentFilter"
        :options="filterOptions"
      />
    </div>
    
    <!-- 统计信息 -->
    <div class="px-4 py-3 bg-secondary/30">
      <p class="text-sm text-muted-foreground">
        共 <span class="font-medium text-foreground">{{ filteredItems.length }}</span> 个单词
      </p>
      <p v-if="actionMessage" class="text-xs text-primary mt-1">{{ actionMessage }}</p>
    </div>
    
    <!-- 单词列表 -->
    <div v-if="loading" class="p-6 text-sm text-muted-foreground text-center">加载中...</div>
    <div v-else-if="filteredItems.length > 0" class="divide-y divide-border">
      <div
        v-for="item in filteredItems"
        :key="item.vocabularyItemId"
        class="px-4 py-4 bg-card hover:bg-secondary/30 transition-colors cursor-pointer"
        @click="openDetail(item.vocabularyItemId)"
      >
        <div class="flex items-start justify-between mb-2">
          <div>
            <h3 class="text-lg font-semibold text-foreground">{{ item.word }}</h3>
            <p v-if="item.phonetic" class="text-sm text-muted-foreground">{{ item.phonetic }}</p>
          </div>
          <span 
            class="px-2 py-1 rounded-full text-xs font-medium"
            :class="getMasteryClass(item.mastery)"
          >
            {{ getMasteryLabel(item.mastery) }}
          </span>
        </div>
        
        <!-- 释义 -->
        <div class="space-y-1 mb-2">
          <p 
            v-for="(meaning, index) in item.meanings.slice(0, 2)" 
            :key="index"
            class="text-sm text-foreground"
          >
            <span class="text-primary">{{ meaning.partOfSpeech }}</span>
            {{ meaning.definition }}
          </p>
        </div>
        
        <!-- 底部信息 -->
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span>添加于 {{ formatDate(item.addedAt) }}</span>
          <span v-if="item.source === 'sentence'" class="text-primary">来自长难句</span>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <EmptyState 
      v-else
      title="暂无生词"
      description="在学习长难句时可以将不认识的单词加入生词本"
      icon="empty"
    />

    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      @click.self="closeAddModal"
    >
      <div class="w-full max-w-sm bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 class="text-base font-semibold text-foreground">添加生词</h3>

        <div class="space-y-2">
          <label class="text-xs text-muted-foreground">英文（必填）</label>
          <input
            v-model="englishWord"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="请输入英文单词，如 situation"
            :disabled="addStep === 2"
          />
        </div>

        <template v-if="addStep === 2">
          <p class="text-xs text-muted-foreground">
            该词不在公共词库和私有词库中，请补充信息后保存
          </p>
          <div class="space-y-2">
            <label class="text-xs text-muted-foreground">中文翻译（必填）</label>
            <input v-model="customTranslation" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="请输入中文释义" />
          </div>
          <div class="space-y-2">
            <label class="text-xs text-muted-foreground">音标（可选）</label>
            <input v-model="customPhonetic" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div class="space-y-2">
            <label class="text-xs text-muted-foreground">词性（可选）</label>
            <input v-model="customPartOfSpeech" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="如 n. / v." />
          </div>
          <div class="space-y-2">
            <label class="text-xs text-muted-foreground">例句（可选，一行一个）</label>
            <textarea v-model="customExamples" rows="3" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" />
          </div>
        </template>

        <div class="flex gap-2 pt-1">
          <AppButton variant="ghost" block @click="closeAddModal">取消</AppButton>
          <AppButton
            v-if="addStep === 1"
            block
            :disabled="!englishWord.trim()"
            @click="submitEnglishCheck"
          >
            下一步
          </AppButton>
          <AppButton
            v-else
            block
            :disabled="!customTranslation.trim()"
            @click="submitCustomAdd"
          >
            保存并加入
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
