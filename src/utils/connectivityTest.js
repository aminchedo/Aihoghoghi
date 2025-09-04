/**
 * Connectivity Test Utility
 * Tests WebSocket and API connectivity
 */

import { API_ENDPOINTS, ENVIRONMENT } from '../config/apiEndpoints'
import { webSocketService } from '../services/webSocketService'
import { legalDocumentService } from '../services/legalDocumentService'

/**
 * Test API connectivity
 */
export async function testApiConnectivity() {
  console.log('🧪 Testing API connectivity...')
  
  const results = {
    baseUrl: API_ENDPOINTS.BASE,
    tests: {},
    overall: 'unknown'
  }
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${API_ENDPOINTS.BASE}/health`, {
      method: 'GET',
      timeout: 5000
    })
    
    results.tests.health = {
      success: healthResponse.ok,
      status: healthResponse.status,
      statusText: healthResponse.statusText
    }
    
    // Test documents endpoint
    const docsResponse = await fetch(`${API_ENDPOINTS.BASE}/documents/status`, {
      method: 'GET',
      timeout: 5000
    })
    
    results.tests.documents = {
      success: docsResponse.ok,
      status: docsResponse.status,
      statusText: docsResponse.statusText
    }
    
    // Test system metrics endpoint
    const metricsResponse = await fetch(`${API_ENDPOINTS.BASE}/system/metrics`, {
      method: 'GET',
      timeout: 5000
    })
    
    results.tests.metrics = {
      success: metricsResponse.ok,
      status: metricsResponse.status,
      statusText: metricsResponse.statusText
    }
    
    // Calculate overall success
    const successfulTests = Object.values(results.tests).filter(test => test.success).length
    const totalTests = Object.keys(results.tests).length
    
    results.overall = successfulTests === totalTests ? 'success' : 'partial'
    results.successRate = Math.round((successfulTests / totalTests) * 100)
    
    console.log(`✅ API connectivity test completed: ${successfulTests}/${totalTests} tests passed`)
    
  } catch (error) {
    console.error('❌ API connectivity test failed:', error)
    results.overall = 'failed'
    results.error = error.message
  }
  
  return results
}

/**
 * Test WebSocket connectivity
 */
export async function testWebSocketConnectivity() {
  console.log('🧪 Testing WebSocket connectivity...')
  
  const results = {
    websocketUrl: API_ENDPOINTS.WEB_SOCKET,
    tests: {},
    overall: 'unknown'
  }
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      results.overall = 'timeout'
      results.error = 'WebSocket connection timeout'
      console.warn('⚠️ WebSocket connection timeout')
      resolve(results)
    }, 10000)
    
    // Test WebSocket connection
    try {
      const testSocket = new WebSocket(API_ENDPOINTS.WEB_SOCKET)
      
      testSocket.onopen = () => {
        clearTimeout(timeout)
        results.tests.connection = { success: true, message: 'Connected successfully' }
        results.overall = 'success'
        console.log('✅ WebSocket connection successful')
        
        // Test message sending
        testSocket.send(JSON.stringify({
          type: 'test',
          message: 'Connectivity test',
          timestamp: new Date().toISOString()
        }))
        
        results.tests.messageSending = { success: true, message: 'Message sent successfully' }
        
        testSocket.close()
        resolve(results)
      }
      
      testSocket.onerror = (error) => {
        clearTimeout(timeout)
        results.tests.connection = { success: false, error: error.message || 'Connection failed' }
        results.overall = 'failed'
        console.error('❌ WebSocket connection failed:', error)
        resolve(results)
      }
      
      testSocket.onclose = (event) => {
        if (event.code !== 1000) {
          clearTimeout(timeout)
          results.tests.connection = { 
            success: false, 
            error: `Connection closed with code ${event.code}: ${event.reason}` 
          }
          results.overall = 'failed'
          console.error('❌ WebSocket connection closed unexpectedly:', event)
          resolve(results)
        }
      }
      
    } catch (error) {
      clearTimeout(timeout)
      results.tests.connection = { success: false, error: error.message }
      results.overall = 'failed'
      console.error('❌ WebSocket test failed:', error)
      resolve(results)
    }
  })
}

/**
 * Test service initialization
 */
export async function testServiceInitialization() {
  console.log('🧪 Testing service initialization...')
  
  const results = {
    services: {},
    overall: 'unknown'
  }
  
  try {
    // Test legal document service
    const docServiceStatus = legalDocumentService.getStatus()
    results.services.legalDocument = {
      success: docServiceStatus.initialized,
      status: docServiceStatus
    }
    
    // Test WebSocket service
    const wsServiceStatus = webSocketService.getStatus()
    results.services.webSocket = {
      success: wsServiceStatus.connected || wsServiceStatus.fallbackMode,
      status: wsServiceStatus
    }
    
    // Calculate overall success
    const successfulServices = Object.values(results.services).filter(service => service.success).length
    const totalServices = Object.keys(results.services).length
    
    results.overall = successfulServices === totalServices ? 'success' : 'partial'
    results.successRate = Math.round((successfulServices / totalServices) * 100)
    
    console.log(`✅ Service initialization test completed: ${successfulServices}/${totalServices} services ready`)
    
  } catch (error) {
    console.error('❌ Service initialization test failed:', error)
    results.overall = 'failed'
    results.error = error.message
  }
  
  return results
}

/**
 * Run comprehensive connectivity test
 */
export async function runConnectivityTest() {
  console.log('🚀 Starting comprehensive connectivity test...')
  
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT.isDevelopment() ? 'development' : 'production',
    isGitHubPages: ENVIRONMENT.isGitHubPages(),
    tests: {}
  }
  
  try {
    // Run all tests
    testResults.tests.api = await testApiConnectivity()
    testResults.tests.websocket = await testWebSocketConnectivity()
    testResults.tests.services = await testServiceInitialization()
    
    // Calculate overall results
    const apiSuccess = testResults.tests.api.overall === 'success'
    const wsSuccess = testResults.tests.websocket.overall === 'success'
    const servicesSuccess = testResults.tests.services.overall === 'success'
    
    testResults.overall = {
      success: apiSuccess && servicesSuccess, // WebSocket is optional
      apiConnected: apiSuccess,
      websocketConnected: wsSuccess,
      servicesReady: servicesSuccess,
      fallbackMode: testResults.tests.websocket.status?.fallbackMode || false
    }
    
    console.log('📊 Connectivity test results:', testResults)
    
    return testResults
    
  } catch (error) {
    console.error('❌ Connectivity test failed:', error)
    testResults.overall = { success: false, error: error.message }
    return testResults
  }
}

/**
 * Quick connectivity check
 */
export async function quickConnectivityCheck() {
  try {
    const response = await fetch(`${API_ENDPOINTS.BASE}/health`, {
      method: 'GET',
      timeout: 3000
    })
    
    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Backend is reachable' : 'Backend is not responding'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Backend is not reachable'
    }
  }
}

export default {
  testApiConnectivity,
  testWebSocketConnectivity,
  testServiceInitialization,
  runConnectivityTest,
  quickConnectivityCheck
}