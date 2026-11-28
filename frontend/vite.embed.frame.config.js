import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';

function transformJsxInJavaScriptFiles() {
  return {
    name: 'vite:jsx-in-js-compat',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.includes('/src/') || !id.endsWith('.js')) return null;
      const result = await transformWithOxc(code, id, {
        lang: 'jsx',
        jsx: { runtime: 'automatic' },
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL('./embed', import.meta.url)),
  publicDir: false,
  base: '/embed/',
  plugins: [transformJsxInJavaScriptFiles(), react()],
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist/embed', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./embed/frame.html', import.meta.url)),
    },
  },
});
