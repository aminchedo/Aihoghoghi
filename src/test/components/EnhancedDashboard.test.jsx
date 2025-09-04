import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EnhancedDashboard from '../../components/pages/EnhancedDashboard'

// Mock the contexts
vi.mock('../../contexts/SystemContext', () => ({
  useSystem: () => ({
    metrics: {
      documents: { total: 100, processed: 95, pending: 5 },
      system: { cpu_usage: 45.2, memory_usage: 67.8, disk_usage: 23.1 },
      api: { requests_per_minute: 150, average_response_time: 0.25, error_rate: 0.02 }
    },
    documents: [],
    proxies: [],
    connectionStatus: 'connected',
    loadSystemMetrics: vi.fn()
  })
}))

vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocket: () => ({
    isConnected: true,
    metrics: { active_connections: 5 }
  })
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  }
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Server: () => <div data-testid="server-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Search: () => <div data-testid="search-icon" />,
  RefreshCw: () => <div data-testid="refresh-cw-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  BarChart3: () => <div data-testid="bar-chart-3-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Settings: () => <div data-testid="settings-icon" />
}))

const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('EnhancedDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard with all main sections', () => {
    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Check for main dashboard elements
    expect(screen.getByText('داشبورد سیستم')).toBeInTheDocument()
    expect(screen.getByText('آمار کلی')).toBeInTheDocument()
    expect(screen.getByText('وضعیت سیستم')).toBeInTheDocument()
    expect(screen.getByText('فعالیت‌های اخیر')).toBeInTheDocument()
  })

  it('should display system metrics', () => {
    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Check for metrics display
    expect(screen.getByText('100')).toBeInTheDocument() // Total documents
    expect(screen.getByText('95')).toBeInTheDocument() // Processed documents
    expect(screen.getByText('5')).toBeInTheDocument() // Pending documents
  })

  it('should display system health indicators', () => {
    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Check for health indicators
    expect(screen.getByText('45.2%')).toBeInTheDocument() // CPU usage
    expect(screen.getByText('67.8%')).toBeInTheDocument() // Memory usage
    expect(screen.getByText('23.1%')).toBeInTheDocument() // Disk usage
  })

  it('should display recent activity', () => {
    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Check for recent activity items
    expect(screen.getByText('سند جدید از مجلس پردازش شد')).toBeInTheDocument()
    expect(screen.getByText('پروکسی ایرانی جدید فعال شد')).toBeInTheDocument()
    expect(screen.getByText('جستجوی نفقه انجام شد')).toBeInTheDocument()
    expect(screen.getByText('تحلیل Persian BERT تکمیل شد')).toBeInTheDocument()
  })

  it('should have refresh button functionality', async () => {
    const mockLoadSystemMetrics = vi.fn()
    
    vi.mocked(require('../../contexts/SystemContext').useSystem).mockReturnValue({
      metrics: {
        documents: { total: 100, processed: 95, pending: 5 },
        system: { cpu_usage: 45.2, memory_usage: 67.8, disk_usage: 23.1 },
        api: { requests_per_minute: 150, average_response_time: 0.25, error_rate: 0.02 }
      },
      documents: [],
      proxies: [],
      connectionStatus: 'connected',
      loadSystemMetrics: mockLoadSystemMetrics
    })

    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    const refreshButton = screen.getByText('بروزرسانی متریک‌ها')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(mockLoadSystemMetrics).toHaveBeenCalled()
    })
  })

  it('should display connection status', () => {
    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Check for connection status
    expect(screen.getByText('متصل')).toBeInTheDocument()
  })

  it('should display WebSocket connection status', () => {
    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Check for WebSocket status
    expect(screen.getByText('5')).toBeInTheDocument() // Active connections
  })

  it('should have navigation links', () => {
    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Check for navigation links
    expect(screen.getByText('جستجو در پایگاه داده')).toBeInTheDocument()
    expect(screen.getByText('رابط استخراج')).toBeInTheDocument()
    expect(screen.getByText('تحلیل هوش مصنوعی')).toBeInTheDocument()
    expect(screen.getByText('تنظیمات')).toBeInTheDocument()
  })

  it('should display API performance metrics', () => {
    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Check for API metrics
    expect(screen.getByText('150')).toBeInTheDocument() // Requests per minute
    expect(screen.getByText('0.25s')).toBeInTheDocument() // Average response time
    expect(screen.getByText('0.02%')).toBeInTheDocument() // Error rate
  })

  it('should handle loading state', async () => {
    vi.mocked(require('../../contexts/SystemContext').useSystem).mockReturnValue({
      metrics: null,
      documents: [],
      proxies: [],
      connectionStatus: 'connecting',
      loadSystemMetrics: vi.fn()
    })

    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Should show loading state
    expect(screen.getByText('در حال بارگذاری...')).toBeInTheDocument()
  })

  it('should display error state when connection fails', () => {
    vi.mocked(require('../../contexts/SystemContext').useSystem).mockReturnValue({
      metrics: {
        documents: { total: 0, processed: 0, pending: 0 },
        system: { cpu_usage: 0, memory_usage: 0, disk_usage: 0 },
        api: { requests_per_minute: 0, average_response_time: 0, error_rate: 0 }
      },
      documents: [],
      proxies: [],
      connectionStatus: 'error',
      loadSystemMetrics: vi.fn()
    })

    render(
      <TestWrapper>
        <EnhancedDashboard />
      </TestWrapper>
    )

    // Should show error state
    expect(screen.getByText('خطا در اتصال')).toBeInTheDocument()
  })
})