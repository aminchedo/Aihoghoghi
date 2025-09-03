const { pipeline, AutoTokenizer, AutoModel } = require('@xenova/transformers');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class PersianBertService {
  constructor() {
    this.model = null;
    this.tokenizer = null;
    this.isInitialized = false;
    this.modelPath = process.env.AI_MODEL_PATH || './models/persian-bert-legal';
    this.cacheDir = process.env.AI_CACHE_DIR || './ai_cache';
    this.maxSequenceLength = 512;
    this.batchSize = 8;
    this.modelConfig = {
      modelName: 'HooshvareLab/bert-base-parsbert-uncased',
      revision: 'main',
      quantized: false
    };
  }

  async initialize() {
    try {
      console.log('🤖 Initializing Persian BERT service...');
      
      // Create cache directory if it doesn't exist
      await this.ensureCacheDirectory();
      
      // Download and load the model
      await this.downloadModel();
      
      // Initialize the pipeline
      this.model = await pipeline('feature-extraction', this.modelPath, {
        quantized: this.modelConfig.quantized,
        revision: this.modelConfig.revision
      });
      
      // Load tokenizer
      this.tokenizer = await AutoTokenizer.from_pretrained(this.modelPath);
      
      this.isInitialized = true;
      console.log('✅ Persian BERT service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Persian BERT service:', error);
      throw error;
    }
  }

  async ensureCacheDirectory() {
    try {
      await fs.access(this.cacheDir);
    } catch {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log(`📁 Created AI cache directory: ${this.cacheDir}`);
    }
  }

  async downloadModel() {
    const modelExists = await this.checkModelExists();
    if (!modelExists) {
      console.log('📥 Downloading Persian BERT model...');
      await this.downloadModelFiles();
    } else {
      console.log('✅ Model already exists locally');
    }
  }

  async checkModelExists() {
    try {
      const configPath = path.join(this.modelPath, 'config.json');
      const modelPath = path.join(this.modelPath, 'pytorch_model.bin');
      const tokenizerPath = path.join(this.modelPath, 'tokenizer.json');
      
      await fs.access(configPath);
      await fs.access(modelPath);
      await fs.access(tokenizerPath);
      
      return true;
    } catch {
      return false;
    }
  }

  async downloadModelFiles() {
    try {
      // Download model files from Hugging Face
      const modelFiles = [
        'config.json',
        'pytorch_model.bin',
        'tokenizer.json',
        'tokenizer_config.json',
        'vocab.txt'
      ];

      for (const file of modelFiles) {
        const url = `https://huggingface.co/${this.modelConfig.modelName}/resolve/${this.modelConfig.revision}/${file}`;
        const filePath = path.join(this.modelPath, file);
        
        console.log(`📥 Downloading ${file}...`);
        await this.downloadFile(url, filePath);
      }
      
      console.log('✅ Model files downloaded successfully');
    } catch (error) {
      console.error('❌ Failed to download model files:', error);
      throw error;
    }
  }

  async downloadFile(url, filePath) {
    const https = require('https');
    
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(filePath);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Delete the file async
          reject(err);
        });
      }).on('error', reject);
    });
  }

  async analyzeDocument(content, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Persian BERT service not initialized');
    }

    try {
      const startTime = Date.now();
      
      // Preprocess content
      const processedContent = this.preprocessContent(content);
      
      // Generate embeddings
      const embeddings = await this.generateEmbeddings(processedContent);
      
      // Extract legal entities
      const entities = await this.extractLegalEntities(processedContent);
      
      // Classify document type
      const classification = await this.classifyDocument(processedContent);
      
      // Extract legal topics
      const topics = await this.extractLegalTopics(processedContent);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        embeddings: embeddings,
        entities: entities,
        classification: classification,
        topics: topics,
        processing_time_ms: processingTime,
        model_info: {
          name: this.modelConfig.modelName,
          version: this.modelConfig.revision,
          language: 'fa'
        }
      };
    } catch (error) {
      console.error('Document analysis error:', error);
      throw error;
    }
  }

  preprocessContent(content) {
    // Clean and normalize Persian text
    let processed = content
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Truncate if too long
    if (processed.length > this.maxSequenceLength * 4) {
      processed = processed.substring(0, this.maxSequenceLength * 4);
    }
    
    return processed;
  }

  async generateEmbeddings(content) {
    try {
      const features = await this.model(content, {
        pooling: 'mean',
        normalize: true,
        max_length: this.maxSequenceLength
      });
      
      return {
        vector: Array.from(features.data),
        dimension: features.data.length,
        pooling_method: 'mean',
        normalized: true
      };
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  async extractLegalEntities(content) {
    try {
      // Legal entity patterns for Persian text
      const entityPatterns = {
        law_numbers: /قانون\s+(?:شماره\s+)?(\d+)/g,
        article_numbers: /ماده\s+(\d+)/g,
        court_names: /(?:دادگاه|دیوان)\s+([^\s]+)/g,
        ministry_names: /وزارت\s+([^\s]+)/g,
        dates: /(\d{4}\/\d{2}\/\d{2})/g,
        legal_terms: /(?:حقوق|قانون|مقررات|آیین\s+نامه|تصویب\s+نامه)/g
      };
      
      const entities = {};
      
      for (const [entityType, pattern] of Object.entries(entityPatterns)) {
        const matches = content.match(pattern);
        if (matches) {
          entities[entityType] = matches;
        }
      }
      
      return entities;
    } catch (error) {
      console.error('Entity extraction error:', error);
      return {};
    }
  }

  async classifyDocument(content) {
    try {
      // Legal document classification based on content patterns
      const classifications = {
        'constitutional': /(?:قانون\s+اساسی|متمم|اصل\s+\d+)/i,
        'civil': /(?:قانون\s+مدنی|عقود|معاملات|ارث|وصیت)/i,
        'criminal': /(?:قانون\s+کیفری|مجازات|جرایم|محکومیت)/i,
        'commercial': /(?:قانون\s+تجارت|شرکت|اسناد\s+تجاری|ورشکستگی)/i,
        'administrative': /(?:قانون\s+اداری|مقررات\s+دولتی|خدمات\s+مدنی)/i,
        'family': /(?:قانون\s+خانواده|ازدواج|طلاق|نفقه|حضانت)/i,
        'labor': /(?:قانون\s+کار|کارگر|کارفرما|حقوق\s+کار)/i,
        'tax': /(?:قانون\s+مالیات|مالیات|عوارض|گمرک)/i
      };
      
      const scores = {};
      let totalScore = 0;
      
      for (const [category, pattern] of Object.entries(classifications)) {
        const matches = content.match(pattern);
        const score = matches ? matches.length : 0;
        scores[category] = score;
        totalScore += score;
      }
      
      // Normalize scores
      const normalizedScores = {};
      for (const [category, score] of Object.entries(scores)) {
        normalizedScores[category] = totalScore > 0 ? score / totalScore : 0;
      }
      
      // Get top classification
      const topClassification = Object.entries(normalizedScores)
        .sort(([,a], [,b]) => b - a)[0];
      
      return {
        primary_category: topClassification[0],
        confidence: topClassification[1],
        all_scores: normalizedScores
      };
    } catch (error) {
      console.error('Document classification error:', error);
      return {
        primary_category: 'unknown',
        confidence: 0,
        all_scores: {}
      };
    }
  }

  async extractLegalTopics(content) {
    try {
      // Extract legal topics based on Persian legal terminology
      const topicPatterns = [
        { topic: 'حقوق مدنی', patterns: ['عقود', 'معاملات', 'ارث', 'وصیت', 'مالکیت'] },
        { topic: 'حقوق کیفری', patterns: ['مجازات', 'جرایم', 'محکومیت', 'بزهکاری'] },
        { topic: 'حقوق تجارت', patterns: ['شرکت', 'اسناد تجاری', 'ورشکستگی', 'تجارت'] },
        { topic: 'حقوق خانواده', patterns: ['ازدواج', 'طلاق', 'نفقه', 'حضانت', 'مهریه'] },
        { topic: 'حقوق کار', patterns: ['کارگر', 'کارفرما', 'حقوق کار', 'مزد', 'ساعات کار'] },
        { topic: 'مالیات', patterns: ['مالیات', 'عوارض', 'گمرک', 'درآمد', 'مشمول'] },
        { topic: 'قانون اساسی', patterns: ['قانون اساسی', 'متمم', 'اصل', 'حقوق ملت'] },
        { topic: 'آیین دادرسی', patterns: ['آیین دادرسی', 'دعوا', 'رسیدگی', 'قضایی'] }
      ];
      
      const topics = [];
      
      for (const { topic, patterns } of topicPatterns) {
        for (const pattern of patterns) {
          if (content.includes(pattern)) {
            topics.push(topic);
            break;
          }
        }
      }
      
      return [...new Set(topics)]; // Remove duplicates
    } catch (error) {
      console.error('Topic extraction error:', error);
      return [];
    }
  }

  async batchAnalyze(documents, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Persian BERT service not initialized');
    }

    try {
      const results = [];
      const batchSize = options.batchSize || this.batchSize;
      
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const batchPromises = batch.map(doc => this.analyzeDocument(doc.content, doc.options));
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          if (result.status === 'fulfilled') {
            results.push({
              document_id: batch[j].id,
              ...result.value
            });
          } else {
            results.push({
              document_id: batch[j].id,
              success: false,
              error: result.reason.message
            });
          }
        }
        
        // Add delay between batches to prevent overload
        if (i + batchSize < documents.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return results;
    } catch (error) {
      console.error('Batch analysis error:', error);
      throw error;
    }
  }

  async getModelInfo() {
    if (!this.isInitialized) {
      throw new Error('Persian BERT service not initialized');
    }

    try {
      const modelFiles = await fs.readdir(this.modelPath);
      const modelSize = await this.calculateModelSize();
      
      return {
        name: this.modelConfig.modelName,
        version: this.modelConfig.revision,
        language: 'fa',
        model_path: this.modelPath,
        files: modelFiles,
        size_mb: modelSize,
        max_sequence_length: this.maxSequenceLength,
        batch_size: this.batchSize,
        initialized: this.isInitialized,
        cache_directory: this.cacheDir
      };
    } catch (error) {
      console.error('Failed to get model info:', error);
      throw error;
    }
  }

  async calculateModelSize() {
    try {
      const modelPath = path.join(this.modelPath, 'pytorch_model.bin');
      const stats = await fs.stat(modelPath);
      return Math.round(stats.size / (1024 * 1024)); // Convert to MB
    } catch {
      return 0;
    }
  }

  async cleanup() {
    try {
      if (this.model) {
        this.model = null;
      }
      if (this.tokenizer) {
        this.tokenizer = null;
      }
      this.isInitialized = false;
      console.log('🧹 Persian BERT service cleaned up');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Health check method
  async healthCheck() {
    return {
      service: 'Persian BERT AI Service',
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      model_loaded: !!this.model,
      tokenizer_loaded: !!this.tokenizer,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
let persianBertService = null;

async function getPersianBertService() {
  if (!persianBertService) {
    persianBertService = new PersianBertService();
    await persianBertService.initialize();
  }
  return persianBertService;
}

module.exports = {
  PersianBertService,
  getPersianBertService
};