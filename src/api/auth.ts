import type { User as SupabaseAuthUser } from '@supabase/supabase-js'
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

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
  if (m.includes('invalid login credentials')) return 'Invalid email or password'
  if (m.includes('user already registered')) return 'This email is already registered'
  if (m.includes('email not confirmed')) return 'Please verify your email before logging in'
  if (m.includes('password should be at least')) return 'Password does not meet requirements'
  if (m.includes('signup requires a valid password')) return 'Invalid password format'
  return message
}

export async function restoreSupabaseAuth(): Promise<AuthResponse | null> {
  if (!isSupabaseConfigured()) return null

  const {
    data: { session }
  } = await getSupabase().auth.getSession()

  if (!session?.user) return null
  return {
    user: mapSupabaseUser(session.user),
    token: session.access_token
  }
}

export function subscribeSupabaseAuth(
  callback: (state: AuthResponse | null) => void
): { unsubscribe: () => void } {
  const supabase = getSupabase()
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({ user: mapSupabaseUser(session.user), token: session.access_token })
    } else {
      callback(null)
    }
  })

  return { unsubscribe: () => subscription.unsubscribe() }
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password
    })

    if (error) throw new Error(formatSupabaseAuthError(error.message))
    if (!data.session?.user) throw new Error('Login failed, please try again')

    return {
      user: mapSupabaseUser(data.session.user),
      token: data.session.access_token
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match')
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

    if (error) throw new Error(formatSupabaseAuthError(error.message))

    if (signUpData.user && !signUpData.session) {
      throw new Error('Registration succeeded. Please verify your email before logging in')
    }

    if (!signUpData.session?.user) {
      throw new Error('Registration failed, please try again')
    }

    return {
      user: mapSupabaseUser(signUpData.session.user),
      token: signUpData.session.access_token
    }
  },

  async getProfile(): Promise<User> {
    const {
      data: { user: u },
      error
    } = await getSupabase().auth.getUser()

    if (error || !u) {
      throw new Error(error ? formatSupabaseAuthError(error.message) : 'Not authenticated')
    }

    return mapSupabaseUser(u)
  },

  async logout(): Promise<void> {
    await getSupabase().auth.signOut()
  }
}

export { isSupabaseConfigured }
