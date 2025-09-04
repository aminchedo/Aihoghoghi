import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

const WebSocketContext = createContext()

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = () => {
    try {
      // In production, this would be your WebSocket server URL
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com/ws'
        : 'ws://localhost:8000/ws'
      
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        setIsConnected(true)
        setError(null)
        console.log('WebSocket connected')
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }
      
      wsRef.current.onclose = () => {
        setIsConnected(false)
        console.log('WebSocket disconnected')
        
        // Attempt to reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }
      
      wsRef.current.onerror = (error) => {
        setError(error)
        console.error('WebSocket error:', error)
      }
    } catch (err) {
      setError(err)
      console.error('Failed to create WebSocket connection:', err)
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
  }

  const sendMessage = (message) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [])

  const value = {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}