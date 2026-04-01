<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: 'empty' | 'search' | 'error'
}

withDefaults(defineProps<Props>(), {
  title: '暂无数据',
  description: '',
  icon: 'empty'
})

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <!-- 图标 -->
    <div class="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
      <!-- 空状态图标 -->
      <svg v-if="icon === 'empty'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/>
        <path d="M12 22V12"/>
      </svg>
      <!-- 搜索无结果图标 -->
      <svg v-else-if="icon === 'search'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
        <path d="M8 11h6"/>
      </svg>
      <!-- 错误图标 -->
      <svg v-else-if="icon === 'error'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" x2="12" y1="8" y2="12"/>
        <line x1="12" x2="12.01" y1="16" y2="16"/>
      </svg>
    </div>
    
    <!-- 标题 -->
    <h3 class="text-base font-medium text-foreground mb-1">{{ title }}</h3>
    
    <!-- 描述 -->
    <p v-if="description" class="text-sm text-muted-foreground max-w-xs">{{ description }}</p>
    
    <!-- 操作按钮插槽 -->
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
