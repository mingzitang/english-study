<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const examType = ref<'english1' | 'english2'>('english1')
const errors = ref<Record<string, string>>({})

const isValid = computed(() => {
  return email.value.trim() && password.value && confirmPassword.value
})

function validateForm(): boolean {
  errors.value = {}
  
  if (!email.value.trim()) {
    errors.value.email = '请输入邮箱'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.value.email = '请输入有效的邮箱地址'
  }
  
  if (!password.value) {
    errors.value.password = '请输入密码'
  } else if (password.value.length < 6) {
    errors.value.password = '密码至少6位'
  }
  
  if (!confirmPassword.value) {
    errors.value.confirmPassword = '请确认密码'
  } else if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = '两次密码不一致'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  
  const success = await authStore.register({
    email: email.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
    examType: examType.value
  })
  
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 bg-background safe-area-top">
      <div class="flex items-center h-12 px-4">
        <RouterLink 
          :to="{ name: 'Login' }"
          class="w-10 h-10 flex items-center justify-center -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </RouterLink>
        <h1 class="flex-1 text-center text-base font-semibold text-foreground -ml-10">注册</h1>
      </div>
    </header>
    
    <!-- 主内容 -->
    <div class="flex-1 px-6 py-4">
      <!-- 欢迎语 -->
      <div class="mb-6">
        <h2 class="text-xl font-bold text-foreground mb-1">创建账号</h2>
        <p class="text-sm text-muted-foreground">开始你的考研英语学习之旅</p>
      </div>
      
      <!-- 注册表单 -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <AppInput
          v-model="email"
          type="email"
          label="邮箱"
          placeholder="请输入邮箱"
          :error="errors.email"
          required
        />
        
        <AppInput
          v-model="password"
          type="password"
          label="密码"
          placeholder="请输入密码（至少6位）"
          :error="errors.password"
          required
        />
        
        <AppInput
          v-model="confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入密码"
          :error="errors.confirmPassword"
          required
        />
        
        <!-- 考试类型选择 -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            考试类型 <span class="text-destructive">*</span>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="examType = 'english1'"
              class="h-12 rounded-xl text-sm font-medium transition-all border-2"
              :class="[
                examType === 'english1'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card text-foreground hover:border-primary/50'
              ]"
            >
              英语一
            </button>
            <button
              type="button"
              @click="examType = 'english2'"
              class="h-12 rounded-xl text-sm font-medium transition-all border-2"
              :class="[
                examType === 'english2'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card text-foreground hover:border-primary/50'
              ]"
            >
              英语二
            </button>
          </div>
          <p class="text-xs text-muted-foreground">
            此选择会影响词库内容和长难句难度
          </p>
        </div>
        
        <!-- 错误提示 -->
        <p v-if="authStore.error" class="text-sm text-destructive text-center">
          {{ authStore.error }}
        </p>
        
        <div class="pt-4">
          <AppButton
            type="submit"
            block
            size="lg"
            :loading="authStore.loading"
            :disabled="!isValid"
          >
            注册
          </AppButton>
        </div>
      </form>
      
      <!-- 登录链接 -->
      <p class="text-center text-sm text-muted-foreground mt-6">
        已有账号?
        <RouterLink :to="{ name: 'Login' }" class="text-primary font-medium">
          立即登录
        </RouterLink>
      </p>
    </div>
    
    <!-- 底部 -->
    <div class="p-6 text-center">
      <p class="text-xs text-muted-foreground">
        注册即表示同意用户协议和隐私政策
      </p>
    </div>
  </div>
</template>
