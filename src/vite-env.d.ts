/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_GA4_ENABLED?: string;
  readonly VITE_GA4_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
