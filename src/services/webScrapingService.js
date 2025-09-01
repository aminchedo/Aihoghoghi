import axios from 'axios';

/**
 * Web-based Scraping Service for Iranian Legal Documents
 * Browser-compatible version that works without Playwright
 * Handles CORS and proxy requirements for web scraping
 */
class WebScrapingService {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      delay: options.delay || 1000,
      proxyUrl: options.proxyUrl || null,
      ...options
    };
    
    this.axiosInstance = axios.create({
      timeout: this.options.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      startTime: Date.now()
    };
  }

  /**
   * Scrape content from a URL using a CORS proxy
   */
  async scrapeUrl(url, options = {}) {
    const maxRetries = options.retries || this.options.retries;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.stats.totalRequests++;
        console.log(`🔍 Scraping ${url} (attempt ${attempt}/${maxRetries})`);
        
        const result = await this._performScrape(url, options);
        this.stats.successfulRequests++;
        
        return {
          success: true,
          url,
          data: result,
          timestamp: new Date().toISOString(),
          attempt
        };
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed for ${url}:`, error.message);
        
        if (attempt < maxRetries) {
          await this.delay(this.options.delay * attempt);
        }
      }
    }

    this.stats.failedRequests++;
    return {
      success: false,
      url,
      error: lastError?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      attempts: maxRetries
    };
  }

  /**
   * Perform the actual scraping using CORS proxy
   */
  async _performScrape(url, options = {}) {
    // Use a CORS proxy service for cross-origin requests
    const proxyUrl = options.proxyUrl || this.options.proxyUrl || 'https://api.allorigins.win/get?url=';
    const targetUrl = `${proxyUrl}${encodeURIComponent(url)}`;
    
    try {
      const response = await this.axiosInstance.get(targetUrl);
      let htmlContent = response.data.contents || response.data;
      
      // Parse HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      return this._extractDataFromDOM(doc, url, options);
    } catch (error) {
      // Fallback: try direct request (might fail due to CORS)
      try {
        const response = await this.axiosInstance.get(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        return this._extractDataFromDOM(doc, url, options);
      } catch (fallbackError) {
        throw new Error(`Both proxy and direct requests failed: ${error.message}`);
      }
    }
  }

  /**
   * Extract data from DOM document
   */
  _extractDataFromDOM(doc, url, options = {}) {
    const result = {
      url,
      timestamp: new Date().toISOString(),
      title: '',
      content: '',
      metadata: {},
      links: [],
      extractedPatterns: {}
    };

    try {
      // Extract title
      const titleEl = doc.querySelector('title') || doc.querySelector('h1');
      result.title = titleEl ? this.cleanText(titleEl.textContent) : '';

      // Extract main content
      const contentSelectors = [
        'main', 'article', '.content', '.main-content', 
        '.post-content', '.entry-content', '#content'
      ];
      
      let contentEl = null;
      for (const selector of contentSelectors) {
        contentEl = doc.querySelector(selector);
        if (contentEl) break;
      }
      
      if (!contentEl) {
        contentEl = doc.body;
      }
      
      result.content = contentEl ? this.cleanText(contentEl.textContent) : '';

      // Extract metadata
      const metaElements = doc.querySelectorAll('meta');
      metaElements.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          result.metadata[name] = content;
        }
      });

      // Extract links
      const links = doc.querySelectorAll('a[href]');
      result.links = Array.from(links)
        .map(link => ({
          text: this.cleanText(link.textContent),
          href: this.resolveUrl(link.getAttribute('href'), url),
          title: link.getAttribute('title') || ''
        }))
        .filter(link => link.text && link.href)
        .slice(0, 50); // Limit to first 50 links

      // Extract Persian legal document patterns
      result.extractedPatterns = this.extractLegalPatterns(result.content);

      // Detect language and direction
      result.language = this.detectLanguage(result.content);
      result.direction = result.language === 'fa' ? 'rtl' : 'ltr';

      return result;
    } catch (error) {
      console.error('Error extracting data from DOM:', error);
      throw error;
    }
  }

  /**
   * Extract Persian legal document patterns
   */
  extractLegalPatterns(text) {
    if (!text) return {};

    const patterns = {
      caseNumber: {
        regex: /شماره.*?پرونده[:\s]*([۰-۹0-9\-\/]+)/gi,
        label: 'شماره پرونده'
      },
      date: {
        regex: /تاریخ[:\s]*([۰-۹0-9\/\-]+)/gi,
        label: 'تاریخ'
      },
      court: {
        regex: /دادگاه[:\s]*([^\.]{10,50})/gi,
        label: 'دادگاه'
      },
      judge: {
        regex: /قاضی[:\s]*([^\.]{5,30})/gi,
        label: 'قاضی'
      },
      plaintiff: {
        regex: /خواهان[:\s]*([^\.]{5,50})/gi,
        label: 'خواهان'
      },
      defendant: {
        regex: /خوانده[:\s]*([^\.]{5,50})/gi,
        label: 'خوانده'
      },
      verdict: {
        regex: /حکم[:\s]*([^\.]{10,100})/gi,
        label: 'حکم'
      },
      law: {
        regex: /ماده[:\s]*([۰-۹0-9]+)[:\s]*([^\.]{10,100})/gi,
        label: 'ماده قانون'
      },
      amount: {
        regex: /مبلغ[:\s]*([۰-۹0-9,]+)[:\s]*(تومان|ریال|درهم)/gi,
        label: 'مبلغ'
      }
    };

    const extracted = {};
    
    Object.keys(patterns).forEach(patternName => {
      const pattern = patterns[patternName];
      const matches = [...text.matchAll(pattern.regex)];
      
      if (matches.length > 0) {
        extracted[patternName] = {
          label: pattern.label,
          values: matches.map(match => ({
            text: match[0].trim(),
            value: match[1] ? match[1].trim() : '',
            context: this.getContext(text, match.index, 50)
          }))
        };
      }
    });

    return extracted;
  }

  /**
   * Get context around a match
   */
  getContext(text, index, length = 50) {
    const start = Math.max(0, index - length);
    const end = Math.min(text.length, index + length);
    return text.substring(start, end).trim();
  }

  /**
   * Detect language of text
   */
  detectLanguage(text) {
    if (!text) return 'unknown';
    
    const persianChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    
    if (totalChars === 0) return 'unknown';
    
    const persianRatio = persianChars / totalChars;
    
    if (persianRatio > 0.3) return 'fa';
    if (persianRatio > 0.1) return 'mixed';
    return 'en';
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[‌]/g, ' ')
      .trim();
  }

  /**
   * Resolve relative URLs
   */
  resolveUrl(href, baseUrl) {
    try {
      return new URL(href, baseUrl).href;
    } catch {
      return href;
    }
  }

  /**
   * Scrape multiple URLs
   */
  async scrapeMultiple(urls, options = {}) {
    const concurrency = options.concurrency || 2;
    const results = [];
    
    console.log(`🔄 Starting batch scraping of ${urls.length} URLs`);
    
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(url => this.scrapeUrl(url, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      if (i + concurrency < urls.length) {
        await this.delay(this.options.delay);
      }
    }

    return results;
  }

  /**
   * Search and scrape Iranian legal sources
   */
  async searchLegalSources(query, options = {}) {
    const sources = [
      {
        name: 'سایت قوه قضائیه',
        searchUrl: `https://www.judiciary.ir/search?q=${encodeURIComponent(query)}`,
        baseUrl: 'https://www.judiciary.ir'
      },
      {
        name: 'مرکز اسناد و تحقیقات دفاع مقدس',
        searchUrl: `https://www.defapress.ir/search?q=${encodeURIComponent(query)}`,
        baseUrl: 'https://www.defapress.ir'
      },
      {
        name: 'پایگاه اطلاع‌رسانی دولت',
        searchUrl: `https://www.dolat.ir/search?q=${encodeURIComponent(query)}`,
        baseUrl: 'https://www.dolat.ir'
      }
    ];

    const allResults = [];
    
    for (const source of sources) {
      try {
        console.log(`🏛️ Searching ${source.name} for: ${query}`);
        
        const result = await this.scrapeUrl(source.searchUrl, {
          ...options,
          source: source.name
        });
        
        if (result.success) {
          allResults.push({
            ...result,
            source: source.name,
            query
          });
        }
        
        await this.delay(this.options.delay);
      } catch (error) {
        console.error(`❌ Failed to search ${source.name}:`, error);
      }
    }

    return allResults;
  }

  /**
   * Save scraped data as JSON download
   */
  async saveAsJSON(data, filename = null) {
    try {
      const name = filename || `legal_documents_${Date.now()}.json`;
      const formattedData = {
        metadata: {
          timestamp: new Date().toISOString(),
          totalDocuments: Array.isArray(data) ? data.length : 1,
          scrapingStats: this.getStats(),
          generator: 'Iranian Legal Archive Scraping Engine v2.0'
        },
        documents: Array.isArray(data) ? data : [data]
      };
      
      const blob = new Blob([JSON.stringify(formattedData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Data saved as ${name}`);
      return { success: true, filename: name, documentCount: formattedData.documents.length };
    } catch (error) {
      console.error('❌ Failed to save JSON:', error);
      throw error;
    }
  }

  /**
   * Get scraping statistics
   */
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      runtime: `${Math.round(runtime / 1000)}s`,
      successRate: this.stats.totalRequests > 0 
        ? Math.round((this.stats.successfulRequests / this.stats.totalRequests) * 100) 
        : 0
    };
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new WebScrapingService();
export { WebScrapingService };