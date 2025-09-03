import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Aihoghoghi/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        // Manual chunks for better loading (only if modules exist)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui';
            }
          }
        }
      },
    },
    // Optimize for GitHub Pages and Iranian networks
    assetsInlineLimit: 2048, // Smaller inline limit for faster loading
    cssCodeSplit: false, // Single CSS file for simpler loading
    minify: 'esbuild',
    target: 'es2020',
    chunkSizeWarningLimit: 1000, // Increase chunk size limit
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
  css: {
    postcss: './postcss.config.js',
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});