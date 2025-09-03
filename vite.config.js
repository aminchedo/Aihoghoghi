import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Aihoghoghi/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ai-services': ['@huggingface/inference', '@xenova/transformers'],
          'data-viz': ['chart.js', 'react-chartjs-2', 'd3'],
          'ui-components': ['framer-motion', 'lucide-react', '@headlessui/react']
        }
      }
    }
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