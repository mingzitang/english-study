<script setup lang="ts">
import type { WordMastery } from '@/types'

interface Props {
  disabled?: boolean
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  select: [mastery: WordMastery]
}>()

const buttons = [
  { mastery: 'known' as WordMastery, label: '认识', color: 'accent' },
  { mastery: 'fuzzy' as WordMastery, label: '模糊', color: 'warning' },
  { mastery: 'unknown' as WordMastery, label: '不认识', color: 'destructive' }
]
</script>

<template>
  <div class="flex gap-3">
    <button
      v-for="btn in buttons"
      :key="btn.mastery"
      @click="emit('select', btn.mastery)"
      :disabled="disabled || loading"
      class="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      :class="{
        'bg-accent text-accent-foreground hover:bg-accent/90': btn.color === 'accent',
        'bg-warning text-white hover:bg-warning/90': btn.color === 'warning',
        'bg-destructive text-destructive-foreground hover:bg-destructive/90': btn.color === 'destructive'
      }"
    >
      {{ btn.label }}
    </button>
  </div>
</template>
