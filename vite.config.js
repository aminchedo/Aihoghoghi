import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/Aihoghoghi/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['framer-motion', 'lucide-react'],
          ai: ['@huggingface/inference', '@xenova/transformers'],
          charts: ['chart.js', 'react-chartjs-2'],
          services: [
            './src/services/systemIntegration.js',
            './src/services/enhancedAIService.js',
            './src/services/smartScrapingService.js',
            './src/services/legalDocumentService.js',
            './src/services/realTimeMetricsService.js'
          ]
        }
      }
    },
    // Optimize for GitHub Pages
    target: 'es2015',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://api.iranian-legal-archive.com' 
          : 'http://127.0.0.1:7860',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
    __BASE_URL__: JSON.stringify('/Aihoghoghi/')
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'chart.js',
      'react-chartjs-2'
    ]
  }
});