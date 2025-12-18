import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Replaced process.cwd() with '.' to avoid the TypeScript error "Property 'cwd' does not exist on type 'Process'".
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the Google GenAI SDK to work in the browser
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || ''),
    },
  };
});
