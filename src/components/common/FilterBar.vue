<script setup lang="ts">
import { computed } from 'vue'

interface FilterOption {
  value: string
  label: string
}

interface Props {
  options: FilterOption[]
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
    <button
      v-for="option in options"
      :key="option.value"
      @click="selectedValue = option.value"
      class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0"
      :class="[
        selectedValue === option.value
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      ]"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
