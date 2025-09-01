import axios from 'axios';

/**
 * AI-Powered Content Analyzer for Iranian Legal Documents
 * Uses Hugging Face Persian BERT models for intelligent analysis
 */
class AIContentAnalyzer {
  constructor(options = {}) {
    this.options = {
      apiKey: options.apiKey || process.env.REACT_APP_HF_API_KEY || '',
      baseUrl: options.baseUrl || 'https://api-inference.huggingface.co',
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
      batchSize: options.batchSize || 10,
      ...options
    };

    this.axiosInstance = axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeout,
      headers: {
        'Authorization': `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.stats = {
      totalAnalyzed: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      averageConfidence: 0,
      startTime: Date.now()
    };

    // Persian legal document categories
    this.legalCategories = {
      'قرارداد': 'contract',
      'رای_دادگاه': 'court_ruling',
      'قانون': 'law',
      'آیین_نامه': 'regulation',
      'بخشنامه': 'circular',
      'مصوبه': 'resolution',
      'شکایت': 'complaint',
      'دادخواست': 'petition',
      'وکالت_نامه': 'power_of_attorney',
      'سند_مالکیت': 'property_deed'
    };
  }

  /**
   * Analyze single text using Persian BERT model
   */
  async analyzeText(text, options = {}) {
    const model = options.model || 'HooshvareLab/bert-fa-base-uncased-clf-persiannews';
    const maxRetries = options.maxRetries || this.options.maxRetries;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.stats.totalAnalyzed++;
        
        const response = await this.axiosInstance.post('/models/' + model, {
          inputs: this.preprocessText(text)
        });

        const result = this.processAnalysisResult(response.data, text);
        this.stats.successfulAnalyses++;
        
        return result;
      } catch (error) {
        console.warn(`Analysis attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt); // Exponential backoff
        } else {
          this.stats.failedAnalyses++;
          throw new Error(`Analysis failed after ${maxRetries} attempts: ${error.message}`);
        }
      }
    }
  }

  /**
   * Analyze multiple texts in batches
   */
  async analyzeBatch(texts, options = {}) {
    const batchSize = options.batchSize || this.options.batchSize;
    const results = [];
    
    console.log(`🔍 Starting batch analysis of ${texts.length} texts`);
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
      
      const batchPromises = batch.map(async (text, index) => {
        try {
          const result = await this.analyzeText(text, options);
          return {
            index: i + index,
            success: true,
            ...result
          };
        } catch (error) {
          return {
            index: i + index,
            success: false,
            text: text.substring(0, 100) + '...',
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await this.delay(1000);
      }
    }
    
    return this.rankResults(results.filter(r => r.success));
  }

  /**
   * Specialized analysis for Iranian legal documents
   */
  async analyzeLegalDocument(document, options = {}) {
    const text = typeof document === 'string' ? document : document.content || document.text;
    
    try {
      // First, get general classification
      const generalAnalysis = await this.analyzeText(text, {
        model: 'HooshvareLab/bert-fa-base-uncased-clf-persiannews'
      });

      // Extract legal entities and patterns
      const legalEntities = this.extractLegalEntities(text);
      
      // Determine document type based on content patterns
      const documentType = this.detectDocumentType(text);
      
      // Calculate legal relevance score
      const legalRelevanceScore = this.calculateLegalRelevance(text, legalEntities);
      
      // Sentiment analysis for legal context
      const sentiment = await this.analyzeLegalSentiment(text);
      
      return {
        ...generalAnalysis,
        legalAnalysis: {
          documentType,
          legalEntities,
          legalRelevanceScore,
          sentiment,
          extractedPatterns: this.extractLegalPatterns(text),
          keyTerms: this.extractKeyTerms(text),
          complexity: this.assessComplexity(text),
          language: this.detectLanguage(text)
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          textLength: text.length,
          processingTime: Date.now() - this.stats.startTime
        }
      };
    } catch (error) {
      console.error('Legal document analysis failed:', error);
      throw error;
    }
  }

  /**
   * Extract legal entities from Persian text
   */
  extractLegalEntities(text) {
    const entities = {
      persons: [],
      organizations: [],
      locations: [],
      dates: [],
      amounts: [],
      caseNumbers: [],
      laws: [],
      courts: []
    };

    // Persian name patterns
    const personPattern = /(?:آقای|خانم|دکتر|مهندس|استاد)\s+([آ-ی\s]{2,30})/gi;
    const matches = [...text.matchAll(personPattern)];
    entities.persons = [...new Set(matches.map(m => m[1].trim()))];

    // Organization patterns
    const orgPattern = /(شرکت|موسسه|سازمان|اداره|وزارت|دانشگاه)\s+([آ-ی\s]{3,50})/gi;
    const orgMatches = [...text.matchAll(orgPattern)];
    entities.organizations = [...new Set(orgMatches.map(m => `${m[1]} ${m[2]}`.trim()))];

    // Date patterns (Persian)
    const datePattern = /(\d{4}\/\d{1,2}\/\d{1,2}|[۰-۹]{4}\/[۰-۹]{1,2}\/[۰-۹]{1,2})/g;
    entities.dates = [...new Set(text.match(datePattern) || [])];

    // Amount patterns
    const amountPattern = /([\d,۰-۹]+)\s*(تومان|ریال|درهم)/gi;
    const amountMatches = [...text.matchAll(amountPattern)];
    entities.amounts = [...new Set(amountMatches.map(m => `${m[1]} ${m[2]}`))];

    // Case number patterns
    const casePattern = /(شماره|کلاسه)\s*[:\s]*([۰-۹0-9\-\/]+)/gi;
    const caseMatches = [...text.matchAll(casePattern)];
    entities.caseNumbers = [...new Set(caseMatches.map(m => m[2]))];

    // Law references
    const lawPattern = /(ماده|قانون|آیین\s*نامه)\s*([۰-۹0-9]+)/gi;
    const lawMatches = [...text.matchAll(lawPattern)];
    entities.laws = [...new Set(lawMatches.map(m => `${m[1]} ${m[2]}`))];

    // Court names
    const courtPattern = /(دادگاه|دیوان|شورا)\s+([آ-ی\s]{5,40})/gi;
    const courtMatches = [...text.matchAll(courtPattern)];
    entities.courts = [...new Set(courtMatches.map(m => `${m[1]} ${m[2]}`.trim()))];

    return entities;
  }

  /**
   * Detect document type based on content patterns
   */
  detectDocumentType(text) {
    const patterns = {
      'قرارداد': /قرارداد|طرفین|خریدار|فروشنده|اجاره\s*دهنده|اجاره\s*گیرنده/gi,
      'رای_دادگاه': /رای|حکم|دادگاه|قاضی|خواهان|خوانده|پرونده/gi,
      'قانون': /قانون|ماده|تبصره|فصل|باب/gi,
      'دادخواست': /دادخواست|خواهان|علیه|خوانده|تقاضا/gi,
      'وکالت_نامه': /وکالت\s*نامه|وکیل|موکل|نمایندگی/gi,
      'شکایت': /شکایت|متهم|شاکی|جرم/gi,
      'مصوبه': /مصوبه|تصویب|شورا|کمیسیون/gi,
      'بخشنامه': /بخشنامه|اطلاعیه|دستورالعمل/gi
    };

    let maxScore = 0;
    let detectedType = 'نامشخص';

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern) || [];
      const score = matches.length;
      
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    });

    return {
      type: detectedType,
      confidence: Math.min(maxScore / 10, 1), // Normalize to 0-1
      indicators: maxScore
    };
  }

  /**
   * Calculate legal relevance score
   */
  calculateLegalRelevance(text, entities) {
    let score = 0;
    
    // Base score from legal keywords
    const legalKeywords = [
      'قانون', 'ماده', 'تبصره', 'دادگاه', 'قاضی', 'وکیل', 'حکم', 'رای',
      'قرارداد', 'شکایت', 'دادخواست', 'پرونده', 'محکمه', 'دیوان'
    ];
    
    legalKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex) || [];
      score += matches.length * 2;
    });

    // Bonus for extracted entities
    score += entities.persons.length * 3;
    score += entities.caseNumbers.length * 5;
    score += entities.courts.length * 4;
    score += entities.laws.length * 4;
    score += entities.amounts.length * 2;

    // Normalize to 0-100 scale
    return Math.min(score, 100);
  }

  /**
   * Analyze sentiment in legal context
   */
  async analyzeLegalSentiment(text) {
    // Simplified sentiment analysis for legal documents
    const positiveWords = ['موافق', 'تایید', 'پذیرش', 'موفق', 'حل', 'توافق'];
    const negativeWords = ['مخالف', 'رد', 'انکار', 'نقض', 'تخلف', 'جرم'];
    const neutralWords = ['بررسی', 'مطالعه', 'تحقیق', 'بحث', 'مشورت'];

    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    positiveWords.forEach(word => {
      const matches = text.match(new RegExp(word, 'gi')) || [];
      positiveScore += matches.length;
    });

    negativeWords.forEach(word => {
      const matches = text.match(new RegExp(word, 'gi')) || [];
      negativeScore += matches.length;
    });

    neutralWords.forEach(word => {
      const matches = text.match(new RegExp(word, 'gi')) || [];
      neutralScore += matches.length;
    });

    const total = positiveScore + negativeScore + neutralScore;
    
    if (total === 0) {
      return { sentiment: 'neutral', confidence: 0 };
    }

    const sentiments = [
      { type: 'positive', score: positiveScore / total },
      { type: 'negative', score: negativeScore / total },
      { type: 'neutral', score: neutralScore / total }
    ];

    const dominant = sentiments.reduce((max, current) => 
      current.score > max.score ? current : max
    );

    return {
      sentiment: dominant.type,
      confidence: dominant.score,
      scores: {
        positive: positiveScore / total,
        negative: negativeScore / total,
        neutral: neutralScore / total
      }
    };
  }

  /**
   * Extract legal patterns
   */
  extractLegalPatterns(text) {
    const patterns = {
      articles: [...text.matchAll(/ماده\s*([۰-۹0-9]+)/gi)].map(m => m[1]),
      references: [...text.matchAll(/مطابق\s+(ماده|قانون)\s*([۰-۹0-9آ-ی\s]+)/gi)].map(m => m[2]),
      deadlines: [...text.matchAll(/(ظرف|تا|حداکثر)\s*([۰-۹0-9]+)\s*(روز|ماه|سال)/gi)].map(m => `${m[2]} ${m[3]}`),
      obligations: [...text.matchAll(/(متعهد|موظف|ملزم)\s+([آ-ی\s]{10,50})/gi)].map(m => m[2])
    };

    return patterns;
  }

  /**
   * Extract key terms using frequency analysis
   */
  extractKeyTerms(text) {
    const words = text.split(/\s+/).filter(word => 
      word.length > 3 && 
      !/^[0-9۰-۹]+$/.test(word) &&
      !['این', 'آن', 'که', 'در', 'با', 'از', 'به', 'تا'].includes(word)
    );

    const frequency = {};
    words.forEach(word => {
      const clean = word.replace(/[^\u0600-\u06FF\u0041-\u005A\u0061-\u007A]/g, '');
      if (clean.length > 3) {
        frequency[clean] = (frequency[clean] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }));
  }

  /**
   * Assess text complexity
   */
  assessComplexity(text) {
    const sentences = text.split(/[.!?؟]/);
    const words = text.split(/\s+/);
    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord = text.replace(/\s/g, '').length / words.length;
    
    let complexity = 'ساده';
    let score = 0;

    if (avgWordsPerSentence > 20) score += 2;
    if (avgCharsPerWord > 6) score += 2;
    if (text.includes('مطابق') || text.includes('بموجب')) score += 1;
    if (text.match(/[۰-۹0-9]{4}\/[۰-۹0-9]{1,2}\/[۰-۹0-9]{1,2}/g)) score += 1;

    if (score >= 4) complexity = 'پیچیده';
    else if (score >= 2) complexity = 'متوسط';

    return { level: complexity, score, factors: { avgWordsPerSentence, avgCharsPerWord } };
  }

  /**
   * Detect text language
   */
  detectLanguage(text) {
    const persianChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;

    const persianRatio = persianChars / totalChars;
    const englishRatio = englishChars / totalChars;

    if (persianRatio > 0.7) return 'fa';
    if (englishRatio > 0.7) return 'en';
    if (persianRatio > 0.3) return 'mixed';
    return 'unknown';
  }

  /**
   * Preprocess text for analysis
   */
  preprocessText(text) {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 512); // BERT token limit
  }

  /**
   * Process analysis result from Hugging Face API
   */
  processAnalysisResult(data, originalText) {
    const result = Array.isArray(data) ? data[0] : data;
    
    return {
      text: originalText.substring(0, 100) + '...',
      category: result.label,
      confidence: result.score,
      allScores: Array.isArray(data) ? data : [data],
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Rank results by confidence score
   */
  rankResults(results) {
    const ranked = results
      .filter(r => r.confidence > 0.1) // Filter low confidence results
      .sort((a, b) => b.confidence - a.confidence);

    // Update average confidence
    if (ranked.length > 0) {
      this.stats.averageConfidence = ranked.reduce((sum, r) => sum + r.confidence, 0) / ranked.length;
    }

    return {
      total: results.length,
      ranked: ranked,
      stats: this.getStats(),
      categories: this.getCategoryDistribution(ranked)
    };
  }

  /**
   * Get category distribution
   */
  getCategoryDistribution(results) {
    const distribution = {};
    results.forEach(result => {
      distribution[result.category] = (distribution[result.category] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get analysis statistics
   */
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      runtime: `${Math.round(runtime / 1000)}s`,
      successRate: this.stats.totalAnalyzed > 0 
        ? Math.round((this.stats.successfulAnalyses / this.stats.totalAnalyzed) * 100) 
        : 0
    };
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalAnalyzed: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      averageConfidence: 0,
      startTime: Date.now()
    };
  }
}

// Export singleton instance
export default new AIContentAnalyzer();

// Also export the class for custom instances
export { AIContentAnalyzer };