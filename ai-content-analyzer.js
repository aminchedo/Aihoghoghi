// ai-content-analyzer.js
import express from "express";
import cors from "cors";
import { HfInference } from "@huggingface/inference";
import rateLimit from "express-rate-limit";

const app = express();
const hf = new HfInference(process.env.HF_API_KEY || 'your_api_key_here');

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4173',
    'https://aminchedo.github.io',
    'https://aminchedo.github.io/Aihoghoghi',
    /^https:\/\/.*\.github\.io$/,
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.netlify\.app$/
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "بیش از حد مجاز درخواست ارسال شده است. لطفاً کمی صبر کنید."
  }
});

app.use('/analyze', limiter);

// Statistics tracking
let stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  startTime: Date.now(),
  categoryCounts: {},
  averageConfidence: 0
};

// Persian legal document model
const MODEL_NAME = "HooshvareLab/bert-fa-base-uncased-clf-persiannews";

// Helper function to preprocess Persian text
function preprocessPersianText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[‌]/g, ' ') // Replace ZWNJ with space
    .substring(0, 512); // BERT token limit
}

// Helper function to enhance results with legal context
function enhanceWithLegalContext(text, classification) {
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
    language: detectLanguage(text)
  };
}

// Helper function to detect language
function detectLanguage(text) {
  const persianChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  const persianRatio = persianChars / totalChars;
  
  if (persianRatio > 0.7) return 'fa';
  if (persianRatio > 0.3) return 'mixed';
  return 'en';
}

// Main analysis endpoint
app.post("/analyze", async (req, res) => {
  try {
    const { texts } = req.body;
    
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "لطفاً آرایه‌ای از متن‌ها ارسال کنید" 
      });
    }

    stats.totalRequests++;
    console.log(`🔍 تحلیل ${texts.length} متن با مدل ${MODEL_NAME}`);

    // Preprocess texts
    const processedTexts = texts.map(preprocessPersianText).filter(t => t.length > 0);
    
    if (processedTexts.length === 0) {
      return res.status(400).json({
        success: false,
        error: "هیچ متن معتبری برای تحلیل یافت نشد"
      });
    }

    // Get classification results from Hugging Face
    const results = await hf.textClassification({
      model: MODEL_NAME,
      inputs: processedTexts,
    });

    // Process and enhance results
    const enhancedResults = results.map((result, idx) => {
      const originalText = texts[idx];
      const classification = Array.isArray(result) ? result[0] : result;
      
      // Enhanced analysis
      const enhanced = enhanceWithLegalContext(originalText, classification);
      
      // Update statistics
      const category = enhanced.label;
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;

      return {
        text: originalText.substring(0, 150) + (originalText.length > 150 ? '...' : ''),
        fullText: originalText,
        category: category,
        score: enhanced.score,
        confidence: Math.round(enhanced.score * 100),
        legalType: enhanced.legalType,
        legalScore: enhanced.legalScore,
        entities: enhanced.entities,
        textLength: enhanced.textLength,
        language: enhanced.language,
        analyzedAt: new Date().toISOString(),
        allScores: Array.isArray(result) ? result : [result]
      };
    });

    // رتبه‌بندی و مرتب‌سازی بر اساس اعتماد
    const ranked = enhancedResults.sort((a, b) => b.score - a.score);

    // Update average confidence
    const totalConfidence = ranked.reduce((sum, r) => sum + r.score, 0);
    stats.averageConfidence = totalConfidence / ranked.length;
    stats.successfulRequests++;

    res.json({ 
      success: true,
      total: ranked.length,
      ranked,
      stats: getStats(),
      model: MODEL_NAME,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("تحلیل ناموفق:", err);
    stats.failedRequests++;
    
    // Handle specific HuggingFace errors
    let errorMessage = "خطا در تحلیل متن";
    if (err.message.includes('Rate limit')) {
      errorMessage = "محدودیت نرخ درخواست. لطفاً کمی صبر کنید";
    } else if (err.message.includes('Model')) {
      errorMessage = "خطا در بارگذاری مدل. لطفاً دوباره تلاش کنید";
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.round((Date.now() - stats.startTime) / 1000),
    model: MODEL_NAME,
    stats: getStats()
  });
});

// Statistics endpoint
app.get("/stats", (req, res) => {
  res.json({
    success: true,
    stats: getStats(),
    model: MODEL_NAME,
    categoryCounts: stats.categoryCounts
  });
});

// Helper function to get formatted stats
function getStats() {
  const runtime = Date.now() - stats.startTime;
  return {
    totalRequests: stats.totalRequests,
    successfulRequests: stats.successfulRequests,
    failedRequests: stats.failedRequests,
    successRate: stats.totalRequests > 0 
      ? Math.round((stats.successfulRequests / stats.totalRequests) * 100) 
      : 0,
    averageConfidence: Math.round(stats.averageConfidence * 100),
    runtime: Math.round(runtime / 1000) + 's',
    requestsPerMinute: Math.round((stats.totalRequests / (runtime / 60000)) || 0)
  };
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('خطای سرور:', err);
  stats.failedRequests++;
  res.status(500).json({
    success: false,
    error: 'خطای داخلی سرور',
    message: process.env.NODE_ENV === 'development' ? err.message : 'خطای غیرمنتظره'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 AI Content Analyzer running on http://localhost:${PORT}`);
  console.log(`🧠 Model: ${MODEL_NAME}`);
  console.log(`🔑 API Key: ${process.env.HF_API_KEY ? 'Configured' : 'Missing - Set HF_API_KEY environment variable'}`);
  console.log(`📊 Endpoints:`);
  console.log(`   POST /analyze - Analyze texts`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /stats - Statistics`);
});

export default app;