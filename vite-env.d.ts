// Fix: Removed the problematic reference to 'vite/client' and provided manual declarations for essential environment types.
interface ImportMetaEnv {
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
