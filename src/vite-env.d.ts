/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase 项目 URL，如 https://xxxx.supabase.co */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase 匿名（公开）密钥，仅用于浏览器端 */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** 设为 true 时强制使用本地 Mock 鉴权，忽略 Supabase */
  readonly VITE_USE_MOCK_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
