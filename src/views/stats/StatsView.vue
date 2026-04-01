<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useLearningStore } from '@/stores/learning'
import StatsCard from '@/components/common/StatsCard.vue'

const learningStore = useLearningStore()

onMounted(() => {
  learningStore.loadStats()
})

const stats = computed(() => learningStore.stats)
const weeklyTrend = computed(() => stats.value?.weeklyTrend || [])

// 计算近7日最大值用于图表
const maxDailyWords = computed(() => {
  if (!weeklyTrend.value.length) return 100
  return Math.max(...weeklyTrend.value.map(d => d.newWords + d.reviewWords), 100)
})

// 格式化日期显示
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

// 计算柱状图高度百分比
function getBarHeight(value: number) {
  return Math.max((value / maxDailyWords.value) * 100, 4)
}
</script>

<template>
  <div class="px-4 py-4 space-y-6">
    <!-- 总体统计 -->
    <section>
      <h3 class="text-base font-semibold text-foreground mb-3">学习概览</h3>
      <div class="grid grid-cols-2 gap-3">
        <StatsCard
          label="连续打卡"
          :value="`${stats?.consecutiveDays || 0}天`"
          sub-value="保持记录!"
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
    
    <!-- 今日数据 -->
    <section class="bg-card rounded-xl p-4 border border-border">
      <h3 class="text-base font-semibold text-foreground mb-4">今日学习</h3>
      <div class="flex justify-around">
        <div class="text-center">
          <p class="text-2xl font-bold text-primary">{{ stats?.todayNewWords || 0 }}</p>
          <p class="text-xs text-muted-foreground mt-1">新词</p>
        </div>
        <div class="w-px bg-border" />
        <div class="text-center">
          <p class="text-2xl font-bold text-accent">{{ stats?.todayReviewWords || 0 }}</p>
          <p class="text-xs text-muted-foreground mt-1">复习</p>
        </div>
        <div class="w-px bg-border" />
        <div class="text-center">
          <p class="text-2xl font-bold text-foreground">{{ stats?.todaySentences || 0 }}</p>
          <p class="text-xs text-muted-foreground mt-1">长难句</p>
        </div>
      </div>
    </section>
    
    <!-- 近7日趋势 -->
    <section class="bg-card rounded-xl p-4 border border-border">
      <h3 class="text-base font-semibold text-foreground mb-4">近7日趋势</h3>
      
      <!-- 图例 -->
      <div class="flex items-center gap-4 mb-4 text-xs">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-primary" />
          <span class="text-muted-foreground">新词</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-accent" />
          <span class="text-muted-foreground">复习</span>
        </div>
      </div>
      
      <!-- 柱状图 -->
      <div class="flex items-end justify-between gap-2 h-32">
        <div 
          v-for="day in weeklyTrend"
          :key="day.date"
          class="flex-1 flex flex-col items-center gap-1"
        >
          <!-- 柱状图 -->
          <div class="w-full flex gap-0.5 items-end h-24">
            <div 
              class="flex-1 bg-primary rounded-t transition-all duration-300"
              :style="{ height: `${getBarHeight(day.newWords)}%` }"
            />
            <div 
              class="flex-1 bg-accent rounded-t transition-all duration-300"
              :style="{ height: `${getBarHeight(day.reviewWords)}%` }"
            />
          </div>
          <!-- 日期 -->
          <span class="text-xs text-muted-foreground">{{ formatDate(day.date) }}</span>
        </div>
      </div>
      
      <!-- 数据表格 -->
      <div class="mt-4 pt-4 border-t border-border">
        <div class="grid grid-cols-4 text-xs text-muted-foreground mb-2">
          <span>日期</span>
          <span class="text-center">新词</span>
          <span class="text-center">复习</span>
          <span class="text-center">时长</span>
        </div>
        <div 
          v-for="day in weeklyTrend"
          :key="day.date"
          class="grid grid-cols-4 text-sm py-2 border-b border-border last:border-0"
        >
          <span class="text-muted-foreground">{{ formatDate(day.date) }}</span>
          <span class="text-center text-foreground">{{ day.newWords }}</span>
          <span class="text-center text-foreground">{{ day.reviewWords }}</span>
          <span class="text-center text-foreground">{{ day.minutes }}分钟</span>
        </div>
      </div>
    </section>
  </div>
</template>
