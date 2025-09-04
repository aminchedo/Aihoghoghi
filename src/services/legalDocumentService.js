/**
 * Legal Document Service for Iranian Legal Archive
 * Handles document processing, search, and management
 */

import { API_ENDPOINTS } from '../config/apiEndpoints';
import { realTimeMetricsService } from './realTimeService';

class LegalDocumentService {
  constructor() {
    this.baseUrl = API_ENDPOINTS.BASE;
    this.documents = new Map();
    this.searchCache = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the document service
   */
  async initialize() {
    try {
      console.log('📄 Initializing Legal Document Service...');
      
      // Test connection to backend
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('✅ Legal Document Service initialized');
      
      return { success: true, status: 'initialized' };
    } catch (error) {
      console.error('❌ Legal Document Service initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test connection to backend
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Backend connection failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Backend not available, using local mode');
      return { status: 'local_mode' };
    }
  }

  /**
   * Process a legal document
   */
  async processDocument(documentData) {
    try {
      realTimeMetricsService.updateDocumentMetrics('processing_started');
      
      const response = await fetch(`${this.baseUrl}/api/documents/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
      });

      if (!response.ok) {
        throw new Error(`Document processing failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the processed document
      this.documents.set(result.id, result);
      
      realTimeMetricsService.updateDocumentMetrics('processing_completed');
      
      return {
        success: true,
        document: result,
        message: 'سند با موفقیت پردازش شد'
      };
    } catch (error) {
      console.error('Document processing error:', error);
      realTimeMetricsService.updateDocumentMetrics('processing_failed');
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در پردازش سند'
      };
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(query, options = {}) {
    try {
      const cacheKey = `${query}_${JSON.stringify(options)}`;
      
      // Check cache first
      if (this.searchCache.has(cacheKey)) {
        return this.searchCache.get(cacheKey);
      }

      realTimeMetricsService.updateDocumentMetrics('search_started');

      const searchData = {
        query,
        limit: options.limit || 20,
        offset: options.offset || 0,
        filters: options.filters || {},
        sortBy: options.sortBy || 'relevance'
      };

      const response = await fetch(`${this.baseUrl}/api/documents/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the results
      this.searchCache.set(cacheKey, result);
      
      realTimeMetricsService.updateDocumentMetrics('search_completed');
      
      return {
        success: true,
        documents: result.documents || [],
        total: result.total || 0,
        message: `${result.total || 0} سند یافت شد`
      };
    } catch (error) {
      console.error('Document search error:', error);
      realTimeMetricsService.updateDocumentMetrics('search_failed');
      
      return {
        success: false,
        documents: [],
        total: 0,
        error: error.message,
        message: 'خطا در جستجوی اسناد'
      };
    }
  }

  /**
   * Semantic search for documents
   */
  async semanticSearch(query, options = {}) {
    try {
      realTimeMetricsService.updateDocumentMetrics('semantic_search_started');

      const searchData = {
        query,
        limit: options.limit || 20,
        threshold: options.threshold || 0.7,
        category: options.category || null
      };

      const response = await fetch(`${this.baseUrl}/api/documents/semantic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData)
      });

      if (!response.ok) {
        throw new Error(`Semantic search failed: ${response.status}`);
      }

      const result = await response.json();
      
      realTimeMetricsService.updateDocumentMetrics('semantic_search_completed');
      
      return {
        success: true,
        documents: result.documents || [],
        total: result.total || 0,
        message: `${result.total || 0} سند مرتبط یافت شد`
      };
    } catch (error) {
      console.error('Semantic search error:', error);
      realTimeMetricsService.updateDocumentMetrics('semantic_search_failed');
      
      return {
        success: false,
        documents: [],
        total: 0,
        error: error.message,
        message: 'خطا در جستجوی معنایی'
      };
    }
  }

  /**
   * Nafaqe (family law) specific search
   */
  async nafaqeSearch(query, options = {}) {
    try {
      realTimeMetricsService.updateDocumentMetrics('nafaqe_search_started');

      const searchData = {
        query,
        limit: options.limit || 20,
        caseType: options.caseType || 'all',
        courtLevel: options.courtLevel || 'all'
      };

      const response = await fetch(`${this.baseUrl}/api/documents/nafaqe-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData)
      });

      if (!response.ok) {
        throw new Error(`Nafaqe search failed: ${response.status}`);
      }

      const result = await response.json();
      
      realTimeMetricsService.updateDocumentMetrics('nafaqe_search_completed');
      
      return {
        success: true,
        documents: result.documents || [],
        total: result.total || 0,
        message: `${result.total || 0} سند نفقه یافت شد`
      };
    } catch (error) {
      console.error('Nafaqe search error:', error);
      realTimeMetricsService.updateDocumentMetrics('nafaqe_search_failed');
      
      return {
        success: false,
        documents: [],
        total: 0,
        error: error.message,
        message: 'خطا در جستجوی نفقه'
      };
    }
  }

  /**
   * Get a specific document
   */
  async getDocument(documentId) {
    try {
      // Check cache first
      if (this.documents.has(documentId)) {
        return {
          success: true,
          document: this.documents.get(documentId)
        };
      }

      const response = await fetch(`${this.baseUrl}/api/documents/${documentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Document retrieval failed: ${response.status}`);
      }

      const document = await response.json();
      
      // Cache the document
      this.documents.set(documentId, document);
      
      return {
        success: true,
        document,
        message: 'سند با موفقیت دریافت شد'
      };
    } catch (error) {
      console.error('Document retrieval error:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در دریافت سند'
      };
    }
  }

  /**
   * Update a document
   */
  async updateDocument(documentId, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Document update failed: ${response.status}`);
      }

      const updatedDocument = await response.json();
      
      // Update cache
      this.documents.set(documentId, updatedDocument);
      
      return {
        success: true,
        document: updatedDocument,
        message: 'سند با موفقیت به‌روزرسانی شد'
      };
    } catch (error) {
      console.error('Document update error:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در به‌روزرسانی سند'
      };
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Document deletion failed: ${response.status}`);
      }

      // Remove from cache
      this.documents.delete(documentId);
      
      return {
        success: true,
        message: 'سند با موفقیت حذف شد'
      };
    } catch (error) {
      console.error('Document deletion error:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در حذف سند'
      };
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats() {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Stats retrieval failed: ${response.status}`);
      }

      const stats = await response.json();
      
      return {
        success: true,
        stats,
        message: 'آمار اسناد دریافت شد'
      };
    } catch (error) {
      console.error('Document stats error:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'خطا در دریافت آمار اسناد'
      };
    }
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
    console.log('📄 Document search cache cleared');
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      cachedDocuments: this.documents.size,
      cachedSearches: this.searchCache.size,
      baseUrl: this.baseUrl
    };
  }
}

// Create and export singleton instance
export const legalDocumentService = new LegalDocumentService();