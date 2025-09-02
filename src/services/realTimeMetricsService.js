/**
 * Real-Time Metrics Service for Iranian Legal Archive
 * Provides actual system performance metrics and analytics
 */

class RealTimeMetricsService {
  constructor() {
    this.metrics = {
      scraping: {
        totalDocuments: 0,
        successRate: 0,
        averageProcessingTime: 0,
        lastUpdate: null,
        activeProxies: 0,
        failedAttempts: 0
      },
      ai: {
        documentsAnalyzed: 0,
        averageConfidence: 0,
        processingSpeed: 0,
        modelAccuracy: 0,
        lastAnalysis: null
      },
      database: {
        totalRecords: 0,
        queryPerformance: 0,
        indexHealth: 100,
        lastBackup: null,
        storageUsed: 0
      },
      system: {
        uptime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0,
        errorRate: 0
      }
    };
    
    this.listeners = new Set();
    this.updateInterval = null;
    this.startTime = Date.now();
    
    this.initializeMetrics();
  }

  /**
   * Initialize metrics collection
   */
  async initializeMetrics() {
    try {
      // Load persisted metrics
      await this.loadPersistedMetrics();
      
      // Start real-time monitoring
      this.startRealTimeMonitoring();
      
      // Initialize performance observers
      this.setupPerformanceObservers();
      
      console.log('✅ Real-time metrics service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize metrics service:', error);
    }
  }

  /**
   * Load metrics from localStorage
   */
  async loadPersistedMetrics() {
    try {
      const stored = localStorage.getItem('legalArchive_metrics');
      if (stored) {
        const parsedMetrics = JSON.parse(stored);
        this.metrics = { ...this.metrics, ...parsedMetrics };
      }
    } catch (error) {
      console.warn('Failed to load persisted metrics:', error);
    }
  }

  /**
   * Persist metrics to localStorage
   */
  persistMetrics() {
    try {
      localStorage.setItem('legalArchive_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to persist metrics:', error);
    }
  }

  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateSystemMetrics();
      this.notifyListeners();
      this.persistMetrics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update system metrics with real data
   */
  updateSystemMetrics() {
    const now = Date.now();
    
    // Update system uptime
    this.metrics.system.uptime = now - this.startTime;
    
    // Simulate real memory usage based on actual operations
    if (performance.memory) {
      this.metrics.system.memoryUsage = Math.round(
        (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100
      );
    }
    
    // Update network latency using real navigation timing
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.metrics.system.networkLatency = Math.round(navigation.responseStart - navigation.requestStart);
      }
    }
    
    // Calculate error rate based on actual failed requests
    const totalRequests = this.metrics.scraping.totalDocuments + this.metrics.scraping.failedAttempts;
    if (totalRequests > 0) {
      this.metrics.system.errorRate = Math.round((this.metrics.scraping.failedAttempts / totalRequests) * 100);
    }
  }

  /**
   * Setup performance observers for real metrics
   */
  setupPerformanceObservers() {
    try {
      // Observe resource loading performance
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              // Track custom performance measures
              this.updateCustomMetric(entry.name, entry.duration);
            }
          }
        });
        
        observer.observe({ entryTypes: ['measure'] });
      }
    } catch (error) {
      console.warn('Performance observers not available:', error);
    }
  }

  /**
   * Update scraping metrics with real data
   */
  updateScrapingMetrics(data) {
    const { success, processingTime, proxyCount, error } = data;
    
    if (success) {
      this.metrics.scraping.totalDocuments++;
      this.metrics.scraping.lastUpdate = new Date().toISOString();
      
      // Update average processing time
      const currentAvg = this.metrics.scraping.averageProcessingTime;
      const count = this.metrics.scraping.totalDocuments;
      this.metrics.scraping.averageProcessingTime = 
        ((currentAvg * (count - 1)) + processingTime) / count;
    } else {
      this.metrics.scraping.failedAttempts++;
    }
    
    // Update success rate
    const total = this.metrics.scraping.totalDocuments + this.metrics.scraping.failedAttempts;
    this.metrics.scraping.successRate = total > 0 ? 
      Math.round((this.metrics.scraping.totalDocuments / total) * 100) : 0;
    
    // Update active proxies
    if (proxyCount !== undefined) {
      this.metrics.scraping.activeProxies = proxyCount;
    }
    
    this.notifyListeners();
    this.persistMetrics();
  }

  /**
   * Update AI analysis metrics
   */
  updateAIMetrics(data) {
    const { confidence, processingTime, accuracy } = data;
    
    this.metrics.ai.documentsAnalyzed++;
    this.metrics.ai.lastAnalysis = new Date().toISOString();
    
    // Update average confidence
    const currentAvg = this.metrics.ai.averageConfidence;
    const count = this.metrics.ai.documentsAnalyzed;
    this.metrics.ai.averageConfidence = 
      ((currentAvg * (count - 1)) + confidence) / count;
    
    // Update processing speed (docs per second)
    if (processingTime > 0) {
      this.metrics.ai.processingSpeed = Math.round(1000 / processingTime);
    }
    
    // Update model accuracy
    if (accuracy !== undefined) {
      this.metrics.ai.modelAccuracy = accuracy;
    }
    
    this.notifyListeners();
    this.persistMetrics();
  }

  /**
   * Update database metrics
   */
  updateDatabaseMetrics(data) {
    const { recordCount, queryTime, storageSize } = data;
    
    if (recordCount !== undefined) {
      this.metrics.database.totalRecords = recordCount;
    }
    
    if (queryTime !== undefined) {
      this.metrics.database.queryPerformance = queryTime;
    }
    
    if (storageSize !== undefined) {
      this.metrics.database.storageUsed = storageSize;
    }
    
    this.metrics.database.lastBackup = new Date().toISOString();
    
    this.notifyListeners();
    this.persistMetrics();
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get specific metric category
   */
  getMetricCategory(category) {
    return { ...this.metrics[category] };
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of metrics update
   */
  notifyListeners() {
    const currentMetrics = this.getMetrics();
    this.listeners.forEach(callback => {
      try {
        callback(currentMetrics);
      } catch (error) {
        console.error('Error in metrics listener:', error);
      }
    });
  }

  /**
   * Update custom metric
   */
  updateCustomMetric(name, value) {
    if (!this.metrics.custom) {
      this.metrics.custom = {};
    }
    
    this.metrics.custom[name] = {
      value,
      timestamp: new Date().toISOString()
    };
    
    this.notifyListeners();
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const metrics = this.getMetrics();
    
    return {
      overall: {
        health: this.calculateOverallHealth(),
        performance: this.calculatePerformanceScore(),
        reliability: this.calculateReliabilityScore()
      },
      scraping: {
        documentsPerHour: this.calculateDocumentsPerHour(),
        averageSuccessRate: metrics.scraping.successRate,
        proxyEfficiency: this.calculateProxyEfficiency()
      },
      ai: {
        analysisAccuracy: metrics.ai.averageConfidence,
        processingSpeed: metrics.ai.processingSpeed,
        modelPerformance: metrics.ai.modelAccuracy
      },
      database: {
        querySpeed: metrics.database.queryPerformance,
        storageEfficiency: this.calculateStorageEfficiency(),
        indexHealth: metrics.database.indexHealth
      }
    };
  }

  /**
   * Calculate overall system health
   */
  calculateOverallHealth() {
    const weights = {
      scraping: 0.3,
      ai: 0.3,
      database: 0.2,
      system: 0.2
    };
    
    const scores = {
      scraping: Math.min(this.metrics.scraping.successRate, 100),
      ai: Math.min(this.metrics.ai.averageConfidence, 100),
      database: Math.min(this.metrics.database.indexHealth, 100),
      system: Math.max(100 - this.metrics.system.errorRate, 0)
    };
    
    return Math.round(
      Object.entries(weights).reduce((total, [key, weight]) => {
        return total + (scores[key] * weight);
      }, 0)
    );
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore() {
    const processingSpeed = this.metrics.ai.processingSpeed;
    const queryPerformance = Math.max(100 - this.metrics.database.queryPerformance, 0);
    const networkLatency = Math.max(100 - (this.metrics.system.networkLatency / 10), 0);
    
    return Math.round((processingSpeed * 0.4) + (queryPerformance * 0.3) + (networkLatency * 0.3));
  }

  /**
   * Calculate reliability score
   */
  calculateReliabilityScore() {
    const uptime = Math.min((this.metrics.system.uptime / (24 * 60 * 60 * 1000)) * 100, 100);
    const successRate = this.metrics.scraping.successRate;
    const errorRate = Math.max(100 - this.metrics.system.errorRate, 0);
    
    return Math.round((uptime * 0.4) + (successRate * 0.3) + (errorRate * 0.3));
  }

  /**
   * Calculate documents per hour
   */
  calculateDocumentsPerHour() {
    const uptimeHours = this.metrics.system.uptime / (60 * 60 * 1000);
    return uptimeHours > 0 ? Math.round(this.metrics.scraping.totalDocuments / uptimeHours) : 0;
  }

  /**
   * Calculate proxy efficiency
   */
  calculateProxyEfficiency() {
    const activeProxies = this.metrics.scraping.activeProxies;
    const successRate = this.metrics.scraping.successRate;
    return activeProxies > 0 ? Math.round(successRate / activeProxies) : 0;
  }

  /**
   * Calculate storage efficiency
   */
  calculateStorageEfficiency() {
    const records = this.metrics.database.totalRecords;
    const storage = this.metrics.database.storageUsed;
    return storage > 0 ? Math.round(records / (storage / 1024)) : 100; // Records per KB
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      scraping: {
        totalDocuments: 0,
        successRate: 0,
        averageProcessingTime: 0,
        lastUpdate: null,
        activeProxies: 0,
        failedAttempts: 0
      },
      ai: {
        documentsAnalyzed: 0,
        averageConfidence: 0,
        processingSpeed: 0,
        modelAccuracy: 0,
        lastAnalysis: null
      },
      database: {
        totalRecords: 0,
        queryPerformance: 0,
        indexHealth: 100,
        lastBackup: null,
        storageUsed: 0
      },
      system: {
        uptime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0,
        errorRate: 0
      }
    };
    
    this.startTime = Date.now();
    this.persistMetrics();
    this.notifyListeners();
  }

  /**
   * Export metrics data
   */
  exportMetrics() {
    return {
      metrics: this.getMetrics(),
      summary: this.getPerformanceSummary(),
      exportTime: new Date().toISOString(),
      systemInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.listeners.clear();
  }
}

// Create singleton instance
export const realTimeMetricsService = new RealTimeMetricsService();
export default realTimeMetricsService;