
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // تحميل المتغيرات البيئية من ملف .env أو من بيئة النظام (مثل Vercel)
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // الأولوية لمتغير VITE_API_KEY ثم API_KEY لضمان التوافق مع النشر السحابي
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || ''),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser', // تحسين ضغط الملفات للنشر
    },
  };
});
