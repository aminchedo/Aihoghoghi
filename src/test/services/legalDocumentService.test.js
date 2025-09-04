import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { legalDocumentService } from '../../services/legalDocumentService'

// Mock the dependencies
vi.mock('../../contexts/SystemContext', () => ({
  API_ENDPOINTS: {
    BASE: 'http://localhost:3000/api'
  }
}))

vi.mock('../../services/realTimeService', () => ({
  realTimeMetricsService: {
    updateDocumentMetrics: vi.fn()
  }
}))

describe('LegalDocumentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'connected' })
      })

      const result = await legalDocumentService.initialize()

      expect(result.success).toBe(true)
      expect(result.status).toBe('initialized')
      expect(legalDocumentService.isInitialized).toBe(true)
    })

    it('should handle initialization failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection failed'))

      const result = await legalDocumentService.initialize()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection failed')
    })
  })

  describe('processDocument', () => {
    it('should process document successfully', async () => {
      const documentData = {
        content: 'Test document content',
        document_type: 'legal',
        language: 'fa'
      }

      const mockResponse = {
        id: 'doc_123',
        title: 'Test Document',
        content: 'Test document content',
        processed: true
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await legalDocumentService.processDocument(documentData)

      expect(result.success).toBe(true)
      expect(result.document).toEqual(mockResponse)
      expect(result.message).toBe('سند با موفقیت پردازش شد')
    })

    it('should handle processing failure', async () => {
      const documentData = { content: 'Test content' }

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await legalDocumentService.processDocument(documentData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Document processing failed')
    })
  })

  describe('searchDocuments', () => {
    it('should search documents successfully', async () => {
      const query = 'test query'
      const options = { limit: 10 }

      const mockResponse = {
        documents: [
          { id: '1', title: 'Document 1', content: 'Content 1' },
          { id: '2', title: 'Document 2', content: 'Content 2' }
        ],
        total: 2
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await legalDocumentService.searchDocuments(query, options)

      expect(result.success).toBe(true)
      expect(result.documents).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.message).toBe('2 سند یافت شد')
    })

    it('should use cache for repeated searches', async () => {
      const query = 'cached query'
      const options = { limit: 10 }

      const mockResponse = {
        documents: [{ id: '1', title: 'Cached Document' }],
        total: 1
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      // First search
      await legalDocumentService.searchDocuments(query, options)
      
      // Second search should use cache
      const result = await legalDocumentService.searchDocuments(query, options)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(1) // Only called once due to caching
    })
  })

  describe('semanticSearch', () => {
    it('should perform semantic search successfully', async () => {
      const query = 'semantic query'
      const options = { threshold: 0.8 }

      const mockResponse = {
        documents: [
          { id: '1', title: 'Semantic Doc 1', similarity: 0.9 },
          { id: '2', title: 'Semantic Doc 2', similarity: 0.85 }
        ],
        total: 2
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await legalDocumentService.semanticSearch(query, options)

      expect(result.success).toBe(true)
      expect(result.documents).toHaveLength(2)
      expect(result.message).toBe('2 سند مرتبط یافت شد')
    })
  })

  describe('nafaqeSearch', () => {
    it('should perform nafaqe search successfully', async () => {
      const query = 'نفقه'
      const options = { caseType: 'family' }

      const mockResponse = {
        documents: [
          { id: '1', title: 'حکم نفقه', case_type: 'نفقه' }
        ],
        total: 1
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await legalDocumentService.nafaqeSearch(query, options)

      expect(result.success).toBe(true)
      expect(result.documents).toHaveLength(1)
      expect(result.message).toBe('1 سند نفقه یافت شد')
    })
  })

  describe('getDocument', () => {
    it('should get document from cache', async () => {
      const documentId = 'cached_doc'
      const cachedDocument = { id: documentId, title: 'Cached Document' }
      
      legalDocumentService.documents.set(documentId, cachedDocument)

      const result = await legalDocumentService.getDocument(documentId)

      expect(result.success).toBe(true)
      expect(result.document).toEqual(cachedDocument)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch document from API when not cached', async () => {
      const documentId = 'new_doc'
      const mockDocument = { id: documentId, title: 'New Document' }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDocument)
      })

      const result = await legalDocumentService.getDocument(documentId)

      expect(result.success).toBe(true)
      expect(result.document).toEqual(mockDocument)
      expect(legalDocumentService.documents.has(documentId)).toBe(true)
    })
  })

  describe('updateDocument', () => {
    it('should update document successfully', async () => {
      const documentId = 'doc_123'
      const updates = { title: 'Updated Title' }
      const updatedDocument = { id: documentId, title: 'Updated Title' }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedDocument)
      })

      const result = await legalDocumentService.updateDocument(documentId, updates)

      expect(result.success).toBe(true)
      expect(result.document).toEqual(updatedDocument)
      expect(result.message).toBe('سند با موفقیت به‌روزرسانی شد')
    })
  })

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      const documentId = 'doc_123'
      
      legalDocumentService.documents.set(documentId, { id: documentId })

      global.fetch.mockResolvedValueOnce({
        ok: true
      })

      const result = await legalDocumentService.deleteDocument(documentId)

      expect(result.success).toBe(true)
      expect(result.message).toBe('سند با موفقیت حذف شد')
      expect(legalDocumentService.documents.has(documentId)).toBe(false)
    })
  })

  describe('getDocumentStats', () => {
    it('should get document statistics', async () => {
      const mockStats = {
        total: 100,
        by_category: { 'حقوق مدنی': 50, 'حقوق جزا': 30 },
        by_type: { 'legal': 80, 'contract': 20 }
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats)
      })

      const result = await legalDocumentService.getDocumentStats()

      expect(result.success).toBe(true)
      expect(result.stats).toEqual(mockStats)
      expect(result.message).toBe('آمار اسناد دریافت شد')
    })
  })

  describe('clearCache', () => {
    it('should clear search cache', () => {
      legalDocumentService.searchCache.set('test_key', 'test_value')
      
      legalDocumentService.clearCache()
      
      expect(legalDocumentService.searchCache.size).toBe(0)
    })
  })

  describe('getStatus', () => {
    it('should return service status', () => {
      legalDocumentService.isInitialized = true
      legalDocumentService.documents.set('doc1', {})
      legalDocumentService.searchCache.set('search1', {})

      const status = legalDocumentService.getStatus()

      expect(status.initialized).toBe(true)
      expect(status.cachedDocuments).toBe(1)
      expect(status.cachedSearches).toBe(1)
      expect(status.baseUrl).toBe('http://localhost:3000/api')
    })
  })
})