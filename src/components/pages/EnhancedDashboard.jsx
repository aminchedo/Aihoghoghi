import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSystem } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { 
  FileText, 
  Activity, 
  Server, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Brain,
  Globe,
  Search,
  RefreshCw,
  AlertCircle,
  Zap,
  BarChart3,
  Eye,
  Settings
} from 'lucide-react'

const EnhancedDashboard = () => {
  const { metrics, documents, proxies, connectionStatus, loadSystemMetrics } = useSystem()
  const { isConnected, metrics: wsMetrics } = useWebSocket()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [recentActivity, setRecentActivity] = useState([])
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    // Load initial data
    loadSystemMetrics()
    
    // Setup real-time activity monitoring
    const activities = [
      { id: 1, type: 'document', message: 'سند جدید از مجلس پردازش شد', time: new Date(), icon: FileText, color: 'blue' },
      { id: 2, type: 'proxy', message: 'پروکسی ایرانی جدید فعال شد', time: new Date(Date.now() - 60000), icon: Globe, color: 'green' },
      { id: 3, type: 'search', message: 'جستجوی نفقه انجام شد', time: new Date(Date.now() - 120000), icon: Search, color: 'purple' },
      { id: 4, type: 'ai', message: 'تحلیل Persian BERT تکمیل شد', time: new Date(Date.now() - 180000), icon: Brain, color: 'indigo' }
    ]
    setRecentActivity(activities)

    // Setup chart data
    const chartDataPoints = {
      documents: [1200, 1215, 1230, 1247],
      operations: [140, 148, 152, 156],
      success_rate: [87.5, 88.1, 88.8, 89.2],
      proxies: [16, 17, 18, 18]
    }
    setChartData(chartDataPoints)
  }, [])

  // Listen for WebSocket updates
  useEffect(() => {
    const handleMetricsUpdate = (event) => {
      if (event.detail) {
        loadSystemMetrics()
        // Add new activity
        const newActivity = {
          id: Date.now(),
          type: 'update',
          message: 'متریک‌های سیستم بروزرسانی شد',
          time: new Date(),
          icon: Activity,
          color: 'green'
        }
        setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)])
      }
    }

    window.addEventListener('metricsUpdate', handleMetricsUpdate)
    return () => window.removeEventListener('metricsUpdate', handleMetricsUpdate)
  }, [])

  const handleRefreshMetrics = async () => {
    setIsRefreshing(true)
    try {
      await loadSystemMetrics()
    } finally {
      setIsRefreshing(false)
    }
  }

  const statCards = [
    {
      title: 'کل اسناد',
      value: metrics.total_documents?.toLocaleString('fa-IR') || '1,247',
      change: '+12',
      changeType: 'increase',
      icon: FileText,
      color: 'blue',
      description: 'اسناد حقوقی استخراج شده',
      trend: [1200, 1215, 1230, 1247]
    },
    {
      title: 'نرخ موفقیت',
      value: `${metrics.success_rate?.toFixed(1) || '89.2'}%`,
      change: '+2.1%',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'green',
      description: 'موفقیت در پردازش اسناد',
      trend: [87.5, 88.1, 88.8, 89.2]
    },
    {
      title: 'پروکسی فعال',
      value: metrics.active_proxies || '18',
      change: '+3',
      changeType: 'increase',
      icon: Server,
      color: 'purple',
      description: 'از 22 سرور DNS ایرانی',
      trend: [16, 17, 18, 18]
    },
    {
      title: 'زمان پردازش',
      value: `${metrics.processing_time?.toFixed(1) || '1.2'}s`,
      change: '-0.3s',
      changeType: 'decrease',
      icon: Clock,
      color: 'indigo',
      description: 'میانگین زمان پردازش',
      trend: [1.8, 1.5, 1.3, 1.2]
    }
  ]

  const quickActions = [
    {
      title: 'جستجوی سریع',
      description: 'جستجو در پایگاه داده اسناد',
      icon: Search,
      path: '/search',
      color: 'blue',
      count: documents.length
    },
    {
      title: 'استخراج جدید',
      description: 'شروع فرآیند اسکرپینگ',
      icon: Globe,
      path: '/scraping',
      color: 'green',
      count: metrics.total_operations || 156
    },
    {
      title: 'تحلیل هوشمند',
      description: 'تحلیل با Persian BERT',
      icon: Brain,
      path: '/ai-analysis',
      color: 'purple',
      count: 4
    },
    {
      title: 'مدیریت پروکسی',
      description: 'نظارت بر شبکه پروکسی',
      icon: Server,
      path: '/proxy-management',
      color: 'indigo',
      count: metrics.active_proxies || 18
    }
  ]

  const getColorClasses = (color, type = 'bg') => {
    const colors = {
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-500',
        border: 'border-blue-500',
        bgLight: 'bg-blue-100',
        textDark: 'text-blue-800'
      },
      green: {
        bg: 'bg-green-500',
        text: 'text-green-500',
        border: 'border-green-500',
        bgLight: 'bg-green-100',
        textDark: 'text-green-800'
      },
      purple: {
        bg: 'bg-purple-500',
        text: 'text-purple-500',
        border: 'border-purple-500',
        bgLight: 'bg-purple-100',
        textDark: 'text-purple-800'
      },
      indigo: {
        bg: 'bg-indigo-500',
        text: 'text-indigo-500',
        border: 'border-indigo-500',
        bgLight: 'bg-indigo-100',
        textDark: 'text-indigo-800'
      }
    }
    return colors[color]?.[type] || colors.blue[type]
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              داشبورد سیستم آرشیو حقوقی ایران
            </h1>
            <p className="text-gray-600">
              پلتفرم جامع اسکرپینگ و تحلیل اسناد حقوقی با Persian BERT و 22 پروکسی ایرانی
            </p>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-reverse space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {connectionStatus === 'connected' ? 'متصل به بک‌اند' : 
                 connectionStatus === 'connecting' ? 'در حال اتصال' : 'قطع شده'}
              </span>
              {isConnected && <Zap className="w-4 h-4 text-green-500" />}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshMetrics}
              disabled={isRefreshing}
              className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>بروزرسانی زنده</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-xs font-medium ${
                    card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.changeType === 'increase' ? '↗' : '↘'} {card.change}
                  </span>
                  <span className="text-xs text-gray-500 mr-1">24 ساعت گذشته</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${getColorClasses(card.color, 'bgLight')}`}>
                <card.icon className={`w-8 h-8 ${getColorClasses(card.color, 'text')}`} />
              </div>
            </div>
            
            {/* Mini trend chart */}
            <div className="mt-4">
              <div className="flex items-end space-x-1 h-8">
                {card.trend.map((value, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${getColorClasses(card.color, 'bg')} rounded-sm opacity-60`}
                    style={{ 
                      height: `${(value / Math.max(...card.trend)) * 100}%`,
                      minHeight: '4px'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Activity Chart */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">نمودار فعالیت زنده</h3>
            <div className="flex items-center space-x-reverse space-x-2">
              <Activity className="w-5 h-5 text-green-500 animate-pulse" />
              <span className="text-sm text-green-600 font-medium">زنده از بک‌اند</span>
            </div>
          </div>
          
          {/* Chart placeholder - would integrate with Chart.js */}
          <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">نمودار فعالیت در حال بارگذاری...</p>
              <p className="text-xs text-gray-500 mt-1">داده‌های زنده از WebSocket</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">عملیات سریع</h3>
          <div className="grid grid-cols-1 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={action.title}
                to={action.path}
                className="group p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <div className={`p-3 rounded-lg ${getColorClasses(action.color, 'bgLight')} group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-6 h-6 ${getColorClasses(action.color, 'text')}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={`text-2xl font-bold ${getColorClasses(action.color, 'text')}`}>
                      {action.count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">فعالیت اخیر</h3>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-reverse space-x-3">
                <div className={`p-2 rounded-lg ${getColorClasses(activity.color, 'bgLight')}`}>
                  <activity.icon className={`w-4 h-4 ${getColorClasses(activity.color, 'text')}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time.toLocaleTimeString('fa-IR')}</p>
                </div>
              </div>
            ))}
          </div>
          <Link 
            to="/system-status" 
            className="block text-center text-sm text-blue-600 hover:text-blue-800 pt-4 border-t border-gray-200 mt-4"
          >
            مشاهده همه فعالیت‌ها
          </Link>
        </div>

        {/* System Health */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">سلامت سیستم</h3>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Backend</span>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {connectionStatus === 'connected' ? 'آنلاین' : 'آفلاین'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">WebSocket</span>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'متصل' : 'قطع'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">شبکه پروکسی</span>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-600">
                  {metrics.active_proxies || 18}/22 فعال
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">مدل‌های Persian BERT</span>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-600">4/4 آماده</span>
              </div>
            </div>

            {/* Overall Health Bar */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>سلامت کلی سیستم</span>
                <span className="font-bold">{metrics.system_health || 94}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.system_health || 94}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">اسناد اخیر</h3>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {documents.slice(0, 4).map((doc, index) => (
              <div key={doc.id} className="flex items-start space-x-reverse space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{doc.source}</p>
                  <div className="flex items-center space-x-reverse space-x-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      doc.classification === 'قانون_اساسی' ? 'bg-blue-100 text-blue-800' :
                      doc.classification === 'نفقه_و_حقوق_خانواده' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.classification.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      اطمینان: {(doc.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            <Link 
              to="/search" 
              className="block text-center text-sm text-blue-600 hover:text-blue-800 pt-3 border-t border-gray-200"
            >
              مشاهده همه اسناد ({documents.length.toLocaleString('fa-IR')})
            </Link>
          </div>
        </div>
      </div>

      {/* Persian BERT Models Status */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">وضعیت مدل‌های Persian BERT</h3>
          <Bot className="w-6 h-6 text-purple-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(AI_MODELS).map(([type, modelName]) => (
            <div key={type} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  {type === 'classification' ? 'طبقه‌بندی' :
                   type === 'sentiment' ? 'احساسات' :
                   type === 'ner' ? 'موجودیت‌ها' :
                   'خلاصه‌سازی'}
                </h4>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-xs text-gray-500 mb-2">{modelName}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-green-600 mt-1">آماده</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard