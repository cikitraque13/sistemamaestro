import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
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
  plugins: [transformJsxInJavaScriptFiles(), react()],
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    rolldownOptions: {
      transform: { jsx: { runtime: 'automatic' } },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.js'],
  },
});
