/**
 * Centralized API Configuration for Iranian Legal Archive
 * Handles environment-specific endpoint configuration
 */

/**
 * Determine the base URL based on environment
 */
function determineBaseUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // GitHub Pages deployment
    if (hostname.includes('github.io')) {
      return 'https://your-backend-domain.com/api';
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:7860/api';
    }
    
    // Production deployment
    if (hostname.includes('railway.app') || hostname.includes('vercel.app')) {
      return `https://${hostname}/api`;
    }
  }
  
  // Default fallback
  return 'http://localhost:7860/api';
}

/**
 * Determine WebSocket URL based on environment
 */
function determineWebSocketUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // GitHub Pages deployment
    if (hostname.includes('github.io')) {
      return 'wss://your-backend-domain.com/ws';
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:7860/ws';
    }
    
    // Production deployment
    if (hostname.includes('railway.app') || hostname.includes('vercel.app')) {
      return `${protocol}//${hostname}/ws`;
    }
  }
  
  // Default fallback
  return 'ws://localhost:7860/ws';
}

/**
 * API Endpoints Configuration
 */
export const API_ENDPOINTS = {
  BASE: determineBaseUrl(),
  WEB_SOCKET: determineWebSocketUrl(),
  
  // Document endpoints
  DOCUMENTS: '/documents',
  SEARCH: '/search',
  SEMANTIC_SEARCH: '/semantic-search',
  NAFAQE_SEARCH: '/nafaqe-search',
  PROCESS: '/process',
  STATUS: '/status',
  STATS: '/stats',
  
  // Model endpoints
  MODEL_LOAD: '/models/load',
  MODEL_STATUS: '/models/status',
  
  // Proxy endpoints
  PROXY_STATUS: '/proxies/status',
  PROXY_ROTATE: '/proxies/rotate',
  
  // System endpoints
  SYSTEM_METRICS: '/system/metrics',
  HEALTH: '/health'
};

/**
 * AI Models Configuration
 */
export const AI_MODELS = {
  classification: 'HooshvareLab/bert-fa-base-uncased',
  sentiment: 'HooshvareLab/bert-fa-base-uncased-sentiment-digikala',
  ner: 'HooshvareLab/bert-fa-base-uncased-ner-peyma',
  summarization: 'csebuetnlp/mT5_multilingual_XLSum'
};

/**
 * Iranian DNS Servers for Proxy System
 */
export const IRANIAN_DNS_SERVERS = [
  '178.22.122.100', '185.51.200.2', '78.157.42.101', '78.157.42.100',
  '10.202.10.202', '10.202.10.102', '172.29.0.100', '172.29.2.100',
  '185.55.226.26', '185.55.225.25', '78.109.23.1', '94.182.190.241',
  '37.156.28.2', '185.143.232.50', '195.191.56.49', '91.107.6.115',
  '185.142.239.50', '78.109.23.134', '185.228.168.9', '185.228.169.9',
  '8.8.8.8', '1.1.1.1'
];

/**
 * Environment detection utilities
 */
export const ENVIRONMENT = {
  isDevelopment: () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
    return false;
  },
  
  isProduction: () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname.includes('github.io') || 
             window.location.hostname.includes('railway.app') ||
             window.location.hostname.includes('vercel.app');
    }
    return false;
  },
  
  isGitHubPages: () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname.includes('github.io');
    }
    return false;
  }
};

/**
 * Configuration validation
 */
export function validateConfiguration() {
  const issues = [];
  
  if (!API_ENDPOINTS.BASE) {
    issues.push('Base API URL is not configured');
  }
  
  if (!API_ENDPOINTS.WEB_SOCKET) {
    issues.push('WebSocket URL is not configured');
  }
  
  if (issues.length > 0) {
    console.warn('Configuration issues detected:', issues);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get full API URL for an endpoint
 */
export function getApiUrl(endpoint) {
  return `${API_ENDPOINTS.BASE}${endpoint}`;
}

/**
 * Get WebSocket URL with fallback
 */
export function getWebSocketUrl() {
  return API_ENDPOINTS.WEB_SOCKET;
}

// Validate configuration on import
validateConfiguration();

export default API_ENDPOINTS;