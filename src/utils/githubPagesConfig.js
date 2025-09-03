/**
 * GitHub Pages Configuration for Iranian Legal Archive
 * Handles client-side API simulation and routing for GitHub Pages deployment
 */

class GitHubPagesConfig {
  constructor() {
    this.isGitHubPages = window.location.hostname.includes('github.io');
    this.basePath = '/Aihoghoghi';
    this.apiEndpoints = new Map();
    
    if (this.isGitHubPages) {
      this.setupClientSideAPI();
    }
  }

  /**
   * Setup client-side API simulation for GitHub Pages
   */
  setupClientSideAPI() {
    console.log('🌐 Setting up client-side API for GitHub Pages');
    
    // Mock API responses
    this.apiEndpoints.set('/status', () => ({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        scraping: 'active',
        ai: 'ready',
        database: 'connected'
      },
      version: '2.0.0'
    }));
    
    this.apiEndpoints.set('/health', () => ({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: ['scraping', 'ai', 'database']
    }));
    
    this.apiEndpoints.set('/stats', () => ({
      documents: {
        total: Math.floor(Math.random() * 1000) + 500,
        today: Math.floor(Math.random() * 50) + 10,
        categories: {
          'قانون': Math.floor(Math.random() * 200) + 100,
          'آیین‌نامه': Math.floor(Math.random() * 150) + 75,
          'رأی': Math.floor(Math.random() * 300) + 150,
          'بخشنامه': Math.floor(Math.random() * 100) + 50
        }
      },
      scraping: {
        successRate: Math.floor(Math.random() * 20) + 80,
        totalAttempts: Math.floor(Math.random() * 500) + 200,
        activeProxies: Math.floor(Math.random() * 10) + 5
      },
      ai: {
        analysisCount: Math.floor(Math.random() * 200) + 100,
        averageConfidence: Math.floor(Math.random() * 20) + 80,
        processingSpeed: Math.floor(Math.random() * 10) + 5
      }
    }));
    
    this.apiEndpoints.set('/network', () => ({
      connectivity: 'online',
      proxies: {
        total: 15,
        active: Math.floor(Math.random() * 10) + 10,
        failed: Math.floor(Math.random() * 5)
      },
      dns: {
        servers: 22,
        working: Math.floor(Math.random() * 5) + 17
      },
      latency: Math.floor(Math.random() * 100) + 50
    }));
    
    this.apiEndpoints.set('/logs', () => ({
      logs: [
        {
          id: 1,
          level: 'info',
          message: 'سیستم با موفقیت راه‌اندازی شد',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          source: 'system'
        },
        {
          id: 2,
          level: 'success',
          message: '5 سند جدید استخراج شد',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          source: 'scraper'
        },
        {
          id: 3,
          level: 'info',
          message: 'تحلیل هوش مصنوعی 3 سند کامل شد',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          source: 'ai'
        }
      ]
    }));
    
    // Additional API endpoints for full functionality
    this.apiEndpoints.set('/network/proxies', () => ({
      proxies: [
        { id: 1, host: '127.0.0.1', port: 8080, status: 'active', latency: 45 },
        { id: 2, host: '127.0.0.1', port: 8081, status: 'active', latency: 67 },
        { id: 3, host: '127.0.0.1', port: 8082, status: 'inactive', latency: null }
      ]
    }));
    
    this.apiEndpoints.set('/network/test', () => ({
      success: true,
      results: [
        { proxy_id: 1, status: 'success', latency: 45 },
        { proxy_id: 2, status: 'success', latency: 67 }
      ]
    }));
    
    this.apiEndpoints.set('/network/update', () => ({
      success: true,
      updated: Math.floor(Math.random() * 5) + 1,
      message: 'فهرست پروکسی‌ها به‌روزرسانی شد'
    }));
    
    this.apiEndpoints.set('/process', () => ({
      status: 'ready',
      queue: Math.floor(Math.random() * 10),
      processing: Math.floor(Math.random() * 3),
      completed: Math.floor(Math.random() * 50) + 100
    }));
    
    this.apiEndpoints.set('/processed-documents', () => ({
      documents: [
        {
          id: 1,
          title: 'قانون مدنی - ماده ۱۰',
          url: 'https://www.example.ir/law1',
          status: 'completed',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 2,
          title: 'آیین‌نامه اجرایی قانون کار',
          url: 'https://www.example.ir/law2',
          status: 'processing',
          timestamp: new Date(Date.now() - 180000).toISOString()
        }
      ]
    }));
    
    this.apiEndpoints.set('/process-urls', () => ({
      success: true,
      jobId: 'job_' + Math.random().toString(36).substr(2, 9),
      message: 'پردازش URL‌ها آغاز شد'
    }));
    
    this.apiEndpoints.set('/upload-urls', () => ({
      success: true,
      count: Math.floor(Math.random() * 10) + 5,
      message: 'فایل با موفقیت آپلود شد'
    }));
    
    // Intercept fetch requests and provide mock responses
    this.interceptFetchRequests();
  }

  /**
   * Intercept fetch requests for API simulation
   */
  interceptFetchRequests() {
    const originalFetch = window.fetch;
    
    window.fetch = async (url, options = {}) => {
      // Check if it's an API request
      if (typeof url === 'string' && (url.startsWith('/api') || url.startsWith(this.basePath + '/api'))) {
        const endpoint = url.replace(this.basePath, '').replace('/api', '');
        
        if (this.apiEndpoints.has(endpoint)) {
          console.log(`🔄 Simulating API call: ${endpoint}`);
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
          
          const mockData = this.apiEndpoints.get(endpoint)();
          
          return new Response(JSON.stringify(mockData), {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      }
      
      // For non-API requests, use original fetch
      return originalFetch(url, options);
    };
  }

  /**
   * Get base URL for assets
   */
  getAssetUrl(path) {
    if (this.isGitHubPages) {
      return `${this.basePath}${path}`;
    }
    return path;
  }

  /**
   * Get router basename
   */
  getBasename() {
    return this.isGitHubPages ? this.basePath : '/';
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator && this.isGitHubPages) {
      try {
        const registration = await navigator.serviceWorker.register(`${this.basePath}/sw.js`);
        console.log('✅ Service Worker registered:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
        });
        
        return registration;
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Setup PWA features
   */
  setupPWA() {
    if (this.isGitHubPages) {
      // Register service worker
      this.registerServiceWorker();
      
      // Handle install prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        console.log('📱 PWA install prompt available');
        
        // Store the event for later use
        window.deferredPrompt = e;
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('pwa-install-available'));
      });
      
      // Handle app installed
      window.addEventListener('appinstalled', () => {
        console.log('✅ PWA installed successfully');
        window.deferredPrompt = null;
      });
    }
  }

  /**
   * Initialize GitHub Pages features
   */
  initialize() {
    if (this.isGitHubPages) {
      console.log('🏠 GitHub Pages environment detected');
      
      // Setup PWA
      this.setupPWA();
      
      // Setup routing for SPA
      this.setupSPARouting();
      
      // Setup error handling
      this.setupErrorHandling();
    }
  }

  /**
   * Setup SPA routing for GitHub Pages
   */
  setupSPARouting() {
    // Handle 404 redirects for SPA routing
    if (window.location.pathname !== this.basePath + '/' && 
        window.location.pathname.startsWith(this.basePath)) {
      console.log('🔄 Handling SPA route:', window.location.pathname);
    }
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('💥 Global error:', event.error);
      
      // Send error to analytics (if available)
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: event.error.message,
          fatal: false
        });
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('💥 Unhandled promise rejection:', event.reason);
      
      // Send error to analytics (if available)
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: event.reason.message || event.reason,
          fatal: false
        });
      }
    });
  }
}

// Create singleton instance
const githubPagesConfig = new GitHubPagesConfig();

// Auto-initialize
githubPagesConfig.initialize();

export default githubPagesConfig;