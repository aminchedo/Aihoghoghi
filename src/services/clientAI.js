/**
 * Persian Legal AI Service - Client-Side Implementation
 * Advanced AI-powered document classification and analysis using HuggingFace
 */

import { HfInference } from '@huggingface/inference'
import { pipeline, env } from '@xenova/transformers'

// HuggingFace API Configuration - Secure token handling
const HF_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN || 'demo_token'
const hf = new HfInference(HF_TOKEN)

// Configure Transformers.js
env.allowLocalModels = false
env.allowRemoteModels = true
env.remoteHost = 'https://huggingface.co/'
env.remotePathTemplate = '{model}/resolve/main/'

export class PersianLegalAI {
  constructor() {
    this.initialized = false
    this.models = {
      classifier: null,
      embeddings: null,
      summarization: null
    }
    
    // Performance metrics
    this.metrics = {
      totalClassifications: 0,
      totalEmbeddings: 0,
      averageProcessingTime: 0,
      successRate: 0,
      errors: []
    }

    // Model configurations
    this.modelConfigs = {
      classification: {
        model: 'HooshvareLab/bert-fa-base-uncased',
        fallback: 'microsoft/DialoGPT-medium',
        maxLength: 512
      },
      embeddings: {
        model: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
        fallback: 'sentence-transformers/all-MiniLM-L6-v2',
        dimension: 384
      },
      summarization: {
        model: 'csebuetnlp/mT5_multilingual_XLSum',
        fallback: 'facebook/bart-large-cnn',
        maxLength: 150,
        minLength: 50
      }
    }

    // Legal document classification categories
    this.legalCategories = {
      'LAW': { 
        persian: 'قانون', 
        description: 'قوانین مصوب مجلس شورای اسلامی',
        confidence_threshold: 0.7
      },
      'REGULATION': { 
        persian: 'مقررات', 
        description: 'مقررات اجرایی و آیین‌نامه‌ها',
        confidence_threshold: 0.6
      },
      'BYLAW': { 
        persian: 'آیین‌نامه', 
        description: 'آیین‌نامه‌های اجرایی',
        confidence_threshold: 0.6
      },
      'RESOLUTION': { 
        persian: 'مصوبه', 
        description: 'مصوبات شوراها و کمیسیون‌ها',
        confidence_threshold: 0.5
      },
      'VERDICT': { 
        persian: 'رأی', 
        description: 'آرای قضایی و دیوان‌ها',
        confidence_threshold: 0.8
      },
      'JUDGMENT': { 
        persian: 'حکم', 
        description: 'احکام دادگاه‌ها',
        confidence_threshold: 0.8
      },
      'CIRCULAR': { 
        persian: 'بخشنامه', 
        description: 'بخشنامه‌های اجرایی',
        confidence_threshold: 0.5
      },
      'GUIDELINE': { 
        persian: 'دستورالعمل', 
        description: 'دستورالعمل‌های عملیاتی',
        confidence_threshold: 0.5
      },
      'DRAFT': { 
        persian: 'پیش‌نویس', 
        description: 'پیش‌نویس‌های قوانین و مقررات',
        confidence_threshold: 0.4
      },
      'AMENDMENT': { 
        persian: 'اصلاحیه', 
        description: 'اصلاحیه‌های قوانین',
        confidence_threshold: 0.6
      },
      'UNKNOWN': { 
        persian: 'نامشخص', 
        description: 'دسته‌بندی نشده',
        confidence_threshold: 0.0
      }
    }

    // Cache for model predictions
    this.predictionCache = new Map()
    this.embeddingCache = new Map()
    this.maxCacheSize = 1000
  }

  /**
   * Initialize AI models and services
   */
  async initialize() {
    try {
      console.log('🤖 Initializing Persian Legal AI...')
      const startTime = performance.now()

      // Check if API token is available
      if (!HF_TOKEN || HF_TOKEN === 'demo_token') {
        console.warn('⚠️ HuggingFace token not found. Please set VITE_HUGGINGFACE_TOKEN environment variable.')
        console.warn('🔗 Get your token from: https://huggingface.co/settings/tokens')
      }

      // Test HuggingFace API connection
      await this.testHuggingFaceConnection()

      // Initialize local transformer models (optional, fallback to API)
      try {
        await this.initializeLocalModels()
      } catch (error) {
        console.warn('⚠️ Local model initialization failed, using API fallback:', error.message)
      }

      this.initialized = true
      const initTime = performance.now() - startTime
      
      console.log(`✅ Persian Legal AI initialized successfully in ${Math.round(initTime)}ms`)
      return true

    } catch (error) {
      console.error('❌ AI initialization failed:', error)
      this.initialized = false
      this.metrics.errors.push({
        type: 'initialization',
        error: error.message,
        timestamp: new Date().toISOString()
      })
      return false
    }
  }

  /**
   * Test HuggingFace API connection
   */
  async testHuggingFaceConnection() {
    try {
      const testResult = await hf.textClassification({
        model: this.modelConfigs.classification.model,
        inputs: 'این یک متن تست است'
      })
      
      console.log('🔗 HuggingFace API connection successful')
      return true
    } catch (error) {
      console.warn('⚠️ HuggingFace API test failed:', error.message)
      if (HF_TOKEN === 'demo_token') {
        throw new Error('Please set your HuggingFace API token in environment variables')
      }
      throw new Error('HuggingFace API connection failed')
    }
  }

  /**
   * Initialize local transformer models
   */
  async initializeLocalModels() {
    try {
      // Classification model
      this.models.classifier = await pipeline(
        'text-classification',
        this.modelConfigs.classification.model,
        { 
          quantized: false,
          progress_callback: (data) => {
            if (data.status === 'downloading') {
              console.log(`📥 Downloading classifier: ${data.name} (${data.progress}%)`)
            }
          }
        }
      )

      // Embeddings model
      this.models.embeddings = await pipeline(
        'feature-extraction',
        this.modelConfigs.embeddings.model,
        {
          quantized: true,
          progress_callback: (data) => {
            if (data.status === 'downloading') {
              console.log(`📥 Downloading embeddings: ${data.name} (${data.progress}%)`)
            }
          }
        }
      )

      console.log('🚀 Local models loaded successfully')
    } catch (error) {
      console.warn('Local model loading failed:', error.message)
      throw error
    }
  }

  /**
   * Classify legal document with advanced analysis
   */
  async classifyDocument(text, title = '', options = {}) {
    const startTime = performance.now()
    const {
      useCache = true,
      includeAnalysis = true,
      confidenceThreshold = 0.3
    } = options

    try {
      // Input validation and preprocessing
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid input text')
      }

      const fullText = `${title} ${text}`.trim()
      const processedText = this.normalizeText(fullText).slice(0, this.modelConfigs.classification.maxLength)
      
      // Check cache first
      const cacheKey = this.generateCacheKey(processedText)
      if (useCache && this.predictionCache.has(cacheKey)) {
        const cached = this.predictionCache.get(cacheKey)
        cached.cached = true
        cached.processing_time = Math.round(performance.now() - startTime)
        return cached
      }

      let result

      // Try local model first, then fallback to API
      if (this.initialized && this.models.classifier) {
        result = await this.classifyWithLocalModel(processedText)
      } else {
        result = await this.classifyWithAPI(processedText)
      }

      // Enhanced classification with rule-based analysis
      if (includeAnalysis) {
        const ruleBasedResult = this.performRuleBasedClassification(fullText, title)
        result = this.combineClassificationResults(result, ruleBasedResult)
      }

      // Apply confidence threshold
      if (result.confidence < confidenceThreshold) {
        result.category = 'UNKNOWN'
        result.low_confidence = true
      }

      // Add metadata
      result.processing_time = Math.round(performance.now() - startTime)
      result.model_version = this.modelConfigs.classification.model
      result.timestamp = new Date().toISOString()
      result.text_length = processedText.length
      result.language = this.detectLanguage(processedText)

      // Update metrics
      this.updateMetrics('classification', result.processing_time, true)

      // Cache result
      if (useCache) {
        this.addToCache(this.predictionCache, cacheKey, result)
      }

      return result

    } catch (error) {
      console.error('Document classification failed:', error)
      this.updateMetrics('classification', performance.now() - startTime, false)
      
      // Fallback to rule-based classification
      return this.fallbackClassification(text, title, error)
    }
  }

  /**
   * Classify using local transformer model
   */
  async classifyWithLocalModel(text) {
    const result = await this.models.classifier(text)
    
    return {
      category: this.mapLabelToCategory(result[0].label),
      confidence: Math.round(result[0].score * 100) / 100,
      method: 'local_transformer',
      raw_result: result[0]
    }
  }

  /**
   * Classify using HuggingFace API
   */
  async classifyWithAPI(text) {
    const result = await hf.textClassification({
      model: this.modelConfigs.classification.model,
      inputs: text
    })
    
    return {
      category: this.mapLabelToCategory(result[0].label),
      confidence: Math.round(result[0].score * 100) / 100,
      method: 'huggingface_api',
      raw_result: result[0]
    }
  }

  /**
   * Rule-based classification for Persian legal documents
   */
  performRuleBasedClassification(text, title) {
    const entities = this.extractLegalEntities(text)
    const nlpResult = this.classifyDocumentType(title, text)
    
    return {
      category: nlpResult.category,
      confidence: nlpResult.confidence,
      method: 'rule_based',
      entities: entities,
      matched_terms: nlpResult.entities?.map(e => e.term) || []
    }
  }

  /**
   * Combine AI and rule-based classification results
   */
  combineClassificationResults(aiResult, ruleResult) {
    // Weight the results: 70% AI, 30% rule-based
    const aiWeight = 0.7
    const ruleWeight = 0.3

    let finalCategory = aiResult.category
    let finalConfidence = aiResult.confidence * aiWeight

    // If rule-based has high confidence, consider it
    if (ruleResult.confidence > 0.6) {
      if (ruleResult.category === aiResult.category) {
        // Both agree, boost confidence
        finalConfidence = Math.min(0.95, aiResult.confidence + ruleResult.confidence * 0.2)
      } else {
        // Disagreement, use weighted average
        const combinedConfidence = (aiResult.confidence * aiWeight) + (ruleResult.confidence * ruleWeight)
        
        if (ruleResult.confidence > aiResult.confidence) {
          finalCategory = ruleResult.category
          finalConfidence = combinedConfidence
        }
      }
    }

    return {
      ...aiResult,
      category: finalCategory,
      confidence: Math.round(finalConfidence * 100) / 100,
      method: 'hybrid',
      rule_based_result: ruleResult,
      agreement: aiResult.category === ruleResult.category
    }
  }

  /**
   * Fallback classification when AI fails
   */
  fallbackClassification(text, title, error) {
    const ruleResult = this.performRuleBasedClassification(text, title)
    
    return {
      category: ruleResult.category || 'UNKNOWN',
      confidence: Math.max(0.1, ruleResult.confidence || 0),
      method: 'fallback_rule_based',
      error: error.message,
      entities: ruleResult.entities || [],
      processing_time: 0,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Generate document embeddings for semantic search
   */
  async generateEmbeddings(text, options = {}) {
    const startTime = performance.now()
    const { useCache = true, maxLength = 512 } = options

    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid input text for embeddings')
      }

      const processedText = this.normalizeText(text).slice(0, maxLength)
      const cacheKey = this.generateCacheKey(processedText)

      // Check cache
      if (useCache && this.embeddingCache.has(cacheKey)) {
        const cached = this.embeddingCache.get(cacheKey)
        return {
          embedding: cached,
          cached: true,
          processing_time: Math.round(performance.now() - startTime)
        }
      }

      let embedding

      // Try local model first
      if (this.initialized && this.models.embeddings) {
        const result = await this.models.embeddings(processedText)
        embedding = Array.from(result.data)
      } else {
        // Use HuggingFace API
        const result = await hf.featureExtraction({
          model: this.modelConfigs.embeddings.model,
          inputs: processedText
        })
        embedding = Array.from(result)
      }

      // Normalize embedding vector
      embedding = this.normalizeVector(embedding)

      // Update metrics
      this.updateMetrics('embeddings', performance.now() - startTime, true)

      // Cache result
      if (useCache) {
        this.addToCache(this.embeddingCache, cacheKey, embedding)
      }

      return {
        embedding,
        dimension: embedding.length,
        model: this.modelConfigs.embeddings.model,
        processing_time: Math.round(performance.now() - startTime),
        cached: false
      }

    } catch (error) {
      console.error('Embedding generation failed:', error)
      this.updateMetrics('embeddings', performance.now() - startTime, false)
      
      // Return zero vector as fallback
      return {
        embedding: new Array(this.modelConfigs.embeddings.dimension).fill(0),
        error: error.message,
        fallback: true,
        processing_time: Math.round(performance.now() - startTime)
      }
    }
  }

  /**
   * Utility methods
   */
  
  mapLabelToCategory(label) {
    // Map model output labels to our category system
    const labelMappings = {
      'POSITIVE': 'LAW',
      'NEGATIVE': 'UNKNOWN',
      'NEUTRAL': 'REGULATION'
    }
    
    return labelMappings[label] || label
  }

  generateCacheKey(text) {
    // Simple hash function for cache keys
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  addToCache(cache, key, value) {
    // Implement LRU cache logic
    if (cache.size >= this.maxCacheSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    cache.set(key, value)
  }

  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector
  }

  updateMetrics(operation, processingTime, success) {
    if (operation === 'classification') {
      this.metrics.totalClassifications++
    } else if (operation === 'embeddings') {
      this.metrics.totalEmbeddings++
    }

    // Update average processing time
    const totalOperations = this.metrics.totalClassifications + this.metrics.totalEmbeddings
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (totalOperations - 1) + processingTime) / totalOperations

    // Update success rate
    const successfulOps = success ? 1 : 0
    this.metrics.successRate = 
      (this.metrics.successRate * (totalOperations - 1) + successfulOps) / totalOperations

    if (!success) {
      this.metrics.errors.push({
        operation,
        timestamp: new Date().toISOString(),
        processing_time: processingTime
      })
    }
  }

  /**
   * Get AI service statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      initialized: this.initialized,
      cache_stats: {
        prediction_cache_size: this.predictionCache.size,
        embedding_cache_size: this.embeddingCache.size,
        max_cache_size: this.maxCacheSize
      },
      model_configs: this.modelConfigs,
      legal_categories: Object.keys(this.legalCategories).length
    }
  }
}

// Export singleton instance
export const persianAI = new PersianLegalAI()

// Auto-initialize when module loads
persianAI.initialize().then(success => {
  if (success) {
    console.log('🚀 Persian AI ready for use')
  } else {
    console.log('⚡ Persian AI running in fallback mode')
  }
}).catch(error => {
  console.error('🚨 Persian AI initialization error:', error)
})

// Add missing helper methods to PersianLegalAI class
PersianLegalAI.prototype.normalizeText = function(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[‌]/g, ' ') // Replace ZWNJ with space
    .normalize('NFD');
};

PersianLegalAI.prototype.detectLanguage = function(text) {
  const persianChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  const persianRatio = persianChars / totalChars;
  
  if (persianRatio > 0.7) return 'fa';
  if (persianRatio > 0.3) return 'mixed';
  return 'en';
};

PersianLegalAI.prototype.extractLegalEntities = function(text) {
  return {
    persons: [...(text.match(/(?:آقای|خانم|دکتر)\s+([آ-ی\s]{2,30})/gi) || [])].slice(0, 3),
    dates: [...(text.match(/\d{4}\/\d{1,2}\/\d{1,2}|[۰-۹]{4}\/[۰-۹]{1,2}\/[۰-۹]{1,2}/g) || [])].slice(0, 3),
    amounts: [...(text.match(/([\d,۰-۹]+)\s*(تومان|ریال)/gi) || [])].slice(0, 2)
  };
};

PersianLegalAI.prototype.classifyDocumentType = function(title, text) {
  const legalPatterns = {
    'قرارداد': /قرارداد|طرفین|خریدار|فروشنده|اجاره/gi,
    'رای_دادگاه': /رای|حکم|دادگاه|قاضی|خواهان|خوانده/gi,
    'قانون': /قانون|ماده|تبصره|فصل|باب/gi,
    'دادخواست': /دادخواست|خواهان|علیه|خوانده/gi,
    'شکایت': /شکایت|متهم|شاکی|جرم/gi,
    'مصوبه': /مصوبه|تصویب|شورا|کمیسیون/gi
  };

  let maxScore = 0;
  let category = 'عمومی';
  
  Object.entries(legalPatterns).forEach(([type, pattern]) => {
    const matches = (title + ' ' + text).match(pattern) || [];
    if (matches.length > maxScore) {
      maxScore = matches.length;
      category = type;
    }
  });

  return {
    category,
    confidence: Math.min(maxScore * 0.1, 0.95)
  };
};

export default PersianLegalAI