/**
 * Persian Language Utilities for Iranian Legal Archive
 * RTL support, number conversion, date formatting
 */

/**
 * Convert English numbers to Persian
 */
export function toPersianNumbers(str) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return str.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)])
}

/**
 * Convert Persian numbers to English
 */
export function toEnglishNumbers(str) {
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  
  let result = str.toString()
  for (let i = 0; i < persianDigits.length; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i])
  }
  return result
}

/**
 * Format Persian date
 */
export function formatPersianDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tehran',
    calendar: 'persian',
    ...options
  }
  
  try {
    return new Intl.DateTimeFormat('fa-IR', defaultOptions).format(new Date(date))
  } catch (error) {
    // Fallback to simple format
    return new Date(date).toLocaleDateString('fa-IR')
  }
}

/**
 * Format Persian time
 */
export function formatPersianTime(date, includeSeconds = true) {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tehran'
  }
  
  if (includeSeconds) {
    options.second = '2-digit'
  }
  
  try {
    return new Intl.DateTimeFormat('fa-IR', options).format(new Date(date))
  } catch (error) {
    // Fallback
    return new Date(date).toLocaleTimeString('fa-IR')
  }
}

/**
 * Format Persian date and time
 */
export function formatPersianDateTime(date) {
  return `${formatPersianDate(date)} - ${formatPersianTime(date)}`
}

/**
 * Format file size in Persian
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '۰ بایت'
  
  const k = 1024
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  const size = (bytes / Math.pow(k, i)).toFixed(1)
  return `${toPersianNumbers(size)} ${sizes[i]}`
}

/**
 * Format duration in Persian
 */
export function formatDuration(milliseconds) {
  if (milliseconds < 1000) {
    return `${toPersianNumbers(milliseconds)} میلی‌ثانیه`
  }
  
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) {
    return `${toPersianNumbers(seconds)} ثانیه`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${toPersianNumbers(minutes)} دقیقه و ${toPersianNumbers(remainingSeconds)} ثانیه`
      : `${toPersianNumbers(minutes)} دقیقه`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return remainingMinutes > 0
    ? `${toPersianNumbers(hours)} ساعت و ${toPersianNumbers(remainingMinutes)} دقیقه`
    : `${toPersianNumbers(hours)} ساعت`
}

/**
 * Format percentage in Persian
 */
export function formatPercentage(value, decimals = 1) {
  return `${toPersianNumbers(value.toFixed(decimals))}٪`
}

/**
 * Format large numbers in Persian
 */
export function formatLargeNumber(number) {
  if (number < 1000) {
    return toPersianNumbers(number.toString())
  }
  
  if (number < 1000000) {
    const k = (number / 1000).toFixed(1)
    return `${toPersianNumbers(k)} هزار`
  }
  
  if (number < 1000000000) {
    const m = (number / 1000000).toFixed(1)
    return `${toPersianNumbers(m)} میلیون`
  }
  
  const b = (number / 1000000000).toFixed(1)
  return `${toPersianNumbers(b)} میلیارد`
}

/**
 * Truncate Persian text
 */
export function truncatePersianText(text, maxLength = 100, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text
  }
  
  // Try to break at word boundary
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + suffix
  }
  
  return truncated + suffix
}

/**
 * Highlight search terms in Persian text
 */
export function highlightSearchTerms(text, searchTerms, className = 'bg-yellow-200') {
  if (!text || !searchTerms || searchTerms.length === 0) {
    return text
  }
  
  let highlightedText = text
  
  searchTerms.forEach(term => {
    if (term.trim()) {
      const regex = new RegExp(`(${term.trim()})`, 'gi')
      highlightedText = highlightedText.replace(
        regex, 
        `<span class="${className}">$1</span>`
      )
    }
  })
  
  return highlightedText
}

/**
 * Clean and normalize Persian text
 */
export function normalizePersianText(text) {
  if (!text) return ''
  
  return text
    .replace(/ي/g, 'ی')  // Replace Arabic ي with Persian ی
    .replace(/ك/g, 'ک')  // Replace Arabic ك with Persian ک
    .replace(/ء/g, 'ٔ')   // Replace Arabic hamza
    .replace(/\u200C+/g, '\u200C') // Normalize ZWNJ (zero-width non-joiner)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Extract legal entities from Persian text
 */
export function extractLegalEntities(text) {
  const entities = {
    laws: [],
    articles: [],
    dates: [],
    courts: [],
    persons: []
  }

  // Law patterns
  const lawPatterns = [
    /قانون\s+[^\s]+/g,
    /آیین‌نامه\s+[^\s]+/g,
    /مقررات\s+[^\s]+/g
  ]
  
  // Article patterns
  const articlePatterns = [
    /ماده\s*\d+/g,
    /اصل\s*\d+/g,
    /بند\s*\d+/g,
    /تبصره\s*\d*/g
  ]
  
  // Date patterns
  const datePatterns = [
    /\d{4}\/\d{1,2}\/\d{1,2}/g,
    /\d+\/\d+\/\d+/g
  ]
  
  // Court patterns
  const courtPatterns = [
    /دادگاه\s+[^\s]+/g,
    /محکمه\s+[^\s]+/g,
    /شعبه\s+\d+/g
  ]

  // Extract entities
  lawPatterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    entities.laws.push(...matches)
  })

  articlePatterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    entities.articles.push(...matches)
  })

  datePatterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    entities.dates.push(...matches)
  })

  courtPatterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    entities.courts.push(...matches)
  })

  // Remove duplicates
  Object.keys(entities).forEach(key => {
    entities[key] = [...new Set(entities[key])]
  })

  return entities
}

/**
 * Calculate text similarity for Persian text
 */
export function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0
  
  const words1 = normalizePersianText(text1).toLowerCase().split(/\s+/)
  const words2 = normalizePersianText(text2).toLowerCase().split(/\s+/)
  
  const set1 = new Set(words1)
  const set2 = new Set(words2)
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return intersection.size / union.size
}

/**
 * Classify legal document type
 */
export function classifyLegalDocument(title, content) {
  const text = `${title} ${content}`.toLowerCase()
  
  const categories = {
    'قانون_اساسی': ['قانون اساسی', 'اصول اساسی', 'اصل'],
    'قانون_عادی': ['قانون', 'مقررات', 'آیین‌نامه', 'ماده'],
    'دادنامه': ['دادنامه', 'رای', 'حکم', 'قرار', 'دادگاه'],
    'نفقه_و_حقوق_خانواده': ['نفقه', 'زوجه', 'فرزندان', 'طلاق', 'ازدواج', 'خانواده'],
    'حقوق_جزا': ['جزا', 'مجازات', 'جرم', 'کیفر'],
    'حقوق_مدنی': ['مدنی', 'قرارداد', 'تعهدات', 'اموال']
  }

  let maxScore = 0
  let predictedCategory = 'نامشخص'
  
  Object.entries(categories).forEach(([category, keywords]) => {
    let score = 0
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 1
      }
    })
    
    const normalizedScore = score / keywords.length
    if (normalizedScore > maxScore) {
      maxScore = normalizedScore
      predictedCategory = category
    }
  })

  return {
    category: predictedCategory,
    confidence: maxScore,
    all_scores: Object.keys(categories).map(cat => ({
      category: cat,
      score: categories[cat].filter(keyword => text.includes(keyword)).length / categories[cat].length
    }))
  }
}

export default {
  toPersianNumbers,
  toEnglishNumbers,
  formatPersianDate,
  formatPersianTime,
  formatPersianDateTime,
  formatFileSize,
  formatDuration,
  formatPercentage,
  formatLargeNumber,
  truncatePersianText,
  highlightSearchTerms,
  normalizePersianText,
  extractLegalEntities,
  calculateTextSimilarity,
  classifyLegalDocument
}