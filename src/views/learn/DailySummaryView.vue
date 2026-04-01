<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '@/stores/learning'
import AppButton from '@/components/common/AppButton.vue'
import StatsCard from '@/components/common/StatsCard.vue'

const router = useRouter()
const learningStore = useLearningStore()

const isCheckingIn = ref(false)
const hasCheckedIn = ref(false)

const todayPlan = computed(() => learningStore.todayPlan)
const stats = computed(() => learningStore.stats)

// 计算完成率
const completionRate = computed(() => {
  if (!todayPlan.value) return 0
  const { newWordsTarget, reviewWordsTarget, newWordsCompleted, reviewWordsCompleted, sentenceCompleted } = todayPlan.value
  const wordTotal = newWordsTarget + reviewWordsTarget
  const wordCompleted = newWordsCompleted + reviewWordsCompleted
  const sentenceWeight = 20
  const wordWeight = 80
  
  const wordProgress = wordTotal > 0 ? (wordCompleted / wordTotal) * wordWeight : wordWeight
  const sentenceProgress = sentenceCompleted ? sentenceWeight : 0
  
  return Math.round(wordProgress + sentenceProgress)
})

// 鼓励性文案
const encouragement = computed(() => {
  const rate = completionRate.value
  if (rate < 50) return '每一步都是进步，继续加油!'
  if (rate < 80) return '你已经完成大部分了，坚持就是胜利!'
  if (rate < 100) return '就差一点点，冲刺完成今日目标!'
  return '太棒了! 今日学习任务已全部完成!'
})

onMounted(() => {
  learningStore.loadTodayPlan()
  learningStore.loadStats()
})

async function handleCheckIn() {
  isCheckingIn.value = true
  try {
    await learningStore.checkIn()
    hasCheckedIn.value = true
  } finally {
    isCheckingIn.value = false
  }
}

function goHome() {
  router.push({ name: 'Home' })
}

function continueLearning() {
  // 返回首页继续学习
  router.push({ name: 'Home' })
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-background">
    <!-- 顶部装饰 -->
    <div 
      class="h-48 flex items-center justify-center"
      :class="[
        completionRate === 100 
          ? 'bg-gradient-to-b from-accent/20 to-transparent' 
          : 'bg-gradient-to-b from-primary/10 to-transparent'
      ]"
    >
      <div class="text-center">
        <!-- 完成率圆环 -->
        <div class="relative w-28 h-28 mx-auto mb-4">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              stroke-width="8"
              fill="none"
              class="text-secondary"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              stroke-width="8"
              fill="none"
              stroke-linecap="round"
              :class="[completionRate === 100 ? 'text-accent' : 'text-primary']"
              :stroke-dasharray="`${completionRate * 2.51} 251`"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-2xl font-bold text-foreground">{{ completionRate }}%</span>
          </div>
        </div>
        <h2 class="text-lg font-semibold text-foreground">今日总结</h2>
      </div>
    </div>
    
    <!-- 主内容 -->
    <div class="flex-1 px-4 -mt-4">
      <!-- 鼓励文案 -->
      <div class="bg-card rounded-xl p-4 border border-border mb-4 text-center">
        <p class="text-foreground">{{ encouragement }}</p>
      </div>
      
      <!-- 学习数据 -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <StatsCard
          label="新词完成"
          :value="`${todayPlan?.newWordsCompleted || 0}/${todayPlan?.newWordsTarget || 0}`"
          icon="book"
        />
        <StatsCard
          label="复习完成"
          :value="`${todayPlan?.reviewWordsCompleted || 0}/${todayPlan?.reviewWordsTarget || 0}`"
          icon="target"
        />
      </div>
      
      <!-- 长难句状态 -->
      <div class="bg-card rounded-xl p-4 border border-border mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="[
                todayPlan?.sentenceCompleted 
                  ? 'bg-accent/10 text-accent' 
                  : 'bg-secondary text-muted-foreground'
              ]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 6.1H3"/>
                <path d="M21 12.1H3"/>
                <path d="M15.1 18H3"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-foreground">长难句训练</p>
              <p class="text-xs text-muted-foreground">
                {{ todayPlan?.sentenceCompleted ? '已完成' : '待完成' }}
              </p>
            </div>
          </div>
          <svg 
            v-if="todayPlan?.sentenceCompleted"
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            class="text-accent"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
      </div>
      
      <!-- 连续打卡 -->
      <div class="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">连续打卡</p>
            <p class="text-2xl font-bold text-foreground">
              {{ stats?.consecutiveDays || 0 }} <span class="text-base font-normal">天</span>
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部操作 -->
    <div class="p-4 space-y-3 safe-area-bottom">
      <template v-if="completionRate === 100 && !hasCheckedIn">
        <AppButton
          @click="handleCheckIn"
          block
          size="lg"
          :loading="isCheckingIn"
        >
          完成打卡
        </AppButton>
      </template>
      
      <template v-else-if="hasCheckedIn">
        <div class="bg-accent/10 rounded-xl p-4 text-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent mx-auto mb-2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p class="text-accent font-medium">打卡成功!</p>
        </div>
        <AppButton
          @click="goHome"
          block
          size="lg"
        >
          返回首页
        </AppButton>
      </template>
      
      <template v-else>
        <AppButton
          @click="continueLearning"
          block
          size="lg"
        >
          继续学习
        </AppButton>
        <AppButton
          @click="goHome"
          variant="ghost"
          block
        >
          返回首页
        </AppButton>
      </template>
    </div>
  </div>
</template>
