import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSystem } from './contexts/SystemContext'
import { useWebSocket } from './contexts/WebSocketContext'

// Layout Components
import Header from './components/layout/Header'
import Sidebar from './components/layout/EnhancedSidebar'

// Page Components
import Dashboard from './components/pages/EnhancedDashboard'
import SearchInterface from './components/pages/EnhancedSearchInterface'
import ScrapingDashboard from './components/pages/ScrapingDashboard'
import AIAnalysisDashboard from './components/pages/EnhancedAIAnalysisDashboard'
import Settings from './components/pages/EnhancedSettings'
import ProxyDashboard from './components/pages/EnhancedProxyDashboard'
import DocumentProcessing from './components/pages/EnhancedDocumentProcessing'

// UI Components
import LoadingOverlay from './components/ui/LoadingOverlay'
import SystemStatusIndicator from './components/ui/SystemStatusIndicator'

function App() {
  const { isLoading, connectionStatus, systemHealth } = useSystem()
  const { isConnected } = useWebSocket()

  // Show loading overlay during initialization
  if (isLoading) {
    return <LoadingOverlay message="در حال راه‌اندازی سیستم آرشیو حقوقی..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" dir="rtl">
      {/* System Status Indicator */}
      <SystemStatusIndicator 
        connectionStatus={connectionStatus}
        systemHealth={systemHealth}
        isWebSocketConnected={isConnected}
      />
      
      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/search" element={<SearchInterface />} />
              <Route path="/scraping" element={<ScrapingDashboard />} />
              <Route path="/ai-analysis" element={<AIAnalysisDashboard />} />
              <Route path="/proxy-management" element={<ProxyDashboard />} />
              <Route path="/document-processing" element={<DocumentProcessing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App