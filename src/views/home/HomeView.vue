<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useLearningStore } from '@/stores/learning'
import { useAuthStore } from '@/stores/auth'
import ProgressCard from '@/components/common/ProgressCard.vue'
import StatsCard from '@/components/common/StatsCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const learningStore = useLearningStore()
const authStore = useAuthStore()

onMounted(() => {
  learningStore.loadTodayPlan()
  learningStore.loadStats()
})

const todayPlan = computed(() => learningStore.todayPlan)
const stats = computed(() => learningStore.stats)
const isTodayPlanLoaded = computed(() => learningStore.todayPlanLoaded)
const progress = computed(() => (isTodayPlanLoaded.value ? learningStore.todayProgress : null))

// 鼓励性文案
const encouragement = computed(() => {
  if (!isTodayPlanLoaded.value) return '正在同步今日进度...'
  const rate = progress.value
  if (rate === null) return '正在同步今日进度...'
  if (rate === 0) return '新的一天，开始学习吧!'
  if (rate < 30) return '加油，你已经迈出第一步!'
  if (rate < 60) return '继续保持，你做得很好!'
  if (rate < 100) return '就差一点点，冲刺完成!'
  return '太棒了，今日目标已完成!'
})

function startLearning() {
  // 根据今日计划决定从哪里开始
  if (todayPlan.value) {
    const { reviewWordsCompleted, reviewWordsTarget, newWordsCompleted, newWordsTarget, sentenceCompleted } = todayPlan.value
    
    // 先复习旧词
    if (reviewWordsCompleted < reviewWordsTarget) {
      router.push({ name: 'WordLearning', query: { type: 'review' } })
      return
    }
    
    // 再练长难句
    if (!sentenceCompleted) {
      router.push({ name: 'SentenceLearning' })
      return
    }
    
    // 最后背新词
    if (newWordsCompleted < newWordsTarget) {
      router.push({ name: 'WordLearning', query: { type: 'new' } })
      return
    }
  }
  
  // 默认从新词开始
  router.push({ name: 'WordLearning', query: { type: 'new' } })
}
</script>

<template>
  <div class="px-4 py-4 space-y-6">
    <!-- 欢迎区域 -->
    <section class="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground">
      <div class="flex items-start justify-between mb-4">
        <div>
          <p class="text-sm opacity-90 mb-1">{{ authStore.examType === 'english1' ? '英语一' : '英语二' }}</p>
          <h2 class="text-xl font-bold">{{ encouragement }}</h2>
        </div>
        <div class="text-right">
          <p class="text-3xl font-bold">{{ progress === null ? '--' : `${progress}%` }}</p>
          <p class="text-xs opacity-80">今日进度</p>
        </div>
      </div>
      
      <!-- 今日目标 -->
      <div class="flex items-center gap-4 text-sm opacity-90 mb-4">
        <span>预计 {{ todayPlan?.estimatedMinutes || 35 }} 分钟</span>
        <span class="w-1 h-1 rounded-full bg-current opacity-60" />
        <span>新词 {{ todayPlan?.newWordsTarget || 40 }}</span>
        <span class="w-1 h-1 rounded-full bg-current opacity-60" />
        <span>复习 {{ todayPlan?.reviewWordsTarget || 60 }}</span>
      </div>
      
      <AppButton 
        @click="startLearning"
        variant="secondary"
        block
        size="lg"
      >
        {{ progress !== null && progress > 0 && progress < 100 ? '继续学习' : progress === 100 ? '查看总结' : '开始学习' }}
      </AppButton>
    </section>
    
    <!-- 学习进度 -->
    <section>
      <h3 class="text-base font-semibold text-foreground mb-3">今日进度</h3>
      <div class="grid grid-cols-2 gap-3">
        <ProgressCard
          title="新词学习"
          :current="todayPlan?.newWordsCompleted || 0"
          :total="todayPlan?.newWordsTarget || 40"
          unit="词"
          color="primary"
        />
        <ProgressCard
          title="复习单词"
          :current="todayPlan?.reviewWordsCompleted || 0"
          :total="todayPlan?.reviewWordsTarget || 60"
          unit="词"
          color="accent"
        />
      </div>
      
      <!-- 长难句状态 -->
      <div class="mt-3 bg-card rounded-xl p-4 border border-border">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="[
                !isTodayPlanLoaded
                  ? 'bg-secondary text-muted-foreground'
                  : todayPlan?.sentenceCompleted 
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
              <p class="text-sm font-medium text-foreground">今日长难句</p>
              <p class="text-xs text-muted-foreground">
                {{ !isTodayPlanLoaded ? '同步中...' : todayPlan?.sentenceCompleted ? '已完成' : '待完成' }}
              </p>
            </div>
          </div>
          <RouterLink 
            :to="{ name: 'SentenceLearning' }"
            class="text-sm text-primary font-medium"
          >
            {{ !isTodayPlanLoaded ? '加载中' : todayPlan?.sentenceCompleted ? '查看' : '去练习' }}
          </RouterLink>
        </div>
      </div>
    </section>
    
    <!-- 学习数据 -->
    <section>
      <h3 class="text-base font-semibold text-foreground mb-3">学习数据</h3>
      <div class="grid grid-cols-2 gap-3">
        <StatsCard
          label="连续打卡"
          :value="`${stats?.consecutiveDays || 0}天`"
          icon="fire"
          highlight
        />
        <StatsCard
          label="累计打卡"
          :value="`${stats?.totalDays || 0}天`"
          icon="calendar"
        />
        <StatsCard
          label="已学单词"
          :value="stats?.totalWordsLearned || 0"
          icon="book"
        />
        <StatsCard
          label="长难句完成"
          :value="stats?.totalSentencesCompleted || 0"
          icon="target"
        />
      </div>
    </section>
    
    <!-- 快捷入口 -->
    <section>
      <h3 class="text-base font-semibold text-foreground mb-3">快捷入口</h3>
      <div class="grid grid-cols-4 gap-2">
        <RouterLink 
          :to="{ name: 'Vocabulary' }"
          class="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              <path d="M12 13V7"/>
              <path d="m9 10 3-3 3 3"/>
            </svg>
          </div>
          <span class="text-xs text-foreground">生词本</span>
        </RouterLink>
        
        <RouterLink 
          :to="{ name: 'ErrorBook' }"
          class="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          </div>
          <span class="text-xs text-foreground">错题本</span>
        </RouterLink>
        
        <RouterLink 
          :to="{ name: 'CheckIn' }"
          class="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
              <path d="m9 16 2 2 4-4"/>
            </svg>
          </div>
          <span class="text-xs text-foreground">打卡记录</span>
        </RouterLink>
        
        <RouterLink 
          :to="{ name: 'Settings' }"
          class="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <span class="text-xs text-foreground">设置</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
