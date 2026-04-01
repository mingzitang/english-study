import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

let client: SupabaseClient | null = null

/**
 * 单例 Supabase 客户端。仅在已配置环境变量时使用。
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      '未配置 Supabase：请在项目根目录新建 .env 或 .env.local，设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY'
    )
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }
  return client
}
