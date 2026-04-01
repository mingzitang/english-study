<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLearningStore } from '@/stores/learning'
import type { WordMastery } from '@/types'
import MasteryButtons from '@/components/common/MasteryButtons.vue'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()
const learningStore = useLearningStore()

const showMeaning = ref(false)
const isTransitioning = ref(false)

// 学习类型: new 新词 / review 复习
const learningType = computed(() => (route.query.type as 'new' | 'review') || 'new')

const currentWord = computed(() => learningStore.currentWord)
const progress = computed(() => learningStore.wordsProgress)
const currentIndex = computed(() => learningStore.currentWordIndex)
const totalWords = computed(() => learningStore.currentWords.length)
const hasNextWord = computed(() => learningStore.hasNextWord)
const isLoading = computed(() => learningStore.loading)

onMounted(() => {
  loadWords()
})

watch(() => route.query.type, () => {
  loadWords()
})

async function loadWords() {
  showMeaning.value = false
  await learningStore.loadTodayWords(learningType.value)
}

function revealMeaning() {
  showMeaning.value = true
}

async function handleMastery(mastery: WordMastery) {
  if (!currentWord.value || isTransitioning.value) return
  
  isTransitioning.value = true
  
  // 提交掌握程度
  await learningStore.markWordMastery(currentWord.value.id, mastery)
  
  // 如果还有下一个单词，继续
  if (hasNextWord.value) {
    showMeaning.value = false
    learningStore.nextWord()
    
    setTimeout(() => {
      isTransitioning.value = false
    }, 100)
  } else {
    // 所有单词学完，跳转到下一个环节或总结
    handleComplete()
  }
}

function handleComplete() {
  if (learningType.value === 'review') {
    // 复习完成，去练长难句
    router.push({ name: 'SentenceLearning' })
  } else {
    // 新词学完，去看总结
    router.push({ name: 'DailySummary' })
  }
}

function exitLearning() {
  router.back()
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-background">
    <!-- 进度条 -->
    <div class="px-4 pt-4">
      <div class="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>{{ learningType === 'new' ? '新词学习' : '单词复习' }}</span>
        <span>{{ currentIndex + 1 }} / {{ totalWords }}</span>
      </div>
      <div class="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          class="h-full bg-primary rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col justify-center px-6 py-8">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-center">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">加载中...</p>
      </div>
      
      <!-- 无单词状态 -->
      <div v-else-if="!currentWord" class="text-center">
        <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-foreground mb-2">
          {{ learningType === 'new' ? '今日新词已学完' : '今日复习已完成' }}
        </h2>
        <p class="text-sm text-muted-foreground mb-6">继续保持，你做得很棒!</p>
        <AppButton @click="handleComplete">
          继续
        </AppButton>
      </div>
      
      <!-- 单词卡片 -->
      <div v-else class="text-center">
        <!-- 单词 -->
        <h1 class="text-4xl font-bold text-foreground mb-2">
          {{ currentWord.word }}
        </h1>
        
        <!-- 音标 -->
        <p v-if="currentWord.phonetic" class="text-lg text-muted-foreground mb-6">
          {{ currentWord.phonetic }}
        </p>
        
        <!-- 释义区域 -->
        <div 
          class="min-h-32 flex flex-col items-center justify-center transition-all duration-300"
          :class="{ 'opacity-0': !showMeaning && !learningType }"
        >
          <template v-if="showMeaning || learningType === 'new'">
            <!-- 释义列表 -->
            <div class="space-y-2 mb-6">
              <p 
                v-for="(meaning, index) in currentWord.meanings" 
                :key="index"
                class="text-lg text-foreground"
              >
                <span class="text-primary font-medium">{{ meaning.partOfSpeech }}</span>
                {{ meaning.definition }}
              </p>
            </div>
            
            <!-- 例句 -->
            <div v-if="currentWord.examples.length > 0" class="w-full max-w-md">
              <p class="text-sm text-muted-foreground mb-2">例句</p>
              <div class="bg-secondary/50 rounded-xl p-4 text-left">
                <p 
                  v-for="(example, index) in currentWord.examples.slice(0, 1)" 
                  :key="index"
                  class="text-sm text-foreground leading-relaxed"
                >
                  {{ example }}
                </p>
              </div>
            </div>
          </template>
          
          <!-- 点击显示释义按钮 (仅复习时) -->
          <button
            v-else
            @click="revealMeaning"
            class="px-6 py-3 text-primary font-medium hover:bg-primary/5 rounded-xl transition-colors"
          >
            点击显示释义
          </button>
        </div>
      </div>
    </div>
    
    <!-- 底部操作区 -->
    <div v-if="currentWord" class="p-4 bg-card border-t border-border safe-area-bottom">
      <MasteryButtons 
        @select="handleMastery"
        :disabled="!showMeaning && learningType === 'review'"
        :loading="isTransitioning"
      />
      
      <!-- 退出按钮 -->
      <button 
        @click="exitLearning"
        class="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        稍后继续
      </button>
    </div>
  </div>
</template>
