/**
 * Security utilities for Iranian Legal Archive System
 */

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for inline scripts in index.html
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net',
    'https://fonts.googleapis.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
    'https://fonts.googleapis.com',
    'https://cdnjs.cloudflare.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'https://cdnjs.cloudflare.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:'
  ],
  'connect-src': [
    "'self'",
    'ws:',
    'wss:',
    'http://127.0.0.1:7860',
    'https://api.iranian-legal-archive.com'
  ],
  'media-src': [
    "'self'",
    'data:',
    'blob:'
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
}

// Generate CSP header string
export const generateCSPHeader = () => {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive
      }
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')
}

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input
  }

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// XSS protection
export const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') {
    return unsafe
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// CSRF token management
export class CSRFManager {
  constructor() {
    this.token = null
    this.tokenExpiry = null
  }

  async getToken() {
    if (!this.token || this.isTokenExpired()) {
      await this.refreshToken()
    }
    return this.token
  }

  async refreshToken() {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        this.token = data.token
        this.tokenExpiry = Date.now() + (data.expires_in * 1000)
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error)
    }
  }

  isTokenExpired() {
    return !this.tokenExpiry || Date.now() > this.tokenExpiry
  }

  getTokenHeader() {
    return this.token ? { 'X-CSRF-Token': this.token } : {}
  }
}

// Rate limiting
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }

  isAllowed(identifier) {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Clean up old entries
    for (const [key, timestamp] of this.requests.entries()) {
      if (timestamp < windowStart) {
        this.requests.delete(key)
      }
    }

    // Count requests in current window
    const currentRequests = Array.from(this.requests.values())
      .filter(timestamp => timestamp > windowStart).length

    if (currentRequests >= this.maxRequests) {
      return false
    }

    // Record this request
    this.requests.set(identifier, now)
    return true
  }

  getRemainingRequests(identifier) {
    const now = Date.now()
    const windowStart = now - this.windowMs

    const currentRequests = Array.from(this.requests.values())
      .filter(timestamp => timestamp > windowStart).length

    return Math.max(0, this.maxRequests - currentRequests)
  }
}

// Secure headers configuration
export const SECURE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
}

// API request security
export class SecureAPIClient {
  constructor(baseURL) {
    this.baseURL = baseURL
    this.csrfManager = new CSRFManager()
    this.rateLimiter = new RateLimiter()
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const requestId = `${endpoint}_${Date.now()}`

    // Check rate limit
    if (!this.rateLimiter.isAllowed(requestId)) {
      throw new Error('Rate limit exceeded')
    }

    // Get CSRF token for state-changing requests
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
      const csrfHeaders = await this.csrfManager.getTokenHeader()
      Object.assign(headers, csrfHeaders)
    }

    // Sanitize request body
    if (options.body && typeof options.body === 'object') {
      options.body = this.sanitizeRequestBody(options.body)
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      })

      // Check for security headers
      this.validateSecurityHeaders(response)

      return response
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  sanitizeRequestBody(body) {
    if (typeof body === 'object') {
      const sanitized = {}
      for (const [key, value] of Object.entries(body)) {
        sanitized[sanitizeInput(key)] = typeof value === 'string' ? sanitizeInput(value) : value
      }
      return sanitized
    }
    return body
  }

  validateSecurityHeaders(response) {
    const requiredHeaders = ['X-Content-Type-Options', 'X-Frame-Options']
    
    for (const header of requiredHeaders) {
      if (!response.headers.get(header)) {
        console.warn(`Missing security header: ${header}`)
      }
    }
  }
}

// Session management
export class SessionManager {
  constructor() {
    this.sessionKey = 'iranian_legal_session'
    this.sessionTimeout = 30 * 60 * 1000 // 30 minutes
  }

  createSession(userData) {
    const session = {
      id: this.generateSessionId(),
      user: userData,
      created: Date.now(),
      lastActivity: Date.now()
    }

    sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
    return session
  }

  getSession() {
    const sessionData = sessionStorage.getItem(this.sessionKey)
    if (!sessionData) {
      return null
    }

    try {
      const session = JSON.parse(sessionData)
      
      // Check if session is expired
      if (Date.now() - session.lastActivity > this.sessionTimeout) {
        this.destroySession()
        return null
      }

      // Update last activity
      session.lastActivity = Date.now()
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
      
      return session
    } catch (error) {
      console.error('Invalid session data:', error)
      this.destroySession()
      return null
    }
  }

  updateSession(updates) {
    const session = this.getSession()
    if (session) {
      Object.assign(session, updates)
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
    }
  }

  destroySession() {
    sessionStorage.removeItem(this.sessionKey)
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  }
}

// Initialize security measures
export const initializeSecurity = () => {
  // Set secure cookies
  document.cookie = 'secure; SameSite=Strict; Secure'
  
  // Disable right-click context menu in production
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  // Disable F12 and other dev tools shortcuts in production
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault()
      }
    })
  }

  console.log('Security measures initialized')
}

// Export security utilities
export const securityUtils = {
  sanitizeInput,
  escapeHtml,
  CSRFManager,
  RateLimiter,
  SecureAPIClient,
  SessionManager,
  generateCSPHeader,
  initializeSecurity
}