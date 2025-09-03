import { useState, useEffect, useRef } from 'react'
import { useSystem } from '../contexts/SystemContext'
import { useWebSocket } from '../contexts/WebSocketContext'

export function useRealTimeMetrics(updateInterval = 5000) {
  const { metrics, loadSystemMetrics } = useSystem()
  const { isConnected, subscribe } = useWebSocket()
  const [localMetrics, setLocalMetrics] = useState(metrics)
  const [lastUpdate, setLastUpdate] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    setLocalMetrics(metrics)
  }, [metrics])

  useEffect(() => {
    // Subscribe to WebSocket metrics updates
    const unsubscribe = subscribe('metrics', (data) => {
      setLocalMetrics(prev => ({ ...prev, ...data }))
      setLastUpdate(new Date())
    })

    return unsubscribe
  }, [subscribe])

  useEffect(() => {
    // Setup polling for non-WebSocket environments
    if (!isConnected) {
      intervalRef.current = setInterval(() => {
        loadSystemMetrics()
        setLastUpdate(new Date())
      }, updateInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isConnected, updateInterval, loadSystemMetrics])

  const refreshMetrics = async () => {
    try {
      await loadSystemMetrics()
      setLastUpdate(new Date())
      return true
    } catch (error) {
      console.error('Failed to refresh metrics:', error)
      return false
    }
  }

  return {
    metrics: localMetrics,
    lastUpdate,
    isRealTime: isConnected,
    refreshMetrics
  }
}

export default useRealTimeMetrics