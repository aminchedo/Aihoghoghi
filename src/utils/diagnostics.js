/**
 * Comprehensive diagnostics utility for debugging startup issues
 * Provides detailed system information and troubleshooting tools
 */

export class SystemDiagnostics {
  constructor() {
    this.diagnosticData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      environment: this.detectEnvironment(),
      performance: {}
    };
  }

  /**
   * Detect the current environment
   */
  detectEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('github.io')) {
      return 'GitHub Pages';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'Local Development';
    } else if (hostname.includes('vercel') || hostname.includes('netlify')) {
      return 'Cloud Hosting';
    } else {
      return 'Production';
    }
  }

  /**
   * Collect comprehensive system state
   */
  collectSystemState() {
    const state = {
      ...this.diagnosticData,
      timestamp: new Date().toISOString(),
      
      // Browser information
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency
      },
      
      // Document state
      document: {
        readyState: document.readyState,
        visibilityState: document.visibilityState,
        title: document.title,
        url: document.URL,
        referrer: document.referrer
      },
      
      // Window objects
      windowObjects: {
        autoStartupService: !!window.autoStartupService,
        iranianLegalArchive: !!window.iranianLegalArchive,
        autoStartupServiceStatus: window.autoStartupService?.getSystemStatus?.() || null,
        iranianLegalArchiveStatus: window.iranianLegalArchive || null
      },
      
      // Local storage
      localStorage: this.getLocalStorageInfo(),
      sessionStorage: this.getSessionStorageInfo(),
      
      // Performance metrics
      performance: this.getPerformanceMetrics(),
      
      // Console logs (if available)
      consoleLogs: this.getRecentConsoleLogs(),
      
      // Network status
      network: this.getNetworkInfo()
    };
    
    return state;
  }

  /**
   * Get localStorage information
   */
  getLocalStorageInfo() {
    try {
      const info = {
        available: true,
        itemCount: localStorage.length,
        items: {}
      };
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('iranian')) {
          try {
            info.items[key] = JSON.parse(localStorage.getItem(key));
          } catch {
            info.items[key] = localStorage.getItem(key);
          }
        }
      }
      
      return info;
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Get sessionStorage information
   */
  getSessionStorageInfo() {
    try {
      const info = {
        available: true,
        itemCount: sessionStorage.length,
        items: {}
      };
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          info.items[key] = sessionStorage.getItem(key);
        }
      }
      
      return info;
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        navigation: {
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
          loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
          totalTime: navigation?.loadEventEnd - navigation?.navigationStart
        },
        paint: paint.reduce((acc, entry) => {
          acc[entry.name] = entry.startTime;
          return acc;
        }, {}),
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get recent console logs (if monkey-patched)
   */
  getRecentConsoleLogs() {
    if (window.diagnosticConsoleLogs) {
      return window.diagnosticConsoleLogs.slice(-50); // Last 50 logs
    }
    return [];
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      return {
        online: navigator.onLine,
        connection: connection ? {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        } : null
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Run comprehensive diagnostics
   */
  async runDiagnostics() {
    console.log('🔍 Running system diagnostics...');
    
    const diagnostics = {
      systemState: this.collectSystemState(),
      serviceTests: await this.testServices(),
      recommendations: this.generateRecommendations()
    };
    
    console.log('📊 Diagnostics completed:', diagnostics);
    return diagnostics;
  }

  /**
   * Test individual services
   */
  async testServices() {
    const tests = {
      autoStartupService: this.testAutoStartupService(),
      iranianLegalArchive: this.testIranianLegalArchive(),
      localStorage: this.testLocalStorage(),
      indexedDB: await this.testIndexedDB(),
      network: await this.testNetwork()
    };
    
    return tests;
  }

  /**
   * Test autoStartupService availability
   */
  testAutoStartupService() {
    const service = window.autoStartupService;
    
    if (!service) {
      return { available: false, error: 'Service not found on window object' };
    }
    
    try {
      const status = service.getSystemStatus();
      return {
        available: true,
        initialized: service.isInitialized,
        status: status,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(service))
      };
    } catch (error) {
      return { available: true, error: error.message };
    }
  }

  /**
   * Test iranianLegalArchive global object
   */
  testIranianLegalArchive() {
    const archive = window.iranianLegalArchive;
    
    if (!archive) {
      return { available: false, error: 'Global object not found' };
    }
    
    return {
      available: true,
      servicesReady: archive.servicesReady,
      features: archive.features,
      version: archive.version,
      sessionId: archive.sessionId,
      isGitHubPages: archive.isGitHubPages
    };
  }

  /**
   * Test localStorage functionality
   */
  testLocalStorage() {
    try {
      const testKey = 'diagnostic_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return {
        available: true,
        working: retrieved === 'test',
        quota: this.getStorageQuota('localStorage')
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Test IndexedDB functionality
   */
  async testIndexedDB() {
    try {
      const testDB = await new Promise((resolve, reject) => {
        const request = indexedDB.open('DiagnosticTest', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          db.createObjectStore('test', { keyPath: 'id' });
        };
      });
      
      testDB.close();
      indexedDB.deleteDatabase('DiagnosticTest');
      
      return { available: true, working: true };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Test network connectivity
   */
  async testNetwork() {
    try {
      const startTime = Date.now();
      const response = await fetch('/manifest.json', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const endTime = Date.now();
      
      return {
        available: true,
        online: navigator.onLine,
        responseTime: endTime - startTime,
        status: response.status,
        ok: response.ok
      };
    } catch (error) {
      return {
        available: false,
        online: navigator.onLine,
        error: error.message
      };
    }
  }

  /**
   * Get storage quota information
   */
  getStorageQuota(storageType) {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(estimate => {
          console.log(`📊 Storage quota - Used: ${estimate.usage}, Available: ${estimate.quota}`);
        });
      }
      return 'Checking...';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * Generate troubleshooting recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const state = this.collectSystemState();
    
    // Check for common issues
    if (!state.windowObjects.autoStartupService) {
      recommendations.push({
        issue: 'AutoStartupService not available',
        solution: 'Check if autoStartupService.js is loaded properly',
        severity: 'high'
      });
    }
    
    if (!state.windowObjects.iranianLegalArchive) {
      recommendations.push({
        issue: 'iranianLegalArchive global object missing',
        solution: 'AutoStartupService should create this object after initialization',
        severity: 'high'
      });
    }
    
    if (!state.localStorage.available) {
      recommendations.push({
        issue: 'localStorage not available',
        solution: 'Check browser privacy settings or incognito mode',
        severity: 'medium'
      });
    }
    
    if (!state.network.available) {
      recommendations.push({
        issue: 'Network connectivity issues',
        solution: 'Check internet connection and firewall settings',
        severity: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Export diagnostics report
   */
  exportDiagnosticsReport() {
    const report = {
      title: 'Iranian Legal Archive - System Diagnostics Report',
      ...this.collectSystemState(),
      recommendations: this.generateRecommendations(),
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📤 Diagnostics report exported');
    return report;
  }
}

// Global diagnostics instance
const diagnostics = new SystemDiagnostics();

// Make available globally for debugging
window.systemDiagnostics = diagnostics;

export default diagnostics;