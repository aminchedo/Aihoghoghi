import { PRODUCTION_ENDPOINTS, API_STATUS, DEFAULT_HEADERS, RATE_LIMITS } from '../config/productionEndpoints';

class ProductionAPIService {
  constructor() {
    this.baseURL = PRODUCTION_ENDPOINTS.BASE;
    this.defaultHeaders = DEFAULT_HEADERS;
    this.rateLimiters = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    // Initialize rate limiters
    Object.entries(RATE_LIMITS).forEach(([key, config]) => {
      this.rateLimiters.set(key, {
        requests: 0,
        windowStart: Date.now(),
        ...config
      });
    });
  }

  // Core request method with real data integration
  async request(endpoint, options = {}) {
    const url = this.buildURL(endpoint);
    const requestConfig = this.buildRequestConfig(options);
    
    // Check rate limiting
    if (!this.checkRateLimit(options.rateLimitType || 'DEFAULT')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const response = await fetch(url, requestConfig);
      
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      const data = await response.json();
      
      // Update rate limiter
      this.updateRateLimit(options.rateLimitType || 'DEFAULT');
      
      return data;
    } catch (error) {
      return this.handleRequestError(error, endpoint, options);
    }
  }

  // Build full URL
  buildURL(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseURL}${endpoint}`;
  }

  // Build request configuration
  buildRequestConfig(options) {
    const config = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };

    // Add authentication if available
    const token = this.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle request body
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    return config;
  }

  // Rate limiting
  checkRateLimit(type) {
    const limiter = this.rateLimiters.get(type);
    if (!limiter) return true;

    const now = Date.now();
    if (now - limiter.windowStart > limiter.window) {
      limiter.requests = 0;
      limiter.windowStart = now;
    }

    return limiter.requests < limiter.requests;
  }

  updateRateLimit(type) {
    const limiter = this.rateLimiters.get(type);
    if (limiter) {
      limiter.requests++;
    }
  }

  // Error handling
  async handleErrorResponse(response) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Unknown error occurred' };
    }

    const error = new Error(errorData.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    error.response = response;

    return error;
  }

  handleRequestError(error, endpoint, options) {
    console.error(`API request failed for ${endpoint}:`, error);

    // Check if we should retry
    if (this.shouldRetry(error, endpoint)) {
      return this.retryRequest(endpoint, options);
    }

    // Queue request if it's a connection error
    if (this.isConnectionError(error)) {
      return this.queueRequest(endpoint, options);
    }

    throw error;
  }

  shouldRetry(error, endpoint) {
    const retryCount = this.retryAttempts.get(endpoint) || 0;
    return retryCount < this.maxRetries && this.isRetryableError(error);
  }

  isRetryableError(error) {
    return error.status >= 500 || error.status === 429 || 
           error.name === 'TypeError' || error.message.includes('fetch');
  }

  isConnectionError(error) {
    return error.name === 'TypeError' || 
           error.message.includes('fetch') ||
           error.message.includes('network');
  }

  async retryRequest(endpoint, options) {
    const retryCount = this.retryAttempts.get(endpoint) || 0;
    this.retryAttempts.set(endpoint, retryCount + 1);

    const delay = this.retryDelay * Math.pow(2, retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));

    return this.request(endpoint, options);
  }

  queueRequest(endpoint, options) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ endpoint, options, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { endpoint, options, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await this.request(endpoint, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  // Authentication
  getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  setAuthToken(token, persistent = false) {
    if (persistent) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
    }
  }

  clearAuthToken() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }

  // Document processing endpoints
  async processDocument(documentData, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.PROCESS_DOCUMENT, {
      method: 'POST',
      body: documentData,
      rateLimitType: 'UPLOAD',
      ...options
    });
  }

  async batchProcessDocuments(documents, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.BATCH_PROCESS, {
      method: 'POST',
      body: { documents },
      rateLimitType: 'UPLOAD',
      ...options
    });
  }

  async searchDocuments(query, options = {}) {
    const params = new URLSearchParams(query);
    return this.request(`${PRODUCTION_ENDPOINTS.SEARCH}?${params}`, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async semanticSearch(query, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.SEMANTIC_SEARCH, {
      method: 'POST',
      body: { query },
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async advancedSearch(criteria, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.ADVANCED_SEARCH, {
      method: 'POST',
      body: criteria,
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async getDocument(id, options = {}) {
    const endpoint = PRODUCTION_ENDPOINTS.GET_DOCUMENT.replace(':id', id);
    return this.request(endpoint, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async updateDocument(id, updates, options = {}) {
    const endpoint = PRODUCTION_ENDPOINTS.UPDATE_DOCUMENT.replace(':id', id);
    return this.request(endpoint, {
      method: 'PUT',
      body: updates,
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async deleteDocument(id, options = {}) {
    const endpoint = PRODUCTION_ENDPOINTS.DELETE_DOCUMENT.replace(':id', id);
    return this.request(endpoint, {
      method: 'DELETE',
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  // AI Services endpoints
  async classifyDocument(documentId, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.CLASSIFY, {
      method: 'POST',
      body: { document_id: documentId },
      rateLimitType: 'AI_ANALYSIS',
      ...options
    });
  }

  async analyzeSentiment(documentId, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.SENTIMENT, {
      method: 'POST',
      body: { document_id: documentId },
      rateLimitType: 'AI_ANALYSIS',
      ...options
    });
  }

  async extractEntities(documentId, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.NER, {
      method: 'POST',
      body: { document_id: documentId },
      rateLimitType: 'AI_ANALYSIS',
      ...options
    });
  }

  async summarizeDocument(documentId, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.SUMMARIZE, {
      method: 'POST',
      body: { document_id: documentId },
      rateLimitType: 'AI_ANALYSIS',
      ...options
    });
  }

  async batchAnalyzeDocuments(documentIds, analysisTypes, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.BATCH_ANALYZE, {
      method: 'POST',
      body: { document_ids: documentIds, analysis_types: analysisTypes },
      rateLimitType: 'AI_ANALYSIS',
      ...options
    });
  }

  async getAIModels(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.AI_MODELS, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async getAIStatus(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.AI_STATUS, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  // Scraping endpoints
  async scrapeURL(url, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.SCRAPE_URL, {
      method: 'POST',
      body: { url },
      rateLimitType: 'SCRAPING',
      ...options
    });
  }

  async getScrapingStatus(taskId, options = {}) {
    const endpoint = PRODUCTION_ENDPOINTS.SCRAPING_STATUS.replace(':id', taskId);
    return this.request(endpoint, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async getScrapingHistory(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.SCRAPING_HISTORY, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async batchScrape(urls, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.BATCH_SCRAPE, {
      method: 'POST',
      body: { urls },
      rateLimitType: 'SCRAPING',
      ...options
    });
  }

  // System management endpoints
  async getProxyStatus(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.PROXY_STATUS, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async getDNSStatus(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.DNS_STATUS, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async getSystemMetrics(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.SYSTEM_METRICS, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async healthCheck(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.HEALTH_CHECK, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async updateSystemConfig(config, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.CONFIG_UPDATE, {
      method: 'PUT',
      body: config,
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async getSystemStatus(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.SYSTEM_STATUS, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  // User management endpoints
  async login(credentials, options = {}) {
    const response = await this.request(PRODUCTION_ENDPOINTS.USER_LOGIN, {
      method: 'POST',
      body: credentials,
      rateLimitType: 'DEFAULT',
      ...options
    });

    if (response.token) {
      this.setAuthToken(response.token, response.persistent || false);
    }

    return response;
  }

  async logout(options = {}) {
    const response = await this.request(PRODUCTION_ENDPOINTS.USER_LOGOUT, {
      method: 'POST',
      rateLimitType: 'DEFAULT',
      ...options
    });

    this.clearAuthToken();
    return response;
  }

  async getUserProfile(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.USER_PROFILE, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async getUserSessions(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.USER_SESSIONS, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  // Analytics endpoints
  async getAnalyticsDashboard(options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.ANALYTICS_DASHBOARD, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async getAnalyticsReports(filters, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.ANALYTICS_REPORTS, {
      method: 'POST',
      body: filters,
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async exportAnalytics(format, filters, options = {}) {
    return this.request(PRODUCTION_ENDPOINTS.ANALYTICS_EXPORT, {
      method: 'POST',
      body: { format, filters },
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  // File management endpoints
  async uploadFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(PRODUCTION_ENDPOINTS.UPLOAD_FILE, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
        ...this.defaultHeaders,
        'Content-Type': undefined
      },
      rateLimitType: 'UPLOAD',
      ...options
    });
  }

  async downloadFile(fileId, options = {}) {
    const endpoint = PRODUCTION_ENDPOINTS.DOWNLOAD_FILE.replace(':id', fileId);
    return this.request(endpoint, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async getFileStatus(fileId, options = {}) {
    const endpoint = PRODUCTION_ENDPOINTS.FILE_STATUS.replace(':id', fileId);
    return this.request(endpoint, {
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  async deleteFile(fileId, options = {}) {
    const endpoint = PRODUCTION_ENDPOINTS.DELETE_FILE.replace(':id', fileId);
    return this.request(endpoint, {
      method: 'DELETE',
      rateLimitType: 'DEFAULT',
      ...options
    });
  }

  // Utility methods
  async ping() {
    try {
      const start = Date.now();
      await this.healthCheck();
      const end = Date.now();
      return end - start;
    } catch (error) {
      throw new Error('Service unavailable');
    }
  }

  getRateLimitStatus() {
    const status = {};
    this.rateLimiters.forEach((limiter, type) => {
      status[type] = {
        requests: limiter.requests,
        limit: limiter.requests,
        window: limiter.window,
        remaining: Math.max(0, limiter.requests - limiter.requests),
        resetTime: new Date(limiter.windowStart + limiter.window)
      };
    });
    return status;
  }

  clearRateLimiters() {
    this.rateLimiters.forEach(limiter => {
      limiter.requests = 0;
      limiter.windowStart = Date.now();
    });
  }

  // Batch operations
  async batchRequest(requests, options = {}) {
    const promises = requests.map(({ endpoint, method = 'GET', body }) => {
      return this.request(endpoint, { method, body, ...options });
    });

    return Promise.allSettled(promises);
  }

  // Real-time data streaming
  async streamData(endpoint, options = {}) {
    const url = this.buildURL(endpoint);
    const requestConfig = this.buildRequestConfig(options);

    try {
      const response = await fetch(url, requestConfig);
      
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      return {
        async *[Symbol.asyncIterator]() {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim());
              
              for (const line of lines) {
                try {
                  const data = JSON.parse(line);
                  yield data;
                } catch (e) {
                  console.warn('Failed to parse streaming data:', e);
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      };
    } catch (error) {
      throw this.handleRequestError(error, endpoint, options);
    }
  }
}

// Create singleton instance
const productionAPIService = new ProductionAPIService();

// Export both class and instance
export { ProductionAPIService, productionAPIService as default };