import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { smartScrapingService } from '../../services/smartScrapingService'

// Mock the dependencies
vi.mock('../../contexts/SystemContext', () => ({
  API_ENDPOINTS: {
    BASE: 'http://localhost:3000/api'
  }
}))

vi.mock('../../services/realTimeService', () => ({
  realTimeMetricsService: {
    updateScrapingMetrics: vi.fn()
  }
}))

describe('SmartScrapingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    smartScrapingService.activeJobs.clear()
    smartScrapingService.proxyList = []
    smartScrapingService.currentProxyIndex = 0
    smartScrapingService.rateLimiter.requests = 0
    smartScrapingService.rateLimiter.lastReset = Date.now()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ proxies: [{ id: 'proxy1' }] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'test_passed' })
        })

      const result = await smartScrapingService.initialize()

      expect(result.success).toBe(true)
      expect(result.status).toBe('initialized')
      expect(smartScrapingService.isInitialized).toBe(true)
      expect(smartScrapingService.proxyList).toHaveLength(1)
    })

    it('should handle initialization failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Initialization failed'))

      const result = await smartScrapingService.initialize()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Initialization failed')
    })
  })

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', () => {
      smartScrapingService.rateLimiter.requests = 50
      smartScrapingService.rateLimiter.maxRequests = 100

      const result = smartScrapingService.checkRateLimit()

      expect(result).toBe(true)
    })

    it('should block requests exceeding rate limit', () => {
      smartScrapingService.rateLimiter.requests = 100
      smartScrapingService.rateLimiter.maxRequests = 100

      const result = smartScrapingService.checkRateLimit()

      expect(result).toBe(false)
    })

    it('should reset rate limit after window expires', () => {
      smartScrapingService.rateLimiter.requests = 100
      smartScrapingService.rateLimiter.maxRequests = 100
      smartScrapingService.rateLimiter.lastReset = Date.now() - 70000 // 70 seconds ago

      const result = smartScrapingService.checkRateLimit()

      expect(result).toBe(true)
      expect(smartScrapingService.rateLimiter.requests).toBe(0)
    })
  })

  describe('getNextProxy', () => {
    it('should return next proxy in rotation', () => {
      smartScrapingService.proxyList = [
        { id: 'proxy1', host: 'proxy1.com' },
        { id: 'proxy2', host: 'proxy2.com' },
        { id: 'proxy3', host: 'proxy3.com' }
      ]

      const proxy1 = smartScrapingService.getNextProxy()
      const proxy2 = smartScrapingService.getNextProxy()
      const proxy3 = smartScrapingService.getNextProxy()
      const proxy4 = smartScrapingService.getNextProxy() // Should cycle back

      expect(proxy1.id).toBe('proxy1')
      expect(proxy2.id).toBe('proxy2')
      expect(proxy3.id).toBe('proxy3')
      expect(proxy4.id).toBe('proxy1') // Cycled back
    })

    it('should return null when no proxies available', () => {
      smartScrapingService.proxyList = []

      const proxy = smartScrapingService.getNextProxy()

      expect(proxy).toBeNull()
    })
  })

  describe('scrapeUrl', () => {
    it('should scrape URL successfully', async () => {
      const url = 'https://example.com'
      const options = { timeout: 30000 }

      const mockResponse = {
        job_id: 'scrape_123',
        url: url,
        status: 'completed',
        content: 'Scraped content'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await smartScrapingService.scrapeUrl(url, options)

      expect(result.success).toBe(true)
      expect(result.jobId).toBeDefined()
      expect(result.data).toEqual(mockResponse)
      expect(result.message).toBe('صفحه با موفقیت استخراج شد')
      expect(smartScrapingService.activeJobs.size).toBe(1)
    })

    it('should handle rate limit exceeded', async () => {
      smartScrapingService.rateLimiter.requests = 100
      smartScrapingService.rateLimiter.maxRequests = 100

      const result = await smartScrapingService.scrapeUrl('https://example.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Rate limit exceeded')
    })

    it('should handle scraping failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await smartScrapingService.scrapeUrl('https://example.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Scraping failed')
    })
  })

  describe('scrapeDocument', () => {
    it('should scrape document successfully', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const options = { extractText: true }

      const mockResponse = {
        job_id: 'doc_123',
        filename: 'test.pdf',
        status: 'completed',
        content: 'Extracted text'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await smartScrapingService.scrapeDocument(file, options)

      expect(result.success).toBe(true)
      expect(result.jobId).toBeDefined()
      expect(result.data).toEqual(mockResponse)
      expect(result.message).toBe('سند با موفقیت استخراج شد')
    })

    it('should handle document scraping failure', async () => {
      const file = new File(['test content'], 'test.pdf')

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await smartScrapingService.scrapeDocument(file)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Document scraping failed')
    })
  })

  describe('getScrapingStatus', () => {
    it('should get specific job status', async () => {
      const jobId = 'test_job'
      const jobData = {
        id: jobId,
        url: 'https://example.com',
        status: 'completed',
        startTime: Date.now()
      }

      smartScrapingService.activeJobs.set(jobId, jobData)

      const result = await smartScrapingService.getScrapingStatus(jobId)

      expect(result.success).toBe(true)
      expect(result.job).toEqual(jobData)
      expect(result.message).toBe('وضعیت کار دریافت شد')
    })

    it('should return error for non-existent job', async () => {
      const result = await smartScrapingService.getScrapingStatus('non_existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Job not found')
    })

    it('should get all jobs status', async () => {
      const jobs = [
        { id: 'job1', status: 'completed' },
        { id: 'job2', status: 'running' },
        { id: 'job3', status: 'failed' }
      ]

      jobs.forEach(job => smartScrapingService.activeJobs.set(job.id, job))

      const result = await smartScrapingService.getScrapingStatus()

      expect(result.success).toBe(true)
      expect(result.jobs).toHaveLength(3)
      expect(result.total).toBe(3)
      expect(result.active).toBe(1)
      expect(result.completed).toBe(1)
      expect(result.failed).toBe(1)
    })
  })

  describe('stopScraping', () => {
    it('should stop scraping job successfully', async () => {
      const jobId = 'test_job'
      const jobData = {
        id: jobId,
        url: 'https://example.com',
        status: 'running'
      }

      smartScrapingService.activeJobs.set(jobId, jobData)

      global.fetch.mockResolvedValueOnce({
        ok: true
      })

      const result = await smartScrapingService.stopScraping(jobId)

      expect(result.success).toBe(true)
      expect(result.message).toBe('کار متوقف شد')
      expect(smartScrapingService.activeJobs.get(jobId).status).toBe('stopped')
    })

    it('should return error for non-existent job', async () => {
      const result = await smartScrapingService.stopScraping('non_existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Job not found')
    })
  })

  describe('getProxyStatus', () => {
    it('should get proxy status successfully', async () => {
      const mockStatus = {
        proxies: [
          { id: 'proxy1', status: 'active' },
          { id: 'proxy2', status: 'inactive' }
        ],
        total: 2,
        active: 1
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      })

      const result = await smartScrapingService.getProxyStatus()

      expect(result.success).toBe(true)
      expect(result.status).toEqual(mockStatus)
      expect(result.message).toBe('وضعیت پروکسی‌ها دریافت شد')
    })
  })

  describe('clearCompletedJobs', () => {
    it('should clear completed jobs', () => {
      const jobs = [
        { id: 'job1', status: 'completed' },
        { id: 'job2', status: 'running' },
        { id: 'job3', status: 'failed' },
        { id: 'job4', status: 'stopped' }
      ]

      jobs.forEach(job => smartScrapingService.activeJobs.set(job.id, job))

      smartScrapingService.clearCompletedJobs()

      expect(smartScrapingService.activeJobs.size).toBe(1)
      expect(smartScrapingService.activeJobs.has('job2')).toBe(true)
    })
  })

  describe('getStatus', () => {
    it('should return service status', () => {
      smartScrapingService.isInitialized = true
      smartScrapingService.activeJobs.set('job1', {})
      smartScrapingService.proxyList = [{ id: 'proxy1' }, { id: 'proxy2' }]
      smartScrapingService.currentProxyIndex = 1
      smartScrapingService.rateLimiter.requests = 50

      const status = smartScrapingService.getStatus()

      expect(status.initialized).toBe(true)
      expect(status.activeJobs).toBe(1)
      expect(status.proxyCount).toBe(2)
      expect(status.currentProxyIndex).toBe(1)
      expect(status.rateLimit.requests).toBe(50)
      expect(status.rateLimit.remaining).toBe(50)
    })
  })
})