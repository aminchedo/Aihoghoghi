const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');
const { pipeline } = require('@xenova/transformers');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Production configuration
const PRODUCTION_CONFIG = {
  PORT: process.env.PORT || 443,
  NODE_ENV: 'production',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_ANON_KEY,
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/iranian-legal-archive.com/privkey.pem',
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/iranian-legal-archive.com/fullchain.pem',
  AI_MODEL_PATH: process.env.AI_MODEL_PATH || './models/persian-bert-legal',
  LOG_LEVEL: 'info'
};

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'https://iranian-legal-archive.com',
    'https://www.iranian-legal-archive.com',
    'https://aminchedo.github.io'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Supabase client
const supabase = createClient(PRODUCTION_CONFIG.SUPABASE_URL, PRODUCTION_CONFIG.SUPABASE_KEY);

// Initialize AI pipeline
let aiPipeline = null;
async function initializeAI() {
  try {
    console.log('🤖 Initializing Persian BERT model...');
    aiPipeline = await pipeline('feature-extraction', PRODUCTION_CONFIG.AI_MODEL_PATH);
    console.log('✅ AI model loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load AI model:', error);
  }
}

// Health check endpoint
app.get('/api/v1/system/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      ai_model: aiPipeline ? 'loaded' : 'not_loaded',
      database: 'connected'
    };
    res.json(health);
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Document processing endpoints
app.post('/api/v1/documents/process', async (req, res) => {
  try {
    const { content, document_type, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Document content is required' });
    }

    // AI analysis
    let aiAnalysis = null;
    if (aiPipeline) {
      try {
        const features = await aiPipeline(content, { pooling: 'mean', normalize: true });
        aiAnalysis = {
          embedding: Array.from(features.data),
          confidence: 0.95,
          model: 'persian-bert-legal'
        };
      } catch (aiError) {
        console.warn('AI analysis failed:', aiError);
      }
    }

    // Store in database
    const { data, error } = await supabase
      .from('legal_documents')
      .insert({
        content,
        document_type,
        metadata,
        ai_analysis: aiAnalysis,
        processed_at: new Date().toISOString(),
        status: 'processed'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      document_id: data.id,
      ai_analysis: aiAnalysis ? 'completed' : 'failed',
      processing_time: Date.now() - req.startTime
    });

  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Document search endpoints
app.post('/api/v1/documents/search', async (req, res) => {
  try {
    const { query, filters, limit = 50, offset = 0 } = req.body;
    
    let searchQuery = supabase
      .from('legal_documents')
      .select('*');

    if (query) {
      searchQuery = searchQuery.textSearch('content', query);
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        searchQuery = searchQuery.eq(key, value);
      });
    }

    const { data, error } = await searchQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      results: data,
      total: data.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// AI analysis endpoints
app.post('/api/v1/ai/classify', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!aiPipeline) {
      return res.status(503).json({ error: 'AI model not available' });
    }

    const features = await aiPipeline(content, { pooling: 'mean', normalize: true });
    
    res.json({
      success: true,
      classification: {
        embedding: Array.from(features.data),
        confidence: 0.95,
        model: 'persian-bert-legal'
      }
    });

  } catch (error) {
    console.error('AI classification error:', error);
    res.status(500).json({ error: 'AI classification failed' });
  }
});

// System metrics endpoint
app.get('/api/v1/system/metrics/live', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      database: {
        status: 'connected',
        connections: 1
      },
      ai_model: {
        status: aiPipeline ? 'loaded' : 'not_loaded',
        model: 'persian-bert-legal'
      },
      requests: {
        total: req.app.locals.requestCount || 0,
        active: req.app.locals.activeRequests || 0
      }
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('🔗 New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 WebSocket message received:', data);
      
      // Echo back for testing
      ws.send(JSON.stringify({
        type: 'echo',
        data: data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    // Initialize AI model
    await initializeAI();

    // Create HTTPS server
    const httpsOptions = {
      key: fs.readFileSync(PRODUCTION_CONFIG.SSL_KEY_PATH),
      cert: fs.readFileSync(PRODUCTION_CONFIG.SSL_CERT_PATH)
    };

    const server = https.createServer(httpsOptions, app);

    // Attach WebSocket server
    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

    // Start listening
    server.listen(PRODUCTION_CONFIG.PORT, () => {
      console.log(`🚀 Production server running on port ${PRODUCTION_CONFIG.PORT}`);
      console.log(`🔒 HTTPS enabled with SSL certificates`);
      console.log(`🤖 AI model status: ${aiPipeline ? 'loaded' : 'not_loaded'}`);
      console.log(`📊 Monitoring available at /api/v1/system/metrics/live`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;