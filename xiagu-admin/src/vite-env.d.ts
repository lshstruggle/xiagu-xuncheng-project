/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 腾讯地图全局声明
declare global {
  interface Window {
    TMap: any;
    initTMap: () => void;
  }
}

export {};
