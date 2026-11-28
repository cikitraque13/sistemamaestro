import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: fileURLToPath(new URL('./dist/embed', import.meta.url)),
    emptyOutDir: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/embed/loader.js', import.meta.url)),
      output: {
        format: 'iife',
        entryFileNames: 'agent.js',
      },
    },
  },
});
