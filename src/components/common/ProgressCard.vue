<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  current: number
  total: number
  unit?: string
  showPercentage?: boolean
  color?: 'primary' | 'accent' | 'warning'
  /** 未拉到今日计划前占位，避免分母先显示默认 40/60 再跳变 */
  pending?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  showPercentage: true,
  color: 'primary',
  pending: false
})

const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.current / props.total) * 100)
})

const progressColorClass = computed(() => {
  const colors = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    warning: 'bg-warning'
  }
  return colors[props.color]
})
</script>

<template>
  <div class="bg-card rounded-xl p-4 border border-border">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-foreground">{{ title }}</span>
      <span v-if="showPercentage && !pending" class="text-sm text-muted-foreground">{{ percentage }}%</span>
      <span v-else-if="showPercentage && pending" class="text-sm text-muted-foreground">—</span>
    </div>
    
    <!-- 进度条 -->
    <div class="h-2 bg-secondary rounded-full overflow-hidden mb-2">
      <div 
        v-if="!pending"
        class="h-full rounded-full transition-all duration-300"
        :class="progressColorClass"
        :style="{ width: `${percentage}%` }"
      />
    </div>
    
    <!-- 数值显示 -->
    <div v-if="pending" class="flex items-baseline gap-1 min-h-[1.75rem]">
      <span class="text-sm text-muted-foreground">同步中…</span>
    </div>
    <div v-else class="flex items-baseline gap-1">
      <span class="text-lg font-semibold text-foreground">{{ current }}</span>
      <span class="text-sm text-muted-foreground">/ {{ total }}{{ unit }}</span>
    </div>
  </div>
</template>
