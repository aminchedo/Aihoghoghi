// Real AI Service with HuggingFace Integration
class AIService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_TOKEN || 'your_huggingface_token_here';
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.model = 'HooshvareLab/bert-fa-base-uncased-clf-persiannews';
    this.fallbackModel = 'microsoft/DialoGPT-medium';
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      startTime: Date.now(),
      categoryCounts: {}
    };
  }

  async query(data, model = this.model) {
    const response = await fetch(`${this.baseUrl}/${model}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  preprocessPersianText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[‌]/g, ' ') // Replace ZWNJ with space
      .substring(0, 512); // BERT token limit
  }

  enhanceWithLegalContext(text, classification) {
    const legalPatterns = {
      'قرارداد': /قرارداد|طرفین|خریدار|فروشنده|اجاره/gi,
      'رای_دادگاه': /رای|حکم|دادگاه|قاضی|خواهان|خوانده/gi,
      'قانون': /قانون|ماده|تبصره|فصل|باب/gi,
      'دادخواست': /دادخواست|خواهان|علیه|خوانده/gi,
      'شکایت': /شکایت|متهم|شاکی|جرم/gi,
      'مصوبه': /مصوبه|تصویب|شورا|کمیسیون/gi
    };

    let legalScore = 0;
    let detectedType = 'عمومی';
    
    Object.entries(legalPatterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern) || [];
      if (matches.length > legalScore) {
        legalScore = matches.length;
        detectedType = type;
      }
    });

    // Extract key entities
    const entities = {
      persons: [...(text.match(/(?:آقای|خانم|دکتر)\s+([آ-ی\s]{2,30})/gi) || [])].slice(0, 3),
      dates: [...(text.match(/\d{4}\/\d{1,2}\/\d{1,2}|[۰-۹]{4}\/[۰-۹]{1,2}\/[۰-۹]{1,2}/g) || [])].slice(0, 3),
      amounts: [...(text.match(/([\d,۰-۹]+)\s*(تومان|ریال)/gi) || [])].slice(0, 2)
    };

    return {
      ...classification,
      legalType: detectedType,
      legalScore: Math.min(legalScore * 10, 100),
      entities: entities,
      textLength: text.length,
      language: this.detectLanguage(text)
    };
  }

  detectLanguage(text) {
    const persianChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    const persianRatio = persianChars / totalChars;
    
    if (persianRatio > 0.7) return 'fa';
    if (persianRatio > 0.3) return 'mixed';
    return 'en';
  }

  async analyzeTexts(texts) {
    try {
      if (!texts || !Array.isArray(texts) || texts.length === 0) {
        throw new Error('لطفاً آرایه‌ای از متن‌ها ارسال کنید');
      }

      this.stats.totalRequests++;
      console.log(`🔍 تحلیل ${texts.length} متن با مدل ${this.model}`);

      // Preprocess texts
      const processedTexts = texts.map(text => this.preprocessPersianText(text)).filter(t => t.length > 0);
      
      if (processedTexts.length === 0) {
        throw new Error('هیچ متن معتبری برای تحلیل یافت نشد');
      }

      // Get classification results from Hugging Face
      const results = await this.query({
        inputs: processedTexts,
      });

      // Process and enhance results
      const enhancedResults = results.map((result, idx) => {
        const originalText = texts[idx];
        const classification = Array.isArray(result) ? result[0] : result;
        
        // Enhanced analysis
        const enhanced = this.enhanceWithLegalContext(originalText, classification);
        
        // Update statistics
        const category = enhanced.label || 'نامشخص';
        this.stats.categoryCounts[category] = (this.stats.categoryCounts[category] || 0) + 1;

        return {
          text: originalText.substring(0, 150) + (originalText.length > 150 ? '...' : ''),
          fullText: originalText,
          category: category,
          score: enhanced.score || 0.5,
          confidence: Math.round((enhanced.score || 0.5) * 100),
          legalType: enhanced.legalType,
          legalScore: enhanced.legalScore,
          entities: enhanced.entities,
          textLength: enhanced.textLength,
          language: enhanced.language,
          analyzedAt: new Date().toISOString(),
          allScores: Array.isArray(result) ? result : [result]
        };
      });

      // Sort by confidence
      const ranked = enhancedResults.sort((a, b) => b.score - a.score);

      // Update average confidence
      const totalConfidence = ranked.reduce((sum, r) => sum + r.score, 0);
      this.stats.averageConfidence = totalConfidence / ranked.length;
      this.stats.successfulRequests++;

      return { 
        success: true,
        total: ranked.length,
        ranked,
        stats: this.getStats(),
        model: this.model,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("تحلیل ناموفق:", error);
      this.stats.failedRequests++;
      
      // Handle specific errors
      let errorMessage = "خطا در تحلیل متن";
      if (error.message.includes('Rate limit')) {
        errorMessage = "محدودیت نرخ درخواست. لطفاً کمی صبر کنید";
      } else if (error.message.includes('Model')) {
        errorMessage = "خطا در بارگذاری مدل. لطفاً دوباره تلاش کنید";
      }
      
      throw new Error(errorMessage);
    }
  }

  async generateText(prompt, maxLength = 100) {
    try {
      const result = await this.query({
        inputs: prompt,
        parameters: {
          max_length: maxLength,
          temperature: 0.7,
          do_sample: true
        }
      }, 'microsoft/DialoGPT-medium');

      return {
        success: true,
        generated_text: result[0]?.generated_text || 'متن تولید نشد',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("تولید متن ناموفق:", error);
      throw new Error("خطا در تولید متن");
    }
  }

  async summarizeText(text, maxLength = 150) {
    try {
      const result = await this.query({
        inputs: text,
        parameters: {
          max_length: maxLength,
          min_length: 50,
          do_sample: false
        }
      }, 'facebook/bart-large-cnn');

      return {
        success: true,
        summary_text: result[0]?.summary_text || 'خلاصه تولید نشد',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("خلاصه‌سازی ناموفق:", error);
      throw new Error("خطا در خلاصه‌سازی متن");
    }
  }

  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      successRate: this.stats.totalRequests > 0 
        ? Math.round((this.stats.successfulRequests / this.stats.totalRequests) * 100) 
        : 0,
      averageConfidence: Math.round((this.stats.averageConfidence || 0) * 100),
      runtime: Math.round(runtime / 1000) + 's',
      requestsPerMinute: Math.round((this.stats.totalRequests / (runtime / 60000)) || 0),
      categoryCounts: this.stats.categoryCounts
    };
  }

  getHealth() {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.stats.startTime) / 1000),
      model: this.model,
      stats: this.getStats()
    };
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;