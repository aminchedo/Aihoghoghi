import axios from 'axios';

/**
 * AI Analysis Service for content ranking and categorization
 * Integrates with backend ai-content-analyzer.js
 */
class AIAnalysisService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://your-backend-domain.com' // Will be updated with actual deployment URL
      : 'http://localhost:3001';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Analyze content using AI backend
   * @param {string[]} texts - Array of texts to analyze
   * @returns {Promise<Object>} Analysis results with rankings
   */
  async analyzeContent(texts) {
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      throw new Error('لطفاً آرایه‌ای از متن‌ها ارسال کنید');
    }

    // Create cache key from texts
    const cacheKey = this.createCacheKey(texts);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📋 استفاده از نتایج کش شده');
        return cached.data;
      }
    }

    try {
      console.log(`🔍 تحلیل ${texts.length} متن با هوش مصنوعی`);
      
      const response = await this.axiosInstance.post('/analyze', {
        texts: texts
      });

      if (response.data.success) {
        // Cache the results
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });

        return response.data;
      } else {
        throw new Error(response.data.error || 'خطا در تحلیل');
      }
    } catch (error) {
      console.error('خطا در تحلیل هوش مصنوعی:', error);
      
      // Return fallback analysis if backend is unavailable
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.warn('🔄 استفاده از تحلیل محلی به دلیل عدم دسترسی به سرور');
        return this.fallbackAnalysis(texts);
      }
      
      throw new Error(error.response?.data?.error || error.message || 'خطا در اتصال به سرور تحلیل');
    }
  }

  /**
   * Get analysis statistics
   */
  async getStats() {
    try {
      const response = await this.axiosInstance.get('/stats');
      return response.data.success ? response.data.stats : null;
    } catch (error) {
      console.error('خطا در دریافت آمار:', error);
      return null;
    }
  }

  /**
   * Check backend health
   */
  async checkHealth() {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Fallback analysis when backend is unavailable
   */
  fallbackAnalysis(texts) {
    console.log('📊 اجرای تحلیل محلی...');
    
    const results = texts.map((text, index) => {
      const category = this.detectCategoryLocally(text);
      const confidence = this.calculateLocalConfidence(text, category);
      
      return {
        text: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
        fullText: text,
        category: category.type,
        score: confidence / 100,
        confidence: confidence,
        legalType: category.type,
        legalScore: category.score,
        entities: this.extractEntitiesLocally(text),
        textLength: text.length,
        language: this.detectLanguage(text),
        analyzedAt: new Date().toISOString(),
        isLocal: true
      };
    });

    const ranked = results.sort((a, b) => b.confidence - a.confidence);

    return {
      success: true,
      total: ranked.length,
      ranked,
      isLocal: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalRequests: texts.length,
        successfulRequests: texts.length,
        successRate: 100,
        averageConfidence: Math.round(ranked.reduce((sum, r) => sum + r.confidence, 0) / ranked.length)
      }
    };
  }

  /**
   * Local category detection
   */
  detectCategoryLocally(text) {
    const patterns = {
      'قرارداد': { regex: /قرارداد|طرفین|خریدار|فروشنده|اجاره/gi, score: 0 },
      'رای_دادگاه': { regex: /رای|حکم|دادگاه|قاضی|خواهان|خوانده/gi, score: 0 },
      'قانون': { regex: /قانون|ماده|تبصره|فصل|باب/gi, score: 0 },
      'دادخواست': { regex: /دادخواست|خواهان|علیه|خوانده/gi, score: 0 },
      'شکایت': { regex: /شکایت|متهم|شاکی|جرم/gi, score: 0 },
      'مصوبه': { regex: /مصوبه|تصویب|شورا|کمیسیون/gi, score: 0 },
      'اخبار': { regex: /خبر|گزارش|اعلام|اطلاع/gi, score: 0 }
    };

    let bestMatch = { type: 'عمومی', score: 0 };

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern.regex) || [];
      const score = matches.length * 10;
      
      if (score > bestMatch.score) {
        bestMatch = { type, score: Math.min(score, 100) };
      }
    });

    return bestMatch;
  }

  /**
   * Calculate local confidence
   */
  calculateLocalConfidence(text, category) {
    let confidence = 50; // Base confidence
    
    // Boost confidence based on text length
    if (text.length > 100) confidence += 10;
    if (text.length > 500) confidence += 10;
    
    // Boost confidence based on category score
    confidence += Math.min(category.score / 5, 20);
    
    // Add some randomness to simulate AI uncertainty
    confidence += Math.random() * 10 - 5;
    
    return Math.max(30, Math.min(95, Math.round(confidence)));
  }

  /**
   * Local entity extraction
   */
  extractEntitiesLocally(text) {
    return {
      persons: [...(text.match(/(?:آقای|خانم|دکتر)\s+([آ-ی\s]{2,30})/gi) || [])].slice(0, 3),
      dates: [...(text.match(/\d{4}\/\d{1,2}\/\d{1,2}|[۰-۹]{4}\/[۰-۹]{1,2}\/[۰-۹]{1,2}/g) || [])].slice(0, 3),
      amounts: [...(text.match(/([\d,۰-۹]+)\s*(تومان|ریال)/gi) || [])].slice(0, 2)
    };
  }

  /**
   * Detect text language
   */
  detectLanguage(text) {
    const persianChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    const persianRatio = persianChars / totalChars;
    
    if (persianRatio > 0.7) return 'fa';
    if (persianRatio > 0.3) return 'mixed';
    return 'en';
  }

  /**
   * Create cache key from texts
   */
  createCacheKey(texts) {
    return btoa(JSON.stringify(texts.map(t => t.substring(0, 100)))).substring(0, 50);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Export singleton instance
export default new AIAnalysisService();

// Also export the class for custom instances
export { AIAnalysisService };