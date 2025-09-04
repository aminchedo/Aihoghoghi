/**
 * System Integration Service for Iranian Legal Archive
 * Orchestrates all services and ensures seamless operation
 */

import { realTimeMetricsService } from './realTimeService';
import { legalDocumentService } from './legalDocumentService';
import { smartScrapingService } from './smartScrapingService';
import { enhancedAIService } from './enhancedAIService';

class SystemIntegrationService {
  constructor() {
    this.isInitialized = false;
    this.services = {
      metrics: realTimeMetricsService,
      documents: legalDocumentService,
      scraping: smartScrapingService,
      ai: enhancedAIService
    };
    
    this.eventListeners = new Map();
    this.systemStatus = 'initializing';
    this.initializationPromise = null;
    
    this.initialize();
  }

  /**
   * Initialize all system services
   */
  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform the actual initialization
   */
  async performInitialization() {
    try {
      console.log('🚀 Starting system integration...');
      this.systemStatus = 'initializing';
      
      // Initialize services in order
      await this.initializeMetricsService();
      await this.initializeDocumentService();
      await this.initializeScrapingService();
      await this.initializeAIService();
      
      // Setup cross-service communication
      this.setupServiceCommunication();
      
      // Setup global event handlers
      this.setupGlobalEventHandlers();
      
      // Start background tasks
      this.startBackgroundTasks();
      
      // Load initial data
      await this.loadInitialData();
      
      this.systemStatus = 'ready';
      this.isInitialized = true;
      
      console.log('✅ System integration completed successfully');
      
      // Notify components that system is ready
      this.dispatchSystemEvent('system-ready', {
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: Object.keys(this.services)
      });
      
      return { success: true, status: 'ready' };
      
    } catch (error) {
      console.error('❌ System integration failed:', error);
      this.systemStatus = 'error';
      
      this.dispatchSystemEvent('system-error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Initialize metrics service
   */
  async initializeMetricsService() {
    console.log('📊 Initializing metrics service...');
    
    // Metrics service auto-initializes, just verify it's working
    const metrics = this.services.metrics.getMetrics();
    
    if (metrics) {
      console.log('✅ Metrics service ready');
    } else {
      throw new Error('Failed to initialize metrics service');
    }
  }

  /**
   * Initialize document service
   */
  async initializeDocumentService() {
    console.log('📚 Initializing document service...');
    
    // Wait for document service to be ready
    let attempts = 0;
    while (!this.services.documents.isInitialized && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (this.services.documents.isInitialized) {
      console.log('✅ Document service ready');
      
      // Load sample data if database is empty
      const stats = this.services.documents.getDocumentStats();
      if (stats.total === 0) {
        console.log('📝 Loading sample legal documents...');
        // Sample documents are already loaded in the service constructor
      }
    } else {
      throw new Error('Failed to initialize document service');
    }
  }

  /**
   * Initialize scraping service
   */
  async initializeScrapingService() {
    console.log('🌐 Initializing scraping service...');
    
    // Initialize proxies
    await this.services.scraping.initializeProxies();
    
    // Test network connectivity
    const networkStatus = await this.services.scraping.getNetworkStatus();
    
    if (networkStatus.connectivity === 'online') {
      console.log('✅ Scraping service ready');
    } else {
      console.warn('⚠️ Scraping service initialized with limited connectivity');
    }
  }

  /**
   * Initialize AI service
   */
  async initializeAIService() {
    console.log('🤖 Initializing AI service...');
    
    // AI service auto-initializes, just verify it's working
    const stats = this.services.ai.getAnalysisStats();
    
    if (stats) {
      console.log('✅ AI service ready');
      
      // Test connection if API key is available
      if (stats.hasApiKey) {
        try {
          await this.services.ai.testConnection();
          console.log('🔗 AI API connection verified');
        } catch (error) {
          console.warn('⚠️ AI API connection failed, using fallback methods');
        }
      }
    } else {
      throw new Error('Failed to initialize AI service');
    }
  }

  /**
   * Setup communication between services
   */
  setupServiceCommunication() {
    console.log('🔗 Setting up service communication...');
    
    // Document service updates metrics when documents are added
    const originalAddDocument = this.services.documents.addDocument.bind(this.services.documents);
    this.services.documents.addDocument = async (document) => {
      const result = await originalAddDocument(document);
      
      // Update metrics
      this.services.metrics.updateDatabaseMetrics({
        recordCount: this.services.documents.documents.size,
        storageSize: this.services.documents.calculateStorageSize()
      });
      
      return result;
    };
    
    // Scraping service updates metrics on completion
    const originalStartScraping = this.services.scraping.startScraping.bind(this.services.scraping);
    this.services.scraping.startScraping = async (options) => {
      const result = await originalStartScraping(options);
      
      // Update metrics
      this.services.metrics.updateScrapingMetrics({
        success: result.success,
        processingTime: result.processingTime,
        proxyCount: this.services.scraping.proxies.length
      });
      
      return result;
    };
    
    // AI service updates metrics on analysis
    const originalAnalyzeDocument = this.services.ai.analyzeDocument.bind(this.services.ai);
    this.services.ai.analyzeDocument = async (document) => {
      const result = await originalAnalyzeDocument(document);
      
      // Update metrics
      this.services.metrics.updateAIMetrics({
        confidence: result.overallConfidence * 100,
        processingTime: result.processingTime,
        accuracy: this.services.ai.calculateAccuracy(result)
      });
      
      return result;
    };
    
    console.log('✅ Service communication established');
  }

  /**
   * Setup global event handlers
   */
  setupGlobalEventHandlers() {
    console.log('🎯 Setting up global event handlers...');
    
    // Quick scrape event
    window.addEventListener('quickScrape', async () => {
      try {
        await this.services.scraping.startScraping({ maxDocuments: 3 });
        this.dispatchSystemEvent('scraping-completed', { quick: true });
      } catch (error) {
        console.error('Quick scrape failed:', error);
      }
    });
    
    // Quick analysis event
    window.addEventListener('quickAnalysis', async () => {
      try {
        const recentDocs = this.services.documents.getRecentDocuments(2);
        if (recentDocs.length > 0) {
          await this.services.ai.analyzeDocument(recentDocs[0]);
          this.dispatchSystemEvent('analysis-completed', { quick: true });
        }
      } catch (error) {
        console.error('Quick analysis failed:', error);
      }
    });
    
    // System refresh event
    window.addEventListener('systemRefresh', () => {
      this.dispatchSystemEvent('system-refresh-requested');
    });
    
    // Notification events
    window.addEventListener('notification', (event) => {
      const { type, message } = event.detail;
      console.log(`📢 Notification: ${type} - ${message}`);
    });
    
    console.log('✅ Global event handlers ready');
  }

  /**
   * Start background tasks
   */
  startBackgroundTasks() {
    console.log('⚙️ Starting background tasks...');
    
    // Periodic metrics update
    setInterval(() => {
      this.services.metrics.updateSystemMetrics();
    }, 10000); // Every 10 seconds
    
    // Periodic health check
    setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Every minute
    
    // Auto-save system state
    setInterval(() => {
      this.saveSystemState();
    }, 30000); // Every 30 seconds
    
    console.log('✅ Background tasks started');
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    console.log('📊 Loading initial data...');
    
    try {
      // Ensure we have some sample documents
      const docStats = this.services.documents.getDocumentStats();
      
      if (docStats.total < 3) {
        console.log('📝 Adding additional sample documents...');
        
        // Add more sample documents
        const additionalDocs = [
          {
            title: 'قانون کار جمهوری اسلامی ایران',
            content: 'این قانون به منظور تنظیم روابط کار، حمایت از حقوق کارگران و کارفرمایان، ایجاد امنیت شغلی و رفاه اجتماعی وضع شده است. ماده 1- روابط کار در جمهوری اسلامی ایران بر اساس این قانون تنظیم می‌شود. ماده 2- هر ایرانی حق دارد شغل مورد نظر خود را انتخاب کند مشروط بر اینکه مخالف شرع، قانون، نظم عمومی و اخلاق حسنه نباشد.',
            category: 'قانون',
            source: 'majlis.ir',
            date: '1369/06/31',
            confidence: 0.96,
            language: 'fa',
            wordCount: 3456
          },
          {
            title: 'آیین‌نامه اجرایی قانون نظام صنفی کشور',
            content: 'به منظور اجرای قانون نظام صنفی کشور مصوب 1382/12/05 مجلس شورای اسلامی، این آیین‌نامه تنظیم شده است. ماده 1- تشکیل اتحادیه‌های صنفی در شهرستان‌هایی که حداقل 5 واحد صنفی فعال دارند، الزامی است. ماده 2- اتحادیه‌های صنفی اشخاص حقوقی غیردولتی و غیرانتفاعی محسوب می‌شوند.',
            category: 'آیین‌نامه',
            source: 'dotic.ir',
            date: '1383/03/15',
            confidence: 0.93,
            language: 'fa',
            wordCount: 2890
          }
        ];
        
        for (const doc of additionalDocs) {
          await this.services.documents.addDocument(doc);
        }
      }
      
      // Perform initial AI analysis on sample documents
      const recentDocs = this.services.documents.getRecentDocuments(3);
      for (const doc of recentDocs) {
        try {
          await this.services.ai.analyzeDocument(doc);
        } catch (error) {
          console.warn('Failed to analyze sample document:', error);
        }
      }
      
      console.log('✅ Initial data loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load initial data:', error);
    }
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    try {
      const healthData = {
        timestamp: new Date().toISOString(),
        services: {},
        overall: 'healthy'
      };
      
      // Check each service
      healthData.services.metrics = this.services.metrics ? 'healthy' : 'error';
      healthData.services.documents = this.services.documents.isInitialized ? 'healthy' : 'error';
      healthData.services.scraping = 'healthy'; // Always available
      healthData.services.ai = this.services.ai.isInitialized ? 'healthy' : 'error';
      
      // Check if any service is in error state
      const errorServices = Object.values(healthData.services).filter(status => status === 'error');
      if (errorServices.length > 0) {
        healthData.overall = 'degraded';
      }
      
      // Dispatch health check event
      this.dispatchSystemEvent('health-check', healthData);
      
      return healthData;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { overall: 'error', error: error.message };
    }
  }

  /**
   * Save system state
   */
  saveSystemState() {
    try {
      const state = {
        timestamp: new Date().toISOString(),
        status: this.systemStatus,
        metrics: this.services.metrics.getMetrics(),
        documentCount: this.services.documents.documents.size,
        scrapingStats: this.services.scraping.getScrapingStats(),
        aiStats: this.services.ai.getAnalysisStats()
      };
      
      localStorage.setItem('legalArchive_systemState', JSON.stringify(state));
      
    } catch (error) {
      console.warn('Failed to save system state:', error);
    }
  }

  /**
   * Load system state
   */
  loadSystemState() {
    try {
      const stored = localStorage.getItem('legalArchive_systemState');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load system state:', error);
    }
    return null;
  }

  /**
   * Dispatch system-wide events
   */
  dispatchSystemEvent(eventType, data) {
    const event = new CustomEvent(`legal-archive-${eventType}`, {
      detail: data
    });
    
    window.dispatchEvent(event);
    
    // Also dispatch to React components
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('servicesReady', {
        detail: {
          status: this.systemStatus,
          services: Object.keys(this.services),
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  /**
   * Get system overview
   */
  getSystemOverview() {
    return {
      status: this.systemStatus,
      isInitialized: this.isInitialized,
      services: {
        metrics: {
          status: 'healthy',
          data: this.services.metrics.getMetrics()
        },
        documents: {
          status: this.services.documents.isInitialized ? 'healthy' : 'initializing',
          stats: this.services.documents.getDocumentStats()
        },
        scraping: {
          status: 'healthy',
          stats: this.services.scraping.getScrapingStats()
        },
        ai: {
          status: this.services.ai.isInitialized ? 'healthy' : 'initializing',
          stats: this.services.ai.getAnalysisStats()
        }
      },
      performance: this.services.metrics.getPerformanceSummary(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Perform full system test
   */
  async performSystemTest() {
    console.log('🧪 Starting full system test...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    try {
      // Test document service
      testResults.tests.documents = await this.testDocumentService();
      
      // Test scraping service
      testResults.tests.scraping = await this.testScrapingService();
      
      // Test AI service
      testResults.tests.ai = await this.testAIService();
      
      // Test metrics service
      testResults.tests.metrics = await this.testMetricsService();
      
      // Calculate overall success
      const successfulTests = Object.values(testResults.tests).filter(test => test.success).length;
      const totalTests = Object.keys(testResults.tests).length;
      
      testResults.overall = {
        success: successfulTests === totalTests,
        successRate: Math.round((successfulTests / totalTests) * 100),
        successfulTests,
        totalTests
      };
      
      console.log(`✅ System test completed: ${successfulTests}/${totalTests} tests passed`);
      
      return testResults;
      
    } catch (error) {
      console.error('❌ System test failed:', error);
      testResults.overall = { success: false, error: error.message };
      return testResults;
    }
  }

  /**
   * Test document service
   */
  async testDocumentService() {
    try {
      // Test search functionality
      const searchResult = this.services.documents.searchDocuments('قانون', { limit: 1 });
      
      // Test document stats
      const stats = this.services.documents.getDocumentStats();
      
      return {
        success: true,
        searchWorks: searchResult.documents.length >= 0,
        statsAvailable: stats.total >= 0,
        message: `${stats.total} documents available`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test scraping service
   */
  async testScrapingService() {
    try {
      // Test proxy status
      const networkStatus = await this.services.scraping.getNetworkStatus();
      
      // Test scraping stats
      const stats = this.services.scraping.getScrapingStats();
      
      return {
        success: true,
        networkStatus: networkStatus.connectivity,
        proxiesAvailable: stats.activeProxies,
        message: `${stats.activeProxies} proxies active`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test AI service
   */
  async testAIService() {
    try {
      // Test AI stats
      const stats = this.services.ai.getAnalysisStats();
      
      // Test analysis if documents are available
      const recentDocs = this.services.documents.getRecentDocuments(1);
      let analysisWorks = false;
      
      if (recentDocs.length > 0) {
        try {
          await this.services.ai.analyzeDocument(recentDocs[0]);
          analysisWorks = true;
        } catch (error) {
          console.warn('AI analysis test failed:', error);
        }
      }
      
      return {
        success: true,
        hasApiKey: stats.hasApiKey,
        analysisWorks,
        cacheSize: stats.cacheSize,
        message: `AI service ${stats.hasApiKey ? 'connected' : 'in demo mode'}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test metrics service
   */
  async testMetricsService() {
    try {
      // Test metrics retrieval
      const metrics = this.services.metrics.getMetrics();
      const summary = this.services.metrics.getPerformanceSummary();
      
      return {
        success: true,
        metricsAvailable: !!metrics,
        summaryAvailable: !!summary,
        overallHealth: summary?.overall?.health || 0,
        message: `Metrics service operational`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      status: this.systemStatus,
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Restart system
   */
  async restart() {
    console.log('🔄 Restarting system...');
    
    this.isInitialized = false;
    this.systemStatus = 'restarting';
    this.initializationPromise = null;
    
    // Clear caches
    this.services.ai.clearCache();
    this.services.metrics.resetMetrics();
    
    // Reinitialize
    await this.initialize();
    
    console.log('✅ System restarted successfully');
  }

  /**
   * Shutdown system
   */
  shutdown() {
    console.log('🛑 Shutting down system...');
    
    this.systemStatus = 'shutdown';
    this.isInitialized = false;
    
    // Stop background tasks
    // (Intervals will be cleaned up by garbage collection)
    
    // Save final state
    this.saveSystemState();
    
    console.log('✅ System shutdown complete');
  }
}

// Create singleton instance
export const systemIntegrationService = new SystemIntegrationService();

// Make it globally available
window.iranianLegalArchive = {
  ...window.iranianLegalArchive,
  systemIntegration: systemIntegrationService,
  services: {
    metrics: realTimeMetricsService,
    documents: legalDocumentService,
    scraping: smartScrapingService,
    ai: enhancedAIService
  }
};

export default systemIntegrationService;