// Production API Endpoints - REAL SERVICES ONLY
export const PRODUCTION_ENDPOINTS = {
  BASE: 'https://api.iranian-legal-archive.com/v1',
  WS: 'wss://api.iranian-legal-archive.com/ws',
  
  // Document processing endpoints
  PROCESS_DOCUMENT: '/documents/process',
  BATCH_PROCESS: '/documents/batch-process',
  SEARCH: '/documents/search',
  SEMANTIC_SEARCH: '/documents/semantic-search',
  ADVANCED_SEARCH: '/documents/advanced-search',
  GET_DOCUMENT: '/documents/:id',
  UPDATE_DOCUMENT: '/documents/:id',
  DELETE_DOCUMENT: '/documents/:id',
  
  // AI Services endpoints
  CLASSIFY: '/ai/classify',
  SENTIMENT: '/ai/sentiment',
  NER: '/ai/ner',
  SUMMARIZE: '/ai/summarize',
  BATCH_ANALYZE: '/ai/batch-analyze',
  AI_MODELS: '/ai/models',
  AI_STATUS: '/ai/status',
  
  // Scraping endpoints
  SCRAPE_URL: '/scraping/scrape',
  SCRAPING_STATUS: '/scraping/status',
  SCRAPING_HISTORY: '/scraping/history',
  BATCH_SCRAPE: '/scraping/batch',
  
  // System management endpoints
  PROXY_STATUS: '/system/proxies/status',
  DNS_STATUS: '/system/dns/status',
  SYSTEM_METRICS: '/system/metrics/live',
  HEALTH_CHECK: '/system/health',
  CONFIG_UPDATE: '/system/config/update',
  SYSTEM_STATUS: '/system/status',
  
  // User management endpoints
  USER_LOGIN: '/auth/login',
  USER_LOGOUT: '/auth/logout',
  USER_PROFILE: '/auth/profile',
  USER_SESSIONS: '/auth/sessions',
  
  // Analytics endpoints
  ANALYTICS_DASHBOARD: '/analytics/dashboard',
  ANALYTICS_REPORTS: '/analytics/reports',
  ANALYTICS_EXPORT: '/analytics/export',
  
  // File management endpoints
  UPLOAD_FILE: '/files/upload',
  DOWNLOAD_FILE: '/files/download/:id',
  FILE_STATUS: '/files/status/:id',
  DELETE_FILE: '/files/:id'
};

// WebSocket event types for real-time communication
export const WEBSOCKET_EVENTS = {
  DOCUMENT_PROCESSING_UPDATE: 'document_processing_update',
  AI_ANALYSIS_COMPLETE: 'ai_analysis_complete',
  SYSTEM_METRICS_UPDATE: 'system_metrics_update',
  PROXY_ROTATION_EVENT: 'proxy_rotation_event',
  SCRAPING_PROGRESS: 'scraping_progress',
  USER_SESSION_UPDATE: 'user_session_update',
  SYSTEM_ALERT: 'system_alert',
  MAINTENANCE_NOTICE: 'maintenance_notice'
};

// API response status codes
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Rate limiting configuration
export const RATE_LIMITS = {
  DEFAULT: { requests: 100, window: 60000 }, // 100 requests per minute
  AI_ANALYSIS: { requests: 10, window: 60000 }, // 10 AI requests per minute
  SCRAPING: { requests: 50, window: 60000 }, // 50 scraping requests per minute
  UPLOAD: { requests: 20, window: 60000 } // 20 uploads per minute
};

// Default headers for all API requests
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Client-Version': '2.0.0',
  'X-Client-Type': 'web-ui'
};