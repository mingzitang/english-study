<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { ErrorBookItem } from '@/types'
import { learningApi } from '@/api/learning'
import FilterBar from '@/components/common/FilterBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()

// 筛选状态
const currentFilter = ref('all')
const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待复习' },
  { value: 'reviewed', label: '已复习' },
  { value: 'mastered', label: '已掌握' }
]

const errorItems = ref<ErrorBookItem[]>([])
const loading = ref(false)

// 筛选后的列表
const filteredItems = computed(() => {
  if (currentFilter.value === 'all') {
    return errorItems.value
  }
  return errorItems.value.filter(item => item.reviewStatus === currentFilter.value)
})

// 展开状态
const expandedId = ref<string | null>(null)

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function getStatusClass(status: string) {
  const classes = {
    pending: 'bg-warning/10 text-warning',
    reviewed: 'bg-primary/10 text-primary',
    mastered: 'bg-accent/10 text-accent'
  }
  return classes[status as keyof typeof classes]
}

function getStatusLabel(status: string) {
  const labels = {
    pending: '待复习',
    reviewed: '已复习',
    mastered: '已掌握'
  }
  return labels[status as keyof typeof labels]
}

function getReasonLabel(reason: string) {
  const labels = {
    auto: '自动添加',
    ai_suggest: 'AI建议',
    manual: '手动添加'
  }
  return labels[reason as keyof typeof labels]
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

onMounted(async () => {
  loading.value = true
  try {
    errorItems.value = await learningApi.getErrorBookItems()
  } finally {
    loading.value = false
  }
})
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
        <h1 class="flex-1 text-center text-base font-semibold text-foreground -ml-10">错题本</h1>
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
        共 <span class="font-medium text-foreground">{{ filteredItems.length }}</span> 个错题
      </p>
    </div>
    
    <!-- 错题列表 -->
    <div v-if="loading" class="p-6 text-sm text-muted-foreground text-center">加载中...</div>
    <div v-else-if="filteredItems.length > 0" class="divide-y divide-border">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-card"
      >
        <!-- 句子概览 -->
        <button
          @click="toggleExpand(item.id)"
          class="w-full px-4 py-4 text-left hover:bg-secondary/30 transition-colors"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span 
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="getStatusClass(item.reviewStatus)"
              >
                {{ getStatusLabel(item.reviewStatus) }}
              </span>
              <span class="text-xs text-muted-foreground">
                难度 {{ item.sentence.difficulty }}
              </span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              class="text-muted-foreground transition-transform shrink-0"
              :class="{ 'rotate-180': expandedId === item.id }"
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
          
          <!-- 英文句子预览 -->
          <p class="text-sm text-foreground line-clamp-2 leading-relaxed">
            {{ item.sentence.content }}
          </p>
          
          <!-- 底部信息 -->
          <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{{ formatDate(item.addedAt) }}</span>
            <span>{{ getReasonLabel(item.addedReason) }}</span>
            <span v-if="item.reviewCount > 0">已复习 {{ item.reviewCount }} 次</span>
          </div>
        </button>
        
        <!-- 展开详情 -->
        <div 
          v-if="expandedId === item.id"
          class="px-4 pb-4 space-y-3 border-t border-border pt-3"
        >
          <!-- 参考译文 -->
          <div>
            <p class="text-xs text-muted-foreground mb-1">参考译文</p>
            <p class="text-sm text-foreground leading-relaxed">
              {{ item.sentence.translation }}
            </p>
          </div>
          
          <!-- 句子分析 -->
          <div>
            <p class="text-xs text-muted-foreground mb-1">句子结构</p>
            <p class="text-sm text-foreground whitespace-pre-line leading-relaxed">
              {{ item.sentence.analysis }}
            </p>
          </div>
          
          <!-- 来源 -->
          <div v-if="item.sentence.source" class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">来源:</span>
            <span class="text-xs text-primary">{{ item.sentence.source }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <EmptyState 
      v-else
      title="暂无错题"
      description="在长难句训练中答错的句子会自动加入错题本"
      icon="empty"
    />
  </div>
</template>
