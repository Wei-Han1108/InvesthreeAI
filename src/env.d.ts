/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FMP_API_KEY: string
  readonly VITE_NEWS_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 