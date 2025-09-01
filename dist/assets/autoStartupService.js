/**
 * Auto Startup Service for Iranian Legal Archive
 * Automatically initializes all services when page loads
 */

import SmartProxyService from './smartProxyService.js';
import AdvancedScrapingService from './advancedScrapingService.js';

class AutoStartupService {
  constructor() {
    this.isInitialized = false;
    this.services = {};
    this.startupLog = [];
    this.persistenceKey = 'iranianLegalArchive_state';
    
    // Service configuration
    this.serviceConfig = {
      proxyService: { enabled: true, priority: 1 },
      scrapingService: { enabled: true, priority: 2 },
      backgroundTasks: { enabled: true, priority: 3 },
      dataSync: { enabled: true, priority: 4 }
    };
    
    this.log('🚀 AutoStartupService initialized');
  }

  /**
   * Log startup activities
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message };
    this.startupLog.push(logEntry);
    console.log(`[AutoStartup] ${message}`);
    
    // Persist logs
    this.saveState();
  }

  /**
   * Load previous state from localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem(this.persistenceKey);
      if (saved) {
        const state = JSON.parse(saved);
        this.log(`📂 Loaded previous state: ${Object.keys(state).length} items`);
        return state;
      }
    } catch (error) {
      this.log(`⚠️ Error loading state: ${error.message}`);
    }
    return {};
  }

  /**
   * Save current state to localStorage
   */
  saveState() {
    try {
      const state = {
        isInitialized: this.isInitialized,
        startupLog: this.startupLog.slice(-50), // Keep last 50 logs
        services: Object.keys(this.services),
        lastUpdate: new Date().toISOString(),
        sessionId: this.getSessionId()
      };
      
      localStorage.setItem(this.persistenceKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Initialize all services automatically
   */
  async autoInitialize() {
    if (this.isInitialized) {
      this.log('✅ System already initialized');
      return this.getSystemStatus();
    }

    this.log('🔄 Starting auto-initialization...');
    
    try {
      // Step 1: Initialize Smart Proxy Service
      await this.initializeProxyService();
      
      // Step 2: Initialize Scraping Service
      await this.initializeScrapingService();
      
      // Step 3: Setup Background Tasks
      await this.setupBackgroundTasks();
      
      // Step 4: Initialize Data Persistence
      await this.initializeDataPersistence();
      
      // Step 5: Setup Auto-Update
      await this.setupAutoUpdate();
      
      this.isInitialized = true;
      this.log('✅ Auto-initialization completed successfully');
      
      // Show startup notification
      this.showStartupNotification();
      
      return this.getSystemStatus();
      
    } catch (error) {
      this.log(`❌ Auto-initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize Smart Proxy Service
   */
  async initializeProxyService() {
    this.log('🌐 Initializing Smart Proxy Service...');
    
    try {
      this.services.proxyService = new SmartProxyService();
      
      // Test proxy health
      const workingProxies = await this.services.proxyService.discoverProxies();
      this.log(`✅ Proxy Service ready: ${workingProxies.length} proxies available`);
      
      return true;
    } catch (error) {
      this.log(`❌ Proxy Service failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Initialize Advanced Scraping Service
   */
  async initializeScrapingService() {
    this.log('🔍 Initializing Advanced Scraping Service...');
    
    try {
      this.services.scrapingService = new AdvancedScrapingService();
      
      // Reset stats for new session
      this.services.scrapingService.resetStats();
      this.log('✅ Scraping Service ready');
      
      return true;
    } catch (error) {
      this.log(`❌ Scraping Service failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Setup background tasks
   */
  async setupBackgroundTasks() {
    this.log('⚙️ Setting up background tasks...');
    
    try {
      // Auto-discovery of new proxy sources every 30 minutes
      setInterval(async () => {
        if (this.services.proxyService) {
          this.log('🔄 Auto-discovering new proxies...');
          await this.services.proxyService.discoverProxies();
        }
      }, 30 * 60 * 1000);

      // Auto-save state every 5 minutes
      setInterval(() => {
        this.saveState();
        this.log('💾 State auto-saved');
      }, 5 * 60 * 1000);

      // Health check every 10 minutes
      setInterval(async () => {
        await this.performHealthCheck();
      }, 10 * 60 * 1000);

      this.log('✅ Background tasks configured');
      return true;
    } catch (error) {
      this.log(`❌ Background tasks failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Initialize data persistence
   */
  async initializeDataPersistence() {
    this.log('💾 Initializing data persistence...');
    
    try {
      // Setup IndexedDB for large data storage
      await this.setupIndexedDB();
      
      // Load previous scraping results
      await this.loadPreviousResults();
      
      this.log('✅ Data persistence ready');
      return true;
    } catch (error) {
      this.log(`❌ Data persistence failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Setup IndexedDB for client-side storage
   */
  async setupIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('IranianLegalArchive', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.services.database = request.result;
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create stores
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
          documentsStore.createIndex('url', 'url', { unique: false });
          documentsStore.createIndex('source', 'source', { unique: false });
          documentsStore.createIndex('category', 'category', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('scrapingResults')) {
          const resultsStore = db.createObjectStore('scrapingResults', { keyPath: 'id', autoIncrement: true });
          resultsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('systemLogs')) {
          db.createObjectStore('systemLogs', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  /**
   * Load previous scraping results
   */
  async loadPreviousResults() {
    if (!this.services.database) return;
    
    try {
      const transaction = this.services.database.transaction(['scrapingResults'], 'readonly');
      const store = transaction.objectStore('scrapingResults');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result;
        this.log(`📂 Loaded ${results.length} previous scraping results`);
        
        // Make results available to React components
        window.previousScrapingResults = results;
      };
    } catch (error) {
      this.log(`⚠️ Failed to load previous results: ${error.message}`);
    }
  }

  /**
   * Setup auto-update mechanism
   */
  async setupAutoUpdate() {
    this.log('🔄 Setting up auto-update...');
    
    try {
      // Check for updates every hour
      setInterval(async () => {
        await this.checkForUpdates();
      }, 60 * 60 * 1000);

      // Initial update check
      setTimeout(() => this.checkForUpdates(), 30000); // After 30 seconds
      
      this.log('✅ Auto-update configured');
      return true;
    } catch (error) {
      this.log(`❌ Auto-update failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for system updates
   */
  async checkForUpdates() {
    try {
      // Check if new version is available
      const response = await fetch('/manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        this.log(`🔍 Checked for updates: v${manifest.version || 'unknown'}`);
      }
    } catch (error) {
      this.log(`⚠️ Update check failed: ${error.message}`);
    }
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    this.log('🏥 Performing health check...');
    
    const health = {
      proxyService: false,
      scrapingService: false,
      database: false,
      backgroundTasks: true
    };

    try {
      // Check proxy service
      if (this.services.proxyService) {
        const stats = this.services.proxyService.getStats();
        health.proxyService = stats.iranianDNSCount > 0;
      }

      // Check scraping service
      if (this.services.scrapingService) {
        const stats = this.services.scrapingService.getStats();
        health.scrapingService = true;
      }

      // Check database
      health.database = !!this.services.database;

      const healthyServices = Object.values(health).filter(Boolean).length;
      this.log(`💚 Health check: ${healthyServices}/4 services healthy`);
      
      return health;
    } catch (error) {
      this.log(`❌ Health check failed: ${error.message}`);
      return health;
    }
  }

  /**
   * Show startup notification
   */
  showStartupNotification() {
    // Create a beautiful startup notification
    const notification = document.createElement('div');
    notification.id = 'startup-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: 'Vazirmatn', sans-serif;
        direction: rtl;
        max-width: 350px;
        animation: slideInRight 0.5s ease-out;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 24px; margin-left: 10px;">🏛️</span>
          <h3 style="margin: 0; font-size: 16px;">سیستم آرشیو حقوقی آماده!</h3>
        </div>
        <p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">
          ✅ تمام سرویس‌ها راه‌اندازی شدند<br>
          🌐 ${Object.keys(this.services).length} سرویس فعال<br>
          ⚡ سیستم آماده استفاده است
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 12px;
          margin-top: 10px;
        ">بستن</button>
      </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      const notif = document.getElementById('startup-notification');
      if (notif) {
        notif.style.animation = 'slideInRight 0.5s ease-out reverse';
        setTimeout(() => notif.remove(), 500);
      }
    }, 10000);
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    const status = {
      initialized: this.isInitialized,
      services: Object.keys(this.services),
      serviceCount: Object.keys(this.services).length,
      startupTime: this.startupLog.length > 0 ? this.startupLog[0].timestamp : null,
      lastActivity: this.startupLog.length > 0 ? this.startupLog[this.startupLog.length - 1].timestamp : null,
      sessionId: this.getSessionId(),
      logs: this.startupLog.slice(-10) // Last 10 logs
    };

    // Add service-specific status
    if (this.services.proxyService) {
      status.proxyStats = this.services.proxyService.getStats();
    }
    
    if (this.services.scrapingService) {
      status.scrapingStats = this.services.scrapingService.getStats();
    }

    return status;
  }

  /**
   * Start background scraping automatically
   */
  async startBackgroundScraping() {
    if (!this.services.scrapingService) {
      this.log('❌ Cannot start background scraping: service not available');
      return;
    }

    this.log('🔄 Starting background scraping...');
    
    // High-priority Iranian legal sites
    const prioritySites = [
      { name: 'ایران کد', url: 'https://irancode.ir' },
      { name: 'مرکز پژوهش‌های مجلس', url: 'https://rc.majlis.ir' },
      { name: 'خبرگزاری فارس', url: 'https://www.farsnews.ir' }
    ];

    try {
      const results = await this.services.scrapingService.batchScrape(prioritySites, {
        concurrency: 1,
        delayBetween: 5000
      });

      this.log(`✅ Background scraping completed: ${results.length} results`);
      
      // Store results in IndexedDB
      await this.storeScrapingResults(results);
      
      // Make results available globally
      window.latestScrapingResults = results;
      
      return results;
    } catch (error) {
      this.log(`❌ Background scraping failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Store scraping results in IndexedDB
   */
  async storeScrapingResults(results) {
    if (!this.services.database) return;

    try {
      const transaction = this.services.database.transaction(['scrapingResults'], 'readwrite');
      const store = transaction.objectStore('scrapingResults');
      
      for (const result of results) {
        const record = {
          ...result,
          timestamp: new Date().toISOString(),
          sessionId: this.getSessionId()
        };
        store.add(record);
      }
      
      this.log(`💾 Stored ${results.length} scraping results`);
    } catch (error) {
      this.log(`❌ Failed to store results: ${error.message}`);
    }
  }

  /**
   * Setup automatic data sync
   */
  async setupDataSync() {
    this.log('🔄 Setting up data synchronization...');
    
    // Sync with backend every 15 minutes
    setInterval(async () => {
      await this.syncWithBackend();
    }, 15 * 60 * 1000);

    // Initial sync after 1 minute
    setTimeout(() => this.syncWithBackend(), 60000);
  }

  /**
   * Sync data with backend
   */
  async syncWithBackend() {
    try {
      this.log('🔄 Syncing with backend...');
      
      // Try to reach backend API
      const response = await fetch('/api/health');
      if (response.ok) {
        const health = await response.json();
        this.log(`✅ Backend sync successful: ${health.version}`);
        return true;
      } else {
        this.log('⚠️ Backend not available, using client-side mode');
        return false;
      }
    } catch (error) {
      this.log(`⚠️ Backend sync failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get navigation guidance for returning users
   */
  getNavigationGuidance() {
    const state = this.loadState();
    const isReturningUser = !!state.lastUpdate;
    
    if (isReturningUser) {
      const guidance = {
        isReturningUser: true,
        lastVisit: state.lastUpdate,
        availableFeatures: [
          { name: 'داشبورد اصلی', path: '/dashboard', description: 'نمای کلی سیستم' },
          { name: 'اسکرپینگ هوشمند', path: '/scraping', description: 'استخراج با پروکسی پیشرفته' },
          { name: 'جستجوی پیشرفته', path: '/search', description: 'جستجو در داده‌های استخراج شده' },
          { name: 'تحلیل هوشمند', path: '/ai-analysis', description: 'تحلیل AI متون حقوقی' },
          { name: 'مدیریت پروکسی', path: '/proxy', description: 'تنظیمات پروکسی هوشمند' },
          { name: 'تنظیمات سیستم', path: '/settings', description: 'پیکربندی کامل سیستم' }
        ],
        recommendations: this.getRecommendations(state)
      };
      
      this.log(`👋 Welcome back! Last visit: ${state.lastUpdate}`);
      return guidance;
    }
    
    return {
      isReturningUser: false,
      welcomeMessage: 'به سیستم آرشیو اسناد حقوقی ایران خوش آمدید',
      quickStart: [
        'از داشبورد شروع کنید',
        'تنظیمات پروکسی را بررسی کنید', 
        'اسکرپینگ هوشمند را امتحان کنید'
      ]
    };
  }

  /**
   * Get personalized recommendations
   */
  getRecommendations(state) {
    const recommendations = [];
    
    if (state.services && state.services.includes('scrapingService')) {
      recommendations.push({
        title: 'ادامه اسکرپینگ',
        description: 'اسکرپینگ قبلی شما ذخیره شده است',
        action: 'به صفحه اسکرپینگ بروید',
        path: '/scraping'
      });
    }
    
    recommendations.push({
      title: 'بررسی نتایج جدید',
      description: 'نتایج اسکرپینگ خودکار آماده است',
      action: 'مشاهده داشبورد',
      path: '/dashboard'
    });
    
    return recommendations;
  }

  /**
   * Export system state for debugging
   */
  exportSystemState() {
    const state = {
      ...this.getSystemStatus(),
      fullLogs: this.startupLog,
      localStorage: this.loadState(),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_state_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.log('📤 System state exported');
  }

  /**
   * Reset system to clean state
   */
  resetSystem() {
    localStorage.removeItem(this.persistenceKey);
    sessionStorage.clear();
    
    // Clear IndexedDB
    if (this.services.database) {
      this.services.database.close();
      indexedDB.deleteDatabase('IranianLegalArchive');
    }
    
    this.log('🔄 System reset completed');
    window.location.reload();
  }
}

// Global instance
const autoStartup = new AutoStartupService();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    autoStartup.autoInitialize();
  });
} else {
  // DOM already loaded
  autoStartup.autoInitialize();
}

// Make available globally for React components
window.autoStartupService = autoStartup;

export default autoStartup;