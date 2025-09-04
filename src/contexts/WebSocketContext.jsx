import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { API_ENDPOINTS } from './SystemContext'

const WebSocketContext = createContext()

export function WebSocketProvider({ children }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [lastMessage, setLastMessage] = useState(null)
  const [metrics, setMetrics] = useState({})
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    try {
      const wsUrl = API_ENDPOINTS.WEB_SOCKET
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      
      socketRef.current = new WebSocket(wsUrl)
      
      socketRef.current.onopen = () => {
        console.log('✅ WebSocket connected')
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        
        // Send initial handshake
        send({
          type: 'handshake',
          client: 'iranian-legal-archive-frontend',
          timestamp: new Date().toISOString()
        })
      }
      
      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 WebSocket message received:', data)
          
          setLastMessage(data)
          handleMessage(data)
        } catch (error) {
          console.error('❌ WebSocket message parsing error:', error)
        }
      }
      
      socketRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        setConnectionStatus('disconnected')
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }
      
      socketRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setConnectionStatus('error')
      }
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error)
      setConnectionStatus('error')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Client disconnecting')
    }
    
    setConnectionStatus('disconnected')
  }

  const send = (data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data))
      return true
    }
    
    console.warn('⚠️ WebSocket not connected, cannot send message')
    return false
  }

  const handleMessage = (data) => {
    switch (data.type) {
      case 'metrics_update':
        setMetrics(prev => ({ ...prev, ...data.metrics }))
        // Dispatch custom event for components to listen
        window.dispatchEvent(new CustomEvent('metricsUpdate', { detail: data.metrics }))
        break
        
      case 'document_processed':
        console.log('📄 Document processed:', data.document)
        window.dispatchEvent(new CustomEvent('documentProcessed', { detail: data.document }))
        break
        
      case 'model_loaded':
        console.log('🤖 Model loaded:', data.model)
        window.dispatchEvent(new CustomEvent('modelLoaded', { detail: data }))
        break
        
      case 'proxy_status_update':
        console.log('🌐 Proxy status update:', data.proxies)
        window.dispatchEvent(new CustomEvent('proxyStatusUpdate', { detail: data.proxies }))
        break
        
      case 'scraping_progress':
        console.log('🕷️ Scraping progress:', data.progress)
        window.dispatchEvent(new CustomEvent('scrapingProgress', { detail: data }))
        break
        
      case 'system_health':
        console.log('💗 System health update:', data.health)
        window.dispatchEvent(new CustomEvent('systemHealthUpdate', { detail: data.health }))
        break
        
      case 'error':
        console.error('❌ WebSocket error message:', data.error)
        window.dispatchEvent(new CustomEvent('systemError', { detail: data.error }))
        break
        
      default:
        console.log('📨 Unknown WebSocket message type:', data.type)
    }
  }

  // Subscribe to specific message types
  const subscribe = (messageType, callback) => {
    const handler = (event) => {
      if (event.detail) {
        callback(event.detail)
      }
    }
    
    const eventName = `${messageType}Update`
    window.addEventListener(eventName, handler)
    
    return () => {
      window.removeEventListener(eventName, handler)
    }
  }

  // Connect on mount
  useEffect(() => {
    // Only connect if not on GitHub Pages (no backend available)
    if (!window.location.hostname.includes('github.io')) {
      connect()
    }
    
    return () => {
      disconnect()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const value = {
    connectionStatus,
    lastMessage,
    metrics,
    connect,
    disconnect,
    send,
    subscribe,
    isConnected: connectionStatus === 'connected'
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}