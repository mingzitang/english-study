import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserSettings, LoginRequest, RegisterRequest } from '@/types'
import {
  authApi,
  isSupabaseConfigured,
  restoreSupabaseAuth,
  subscribeSupabaseAuth
} from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const settings = ref<UserSettings>({
    dailyNewWords: 40,
    dailyReviewWords: 60
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const examType = computed(() => user.value?.examType || 'english1')

  // Actions
  async function login(credentials: LoginRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(credentials)
      user.value = response.user
      token.value = response.token
      localStorage.setItem('auth_token', response.token)
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : '登录失败'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.register(data)
      user.value = response.user
      token.value = response.token
      localStorage.setItem('auth_token', response.token)
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : '注册失败'
      return false
    } finally {
      loading.value = false
    }
  }

  let supabaseAuthUnsubscribe: (() => void) | null = null

  /** 应用启动时调用：从 Supabase 恢复会话并监听 token 刷新 */
  async function initAuth() {
    if (!isSupabaseConfigured()) return

    supabaseAuthUnsubscribe?.()
    supabaseAuthUnsubscribe = null

    const restored = await restoreSupabaseAuth()
    if (restored) {
      user.value = restored.user
      token.value = restored.token
      localStorage.setItem('auth_token', restored.token)
    }

    const { unsubscribe } = subscribeSupabaseAuth(state => {
      if (state) {
        user.value = state.user
        token.value = state.token
        localStorage.setItem('auth_token', state.token)
      } else {
        user.value = null
        token.value = null
        localStorage.removeItem('auth_token')
      }
    })
    supabaseAuthUnsubscribe = unsubscribe
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('auth_token')
    }
  }

  async function fetchUser() {
    if (!token.value) return
    loading.value = true
    try {
      const userData = await authApi.getProfile()
      user.value = userData
    } catch (e) {
      // Token 无效，清除登录状态
      logout()
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(newSettings: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    // TODO: 调用后端接口保存设置
  }

  return {
    // State
    user,
    token,
    settings,
    loading,
    error,
    // Getters
    isAuthenticated,
    examType,
    // Actions
    login,
    register,
    initAuth,
    logout,
    fetchUser,
    updateSettings
  }
})
