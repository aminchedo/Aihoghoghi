import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import { SystemProvider } from './contexts/SystemContext'
import { WebSocketProvider } from './contexts/WebSocketContext'

// Initialize the Iranian Legal Archive System
console.log('🚀 Iranian Legal Archive System - Starting...')

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SystemProvider>
        <WebSocketProvider>
          <HashRouter>
            <App />
            <Toaster 
              position="top-left"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'Vazirmatn, sans-serif',
                  direction: 'rtl',
                },
              }}
            />
          </HashRouter>
        </WebSocketProvider>
      </SystemProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)