/**
 * Advanced Scraping Service with Smart Proxy Integration
 * CORS bypass, Iranian DNS, and intelligent content extraction
 */

import SmartProxyService from './smartProxyService.js';

class AdvancedScrapingService {
  constructor() {
    this.proxyService = new SmartProxyService();
    this.extractionRules = {
      'judiciary.ir': {
        titleSelector: 'h1, .title, .news-title',
        contentSelector: '.content, .news-content, .main-content',
        linkSelector: 'a[href*="news"], a[href*="announcement"]'
      },
      'dolat.ir': {
        titleSelector: 'h1, .post-title, .article-title',
        contentSelector: '.post-content, .article-content, .content',
        linkSelector: 'a[href*="news"], a[href*="post"]'
      },
      'majlis.ir': {
        titleSelector: 'h1, .title',
        contentSelector: '.content, .main-content',
        linkSelector: 'a[href*="law"], a[href*="bill"]'
      }
    };

    this.stats = {
      totalScrapes: 0,
      successfulScrapes: 0,
      failedScrapes: 0,
      corsAttempts: 0,
      proxyAttempts: 0,
      dnsResolutions: 0
    };
  }

  /**
   * Smart scraping with all bypass techniques
   */
  async smartScrape(url, options = {}) {
    this.stats.totalScrapes++;
    
    console.log(`\n🚀 Smart Scraping: ${url}`);
    
    try {
      // Step 1: Try smart proxy request
      const response = await this.proxyService.smartRequest(url, {
        maxRetries: 3,
        useProxy: true,
        useDNS: true,
        bypassCORS: true,
        ...options
      });

      if (!response || !response.ok) {
        throw new Error(`Request failed: ${response?.status || 'No response'}`);
      }

      // Step 2: Extract content intelligently
      const text = await response.text();
      const extractedData = await this.extractContent(text, url);

      this.stats.successfulScrapes++;
      
      return {
        success: true,
        url,
        statusCode: response.status,
        contentLength: text.length,
        extractedData,
        timestamp: new Date().toISOString(),
        method: 'smart_proxy'
      };

    } catch (error) {
      this.stats.failedScrapes++;
      console.error(`❌ Smart scraping failed for ${url}:`, error.message);
      
      return {
        success: false,
        url,
        error: error.message,
        timestamp: new Date().toISOString(),
        method: 'smart_proxy'
      };
    }
  }

  /**
   * Extract content using DOM parsing
   */
  async extractContent(html, url) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const hostname = new URL(url).hostname;
    const rules = this.extractionRules[hostname] || this.extractionRules['default'] || {};

    const extracted = {
      title: '',
      content: '',
      links: [],
      headings: [],
      metadata: {}
    };

    // Extract title
    const titleSelectors = [
      rules.titleSelector,
      'title',
      'h1',
      '.title',
      '.page-title'
    ].filter(Boolean);

    for (const selector of titleSelectors) {
      const titleElement = doc.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        extracted.title = titleElement.textContent.trim();
        break;
      }
    }

    // Extract main content
    const contentSelectors = [
      rules.contentSelector,
      'main',
      'article',
      '.content',
      '.main-content',
      '.post-content',
      'body'
    ].filter(Boolean);

    for (const selector of contentSelectors) {
      const contentElement = doc.querySelector(selector);
      if (contentElement) {
        // Remove script and style elements
        const scripts = contentElement.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        extracted.content = contentElement.textContent.trim();
        break;
      }
    }

    // Extract headings
    ['h1', 'h2', 'h3', 'h4'].forEach(tag => {
      const headings = doc.querySelectorAll(tag);
      headings.forEach((heading, index) => {
        if (index < 10) { // Limit to 10 headings
          const text = heading.textContent.trim();
          if (text && text.length > 3) {
            extracted.headings.push({
              tag,
              text: text.substring(0, 200) // Limit length
            });
          }
        }
      });
    });

    // Extract relevant links
    const linkSelector = rules.linkSelector || 'a[href]';
    const linkElements = doc.querySelectorAll(linkSelector);
    
    linkElements.forEach((link, index) => {
      if (index < 20) { // Limit to 20 links
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        
        if (href && text && text.length > 2) {
          // Convert relative URLs to absolute
          let absoluteUrl = href;
          if (href.startsWith('/')) {
            const baseUrl = new URL(url).origin;
            absoluteUrl = baseUrl + href;
          }
          
          extracted.links.push({
            url: absoluteUrl,
            text: text.substring(0, 100) // Limit length
          });
        }
      }
    });

    // Extract metadata
    const metaElements = doc.querySelectorAll('meta[name], meta[property]');
    metaElements.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        extracted.metadata[name] = content;
      }
    });

    // Analyze legal content
    extracted.legalAnalysis = this.analyzeLegalContent(extracted.content);

    return extracted;
  }

  /**
   * Analyze legal content for categorization
   */
  analyzeLegalContent(text) {
    const legalKeywords = {
      'قضایی': ['قاضی', 'دادگاه', 'حکم', 'رأی', 'محاکمه', 'قضاوت', 'دادرسی'],
      'قانونی': ['قانون', 'ماده', 'تبصره', 'آیین‌نامه', 'مقررات', 'مصوبه'],
      'اداری': ['وزارت', 'سازمان', 'اداره', 'مدیریت', 'بخشنامه', 'دستورالعمل'],
      'کیفری': ['جرم', 'مجازات', 'زندان', 'جریمه', 'تعزیرات', 'قصاص'],
      'مدنی': ['ملک', 'خرید', 'فروش', 'اجاره', 'وکالت', 'وراثت', 'ازدواج']
    };

    const analysis = {
      categories: [],
      totalLegalTerms: 0,
      relevanceScore: 0
    };

    const textLower = text.toLowerCase();

    Object.entries(legalKeywords).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => textLower.includes(keyword));
      const totalMatches = matches.reduce((sum, keyword) => {
        const count = (textLower.match(new RegExp(keyword, 'g')) || []).length;
        return sum + count;
      }, 0);

      if (totalMatches > 0) {
        analysis.categories.push({
          category,
          matches: totalMatches,
          keywords: matches
        });
        analysis.totalLegalTerms += totalMatches;
      }
    });

    // Calculate relevance score (0-100)
    analysis.relevanceScore = Math.min(analysis.totalLegalTerms * 5, 100);

    return analysis;
  }

  /**
   * Batch scraping with smart proxy rotation
   */
  async batchScrape(urls, options = {}) {
    console.log(`\n📦 Batch Scraping: ${urls.length} URLs`);
    
    const {
      concurrency = 2,
      delayBetween = 3000,
      ...requestOptions
    } = options;

    const results = [];
    
    // Process URLs in batches to avoid overwhelming servers
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      console.log(`\n📊 Processing batch ${Math.floor(i/concurrency) + 1}/${Math.ceil(urls.length/concurrency)}`);
      
      const batchPromises = batch.map(async (urlData) => {
        const url = typeof urlData === 'string' ? urlData : urlData.url;
        const name = typeof urlData === 'string' ? url : urlData.name;
        
        console.log(`🔍 Scraping: ${name}`);
        const result = await this.smartScrape(url, requestOptions);
        result.siteName = name;
        return result;
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            url: batch[index],
            error: result.reason?.message || 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Delay between batches
      if (i + concurrency < urls.length) {
        console.log(`⏳ Waiting ${delayBetween/1000}s before next batch...`);
        await this.delay(delayBetween);
      }
    }

    return results;
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    const proxyStats = this.proxyService.getStats();
    
    return {
      scraping: this.stats,
      proxy: proxyStats,
      combined: {
        totalOperations: this.stats.totalScrapes + proxyStats.totalRequests,
        overallSuccessRate: this.stats.totalScrapes > 0 
          ? (this.stats.successfulScrapes / this.stats.totalScrapes * 100).toFixed(2)
          : 0
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalScrapes: 0,
      successfulScrapes: 0,
      failedScrapes: 0,
      corsAttempts: 0,
      proxyAttempts: 0,
      dnsResolutions: 0
    };
    
    this.proxyService.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      proxyFailures: 0,
      dnsResolutions: 0,
      corsAttempts: 0
    };
  }
}

export default AdvancedScrapingService;