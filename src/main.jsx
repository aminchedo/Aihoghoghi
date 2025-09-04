import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { API_ENDPOINTS, ENVIRONMENT } from './config/apiEndpoints'
import { initializeGitHubPagesConfig } from './utils/githubPagesConfig'

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  
  // Handle API_ENDPOINTS initialization errors
  if (event.error.message.includes('API_ENDPOINTS')) {
    console.warn('API_ENDPOINTS initialization error detected, initializing fallback configuration')
    
    // Initialize fallback configuration
    if (!window.API_ENDPOINTS) {
      window.API_ENDPOINTS = {
        BASE: ENVIRONMENT.isDevelopment() 
          ? 'http://localhost:7860/api' 
          : 'https://your-backend-domain.com/api',
        WEB_SOCKET: ENVIRONMENT.isDevelopment()
          ? 'ws://localhost:7860/ws'
          : 'wss://your-backend-domain.com/ws'
      }
    }
  }
})

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  
  // Prevent the default behavior (logging to console)
  event.preventDefault()
})

// Initialize GitHub Pages configuration if needed
initializeGitHubPagesConfig()

// Initialize global configuration
window.iranianLegalArchive = {
  ...window.iranianLegalArchive,
  config: {
    API_ENDPOINTS,
    ENVIRONMENT,
    version: '2.0.0',
    initialized: true
  }
}

// Log configuration on startup
console.log('🚀 Iranian Legal Archive System starting...')
console.log('📋 Configuration:', {
  environment: ENVIRONMENT.isDevelopment() ? 'development' : 'production',
  baseUrl: API_ENDPOINTS.BASE,
  websocketUrl: API_ENDPOINTS.WEB_SOCKET,
  isGitHubPages: ENVIRONMENT.isGitHubPages()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)