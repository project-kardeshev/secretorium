/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_NODE_ENV: string;
  readonly VITE_GITHUB_HASH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
