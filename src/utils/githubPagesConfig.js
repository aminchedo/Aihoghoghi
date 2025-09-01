/**
 * GitHub Pages Configuration for Iranian Legal Archive
 * Automatic detection and configuration for GitHub Pages deployment
 */

class GitHubPagesConfig {
  constructor() {
    this.isGitHubPages = window.location.hostname.includes('github.io');
    this.basePath = this.isGitHubPages ? '/Aihoghoghi/' : '/';
    this.apiBaseUrl = this.getApiBaseUrl();
    
    this.config = {
      environment: this.isGitHubPages ? 'github_pages' : 'local',
      basePath: this.basePath,
      apiBaseUrl: this.apiBaseUrl,
      features: {
        clientSideOnly: this.isGitHubPages,
        mockAPI: this.isGitHubPages,
        realScraping: !this.isGitHubPages,
        backgroundServices: true,
        persistence: true
      }
    };
    
    console.log('🔧 GitHub Pages Config:', this.config);
  }

  getApiBaseUrl() {
    if (this.isGitHubPages) {
      // For GitHub Pages, use client-side mock API
      return `${window.location.origin}${this.basePath}api`;
    } else {
      // For local development, use real backend
      return 'http://127.0.0.1:8000/api';
    }
  }

  /**
   * Setup client-side API for GitHub Pages
   */
  setupClientSideAPI() {
    if (!this.isGitHubPages) return;

    console.log('🔧 Setting up client-side API for GitHub Pages...');

    // Create mock API endpoints
    window.mockAPI = {
      async get(endpoint) {
        console.log(`📡 Mock API GET: ${endpoint}`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
        
        switch (endpoint) {
          case '/health':
            return {
              status: 'healthy',
              version: '3.0.0-github-pages',
              environment: 'client_side',
              timestamp: new Date().toISOString()
            };
            
          case '/status':
            return {
              status: 'operational',
              proxy_manager: 'client_side',
              dns_resolver: 'browser_based',
              services: {
                scraper: { status: 'ready', mode: 'client_side' },
                analyzer: { status: 'ready', mode: 'browser_based' },
                database: { status: 'ready', mode: 'indexeddb' }
              },
              timestamp: new Date().toISOString()
            };
            
          case '/stats':
            return {
              total_documents: window.latestScrapingResults?.length || 0,
              processed_today: Math.floor(Math.random() * 50) + 10,
              active_scrapers: 1,
              success_rate: 75 + Math.random() * 20,
              total_sources: 5,
              database_size: '2.3 MB',
              last_update: new Date().toISOString()
            };
            
          case '/scraping/results':
            return {
              results: window.latestScrapingResults || [],
              total_count: window.latestScrapingResults?.length || 0,
              timestamp: new Date().toISOString()
            };
            
          default:
            throw new Error(`Mock API endpoint not found: ${endpoint}`);
        }
      },
      
      async post(endpoint, data) {
        console.log(`📡 Mock API POST: ${endpoint}`, data);
        
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
        
        switch (endpoint) {
          case '/scraping/start':
            // Start client-side scraping
            if (window.autoStartupService) {
              setTimeout(() => {
                window.autoStartupService.startBackgroundScraping();
              }, 1000);
            }
            
            return {
              message: 'Client-side scraping started',
              timestamp: new Date().toISOString(),
              mode: 'github_pages'
            };
            
          default:
            return { success: true, timestamp: new Date().toISOString() };
        }
      }
    };

    // Override fetch for API calls
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('/api/')) {
        const endpoint = url.split('/api')[1];
        const method = options?.method || 'GET';
        
        try {
          let result;
          if (method === 'GET') {
            result = await window.mockAPI.get(endpoint);
          } else if (method === 'POST') {
            const body = options?.body ? JSON.parse(options.body) : {};
            result = await window.mockAPI.post(endpoint, body);
          }
          
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // For non-API calls, use original fetch
      return originalFetch(url, options);
    };

    console.log('✅ Client-side API configured for GitHub Pages');
  }

  /**
   * Setup automatic features for GitHub Pages
   */
  setupAutomaticFeatures() {
    console.log('⚙️ Setting up automatic features...');

    // Auto-start scraping after page load
    setTimeout(() => {
      if (window.autoStartupService) {
        console.log('🔄 Auto-starting background scraping...');
        window.autoStartupService.startBackgroundScraping();
      }
    }, 5000);

    // Setup periodic health checks
    setInterval(() => {
      if (window.autoStartupService) {
        window.autoStartupService.performHealthCheck();
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    // Setup data persistence
    setInterval(() => {
      if (window.autoStartupService) {
        window.autoStartupService.saveState();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log('✅ Automatic features configured');
  }

  /**
   * Initialize everything for GitHub Pages
   */
  initialize() {
    console.log('🚀 Initializing GitHub Pages configuration...');
    
    if (this.isGitHubPages) {
      this.setupClientSideAPI();
    }
    
    this.setupAutomaticFeatures();
    
    // Make config available globally
    window.githubPagesConfig = this.config;
    
    console.log('✅ GitHub Pages configuration complete');
    return this.config;
  }
}

// Auto-initialize
const githubConfig = new GitHubPagesConfig();
githubConfig.initialize();

export default githubConfig;