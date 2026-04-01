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
const errors = ref<Record<string, string>>({})

const isValid = computed(() => {
  return email.value.trim() && password.value.trim()
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
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  
  const success = await authStore.login({
    email: email.value,
    password: password.value
  })
  
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- 顶部装饰 -->
    <div class="h-32 bg-gradient-to-b from-primary/10 to-transparent" />
    
    <!-- 主内容 -->
    <div class="flex-1 px-6 -mt-16">
      <!-- Logo 和标题 -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-foreground">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            <path d="M8 7h6"/>
            <path d="M8 11h8"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-foreground mb-1">考研英语学习助手</h1>
        <p class="text-sm text-muted-foreground">每天进步一点点</p>
      </div>
      
      <!-- 登录表单 -->
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
          placeholder="请输入密码"
          :error="errors.password"
          required
        />
        
        <!-- 错误提示 -->
        <p v-if="authStore.error" class="text-sm text-destructive text-center">
          {{ authStore.error }}
        </p>
        
        <div class="pt-2">
          <AppButton
            type="submit"
            block
            size="lg"
            :loading="authStore.loading"
            :disabled="!isValid"
          >
            登录
          </AppButton>
        </div>
      </form>
      
      <!-- 分隔线 -->
      <div class="flex items-center gap-4 my-6">
        <div class="flex-1 h-px bg-border" />
        <span class="text-xs text-muted-foreground">还没有账号?</span>
        <div class="flex-1 h-px bg-border" />
      </div>
      
      <!-- 注册链接 -->
      <RouterLink :to="{ name: 'Register' }">
        <AppButton variant="outline" block size="lg">
          注册新账号
        </AppButton>
      </RouterLink>
    </div>
    
    <!-- 底部 -->
    <div class="p-6 text-center">
      <p class="text-xs text-muted-foreground">
        登录即表示同意用户协议和隐私政策
      </p>
    </div>
  </div>
</template>
