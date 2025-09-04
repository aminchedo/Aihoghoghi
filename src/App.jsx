import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSystem } from './contexts/SystemContext'
import { useWebSocket } from './contexts/WebSocketContext'

// Layout Components
import Header from './components/layout/Header'
import EnhancedSidebar from './components/layout/EnhancedSidebar'

// Page Components
import EnhancedDashboard from './components/pages/EnhancedDashboard'
import EnhancedSearchInterface from './components/pages/EnhancedSearchInterface'
import ScrapingDashboard from './components/pages/ScrapingDashboard'
import EnhancedAIAnalysisDashboard from './components/pages/EnhancedAIAnalysisDashboard'
import EnhancedSettings from './components/pages/EnhancedSettings'
import EnhancedProxyDashboard from './components/pages/EnhancedProxyDashboard'
import EnhancedDocumentProcessing from './components/pages/EnhancedDocumentProcessing'

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
        <EnhancedSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<EnhancedDashboard />} />
              <Route path="/dashboard" element={<EnhancedDashboard />} />
              <Route path="/search" element={<EnhancedSearchInterface />} />
              <Route path="/scraping" element={<ScrapingDashboard />} />
              <Route path="/ai-analysis" element={<EnhancedAIAnalysisDashboard />} />
              <Route path="/proxy-management" element={<EnhancedProxyDashboard />} />
              <Route path="/document-processing" element={<EnhancedDocumentProcessing />} />
              <Route path="/settings" element={<EnhancedSettings />} />
              <Route path="*" element={<EnhancedDashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App