import axios from 'axios';

/**
 * Enhanced API Service with GitHub Pages compatibility
 * Handles 404 errors, retries, and fallback responses
 */
class APIService {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Get appropriate base URL for different environments
   */
  getBaseURL() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = window.location.hostname === 'localhost';
    
    if (isDevelopment || isLocalhost) {
      return 'http://localhost:8000';
    }
    
    // For GitHub Pages, APIs might be hosted elsewhere or use fallback
    return '/api'; // This will be proxied or handled by fallback
  }

  /**
   * Setup request/response interceptors for better error handling
   */
  setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Handle 404 errors specifically for GitHub Pages
        if (error.response?.status === 404 && !originalRequest._retry) {
          console.warn('⚠️ API 404 detected, attempting fallback...');
          return this.handleAPIFallback(originalRequest);
        }
        
        // Handle network errors with retry
        if (!error.response && !originalRequest._retry && originalRequest._retryCount < this.retryAttempts) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          console.log(`🔄 Retrying API request (${originalRequest._retryCount}/${this.retryAttempts})`);
          
          await this.delay(this.retryDelay * originalRequest._retryCount);
          return this.axiosInstance(originalRequest);
        }
        
        console.error('❌ API Error:', error.response?.status, error.message);
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Handle API fallback for GitHub Pages
   */
  async handleAPIFallback(originalRequest) {
    const endpoint = originalRequest.url;
    
    console.log(`🔄 Using fallback for endpoint: ${endpoint}`);
    
    // Return mock data based on endpoint
    const fallbackData = this.getFallbackData(endpoint);
    
    return {
      data: fallbackData,
      status: 200,
      statusText: 'OK (Fallback)',
      headers: {},
      config: originalRequest,
      isFallback: true
    };
  }

  /**
   * Get fallback data for different endpoints
   */
  getFallbackData(endpoint) {
    const fallbackResponses = {
      '/api/documents': {
        success: true,
        data: [],
        total: 0,
        message: 'در حالت آفلاین - داده‌های نمونه'
      },
      '/api/search': {
        success: true,
        results: [],
        total: 0,
        message: 'جستجو در حالت آفلاین'
      },
      '/api/stats': {
        success: true,
        stats: {
          totalDocuments: 0,
          processedToday: 0,
          activeUsers: 1,
          systemHealth: 'offline'
        }
      },
      '/api/health': {
        status: 'offline',
        message: 'سیستم در حالت آفلاین'
      }
    };

    // Find matching fallback
    const matchingKey = Object.keys(fallbackResponses).find(key => 
      endpoint.includes(key.replace('/api', ''))
    );

    return fallbackResponses[matchingKey] || {
      success: false,
      error: 'سرویس در دسترس نیست',
      message: 'لطفاً بعداً تلاش کنید',
      isFallback: true
    };
  }

  /**
   * Format error for user-friendly display
   */
  formatError(error) {
    if (error.code === 'ECONNREFUSED') {
      return {
        message: 'عدم اتصال به سرور',
        details: 'لطفاً اتصال اینترنت خود را بررسی کنید',
        code: 'CONNECTION_ERROR'
      };
    }
    
    if (error.response?.status === 404) {
      return {
        message: 'سرویس مورد نظر یافت نشد',
        details: 'ممکن است سرویس موقتاً در دسترس نباشد',
        code: 'NOT_FOUND'
      };
    }
    
    if (error.response?.status >= 500) {
      return {
        message: 'خطای سرور',
        details: 'لطفاً دوباره تلاش کنید',
        code: 'SERVER_ERROR'
      };
    }
    
    return {
      message: error.message || 'خطای نامشخص',
      details: error.response?.data?.message || 'خطای غیرمنتظره رخ داد',
      code: error.code || 'UNKNOWN_ERROR'
    };
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make API request with fallback handling
   */
  async request(config) {
    try {
      const response = await this.axiosInstance(config);
      return response.data;
    } catch (error) {
      // If it's a formatted error, throw it
      if (error.code) {
        throw error;
      }
      
      // Otherwise, format and throw
      throw this.formatError(error);
    }
  }

  /**
   * GET request with fallback
   */
  async get(url, config = {}) {
    return this.request({ method: 'GET', url, ...config });
  }

  /**
   * POST request with fallback
   */
  async post(url, data, config = {}) {
    return this.request({ method: 'POST', url, data, ...config });
  }

  /**
   * PUT request with fallback
   */
  async put(url, data, config = {}) {
    return this.request({ method: 'PUT', url, data, ...config });
  }

  /**
   * DELETE request with fallback
   */
  async delete(url, config = {}) {
    return this.request({ method: 'DELETE', url, ...config });
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const response = await this.get('/health');
      return response.status === 'healthy';
    } catch (error) {
      console.warn('API health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export default new APIService();

// Also export the class for custom instances
export { APIService };