/**
 * WebSocket Service for Real-time Updates
 * Handles all real-time communication with backend
 */

import { API_ENDPOINTS, ENVIRONMENT } from '../config/apiEndpoints'
import { shouldDisableWebSocket, shouldUsePollingFallback } from '../utils/githubPagesConfig'

class WebSocketService {
  constructor() {
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.listeners = new Map()
    this.isConnected = false
    this.messageQueue = []
    this.fallbackMode = false
    this.pollingInterval = null
    this.healthCheckInterval = null
    this.connectionTimeout = null
  }

  /**
   * Connect to WebSocket server with health check and fallback
   */
  async connect(url = API_ENDPOINTS.WEB_SOCKET) {
    try {
      console.log('🔌 Connecting to WebSocket:', url)
      
      // First check if backend is available
      const isBackendAvailable = await this.checkBackendHealth()
      
      if (!isBackendAvailable) {
        console.warn('⚠️ Backend not available, falling back to polling mode')
        this.enableFallbackMode()
        return
      }
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.warn('⚠️ WebSocket connection timeout, falling back to polling')
          this.enableFallbackMode()
        }
      }, 5000)
      
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
   * Check if backend is available
   */
  async checkBackendHealth() {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE}/health`, {
        method: 'GET',
        timeout: 5000
      })
      return response.ok
    } catch (error) {
      console.warn('Backend health check failed:', error)
      return false
    }
  }

  /**
   * Enable fallback polling mode
   */
  enableFallbackMode() {
    this.fallbackMode = true
    this.isConnected = false
    
    console.log('🔄 Enabling fallback polling mode')
    
    // Start polling for updates
    this.startPolling()
    
    // Notify listeners about fallback mode
    this.emit('fallback-mode', { 
      status: 'polling', 
      message: 'WebSocket unavailable, using polling fallback' 
    })
  }

  /**
   * Start polling for updates
   */
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
    
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchUpdates()
      } catch (error) {
        console.warn('Polling update failed:', error)
      }
    }, 3000) // Poll every 3 seconds
  }

  /**
   * Fetch updates via HTTP polling
   */
  async fetchUpdates() {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE}/updates`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const updates = await response.json()
        this.handlePollingUpdates(updates)
      }
    } catch (error) {
      console.warn('Failed to fetch updates:', error)
    }
  }

  /**
   * Handle updates received via polling
   */
  handlePollingUpdates(updates) {
    if (updates && updates.length > 0) {
      updates.forEach(update => {
        this.emit(update.type, update)
        this.emit('message', update)
      })
    }
  }

  /**
   * Handle connection open
   */
  handleOpen() {
    console.log('✅ WebSocket connected successfully')
    this.isConnected = true
    this.fallbackMode = false
    this.reconnectAttempts = 0
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
    
    // Stop polling if it was running
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
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
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
    
    // Notify listeners
    this.emit('disconnected', { code: event.code, reason: event.reason })
    
    // Attempt reconnection if not intentional
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('⚠️ Max reconnection attempts reached, enabling fallback mode')
      this.enableFallbackMode()
    }
  }

  /**
   * Handle connection error
   */
  handleError(error) {
    console.error('❌ WebSocket error:', error)
    this.isConnected = false
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
    
    this.emit('error', { error })
    
    // Enable fallback mode on error
    if (!this.fallbackMode) {
      this.enableFallbackMode()
    }
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
    this.fallbackMode = false
    this.messageQueue = []
    
    // Clear all intervals and timeouts
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
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
      fallbackMode: this.fallbackMode,
      readyState: this.socket?.readyState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService()

// Auto-connect on import (if WebSocket is not disabled)
if (!shouldDisableWebSocket()) {
  // Delay connection to allow other services to initialize
  setTimeout(() => {
    webSocketService.connect()
  }, 1000)
  
  // Keep connection alive
  setInterval(() => {
    if (webSocketService.isConnected) {
      webSocketService.ping()
    }
  }, 30000)
} else {
  // Enable polling fallback if WebSocket is disabled
  if (shouldUsePollingFallback()) {
    setTimeout(() => {
      webSocketService.enableFallbackMode()
    }, 1000)
  }
}

export default webSocketService