/**
 * Comprehensive Error Handling for Iranian Legal Archive
 * Handles API errors, network issues, and provides user-friendly messages
 */

import toast from 'react-hot-toast'

export class APIError extends Error {
  constructor(message, status, endpoint) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.endpoint = endpoint
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message, field) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

/**
 * Handle different types of errors with appropriate user messages
 */
export function handleError(error, context = 'عملیات') {
  console.error(`❌ Error in ${context}:`, error)
  
  let userMessage = 'خطای غیرمنتظره رخ داد'
  let toastType = 'error'
  
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        userMessage = 'درخواست نامعتبر - لطفاً ورودی‌ها را بررسی کنید'
        break
      case 401:
        userMessage = 'عدم دسترسی - لطفاً احراز هویت کنید'
        break
      case 403:
        userMessage = 'دسترسی مجاز نیست'
        break
      case 404:
        userMessage = 'منبع مورد نظر یافت نشد'
        break
      case 429:
        userMessage = 'تعداد درخواست‌ها زیاد است - لطفاً کمی صبر کنید'
        toastType = 'warning'
        break
      case 500:
        userMessage = 'خطای داخلی سرور - لطفاً دوباره تلاش کنید'
        break
      case 502:
      case 503:
      case 504:
        userMessage = 'سرور در دسترس نیست - لطفاً دوباره تلاش کنید'
        break
      default:
        userMessage = `خطای API: ${error.message}`
    }
  } else if (error instanceof NetworkError) {
    userMessage = 'خطای شبکه - اتصال اینترنت را بررسی کنید'
  } else if (error instanceof ValidationError) {
    userMessage = `خطای اعتبارسنجی: ${error.message}`
    if (error.field) {
      userMessage += ` (فیلد: ${error.field})`
    }
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    userMessage = 'خطای اتصال - سرور در دسترس نیست'
  } else if (error.name === 'AbortError') {
    userMessage = 'عملیات لغو شد'
    toastType = 'warning'
  } else if (error.message) {
    userMessage = error.message
  }

  // Show toast notification
  if (toastType === 'error') {
    toast.error(userMessage)
  } else if (toastType === 'warning') {
    toast.warning(userMessage)
  }

  // Log error for debugging
  logError(error, context)
  
  return {
    userMessage,
    originalError: error,
    context
  }
}

/**
 * Log error with context information
 */
export function logError(error, context) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    userAgent: navigator.userAgent,
    url: window.location.href,
    connectionStatus: navigator.onLine ? 'online' : 'offline'
  }
  
  // Log to console
  console.error('📝 Error Log:', errorInfo)
  
  // Store in localStorage for debugging
  try {
    const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]')
    errorLogs.push(errorInfo)
    
    // Keep only last 100 errors
    if (errorLogs.length > 100) {
      errorLogs.splice(0, errorLogs.length - 100)
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(errorLogs))
  } catch (e) {
    console.warn('Failed to store error log:', e)
  }
}

/**
 * Validate search input
 */
export function validateSearchInput(query, type = 'text') {
  if (!query || typeof query !== 'string') {
    throw new ValidationError('کلیدواژه جستجو الزامی است', 'query')
  }
  
  const trimmedQuery = query.trim()
  
  if (trimmedQuery.length === 0) {
    throw new ValidationError('کلیدواژه جستجو نمی‌تواند خالی باشد', 'query')
  }
  
  if (trimmedQuery.length < 2) {
    throw new ValidationError('کلیدواژه جستجو باید حداقل 2 کاراکتر باشد', 'query')
  }
  
  if (type === 'semantic' && trimmedQuery.length < 10) {
    throw new ValidationError('برای جستجوی معنایی، توضیح کامل‌تری وارد کنید', 'query')
  }
  
  return trimmedQuery
}

/**
 * Validate URL input
 */
export function validateURL(url) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('آدرس URL الزامی است', 'url')
  }
  
  const trimmedUrl = url.trim()
  
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    throw new ValidationError('آدرس باید با http:// یا https:// شروع شود', 'url')
  }
  
  try {
    new URL(trimmedUrl)
  } catch (e) {
    throw new ValidationError('فرمت آدرس نامعتبر است', 'url')
  }
  
  // Check if it's a valid Iranian legal website
  const legalDomains = [
    'majlis.ir',
    'rc.majlis.ir',
    'judiciary.ir',
    'eadl.ir',
    'dotic.ir',
    'www.dotic.ir'
  ]
  
  const domain = new URL(trimmedUrl).hostname
  const isLegalDomain = legalDomains.some(legalDomain => 
    domain === legalDomain || domain.endsWith('.' + legalDomain)
  )
  
  if (!isLegalDomain) {
    console.warn('⚠️ URL is not from a recognized legal domain:', domain)
  }
  
  return trimmedUrl
}

/**
 * Validate file upload
 */
export function validateFile(file) {
  if (!file) {
    throw new ValidationError('فایل انتخاب نشده است', 'file')
  }
  
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('نوع فایل پشتیبانی نمی‌شود. فقط PDF، DOC، DOCX و TXT مجاز است', 'file')
  }
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new ValidationError('حجم فایل نباید بیشتر از 10 مگابایت باشد', 'file')
  }
  
  return true
}

/**
 * Handle network connectivity issues
 */
export function handleNetworkError() {
  if (!navigator.onLine) {
    toast.error('اتصال اینترنت قطع است')
    return false
  }
  
  return true
}

/**
 * Create error boundary fallback
 */
export function createErrorBoundaryFallback(error, errorInfo) {
  return {
    error,
    errorInfo,
    userMessage: 'خطای غیرمنتظره در رابط کاربری رخ داد',
    timestamp: new Date().toISOString()
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation(operation, maxAttempts = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`⏳ Retrying operation in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJSONParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('JSON parse failed:', error)
    return defaultValue
  }
}

/**
 * Safe localStorage operations
 */
export const safeStorage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Failed to get ${key} from localStorage:`, error)
      return defaultValue
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Failed to set ${key} in localStorage:`, error)
      return false
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error)
      return false
    }
  }
}

export default {
  handleError,
  logError,
  validateSearchInput,
  validateURL,
  validateFile,
  handleNetworkError,
  createErrorBoundaryFallback,
  retryOperation,
  safeJSONParse,
  safeStorage,
  APIError,
  NetworkError,
  ValidationError
}