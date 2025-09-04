import React, { createContext, useContext, useEffect, useState, useRef } from 'react'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const wsRef = useRef(null)

  const connect = () => {
    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://iranian-legal-archive.com/ws'
        : 'ws://localhost:3000/ws'
      
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        console.log('WebSocket connected')
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        setConnectionStatus('disconnected')
        console.log('WebSocket disconnected')
      }

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error')
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const sendMessage = (message) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected')
    }
  }

  useEffect(() => {
    // Connect on mount
    connect()

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [])

  const value = {
    isConnected,
    lastMessage,
    connectionStatus,
    connect,
    disconnect,
    sendMessage
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}