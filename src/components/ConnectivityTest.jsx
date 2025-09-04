/**
 * Connectivity Test Component
 * Displays connectivity status and allows manual testing
 */

import React, { useState, useEffect } from 'react'
import { runConnectivityTest, quickConnectivityCheck } from '../utils/connectivityTest'
import { webSocketService } from '../services/webSocketService'
import { ENVIRONMENT } from '../config/apiEndpoints'

const ConnectivityTest = () => {
  const [testResults, setTestResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [wsStatus, setWsStatus] = useState(null)

  useEffect(() => {
    // Get initial WebSocket status
    setWsStatus(webSocketService.getStatus())
    
    // Listen for WebSocket status changes
    const unsubscribe = webSocketService.on('connected', () => {
      setWsStatus(webSocketService.getStatus())
    })
    
    const unsubscribeDisconnected = webSocketService.on('disconnected', () => {
      setWsStatus(webSocketService.getStatus())
    })
    
    const unsubscribeFallback = webSocketService.on('fallback-mode', () => {
      setWsStatus(webSocketService.getStatus())
    })
    
    return () => {
      unsubscribe()
      unsubscribeDisconnected()
      unsubscribeFallback()
    }
  }, [])

  const runTest = async () => {
    setIsRunning(true)
    try {
      const results = await runConnectivityTest()
      setTestResults(results)
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const runQuickCheck = async () => {
    setIsRunning(true)
    try {
      const result = await quickConnectivityCheck()
      setTestResults({
        timestamp: new Date().toISOString(),
        quickCheck: result
      })
    } catch (error) {
      console.error('Quick check failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'partial': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      case 'timeout': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅'
      case 'partial': return '⚠️'
      case 'failed': return '❌'
      case 'timeout': return '⏱️'
      default: return '❓'
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">🔌 Connectivity Test</h2>
      
      {/* Environment Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Environment Information</h3>
        <div className="text-sm space-y-1">
          <div>Environment: <span className="font-mono">{ENVIRONMENT.isDevelopment() ? 'Development' : 'Production'}</span></div>
          <div>GitHub Pages: <span className="font-mono">{ENVIRONMENT.isGitHubPages() ? 'Yes' : 'No'}</span></div>
          <div>Hostname: <span className="font-mono">{window.location.hostname}</span></div>
        </div>
      </div>

      {/* WebSocket Status */}
      {wsStatus && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">WebSocket Status</h3>
          <div className="text-sm space-y-1">
            <div>Connected: <span className={wsStatus.connected ? 'text-green-600' : 'text-red-600'}>{wsStatus.connected ? 'Yes' : 'No'}</span></div>
            <div>Fallback Mode: <span className={wsStatus.fallbackMode ? 'text-yellow-600' : 'text-gray-600'}>{wsStatus.fallbackMode ? 'Yes' : 'No'}</span></div>
            <div>Reconnect Attempts: <span className="font-mono">{wsStatus.reconnectAttempts}/{wsStatus.maxReconnectAttempts}</span></div>
          </div>
        </div>
      )}

      {/* Test Buttons */}
      <div className="mb-4 space-x-2">
        <button
          onClick={runQuickCheck}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Quick Check'}
        </button>
        <button
          onClick={runTest}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Full Test'}
        </button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Test Results</h3>
          
          {testResults.quickCheck && (
            <div className="p-3 bg-gray-50 rounded mb-2">
              <div className="flex items-center space-x-2">
                <span>{getStatusIcon(testResults.quickCheck.success ? 'success' : 'failed')}</span>
                <span className={getStatusColor(testResults.quickCheck.success ? 'success' : 'failed')}>
                  {testResults.quickCheck.message}
                </span>
              </div>
            </div>
          )}

          {testResults.overall && (
            <div className="p-3 bg-gray-50 rounded mb-2">
              <h4 className="font-semibold mb-2">Overall Status</h4>
              <div className="text-sm space-y-1">
                <div>Success: <span className={getStatusColor(testResults.overall.success ? 'success' : 'failed')}>{testResults.overall.success ? 'Yes' : 'No'}</span></div>
                <div>API Connected: <span className={getStatusColor(testResults.overall.apiConnected ? 'success' : 'failed')}>{testResults.overall.apiConnected ? 'Yes' : 'No'}</span></div>
                <div>WebSocket Connected: <span className={getStatusColor(testResults.overall.websocketConnected ? 'success' : 'failed')}>{testResults.overall.websocketConnected ? 'Yes' : 'No'}</span></div>
                <div>Services Ready: <span className={getStatusColor(testResults.overall.servicesReady ? 'success' : 'failed')}>{testResults.overall.servicesReady ? 'Yes' : 'No'}</span></div>
                {testResults.overall.fallbackMode && (
                  <div>Fallback Mode: <span className="text-yellow-600">Active</span></div>
                )}
              </div>
            </div>
          )}

          {testResults.tests && (
            <div className="space-y-2">
              {Object.entries(testResults.tests).map(([testName, testResult]) => (
                <div key={testName} className="p-3 bg-gray-50 rounded">
                  <h4 className="font-semibold mb-2 capitalize">{testName} Test</h4>
                  <div className="text-sm space-y-1">
                    <div>Status: <span className={getStatusColor(testResult.overall)}>{getStatusIcon(testResult.overall)} {testResult.overall}</span></div>
                    {testResult.successRate && (
                      <div>Success Rate: <span className="font-mono">{testResult.successRate}%</span></div>
                    )}
                    {testResult.error && (
                      <div className="text-red-600">Error: {testResult.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ConnectivityTest