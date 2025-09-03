/**
 * WebSocket Service for Real-time Updates
 * Handles all real-time communication with backend
 */

import { API_ENDPOINTS } from '../contexts/SystemContext'

class WebSocketService {
  constructor() {
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.listeners = new Map()
    this.isConnected = false
    this.messageQueue = []
  }

  /**
   * Connect to WebSocket server
   */
  connect(url = API_ENDPOINTS.WEB_SOCKET) {
    try {
      console.log('🔌 Connecting to WebSocket:', url)
      this.socket = new WebSocket(url)
      
      this.socket.onopen = this.handleOpen.bind(this)
      this.socket.onmessage = this.handleMessage.bind(this)
      this.socket.onclose = this.handleClose.bind(this)
      this.socket.onerror = this.handleError.bind(this)
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error)
      this.handleError(error)
    }
  }

  /**
   * Handle connection open
   */
  handleOpen() {
    console.log('✅ WebSocket connected successfully')
    this.isConnected = true
    this.reconnectAttempts = 0
    
    // Send handshake
    this.send({
      type: 'handshake',
      client: 'iranian-legal-archive-frontend',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    })
    
    // Send queued messages
    this.flushMessageQueue()
    
    // Notify listeners
    this.emit('connected', { status: 'connected' })
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data)
      console.log('📨 WebSocket message received:', data)
      
      // Emit to specific listeners
      this.emit(data.type, data)
      
      // Emit to general listeners
      this.emit('message', data)
      
    } catch (error) {
      console.error('❌ WebSocket message parsing error:', error)
    }
  }

  /**
   * Handle connection close
   */
  handleClose(event) {
    console.log('🔌 WebSocket disconnected:', event.code, event.reason)
    this.isConnected = false
    
    // Notify listeners
    this.emit('disconnected', { code: event.code, reason: event.reason })
    
    // Attempt reconnection if not intentional
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  /**
   * Handle connection error
   */
  handleError(error) {
    console.error('❌ WebSocket error:', error)
    this.emit('error', { error })
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    )
    
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  /**
   * Send message to server
   */
  send(data) {
    if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
      return true
    } else {
      // Queue message for later
      this.messageQueue.push(data)
      console.warn('⚠️ WebSocket not connected, message queued')
      return false
    }
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('❌ WebSocket listener error:', error)
        }
      })
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting')
    }
    this.isConnected = false
    this.messageQueue = []
  }

  /**
   * Request real-time metrics updates
   */
  requestMetricsUpdates(interval = 5000) {
    this.send({
      type: 'subscribe_metrics',
      interval: interval
    })
  }

  /**
   * Request document processing updates
   */
  requestProcessingUpdates() {
    this.send({
      type: 'subscribe_processing'
    })
  }

  /**
   * Request proxy status updates
   */
  requestProxyUpdates() {
    this.send({
      type: 'subscribe_proxies'
    })
  }

  /**
   * Request model status updates
   */
  requestModelUpdates() {
    this.send({
      type: 'subscribe_models'
    })
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    this.send({
      type: 'ping',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      readyState: this.socket?.readyState,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService()

// Auto-connect on import (if not on GitHub Pages)
if (!window.location.hostname.includes('github.io')) {
  webSocketService.connect()
  
  // Keep connection alive
  setInterval(() => {
    if (webSocketService.isConnected) {
      webSocketService.ping()
    }
  }, 30000)
}

export default webSocketService