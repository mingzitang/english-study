<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { CheckInRecord, LearningStats } from '@/types'
import { learningApi } from '@/api/learning'

const router = useRouter()

const stats = ref<LearningStats>({
  totalWordsLearned: 0,
  totalSentencesCompleted: 0,
  consecutiveDays: 0,
  totalDays: 0,
  todayNewWords: 0,
  todayReviewWords: 0,
  todaySentences: 0,
  weeklyTrend: []
})
const records = ref<CheckInRecord[]>([])
const loading = ref(false)

// 生成日历数据 (当前月)
const calendarDays = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  // 本月第一天
  const firstDay = new Date(year, month, 1)
  // 本月最后一天
  const lastDay = new Date(year, month + 1, 0)
  
  const days = []
  
  // 填充前面的空白
  const startDayOfWeek = firstDay.getDay()
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ day: null, isCheckedIn: false })
  }
  
  // 填充日期
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isCheckedIn = records.value.some((r: CheckInRecord) => r.date === dateStr)
    const isToday = day === today.getDate()
    days.push({ day, isCheckedIn, isToday, date: dateStr })
  }
  
  return days
})

const currentMonth = computed(() => {
  const today = new Date()
  return `${today.getFullYear()}年${today.getMonth() + 1}月`
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

function goBack() {
  router.back()
}

onMounted(async () => {
  loading.value = true
  try {
    const [statsData, recordsData] = await Promise.all([
      learningApi.getStats(),
      learningApi.getCheckInRecords(60)
    ])
    stats.value = statsData
    records.value = recordsData
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
        <h1 class="flex-1 text-center text-base font-semibold text-foreground -ml-10">打卡记录</h1>
      </div>
    </header>
    
    <!-- 打卡统计 -->
    <div class="px-4 py-6">
      <div class="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground">
        <div class="flex items-center gap-6">
          <div class="text-center">
            <p class="text-4xl font-bold">{{ stats.consecutiveDays }}</p>
            <p class="text-sm opacity-90 mt-1">连续打卡</p>
          </div>
          <div class="w-px h-12 bg-current opacity-20" />
          <div class="text-center">
            <p class="text-4xl font-bold">{{ stats.totalDays }}</p>
            <p class="text-sm opacity-90 mt-1">累计打卡</p>
          </div>
        </div>
        
        <!-- 鼓励文案 -->
        <div class="mt-4 pt-4 border-t border-current/10">
          <p class="text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
            坚持学习，每天都在进步!
          </p>
        </div>
      </div>
    </div>
    
    <!-- 打卡日历 -->
    <div class="px-4 pb-6">
      <div class="bg-card rounded-xl border border-border p-4">
        <!-- 月份标题 -->
        <div class="flex items-center justify-center mb-4">
          <h3 class="text-base font-semibold text-foreground">{{ currentMonth }}</h3>
        </div>
        
        <!-- 星期标题 -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div 
            v-for="day in weekDays" 
            :key="day"
            class="text-center text-xs text-muted-foreground py-2"
          >
            {{ day }}
          </div>
        </div>
        
        <!-- 日期格子 -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="(item, index) in calendarDays"
            :key="index"
            class="aspect-square flex items-center justify-center rounded-lg text-sm"
            :class="{
              'text-muted-foreground': !item.day,
              'bg-primary text-primary-foreground': item.isCheckedIn,
              'ring-2 ring-primary ring-offset-2 ring-offset-background': item.isToday && !item.isCheckedIn,
              'text-foreground': item.day && !item.isCheckedIn
            }"
          >
            <span v-if="item.day">{{ item.day }}</span>
          </div>
        </div>
        
        <!-- 图例 -->
        <div class="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <div class="w-4 h-4 rounded bg-primary" />
            <span>已打卡</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <div class="w-4 h-4 rounded ring-2 ring-primary" />
            <span>今天</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 打卡记录列表 -->
    <div class="px-4 pb-6">
      <h3 class="text-base font-semibold text-foreground mb-3">最近打卡</h3>
      <div v-if="loading" class="text-sm text-muted-foreground py-2">加载中...</div>
      <div v-else class="space-y-3">
        <div
          v-for="record in records"
          :key="record.id"
          class="bg-card rounded-xl p-4 border border-border"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-foreground">{{ record.date }}</span>
            <span 
              class="px-2 py-1 rounded-full text-xs font-medium"
              :class="[
                record.summary.completionRate === 100 
                  ? 'bg-accent/10 text-accent' 
                  : 'bg-primary/10 text-primary'
              ]"
            >
              {{ record.summary.completionRate }}%
            </span>
          </div>
          <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <span>新词 {{ record.summary.newWordsCompleted }}</span>
            <span>复习 {{ record.summary.reviewWordsCompleted }}</span>
            <span v-if="record.summary.sentenceCompleted">长难句 1</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
