<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const settings = computed(() => authStore.settings)

const newWordsOptions = [10, 40, 80, 100]
const reviewWordsOptions = [20, 60, 100, 200]

const selectedNewWords = ref(settings.value.dailyNewWords)
const selectedReviewWords = ref(settings.value.dailyReviewWords)
const customNewWords = ref('')
const customReviewWords = ref('')
const useCustomNew = ref(false)
const useCustomReview = ref(false)

// 预估学习时长 (每个单词约0.5分钟)
const estimatedMinutes = computed(() => {
  const newWords = useCustomNew.value ? Number(customNewWords.value) || 0 : selectedNewWords.value
  const reviewWords = useCustomReview.value ? Number(customReviewWords.value) || 0 : selectedReviewWords.value
  return Math.round((newWords * 0.5 + reviewWords * 0.3 + 5)) // +5 为长难句时间
})

// 任务量建议
const suggestion = computed(() => {
  const newWords = useCustomNew.value ? Number(customNewWords.value) || 0 : selectedNewWords.value
  const reviewWords = useCustomReview.value ? Number(customReviewWords.value) || 0 : selectedReviewWords.value
  
  if (newWords > 100 || reviewWords > 200) {
    return { type: 'warning', text: '任务量较大，建议适当减少以保证学习质量' }
  }
  if (newWords < 20 && reviewWords < 40) {
    return { type: 'info', text: '任务量较少，可以考虑适当增加' }
  }
  return { type: 'success', text: '任务量适中，加油坚持!' }
})

function selectNewWords(value: number) {
  selectedNewWords.value = value
  useCustomNew.value = false
}

function selectReviewWords(value: number) {
  selectedReviewWords.value = value
  useCustomReview.value = false
}

async function saveSettings() {
  const newWords = useCustomNew.value ? Number(customNewWords.value) : selectedNewWords.value
  const reviewWords = useCustomReview.value ? Number(customReviewWords.value) : selectedReviewWords.value
  
  await authStore.updateSettings({
    dailyNewWords: newWords,
    dailyReviewWords: reviewWords
  })
  
  router.back()
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
        <h1 class="flex-1 text-center text-base font-semibold text-foreground -ml-10">学习设置</h1>
      </div>
    </header>
    
    <div class="p-4 space-y-6">
      <!-- 新词数量 -->
      <section>
        <h3 class="text-sm font-medium text-foreground mb-3">每日新词数量</h3>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="value in newWordsOptions"
            :key="value"
            @click="selectNewWords(value)"
            class="h-11 rounded-xl text-sm font-medium transition-all border-2"
            :class="[
              selectedNewWords === value && !useCustomNew
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-foreground hover:border-primary/50'
            ]"
          >
            {{ value }}
          </button>
        </div>
        
        <!-- 自定义输入 -->
        <div class="mt-3 flex items-center gap-3">
          <input
            v-model="customNewWords"
            @focus="useCustomNew = true"
            type="number"
            placeholder="自定义数量"
            class="flex-1 h-11 px-4 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground text-sm"
            :class="{ 'ring-2 ring-primary': useCustomNew }"
          />
        </div>
      </section>
      
      <!-- 复习词数量 -->
      <section>
        <h3 class="text-sm font-medium text-foreground mb-3">每日复习词数量</h3>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="value in reviewWordsOptions"
            :key="value"
            @click="selectReviewWords(value)"
            class="h-11 rounded-xl text-sm font-medium transition-all border-2"
            :class="[
              selectedReviewWords === value && !useCustomReview
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-foreground hover:border-primary/50'
            ]"
          >
            {{ value }}
          </button>
        </div>
        
        <!-- 自定义输入 -->
        <div class="mt-3 flex items-center gap-3">
          <input
            v-model="customReviewWords"
            @focus="useCustomReview = true"
            type="number"
            placeholder="自定义数量"
            class="flex-1 h-11 px-4 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground text-sm"
            :class="{ 'ring-2 ring-primary': useCustomReview }"
          />
        </div>
      </section>
      
      <!-- 预估时长 -->
      <section class="bg-card rounded-xl p-4 border border-border">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-muted-foreground">预计每日学习时长</span>
          <span class="text-lg font-semibold text-foreground">约 {{ estimatedMinutes }} 分钟</span>
        </div>
        <div 
          class="text-xs rounded-lg p-2"
          :class="{
            'bg-accent/10 text-accent': suggestion.type === 'success',
            'bg-warning/10 text-warning': suggestion.type === 'warning',
            'bg-primary/10 text-primary': suggestion.type === 'info'
          }"
        >
          {{ suggestion.text }}
        </div>
      </section>
      
      <!-- 说明 -->
      <section class="bg-secondary/30 rounded-xl p-4">
        <h4 class="text-sm font-medium text-foreground mb-2">未完成任务处理规则</h4>
        <ul class="space-y-2 text-xs text-muted-foreground">
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">*</span>
            <span>当日未完成的新词会自动减少第二天的新词量</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">*</span>
            <span>当日未完成的复习词会直接顺延到第二天</span>
          </li>
        </ul>
      </section>
    </div>
    
    <!-- 底部保存按钮 -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
      <AppButton
        @click="saveSettings"
        block
        size="lg"
      >
        保存设置
      </AppButton>
    </div>
  </div>
</template>
