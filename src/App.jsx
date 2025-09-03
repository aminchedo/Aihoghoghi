import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './components/pages/Dashboard'
import DocumentProcessing from './components/pages/DocumentProcessing'
import SearchInterface from './components/pages/SearchInterface'

// CRITICAL: GitHub Pages compatibility
const isGitHubPages = window.location.hostname.includes('github.io')

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [services, setServices] = useState({
    scraping: { status: 'ready' },
    ai: { status: 'ready' },  
    database: { status: 'ready' }
  })

  useEffect(() => {
    // IMMEDIATE: Skip service initialization on GitHub Pages
    if (isGitHubPages) {
      console.log('GitHub Pages detected - using client-side mode')
      setIsLoading(false)
      return
    }

    // For other platforms, quick initialization
    const initServices = async () => {
      try {
        // Quick health check only
        const response = await fetch('/api/status').catch(() => null)
        if (response?.ok) {
          const data = await response.json()
          setServices(data.services || services)
        }
      } catch (error) {
        console.warn('Services unavailable - using fallback mode')
      } finally {
        setIsLoading(false)
      }
    }

    // Maximum 2 second timeout
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    initServices()

    return () => clearTimeout(timeout)
  }, [])

  // CRITICAL: Show app immediately without waiting
  if (isGitHubPages || !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/process" element={<DocumentProcessing />} />
          <Route path="/search" element={<SearchInterface />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    )
  }

  // Only show loading for non-GitHub Pages
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">در حال بارگذاری...</p>
      </div>
    </div>
  )
}

export default App;