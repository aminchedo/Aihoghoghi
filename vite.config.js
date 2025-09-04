import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Aihoghoghi/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild'
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.iranian-legal-archive.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  plugins: [react()],
  define: {
    __DEV__: false,
    __PROD__: true
  }
});