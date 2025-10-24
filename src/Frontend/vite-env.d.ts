/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Define que todas as variáveis que começam com VITE_ são strings
  readonly VITE_API_BASE_URL: string;
  // Se você tiver outras variáveis:
  // readonly VITE_OUTRA_VARIAVEL: string; 
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}