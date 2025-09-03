import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSystem } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const RealTimeStats = () => {
  const { metrics } = useSystem()
  const { isConnected, lastMessage } = useWebSocket()
  const [liveData, setLiveData] = useState({
    documents_per_minute: 0,
    operations_per_minute: 0,
    avg_response_time: 0,
    active_connections: 0,
    memory_usage: 0,
    cpu_usage: 0
  })
  const [trends, setTrends] = useState({})

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      const newData = {
        documents_per_minute: Math.floor(Math.random() * 10) + 5,
        operations_per_minute: Math.floor(Math.random() * 20) + 10,
        avg_response_time: Math.floor(Math.random() * 500) + 200,
        active_connections: Math.floor(Math.random() * 50) + 100,
        memory_usage: Math.floor(Math.random() * 20) + 40,
        cpu_usage: Math.floor(Math.random() * 30) + 20
      }
      
      // Calculate trends
      const newTrends = {}
      Object.keys(newData).forEach(key => {
        const oldValue = liveData[key]
        const newValue = newData[key]
        if (oldValue !== 0) {
          const change = ((newValue - oldValue) / oldValue) * 100
          newTrends[key] = {
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            percentage: Math.abs(change).toFixed(1)
          }
        }
      })
      
      setLiveData(newData)
      setTrends(newTrends)
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [liveData])

  // Update from WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'metrics_update') {
      setLiveData(prev => ({ ...prev, ...lastMessage.data }))
    }
  }, [lastMessage])

  const getTrendIcon = (trend) => {
    if (!trend) return <Minus className="w-3 h-3 text-gray-400" />
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />
      default:
        return <Minus className="w-3 h-3 text-gray-400" />
    }
  }

  const getTrendColor = (trend) => {
    if (!trend) return 'text-gray-500'
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  const statsItems = [
    {
      key: 'documents_per_minute',
      label: 'اسناد/دقیقه',
      value: liveData.documents_per_minute,
      unit: '',
      description: 'تعداد اسناد پردازش شده در دقیقه'
    },
    {
      key: 'operations_per_minute',
      label: 'عملیات/دقیقه',
      value: liveData.operations_per_minute,
      unit: '',
      description: 'تعداد عملیات انجام شده در دقیقه'
    },
    {
      key: 'avg_response_time',
      label: 'زمان پاسخ',
      value: liveData.avg_response_time,
      unit: 'ms',
      description: 'میانگین زمان پاسخ API'
    },
    {
      key: 'active_connections',
      label: 'اتصالات فعال',
      value: liveData.active_connections,
      unit: '',
      description: 'تعداد اتصالات فعال به سیستم'
    },
    {
      key: 'memory_usage',
      label: 'استفاده حافظه',
      value: liveData.memory_usage,
      unit: '%',
      description: 'درصد استفاده از حافظه سیستم'
    },
    {
      key: 'cpu_usage',
      label: 'استفاده پردازنده',
      value: liveData.cpu_usage,
      unit: '%',
      description: 'درصد استفاده از پردازنده'
    }
  ]

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">آمار زنده سیستم</h3>
        <div className="flex items-center space-x-reverse space-x-2">
          <Activity className={`w-5 h-5 ${isConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
            {isConnected ? 'داده‌های زنده' : 'آفلاین'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsItems.map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{item.label}</span>
              <div className="flex items-center space-x-reverse space-x-1">
                {getTrendIcon(trends[item.key])}
                <span className={`text-xs ${getTrendColor(trends[item.key])}`}>
                  {trends[item.key] ? `${trends[item.key].percentage}%` : '-'}
                </span>
              </div>
            </div>
            
            <div className="flex items-baseline space-x-reverse space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                {item.value.toLocaleString('fa-IR')}
              </span>
              {item.unit && (
                <span className="text-sm text-gray-500">{item.unit}</span>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Live Activity Indicator */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <p className="text-sm font-medium text-gray-900">سیستم در حال عملکرد زنده</p>
            <p className="text-xs text-gray-600">
              آخرین بروزرسانی: {new Date().toLocaleTimeString('fa-IR')}
              {isConnected && ' • WebSocket متصل'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeStats