/**
 * Smart Scraping Service for Iranian Legal Archive
 * Handles intelligent web scraping with proxy management and rate limiting
 */

import { API_ENDPOINTS } from '../contexts/SystemContext';
import { realTimeMetricsService } from './realTimeService';

class SmartScrapingService {
  constructor() {
    this.baseUrl = API_ENDPOINTS.BASE;
    this.activeJobs = new Map();
    this.proxyList = [];
    this.currentProxyIndex = 0;
    this.isInitialized = false;
    this.rateLimiter = {
      requests: 0,
      lastReset: Date.now(),
      maxRequests: 100, // per minute
      windowMs: 60000
    };
  }

  /**
   * Initialize the scraping service
   */
  async initialize() {
    try {
      console.log('🕷️ Initializing Smart Scraping Service...');
      
      // Load proxy list
      await this.loadProxyList();
      
      // Test scraping capabilities
      await this.testScraping();
      
      this.isInitialized = true;
      console.log('✅ Smart Scraping Service initialized');
      
      return { success: true, status: 'initialized' };
    } catch (error) {
      console.error('❌ Smart Scraping Service initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load proxy list from backend
   */
  async loadProxyList() {
    try {
      const response = await fetch(`${this.baseUrl}/api/proxies/list`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        this.proxyList = data.proxies || [];
        console.log(`📡 Loaded ${this.proxyList.length} proxies`);
      } else {
        console.warn('Could not load proxy list, using direct connection');
        this.proxyList = [];
      }
    } catch (error) {
      console.warn('Proxy list loading failed:', error);
      this.proxyList = [];
    }
  }

  /**
   * Test scraping capabilities
   */
  async testScraping() {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraping/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });

      if (!response.ok) {
        throw new Error(`Scraping test failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Scraping test passed:', result);
    } catch (error) {
      console.warn('Scraping test failed, using local mode:', error);
    }
  }

  /**
   * Check rate limiting
   */
  checkRateLimit() {
    const now = Date.now();
    
    if (now - this.rateLimiter.lastReset > this.rateLimiter.windowMs) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.lastReset = now;
    }
    
    return this.rateLimiter.requests < this.rateLimiter.maxRequests;
  }

  /**
   * Get next proxy
   */
  getNextProxy() {
    if (this.proxyList.length === 0) {
      return null;
    }
    
    const proxy = this.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    return proxy;
  }

  /**
   * Scrape a URL
   */
  async scrapeUrl(url, options = {}) {
    try {
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded. Please wait before making another request.');
      }

      realTimeMetricsService.updateScrapingMetrics('scraping_started');

      const jobId = `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const scrapingData = {
        url,
        jobId,
        options: {
          timeout: options.timeout || 30000,
          retries: options.retries || 3,
          proxy: options.useProxy ? this.getNextProxy() : null,
          headers: options.headers || {},
          followRedirects: options.followRedirects !== false,
          extractText: options.extractText !== false,
          extractLinks: options.extractLinks || false,
          extractImages: options.extractImages || false,
          ...options
        }
      };

      // Store job info
      this.activeJobs.set(jobId, {
        id: jobId,
        url,
        status: 'starting',
        startTime: Date.now(),
        options: scrapingData.options
      });

      const response = await fetch(`${this.baseUrl}/api/scraping/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapingData)
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Update job status
      this.activeJobs.set(jobId, {
        ...this.activeJobs.get(jobId),
        status: 'completed',
        endTime: Date.now(),
        result
      });

      this.rateLimiter.requests++;
      realTimeMetricsService.updateScrapingMetrics('scraping_completed');
      
      return {
        success: true,
        jobId,
        data: result,
        message: 'صفحه با موفقیت استخراج شد'
      };
    } catch (error) {
      console.error('URL scraping error:', error);
      realTimeMetricsService.updateScrapingMetrics('scraping_failed');
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در استخراج صفحه'
      };
    }
  }

  /**
   * Scrape a document file
   */
  async scrapeDocument(file, options = {}) {
    try {
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded. Please wait before making another request.');
      }

      realTimeMetricsService.updateScrapingMetrics('document_scraping_started');

      const jobId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobId', jobId);
      formData.append('options', JSON.stringify({
        extractText: options.extractText !== false,
        extractMetadata: options.extractMetadata !== false,
        ocrEnabled: options.ocrEnabled || false,
        language: options.language || 'fa',
        ...options
      }));

      // Store job info
      this.activeJobs.set(jobId, {
        id: jobId,
        fileName: file.name,
        fileSize: file.size,
        status: 'starting',
        startTime: Date.now(),
        options
      });

      const response = await fetch(`${this.baseUrl}/api/scraping/document`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Document scraping failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Update job status
      this.activeJobs.set(jobId, {
        ...this.activeJobs.get(jobId),
        status: 'completed',
        endTime: Date.now(),
        result
      });

      this.rateLimiter.requests++;
      realTimeMetricsService.updateScrapingMetrics('document_scraping_completed');
      
      return {
        success: true,
        jobId,
        data: result,
        message: 'سند با موفقیت استخراج شد'
      };
    } catch (error) {
      console.error('Document scraping error:', error);
      realTimeMetricsService.updateScrapingMetrics('document_scraping_failed');
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در استخراج سند'
      };
    }
  }

  /**
   * Get scraping status
   */
  async getScrapingStatus(jobId = null) {
    try {
      if (jobId) {
        // Get specific job status
        const job = this.activeJobs.get(jobId);
        if (!job) {
          return {
            success: false,
            error: 'Job not found',
            message: 'کار یافت نشد'
          };
        }

        return {
          success: true,
          job,
          message: 'وضعیت کار دریافت شد'
        };
      } else {
        // Get all jobs status
        const jobs = Array.from(this.activeJobs.values());
        
        return {
          success: true,
          jobs,
          total: jobs.length,
          active: jobs.filter(job => job.status === 'starting' || job.status === 'running').length,
          completed: jobs.filter(job => job.status === 'completed').length,
          failed: jobs.filter(job => job.status === 'failed').length,
          message: 'وضعیت تمام کارها دریافت شد'
        };
      }
    } catch (error) {
      console.error('Status retrieval error:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در دریافت وضعیت'
      };
    }
  }

  /**
   * Stop a scraping job
   */
  async stopScraping(jobId) {
    try {
      const job = this.activeJobs.get(jobId);
      if (!job) {
        return {
          success: false,
          error: 'Job not found',
          message: 'کار یافت نشد'
        };
      }

      const response = await fetch(`${this.baseUrl}/api/scraping/stop/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Stop request failed: ${response.status}`);
      }

      // Update job status
      this.activeJobs.set(jobId, {
        ...job,
        status: 'stopped',
        endTime: Date.now()
      });

      return {
        success: true,
        message: 'کار متوقف شد'
      };
    } catch (error) {
      console.error('Stop scraping error:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در متوقف کردن کار'
      };
    }
  }

  /**
   * Get proxy status
   */
  async getProxyStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/proxies/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Proxy status failed: ${response.status}`);
      }

      const status = await response.json();
      
      return {
        success: true,
        status,
        message: 'وضعیت پروکسی‌ها دریافت شد'
      };
    } catch (error) {
      console.error('Proxy status error:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در دریافت وضعیت پروکسی‌ها'
      };
    }
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs() {
    const completedJobs = Array.from(this.activeJobs.entries())
      .filter(([_, job]) => job.status === 'completed' || job.status === 'failed' || job.status === 'stopped');
    
    completedJobs.forEach(([jobId, _]) => {
      this.activeJobs.delete(jobId);
    });
    
    console.log(`🧹 Cleared ${completedJobs.length} completed jobs`);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      activeJobs: this.activeJobs.size,
      proxyCount: this.proxyList.length,
      currentProxyIndex: this.currentProxyIndex,
      rateLimit: {
        requests: this.rateLimiter.requests,
        maxRequests: this.rateLimiter.maxRequests,
        windowMs: this.rateLimiter.windowMs,
        remaining: this.rateLimiter.maxRequests - this.rateLimiter.requests
      },
      baseUrl: this.baseUrl
    };
  }
}

// Create and export singleton instance
export const smartScrapingService = new SmartScrapingService();