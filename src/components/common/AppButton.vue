<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  block: false
})
</script>

<template>
  <button
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
    :class="[
      // 尺寸
      {
        'h-9 px-4 text-sm': size === 'sm',
        'h-11 px-6 text-sm': size === 'md',
        'h-12 px-8 text-base': size === 'lg'
      },
      // 变体样式
      {
        'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
        'border border-border bg-transparent text-foreground hover:bg-secondary': variant === 'outline',
        'bg-transparent text-foreground hover:bg-secondary': variant === 'ghost',
        'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive'
      },
      // 宽度
      { 'w-full': block }
    ]"
  >
    <!-- 加载中图标 -->
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    
    <slot />
  </button>
</template>
