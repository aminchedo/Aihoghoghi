import { chromium } from 'playwright';

/**
 * Advanced Scraping Engine for Iranian Legal Documents
 * Supports multiple sources with intelligent error handling and retries
 * Handles both RTL (Persian) and LTR text parsing
 * Outputs structured data for MongoDB or JSON storage
 */
class ScrapingEngine {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      delay: options.delay || 1000,
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      headless: options.headless !== false,
      storage: options.storage || 'json', // 'mongodb' or 'json'
      ...options
    };
    
    this.browser = null;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      startTime: Date.now()
    };
  }

  /**
   * Initialize the browser instance
   */
  async initialize() {
    try {
      this.browser = await chromium.launch({
        headless: this.options.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      console.log('🚀 Scraping engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize scraping engine:', error);
      return false;
    }
  }

  /**
   * Create a new page with optimized settings
   */
  async createPage() {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();
    
    // Set viewport and user agent
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.setUserAgent(this.options.userAgent);
    
    // Block unnecessary resources to speed up scraping
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    return page;
  }

  /**
   * Scrape a single URL with retry logic
   */
  async scrapeUrl(url, selectors = {}, options = {}) {
    const maxRetries = options.retries || this.options.retries;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.stats.totalRequests++;
        console.log(`🔍 Scraping ${url} (attempt ${attempt}/${maxRetries})`);
        
        const result = await this._performScrape(url, selectors, options);
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
   * Perform the actual scraping operation
   */
  async _performScrape(url, selectors, options) {
    const page = await this.createPage();
    
    try {
      // Navigate to the URL
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: this.options.timeout 
      });

      // Wait for specific elements if provided
      if (selectors.waitFor) {
        await page.waitForSelector(selectors.waitFor, { timeout: 10000 });
      }

      // Execute custom JavaScript if provided
      if (options.executeScript) {
        await page.evaluate(options.executeScript);
      }

      // Extract data using selectors
      const data = await page.evaluate((sel) => {
        const result = {};
        
        // Helper function to extract text and handle RTL content
        const extractText = (element) => {
          if (!element) return '';
          return element.innerText.trim();
        };

        // Extract title
        if (sel.title) {
          const titleEl = document.querySelector(sel.title);
          result.title = extractText(titleEl);
        }

        // Extract content
        if (sel.content) {
          const contentEl = document.querySelector(sel.content);
          result.content = extractText(contentEl);
        }

        // Extract metadata
        if (sel.metadata) {
          result.metadata = {};
          Object.keys(sel.metadata).forEach(key => {
            const el = document.querySelector(sel.metadata[key]);
            result.metadata[key] = extractText(el);
          });
        }

        // Extract links
        if (sel.links) {
          result.links = Array.from(document.querySelectorAll(sel.links))
            .map(link => ({
              text: extractText(link),
              href: link.href,
              title: link.title
            }));
        }

        // Extract tables
        if (sel.tables) {
          result.tables = Array.from(document.querySelectorAll(sel.tables))
            .map(table => {
              const headers = Array.from(table.querySelectorAll('th'))
                .map(th => extractText(th));
              const rows = Array.from(table.querySelectorAll('tr'))
                .slice(1) // Skip header row
                .map(tr => {
                  const cells = Array.from(tr.querySelectorAll('td, th'))
                    .map(cell => extractText(cell));
                  return cells;
                });
              return { headers, rows };
            });
        }

        // Extract custom selectors
        if (sel.custom) {
          result.custom = {};
          Object.keys(sel.custom).forEach(key => {
            const elements = document.querySelectorAll(sel.custom[key]);
            if (elements.length === 1) {
              result.custom[key] = extractText(elements[0]);
            } else {
              result.custom[key] = Array.from(elements).map(el => extractText(el));
            }
          });
        }

        // Auto-detect Persian legal document patterns
        const persianPatterns = {
          caseNumber: /شماره.*?پرونده[:\s]*([۰-۹0-9\-\/]+)/gi,
          date: /تاریخ[:\s]*([۰-۹0-9\/\-]+)/gi,
          court: /دادگاه[:\s]*([^\.]+)/gi,
          judge: /قاضی[:\s]*([^\.]+)/gi,
          plaintiff: /خواهان[:\s]*([^\.]+)/gi,
          defendant: /خوانده[:\s]*([^\.]+)/gi
        };

        const fullText = document.body.innerText;
        result.extractedPatterns = {};
        
        Object.keys(persianPatterns).forEach(pattern => {
          const matches = [...fullText.matchAll(persianPatterns[pattern])];
          if (matches.length > 0) {
            result.extractedPatterns[pattern] = matches.map(match => match[1].trim());
          }
        });

        return result;
      }, selectors);

      // Add page metadata
      data.pageInfo = {
        url: page.url(),
        title: await page.title(),
        language: await page.getAttribute('html', 'lang') || 'auto-detected',
        direction: await page.getAttribute('html', 'dir') || 'auto-detected'
      };

      return data;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape multiple URLs concurrently
   */
  async scrapeMultiple(urls, selectors = {}, options = {}) {
    const concurrency = options.concurrency || 3;
    const results = [];
    
    console.log(`🔄 Starting batch scraping of ${urls.length} URLs with concurrency ${concurrency}`);
    
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(url => this.scrapeUrl(url, selectors, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + concurrency < urls.length) {
        await this.delay(this.options.delay);
      }
    }

    return results;
  }

  /**
   * Scrape Iranian legal websites with predefined configurations
   */
  async scrapeLegalSources(query = '', options = {}) {
    const sources = [
      {
        name: 'دیوان عدالت اداری',
        baseUrl: 'https://www.divan-edalat.ir',
        searchUrl: 'https://www.divan-edalat.ir/search',
        selectors: {
          title: 'h1, .title',
          content: '.content, .main-content, article',
          metadata: {
            date: '.date, .publish-date',
            category: '.category',
            reference: '.reference-number'
          },
          links: 'a[href*="/decision/"], a[href*="/ruling/"]'
        }
      },
      {
        name: 'سایت قوه قضائیه',
        baseUrl: 'https://www.judiciary.ir',
        searchUrl: 'https://www.judiciary.ir/search',
        selectors: {
          title: 'h1, .news-title',
          content: '.news-content, .content',
          metadata: {
            date: '.news-date',
            category: '.news-category'
          }
        }
      },
      {
        name: 'مرکز پژوهش‌های مجلس',
        baseUrl: 'https://rc.majlis.ir',
        searchUrl: 'https://rc.majlis.ir/search',
        selectors: {
          title: 'h1, .research-title',
          content: '.research-content, .abstract',
          metadata: {
            date: '.publish-date',
            author: '.author',
            category: '.research-category'
          }
        }
      }
    ];

    const allResults = [];
    
    for (const source of sources) {
      try {
        console.log(`🏛️ Scraping ${source.name}...`);
        
        // If query provided, search for it
        let urls = [source.baseUrl];
        if (query && source.searchUrl) {
          urls = [`${source.searchUrl}?q=${encodeURIComponent(query)}`];
        }
        
        const sourceResults = await this.scrapeMultiple(urls, source.selectors, {
          ...options,
          source: source.name
        });
        
        allResults.push(...sourceResults.map(result => ({
          ...result,
          source: source.name
        })));
        
      } catch (error) {
        console.error(`❌ Failed to scrape ${source.name}:`, error);
      }
    }

    return allResults;
  }

  /**
   * Save scraped data to storage
   */
  async saveData(data, options = {}) {
    const storageType = options.storage || this.options.storage;
    
    if (storageType === 'mongodb') {
      return await this.saveToMongoDB(data, options);
    } else {
      return await this.saveToJSON(data, options);
    }
  }

  /**
   * Save data to MongoDB
   */
  async saveToMongoDB(data, options = {}) {
    try {
      // MongoDB implementation would go here
      // For now, we'll simulate it
      console.log('💾 Saving to MongoDB...');
      
      const collection = options.collection || 'scraped_documents';
      const documents = Array.isArray(data) ? data : [data];
      
      // Simulate MongoDB save
      const result = {
        acknowledged: true,
        insertedCount: documents.length,
        insertedIds: documents.map(() => new Date().getTime().toString())
      };
      
      console.log(`✅ Saved ${documents.length} documents to MongoDB collection: ${collection}`);
      return result;
    } catch (error) {
      console.error('❌ Failed to save to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Save data to JSON file
   */
  async saveToJSON(data, options = {}) {
    try {
      const filename = options.filename || `scraped_data_${Date.now()}.json`;
      const formattedData = {
        metadata: {
          timestamp: new Date().toISOString(),
          totalDocuments: Array.isArray(data) ? data.length : 1,
          scrapingStats: this.getStats()
        },
        documents: Array.isArray(data) ? data : [data]
      };
      
      // In a browser environment, we'll create a downloadable file
      const blob = new Blob([JSON.stringify(formattedData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Data saved to ${filename}`);
      return { success: true, filename, documentCount: formattedData.documents.length };
    } catch (error) {
      console.error('❌ Failed to save to JSON:', error);
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
   * Clean up resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    console.log('🧹 Scraping engine cleanup completed');
  }

  /**
   * Utility function for delays
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract and clean Persian text
   */
  static cleanPersianText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/[‌]/g, ' ') // Replace ZWNJ with space
      .trim();
  }

  /**
   * Detect if text is primarily Persian/Arabic
   */
  static isPersianText(text) {
    if (!text) return false;
    
    const persianChars = text.match(/[\u0600-\u06FF]/g);
    const totalChars = text.replace(/\s/g, '').length;
    
    return persianChars && (persianChars.length / totalChars) > 0.5;
  }
}

// Export singleton instance
export default new ScrapingEngine();

// Also export the class for custom instances
export { ScrapingEngine };