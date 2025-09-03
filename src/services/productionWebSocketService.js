import { PRODUCTION_ENDPOINTS, WEBSOCKET_EVENTS } from '../config/productionEndpoints';

class ProductionWebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 15;
    this.connected = false;
    this.eventListeners = new Map();
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.messageQueue = [];
    this.isReconnecting = false;
  }

  connect(url = PRODUCTION_ENDPOINTS.WS) {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('🔗 WebSocket already connected');
        resolve();
        return;
      }

      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        console.log('🔗 WebSocket connected - Real-time data enabled');
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Process queued messages
        this.processMessageQueue();
        
        // Emit connection event
        this.emit('connected');
        
        resolve();
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealTimeMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.socket.onclose = (event) => {
        this.connected = false;
        this.stopHeartbeat();
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        
        // Emit disconnection event
        this.emit('disconnected', event);
        
        if (!this.isReconnecting) {
          this.handleReconnection();
        }
        
        reject(new Error('WebSocket disconnected'));
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    this.connected = false;
    this.stopHeartbeat();
    this.clearReconnectTimeout();
  }

  send(eventType, data) {
    const message = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      data: data
    };

    if (this.connected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      console.log('📝 Message queued, waiting for connection:', eventType);
    }
  }

  handleRealTimeMessage(data) {
    console.log('📨 Received real-time message:', data);
    
    // Process ACTUAL real-time data
    switch(data.event_type) {
      case WEBSOCKET_EVENTS.DOCUMENT_PROCESSING_UPDATE:
        this.updateRealProcessingStatus(data.payload);
        break;
      case WEBSOCKET_EVENTS.AI_ANALYSIS_COMPLETE:
        this.displayRealAnalysisResults(data.payload);
        break;
      case WEBSOCKET_EVENTS.SYSTEM_METRICS_UPDATE:
        this.updateLiveMetrics(data.payload);
        break;
      case WEBSOCKET_EVENTS.PROXY_ROTATION_EVENT:
        this.updateRealProxyStatus(data.payload);
        break;
      case WEBSOCKET_EVENTS.SCRAPING_PROGRESS:
        this.updateRealScrapingProgress(data.payload);
        break;
      case WEBSOCKET_EVENTS.USER_SESSION_UPDATE:
        this.updateUserSession(data.payload);
        break;
      case WEBSOCKET_EVENTS.SYSTEM_ALERT:
        this.showSystemAlert(data.payload);
        break;
      case WEBSOCKET_EVENTS.MAINTENANCE_NOTICE:
        this.showMaintenanceNotice(data.payload);
        break;
      default:
        console.log('Unknown event type:', data.event_type);
    }

    // Emit event to listeners
    this.emit(data.event_type, data.payload);
  }

  // Real-time data update functions
  updateRealProcessingStatus(payload) {
    const { document_id, status, progress, message } = payload;
    
    // Update UI with real processing status
    const statusElement = document.querySelector(`[data-document-id="${document_id}"] .processing-status`);
    if (statusElement) {
      statusElement.textContent = message || status;
      statusElement.className = `processing-status status-${status}`;
    }

    // Update progress bar if exists
    const progressElement = document.querySelector(`[data-document-id="${document_id}"] .progress-bar`);
    if (progressElement && progress !== undefined) {
      progressElement.style.width = `${progress}%`;
    }

    // Emit custom event for components
    window.dispatchEvent(new CustomEvent('documentProcessingUpdate', {
      detail: { document_id, status, progress, message }
    }));
  }

  displayRealAnalysisResults(payload) {
    const { document_id, analysis_type, results, confidence } = payload;
    
    // Update AI analysis results in UI
    const resultsContainer = document.querySelector(`[data-document-id="${document_id}"] .ai-results`);
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="ai-result">
          <h4>${analysis_type} Analysis</h4>
          <p>Confidence: ${confidence}%</p>
          <div class="results-content">${JSON.stringify(results, null, 2)}</div>
        </div>
      `;
    }

    // Emit custom event for components
    window.dispatchEvent(new CustomEvent('aiAnalysisComplete', {
      detail: { document_id, analysis_type, results, confidence }
    }));
  }

  updateLiveMetrics(payload) {
    const { metrics, timestamp } = payload;
    
    // Update dashboard metrics in real-time
    Object.entries(metrics).forEach(([key, value]) => {
      const metricElement = document.querySelector(`[data-metric="${key}"]`);
      if (metricElement) {
        metricElement.textContent = this.formatMetricValue(key, value);
        metricElement.classList.add('updated');
        
        // Remove update animation after delay
        setTimeout(() => {
          metricElement.classList.remove('updated');
        }, 1000);
      }
    });

    // Emit custom event for components
    window.dispatchEvent(new CustomEvent('metricsUpdate', {
      detail: { metrics, timestamp }
    }));
  }

  updateRealProxyStatus(payload) {
    const { proxy_id, status, performance, location } = payload;
    
    // Update proxy status display
    const proxyElement = document.querySelector(`[data-proxy-id="${proxy_id}"]`);
    if (proxyElement) {
      proxyElement.className = `proxy-item status-${status}`;
      proxyElement.querySelector('.status').textContent = status;
      proxyElement.querySelector('.performance').textContent = `${performance}ms`;
      proxyElement.querySelector('.location').textContent = location;
    }

    // Emit custom event for components
    window.dispatchEvent(new CustomEvent('proxyStatusUpdate', {
      detail: { proxy_id, status, performance, location }
    }));
  }

  updateRealScrapingProgress(payload) {
    const { task_id, progress, status, message, documents_found } = payload;
    
    // Update scraping progress in UI
    const progressElement = document.querySelector(`[data-task-id="${task_id}"] .scraping-progress`);
    if (progressElement) {
      progressElement.style.width = `${progress}%`;
      progressElement.textContent = `${progress}%`;
    }

    const statusElement = document.querySelector(`[data-task-id="${task_id}"] .scraping-status`);
    if (statusElement) {
      statusElement.textContent = message || status;
    }

    // Emit custom event for components
    window.dispatchEvent(new CustomEvent('scrapingProgress', {
      detail: { task_id, progress, status, message, documents_found }
    }));
  }

  updateUserSession(payload) {
    const { user_id, session_data, permissions } = payload;
    
    // Update user session information
    if (window.currentUser && window.currentUser.id === user_id) {
      window.currentUser = { ...window.currentUser, ...session_data };
      
      // Update UI elements
      const userElement = document.querySelector('.user-profile');
      if (userElement) {
        userElement.querySelector('.username').textContent = window.currentUser.username;
        userElement.querySelector('.role').textContent = window.currentUser.role;
      }
    }

    // Emit custom event for components
    window.dispatchEvent(new CustomEvent('userSessionUpdate', {
      detail: { user_id, session_data, permissions }
    }));
  }

  showSystemAlert(payload) {
    const { level, title, message, action_required } = payload;
    
    // Show system alert notification
    const alertElement = document.createElement('div');
    alertElement.className = `system-alert alert-${level}`;
    alertElement.innerHTML = `
      <div class="alert-header">
        <span class="alert-icon">${this.getAlertIcon(level)}</span>
        <h4>${title}</h4>
        <button class="close-alert" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <p>${message}</p>
      ${action_required ? '<div class="action-required">Action Required</div>' : ''}
    `;
    
    document.body.appendChild(alertElement);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (alertElement.parentElement) {
        alertElement.remove();
      }
    }, 10000);

    // Emit custom event for components
    window.dispatchEvent(new CustomEvent('systemAlert', {
      detail: { level, title, message, action_required }
    }));
  }

  showMaintenanceNotice(payload) {
    const { scheduled_time, duration, services_affected, message } = payload;
    
    // Show maintenance notice
    const noticeElement = document.createElement('div');
    noticeElement.className = 'maintenance-notice';
    noticeElement.innerHTML = `
      <div class="notice-header">
        <span class="notice-icon">🔧</span>
        <h4>Maintenance Notice</h4>
      </div>
      <p>${message}</p>
      <div class="maintenance-details">
        <p><strong>Scheduled:</strong> ${new Date(scheduled_time).toLocaleString('fa-IR')}</p>
        <p><strong>Duration:</strong> ${duration}</p>
        <p><strong>Services Affected:</strong> {services_affected.join(', ')}</p>
      </div>
    `;
    
    document.body.appendChild(noticeElement);
    
    // Emit custom event for components
    window.dispatchEvent(new CustomEvent('maintenanceNotice', {
      detail: { scheduled_time, duration, services_affected, message }
    }));
  }

  // Utility functions
  formatMetricValue(key, value) {
    switch (key) {
      case 'uptime':
        return `${value}%`;
      case 'response_time':
        return `${value}ms`;
      case 'documents_processed':
        return value.toLocaleString('fa-IR');
      case 'ai_analyses_completed':
        return value.toLocaleString('fa-IR');
      default:
        return value;
    }
  }

  getAlertIcon(level) {
    switch (level) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  }

  // Event handling
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Connection management
  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        this.handleReconnection();
      });
    }, delay);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.send('heartbeat', { timestamp: new Date().toISOString() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.socket.send(JSON.stringify(message));
    }
  }

  // Status and health check
  isConnected() {
    return this.connected && this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  getConnectionStatus() {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  getStats() {
    return {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      messageQueueLength: this.messageQueue.length,
      connectionStatus: this.getConnectionStatus()
    };
  }
}

// Create singleton instance
const productionWebSocketService = new ProductionWebSocketService();

// Export both class and instance
export { ProductionWebSocketService, productionWebSocketService as default };