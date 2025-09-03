/**
 * API Client for Iranian Legal Archive System
 * Handles all backend communication with fallbacks
 */

import { API_ENDPOINTS } from '../contexts/SystemContext'

class APIClient {
  constructor() {
    this.baseURL = API_ENDPOINTS.BASE
    this.timeout = 30000
    this.retryAttempts = 3
    this.retryDelay = 1000
  }

  /**
   * Make API request with retry logic
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: this.timeout,
      ...options
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🌐 API Request (attempt ${attempt}): ${config.method || 'GET'} ${url}`)
        
        const response = await fetch(url, config)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`✅ API Success: ${endpoint}`)
        
        return {
          success: true,
          data,
          status: response.status,
          headers: response.headers
        }

      } catch (error) {
        console.warn(`⚠️ API Attempt ${attempt} failed: ${endpoint}`, error)
        
        if (attempt === this.retryAttempts) {
          console.error(`❌ API Failed after ${this.retryAttempts} attempts: ${endpoint}`)
          return {
            success: false,
            error: error.message,
            status: error.status || 0
          }
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request(url, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const result = await this.get('/health')
      return result.success
    } catch (error) {
      return false
    }
  }

  /**
   * Test all endpoints
   */
  async testEndpoints() {
    const endpoints = [
      '/health',
      '/system/status',
      '/models/status',
      '/proxies/status'
    ]

    const results = {}
    
    for (const endpoint of endpoints) {
      const startTime = Date.now()
      const result = await this.get(endpoint)
      const responseTime = Date.now() - startTime
      
      results[endpoint] = {
        success: result.success,
        responseTime,
        error: result.error
      }
    }

    return results
  }

  /**
   * Update configuration
   */
  updateConfig({ baseURL, timeout, retryAttempts }) {
    if (baseURL) this.baseURL = baseURL
    if (timeout) this.timeout = timeout
    if (retryAttempts) this.retryAttempts = retryAttempts
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts
    }
  }
}

// Create singleton instance
export const apiClient = new APIClient()

// API convenience functions
export const api = {
  // System endpoints
  health: () => apiClient.get('/health'),
  systemStatus: () => apiClient.get('/system/status'),
  systemMetrics: () => apiClient.get('/system/metrics'),
  
  // Model endpoints
  loadModel: (modelType, modelName) => apiClient.post('/models/load', { model_type: modelType, model_name: modelName }),
  getModelStatus: () => apiClient.get('/models/status'),
  classifyText: (text) => apiClient.post('/models/classify', { text }),
  performNER: (text) => apiClient.post('/models/ner', { text }),
  analyzeSentiment: (text) => apiClient.post('/models/sentiment', { text }),
  summarizeText: (text, length = 'medium') => apiClient.post('/models/summarize', { text, length }),
  
  // Document endpoints
  searchDocuments: (query, options = {}) => apiClient.post('/documents/search', { query, ...options }),
  semanticSearch: (query, options = {}) => apiClient.post('/documents/semantic-search', { query, ...options }),
  nafaqeSearch: (query, nafaqeType) => apiClient.post('/documents/nafaqe-search', { query, nafaqe_type: nafaqeType }),
  processDocument: (url, options = {}) => apiClient.post('/documents/process', { url, ...options }),
  uploadDocument: (file, metadata = {}) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', JSON.stringify(metadata))
    
    return apiClient.request('/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it for FormData
    })
  },
  
  // Proxy endpoints
  getProxyStatus: () => apiClient.get('/proxies/status'),
  testIranianProxies: () => apiClient.post('/proxies/test-iranian'),
  rotateProxies: () => apiClient.post('/proxies/rotate'),
  
  // Data endpoints
  getExtractedContent: () => apiClient.get('/data/extracted-content')
}

export default apiClient