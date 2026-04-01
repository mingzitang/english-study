import type { User as SupabaseAuthUser } from '@supabase/supabase-js'
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types'
import { mockUsers, delay } from '@/mock/data'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

/**
 * 认证相关 API
 *
 * 配置 Supabase：在项目根目录设置 VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY 后走真实鉴权；
 * 未配置时继续使用 Mock（便于本地无网开发）。
 */

/** 将启用鉴权 Mock（即使已配置 Supabase） */
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

const USE_MOCK = FORCE_MOCK || !isSupabaseConfigured()

const EXAM_META_KEY = 'exam_type' as const

function mapSupabaseUser(u: SupabaseAuthUser): User {
  const meta = u.user_metadata as Record<string, unknown> | undefined
  const raw = meta?.[EXAM_META_KEY]
  const examType: User['examType'] = raw === 'english2' ? 'english2' : 'english1'
  return {
    id: u.id,
    email: u.email ?? '',
    examType,
    createdAt: u.created_at,
    updatedAt: u.updated_at ?? u.created_at
  }
}

function formatSupabaseAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return '邮箱或密码错误'
  if (m.includes('user already registered')) return '该邮箱已被注册'
  if (m.includes('email not confirmed')) return '请先完成邮箱验证后再登录'
  if (m.includes('password should be at least')) return '密码强度不符合要求'
  if (m.includes('signup requires a valid password')) return '密码格式无效'
  return message
}

/** 从当前 Supabase 会话恢复登录态（刷新页面后） */
export async function restoreSupabaseAuth(): Promise<AuthResponse | null> {
  if (!isSupabaseConfigured()) return null
  const { data: { session } } = await getSupabase().auth.getSession()
  if (!session?.user) return null
  return {
    user: mapSupabaseUser(session.user),
    token: session.access_token
  }
}

/** 订阅登录态变化（刷新 token、异地登出等） */
export function subscribeSupabaseAuth(
  callback: (state: AuthResponse | null) => void
): { unsubscribe: () => void } {
  const supabase = getSupabase()
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        user: mapSupabaseUser(session.user),
        token: session.access_token
      })
    } else {
      callback(null)
    }
  })
  return { unsubscribe: () => subscription.unsubscribe() }
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (USE_MOCK) {
      await delay(800)
      const user = mockUsers.find(u => u.email === credentials.email)
      if (!user) {
        throw new Error('用户不存在')
      }
      if (credentials.password !== '123456') {
        throw new Error('密码错误')
      }
      return {
        user,
        token: 'mock_token_' + Date.now()
      }
    }

    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password
    })
    if (error) {
      throw new Error(formatSupabaseAuthError(error.message))
    }
    if (!data.session?.user) {
      throw new Error('登录失败，请稍后重试')
    }
    return {
      user: mapSupabaseUser(data.session.user),
      token: data.session.access_token
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (USE_MOCK) {
      await delay(800)
      if (mockUsers.some(u => u.email === data.email)) {
        throw new Error('该邮箱已被注册')
      }
      if (data.password !== data.confirmPassword) {
        throw new Error('两次密码不一致')
      }
      const newUser: User = {
        id: 'user_' + Date.now(),
        email: data.email,
        examType: data.examType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      mockUsers.push(newUser)
      return {
        user: newUser,
        token: 'mock_token_' + Date.now()
      }
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('两次密码不一致')
    }

    const { data: signUpData, error } = await getSupabase().auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: {
          [EXAM_META_KEY]: data.examType
        }
      }
    })

    if (error) {
      throw new Error(formatSupabaseAuthError(error.message))
    }

    // 若项目开启了「邮箱确认」，session 为空，需用户先点邮件链接
    if (signUpData.user && !signUpData.session) {
      throw new Error('注册成功，请前往邮箱点击验证链接后再登录')
    }

    if (!signUpData.session?.user) {
      throw new Error('注册失败，请稍后重试')
    }

    return {
      user: mapSupabaseUser(signUpData.session.user),
      token: signUpData.session.access_token
    }
  },

  async getProfile(): Promise<User> {
    if (USE_MOCK) {
      await delay(300)
      return mockUsers[0]
    }

    const { data: { user: u }, error } = await getSupabase().auth.getUser()
    if (error || !u) {
      throw new Error(error ? formatSupabaseAuthError(error.message) : '未登录')
    }
    return mapSupabaseUser(u)
  },

  async logout(): Promise<void> {
    if (USE_MOCK) {
      await delay(200)
      return
    }
    await getSupabase().auth.signOut()
  }
}

export { isSupabaseConfigured }
