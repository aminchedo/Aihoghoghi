/**
 * Legal Document Service for Iranian Legal Archive
 * Handles document management, storage, and retrieval
 */

import { realTimeMetricsService } from './realTimeMetricsService';

class LegalDocumentService {
  constructor() {
    this.db = null;
    this.documents = new Map();
    this.categories = new Set(['قانون', 'آیین‌نامه', 'بخشنامه', 'دستورالعمل', 'رأی', 'نظریه']);
    this.searchIndex = new Map();
    this.isInitialized = false;
    
    this.initializeDatabase();
  }

  /**
   * Initialize IndexedDB for client-side storage
   */
  async initializeDatabase() {
    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        throw new Error('IndexedDB not supported');
      }

      const request = indexedDB.open('IranianLegalArchive', 2);
      
      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB');
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create documents store
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('source', 'source', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('content', 'content', { unique: false });
        }
        
        // Create analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
          analyticsStore.createIndex('type', 'type', { unique: false });
          analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        this.loadExistingDocuments();
        console.log('✅ Legal document database initialized');
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize document database:', error);
      // Fallback to memory storage
      this.initializeMemoryStorage();
    }
  }

  /**
   * Fallback to memory storage
   */
  initializeMemoryStorage() {
    this.isInitialized = true;
    console.log('📝 Using memory storage for documents');
    
    // Add some sample real legal documents for demonstration
    this.addSampleDocuments();
  }

  /**
   * Add sample real legal documents
   */
  addSampleDocuments() {
    const sampleDocs = [
      {
        title: 'قانون اساسی جمهوری اسلامی ایران',
        content: 'ملت ایران پس از پیروزی انقلاب اسلامی به رهبری امام خمینی (ره) که مظهر آرزوی قلبی جامعه مسلمان ایران بود و با هدف تحقق آرمان‌های انسانی آن در جامعه‌ای ایده‌آل...',
        category: 'قانون',
        source: 'majlis.ir',
        date: '1358/12/03',
        confidence: 0.98,
        language: 'fa',
        wordCount: 15420,
        metadata: {
          ratificationDate: '1358/12/03',
          amendmentCount: 2,
          articles: 177
        }
      },
      {
        title: 'قانون مدنی ایران - کتاب اول',
        content: 'از وقتی که طفل تمام متولد شود زنده است و در این صورت از تولد حقوق مدنی ثابت می‌شود مگر آنکه خلاف آن ثابت گردد...',
        category: 'قانون',
        source: 'dotic.ir',
        date: '1307/01/01',
        confidence: 0.95,
        language: 'fa',
        wordCount: 89340,
        metadata: {
          articles: 1223,
          books: 10,
          lastAmendment: '1399/08/15'
        }
      },
      {
        title: 'آیین‌نامه اجرایی قانون حمایت از حقوق مصرف‌کنندگان',
        content: 'به منظور اجرای قانون حمایت از حقوق مصرف‌کنندگان مصوب 1388/12/07 مجلس شورای اسلامی، این آیین‌نامه وضع می‌شود...',
        category: 'آیین‌نامه',
        source: 'judiciary.ir',
        date: '1389/03/12',
        confidence: 0.92,
        language: 'fa',
        wordCount: 12580,
        metadata: {
          chapters: 8,
          articles: 45,
          enforcement: 'active'
        }
      }
    ];

    sampleDocs.forEach(doc => this.addDocument(doc));
  }

  /**
   * Load existing documents from database
   */
  async loadExistingDocuments() {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const documents = request.result;
        documents.forEach(doc => {
          this.documents.set(doc.id, doc);
          this.updateSearchIndex(doc);
        });
        
        // Update metrics
        realTimeMetricsService.updateDatabaseMetrics({
          recordCount: documents.length,
          storageSize: this.calculateStorageSize()
        });
        
        console.log(`📚 Loaded ${documents.length} documents from database`);
      };
      
    } catch (error) {
      console.error('❌ Failed to load documents:', error);
    }
  }

  /**
   * Add new document
   */
  async addDocument(document) {
    try {
      const enrichedDoc = {
        ...document,
        id: document.id || this.generateDocumentId(),
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      
      // Store in memory
      this.documents.set(enrichedDoc.id, enrichedDoc);
      
      // Update search index
      this.updateSearchIndex(enrichedDoc);
      
      // Store in IndexedDB if available
      if (this.db) {
        await this.saveToDatabase(enrichedDoc);
      }
      
      // Update metrics
      realTimeMetricsService.updateDatabaseMetrics({
        recordCount: this.documents.size,
        storageSize: this.calculateStorageSize()
      });
      
      console.log(`📄 Document added: ${enrichedDoc.title}`);
      return enrichedDoc;
      
    } catch (error) {
      console.error('❌ Failed to add document:', error);
      throw error;
    }
  }

  /**
   * Save document to IndexedDB
   */
  async saveToDatabase(document) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.put(document);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Search documents
   */
  searchDocuments(query, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        category = null,
        source = null,
        limit = 50,
        offset = 0,
        sortBy = 'relevance'
      } = options;
      
      let results = Array.from(this.documents.values());
      
      // Filter by category
      if (category) {
        results = results.filter(doc => doc.category === category);
      }
      
      // Filter by source
      if (source) {
        results = results.filter(doc => doc.source === source);
      }
      
      // Text search
      if (query && query.trim()) {
        const searchTerms = query.toLowerCase().split(/\s+/);
        results = results.filter(doc => {
          const searchableText = `${doc.title} ${doc.content}`.toLowerCase();
          return searchTerms.every(term => searchableText.includes(term));
        });
        
        // Calculate relevance scores
        results = results.map(doc => {
          const titleMatches = this.countMatches(doc.title.toLowerCase(), searchTerms);
          const contentMatches = this.countMatches(doc.content.toLowerCase(), searchTerms);
          const relevanceScore = (titleMatches * 3) + contentMatches;
          
          return { ...doc, relevanceScore };
        });
        
        // Sort by relevance
        if (sortBy === 'relevance') {
          results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }
      }
      
      // Sort by other criteria
      if (sortBy === 'date') {
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else if (sortBy === 'title') {
        results.sort((a, b) => a.title.localeCompare(b.title, 'fa'));
      }
      
      // Pagination
      const total = results.length;
      const paginatedResults = results.slice(offset, offset + limit);
      
      const queryTime = Date.now() - startTime;
      
      // Update metrics
      realTimeMetricsService.updateDatabaseMetrics({
        queryTime: queryTime,
        recordCount: this.documents.size
      });
      
      return {
        documents: paginatedResults,
        total,
        query,
        options,
        queryTime,
        hasMore: offset + limit < total
      };
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw error;
    }
  }

  /**
   * Count matches in text
   */
  countMatches(text, terms) {
    return terms.reduce((count, term) => {
      const matches = text.split(term).length - 1;
      return count + matches;
    }, 0);
  }

  /**
   * Get document by ID
   */
  getDocument(id) {
    return this.documents.get(id);
  }

  /**
   * Update document
   */
  async updateDocument(id, updates) {
    const existing = this.documents.get(id);
    if (!existing) {
      throw new Error('Document not found');
    }
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (existing.version || 1) + 1
    };
    
    this.documents.set(id, updated);
    this.updateSearchIndex(updated);
    
    if (this.db) {
      await this.saveToDatabase(updated);
    }
    
    return updated;
  }

  /**
   * Delete document
   */
  async deleteDocument(id) {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error('Document not found');
    }
    
    this.documents.delete(id);
    this.removeFromSearchIndex(id);
    
    if (this.db) {
      const transaction = this.db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      await store.delete(id);
    }
    
    // Update metrics
    realTimeMetricsService.updateDatabaseMetrics({
      recordCount: this.documents.size,
      storageSize: this.calculateStorageSize()
    });
    
    return true;
  }

  /**
   * Get document statistics
   */
  getDocumentStats() {
    const docs = Array.from(this.documents.values());
    
    const categoryStats = {};
    const sourceStats = {};
    const monthlyStats = {};
    
    docs.forEach(doc => {
      // Category statistics
      categoryStats[doc.category] = (categoryStats[doc.category] || 0) + 1;
      
      // Source statistics
      sourceStats[doc.source] = (sourceStats[doc.source] || 0) + 1;
      
      // Monthly statistics
      if (doc.addedAt) {
        const month = doc.addedAt.substring(0, 7); // YYYY-MM
        monthlyStats[month] = (monthlyStats[month] || 0) + 1;
      }
    });
    
    return {
      total: docs.length,
      categories: categoryStats,
      sources: sourceStats,
      monthly: monthlyStats,
      averageWordCount: docs.reduce((sum, doc) => sum + (doc.wordCount || 0), 0) / docs.length,
      lastAdded: docs.reduce((latest, doc) => {
        return doc.addedAt > (latest?.addedAt || '') ? doc : latest;
      }, null)
    };
  }

  /**
   * Update search index
   */
  updateSearchIndex(document) {
    const words = this.extractSearchableWords(document);
    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word).add(document.id);
    });
  }

  /**
   * Remove from search index
   */
  removeFromSearchIndex(documentId) {
    this.searchIndex.forEach((documentIds, word) => {
      documentIds.delete(documentId);
      if (documentIds.size === 0) {
        this.searchIndex.delete(word);
      }
    });
  }

  /**
   * Extract searchable words from document
   */
  extractSearchableWords(document) {
    const text = `${document.title} ${document.content}`.toLowerCase();
    
    // Persian text processing
    const words = text
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 1000); // Limit to prevent memory issues
    
    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Generate unique document ID
   */
  generateDocumentId() {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate storage size
   */
  calculateStorageSize() {
    let totalSize = 0;
    this.documents.forEach(doc => {
      totalSize += JSON.stringify(doc).length;
    });
    return totalSize;
  }

  /**
   * Export documents
   */
  exportDocuments(format = 'json') {
    const docs = Array.from(this.documents.values());
    
    switch (format) {
      case 'json':
        return JSON.stringify(docs, null, 2);
      
      case 'csv':
        const headers = ['ID', 'Title', 'Category', 'Source', 'Date', 'Word Count'];
        const rows = docs.map(doc => [
          doc.id,
          doc.title,
          doc.category,
          doc.source,
          doc.date,
          doc.wordCount || 0
        ]);
        
        return [headers, ...rows].map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
      
      default:
        throw new Error('Unsupported export format');
    }
  }

  /**
   * Import documents
   */
  async importDocuments(data, format = 'json') {
    try {
      let documents = [];
      
      switch (format) {
        case 'json':
          documents = typeof data === 'string' ? JSON.parse(data) : data;
          break;
        
        default:
          throw new Error('Unsupported import format');
      }
      
      let imported = 0;
      for (const doc of documents) {
        try {
          await this.addDocument(doc);
          imported++;
        } catch (error) {
          console.warn(`Failed to import document: ${doc.title}`, error);
        }
      }
      
      return { imported, total: documents.length };
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }

  /**
   * Get recent documents
   */
  getRecentDocuments(limit = 10) {
    const docs = Array.from(this.documents.values())
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, limit);
    
    return docs;
  }

  /**
   * Get popular categories
   */
  getPopularCategories() {
    const stats = this.getDocumentStats();
    return Object.entries(stats.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }

  /**
   * Full-text search with Persian support
   */
  fullTextSearch(query, options = {}) {
    const startTime = Date.now();
    
    // Enhanced Persian search
    const normalizedQuery = this.normalizePersiannText(query);
    const searchTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 1);
    
    const results = Array.from(this.documents.values()).map(doc => {
      const normalizedTitle = this.normalizePersiannText(doc.title);
      const normalizedContent = this.normalizePersiannText(doc.content);
      
      let score = 0;
      let highlights = [];
      
      searchTerms.forEach(term => {
        // Title matches (higher weight)
        const titleMatches = this.findMatches(normalizedTitle, term);
        score += titleMatches.length * 5;
        
        // Content matches
        const contentMatches = this.findMatches(normalizedContent, term);
        score += contentMatches.length;
        
        highlights.push(...titleMatches, ...contentMatches.slice(0, 3));
      });
      
      return {
        document: doc,
        score,
        highlights: highlights.slice(0, 5),
        relevance: score / (doc.wordCount || 1000)
      };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, options.limit || 50);
    
    const queryTime = Date.now() - startTime;
    
    return {
      results,
      query: normalizedQuery,
      queryTime,
      totalFound: results.length
    };
  }

  /**
   * Normalize Persian text for better search
   */
  normalizePersiannText(text) {
    return text
      .replace(/ک/g, 'ک')
      .replace(/ی/g, 'ی')
      .replace(/ء/g, 'ء')
      .toLowerCase()
      .trim();
  }

  /**
   * Find matches in text
   */
  findMatches(text, term) {
    const matches = [];
    let index = text.indexOf(term);
    
    while (index !== -1) {
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + term.length + 50);
      const snippet = text.substring(start, end);
      
      matches.push({
        snippet,
        position: index,
        term
      });
      
      index = text.indexOf(term, index + 1);
    }
    
    return matches;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.db) {
      this.db.close();
    }
    this.documents.clear();
    this.searchIndex.clear();
  }
}

// Create singleton instance
export const legalDocumentService = new LegalDocumentService();
export default legalDocumentService;