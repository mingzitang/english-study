<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
  type?: string
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  label: '',
  error: '',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <div class="space-y-1.5">
    <!-- 标签 -->
    <label v-if="label" class="block text-sm font-medium text-foreground">
      {{ label }}
      <span v-if="required" class="text-destructive">*</span>
    </label>
    
    <!-- 输入框 -->
    <input
      v-model="inputValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full h-11 px-4 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground text-sm transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
      :class="[
        error ? 'ring-2 ring-destructive' : ''
      ]"
    />
    
    <!-- 错误信息 -->
    <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
  </div>
</template>
