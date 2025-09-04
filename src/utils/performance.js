/**
 * Performance optimization utilities for Iranian Legal Archive System
 */

// Lazy loading utility
export const lazyLoadComponent = (importFunc) => {
  return React.lazy(() => importFunc().catch(() => {
    // Fallback component in case of loading failure
    return {
      default: () => React.createElement('div', { 
        className: 'error-boundary',
        children: 'خطا در بارگذاری کامپوننت'
      })
    }
  }))
}

// Image optimization
export const optimizeImage = (src, options = {}) => {
  const { width, height, quality = 80, format = 'webp' } = options
  
  // For external images, use a proxy service
  if (src.startsWith('http')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=${width}&h=${height}&q=${quality}&output=${format}`
  }
  
  return src
}

// Debounce utility for search
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle utility for scroll events
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Memory management
export class MemoryManager {
  constructor() {
    this.cache = new Map()
    this.maxSize = 100
    this.accessCount = new Map()
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }
    
    this.cache.set(key, value)
    this.accessCount.set(key, 1)
  }

  get(key) {
    if (this.cache.has(key)) {
      const count = this.accessCount.get(key) || 0
      this.accessCount.set(key, count + 1)
      return this.cache.get(key)
    }
    return null
  }

  evictLeastUsed() {
    let leastUsedKey = null
    let minCount = Infinity

    for (const [key, count] of this.accessCount.entries()) {
      if (count < minCount) {
        minCount = count
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
      this.accessCount.delete(leastUsedKey)
    }
  }

  clear() {
    this.cache.clear()
    this.accessCount.clear()
  }
}

// Bundle size optimization
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontLink = document.createElement('link')
  fontLink.rel = 'preload'
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap'
  fontLink.as = 'style'
  document.head.appendChild(fontLink)

  // Preload critical CSS
  const cssLink = document.createElement('link')
  cssLink.rel = 'preload'
  cssLink.href = 'https://cdn.tailwindcss.com'
  cssLink.as = 'script'
  document.head.appendChild(cssLink)
}

// Service Worker registration for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = []
  }

  startTiming(name) {
    this.metrics.set(name, { start: performance.now() })
  }

  endTiming(name) {
    const metric = this.metrics.get(name)
    if (metric) {
      metric.end = performance.now()
      metric.duration = metric.end - metric.start
      
      // Log slow operations
      if (metric.duration > 1000) {
        console.warn(`Slow operation detected: ${name} took ${metric.duration}ms`)
      }
    }
  }

  measureWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('LCP:', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      console.log('CLS:', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// Resource hints
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: 'https://cdn.tailwindcss.com' },
    { rel: 'dns-prefetch', href: 'https://cdn.jsdelivr.net' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
  ]

  hints.forEach(hint => {
    const link = document.createElement('link')
    Object.assign(link, hint)
    document.head.appendChild(link)
  })
}

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  preloadCriticalResources()
  addResourceHints()
  registerServiceWorker()
  
  const monitor = new PerformanceMonitor()
  monitor.measureWebVitals()
  
  return monitor
}