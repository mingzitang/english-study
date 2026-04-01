<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { WordMastery } from '@/types'
import { mockWords } from '@/mock/data'
import FilterBar from '@/components/common/FilterBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()

// 筛选状态
const currentFilter = ref('all')
const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'unknown', label: '不认识' },
  { value: 'fuzzy', label: '模糊' },
  { value: 'known', label: '认识' }
]

// Mock 生词本数据
const vocabularyItems = ref(mockWords.slice(0, 6).map((word, index) => ({
  ...word,
  mastery: (['unknown', 'fuzzy', 'known'] as WordMastery[])[index % 3],
  addedAt: new Date(Date.now() - index * 86400000).toISOString()
})))

// 筛选后的列表
const filteredItems = computed(() => {
  if (currentFilter.value === 'all') {
    return vocabularyItems.value
  }
  return vocabularyItems.value.filter(item => item.mastery === currentFilter.value)
})

// 获取掌握程度标签样式
function getMasteryClass(mastery: WordMastery) {
  const classes = {
    known: 'bg-accent/10 text-accent',
    fuzzy: 'bg-warning/10 text-warning',
    unknown: 'bg-destructive/10 text-destructive'
  }
  return classes[mastery]
}

function getMasteryLabel(mastery: WordMastery) {
  const labels = {
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
    </div>
    
    <!-- 单词列表 -->
    <div v-if="filteredItems.length > 0" class="divide-y divide-border">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="px-4 py-4 bg-card hover:bg-secondary/30 transition-colors"
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
  </div>
</template>
