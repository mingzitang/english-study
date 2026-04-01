<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  subValue?: string
  icon?: 'fire' | 'book' | 'calendar' | 'clock' | 'target'
  highlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  highlight: false
})
</script>

<template>
  <div 
    class="bg-card rounded-xl p-4 border transition-colors"
    :class="[
      highlight ? 'border-primary bg-primary/5' : 'border-border'
    ]"
  >
    <div class="flex items-start gap-3">
      <!-- 图标 -->
      <div 
        v-if="icon"
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        :class="[
          highlight ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
        ]"
      >
        <!-- 火焰图标 (连续打卡) -->
        <svg v-if="icon === 'fire'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
        <!-- 书本图标 (单词) -->
        <svg v-else-if="icon === 'book'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
        <!-- 日历图标 (打卡天数) -->
        <svg v-else-if="icon === 'calendar'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
        <!-- 时钟图标 -->
        <svg v-else-if="icon === 'clock'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <!-- 目标图标 -->
        <svg v-else-if="icon === 'target'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      </div>
      
      <div class="flex-1 min-w-0">
        <p class="text-xs text-muted-foreground mb-1">{{ label }}</p>
        <p class="text-xl font-bold text-foreground">{{ value }}</p>
        <p v-if="subValue" class="text-xs text-muted-foreground mt-0.5">{{ subValue }}</p>
      </div>
    </div>
  </div>
</template>
