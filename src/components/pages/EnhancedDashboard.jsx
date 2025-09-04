import React from 'react'
import { useSystemContext } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'

const EnhancedDashboard = () => {
  const { systemStatus, systemConfig } = useSystemContext()
  const { isConnected, connectionStatus } = useWebSocket()

  const stats = [
    { title: 'کل اسناد', value: '12,847', change: '+12%', icon: '📄' },
    { title: 'اسناد پردازش شده', value: '8,923', change: '+8%', icon: '✅' },
    { title: 'تحلیل‌های AI', value: '3,456', change: '+25%', icon: '🤖' },
    { title: 'کاربران فعال', value: '156', change: '+5%', icon: '👥' },
  ]

  const recentActivities = [
    { action: 'سند جدید اضافه شد', document: 'قرارداد تجاری 2024', time: '2 دقیقه پیش', type: 'add' },
    { action: 'تحلیل AI تکمیل شد', document: 'احکام قضایی', time: '15 دقیقه پیش', type: 'ai' },
    { action: 'پردازش اسناد', document: '5 سند جدید', time: '1 ساعت پیش', type: 'process' },
    { action: 'پشتیبان‌گیری', document: 'کامل', time: '2 ساعت پیش', type: 'backup' },
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'add': return '➕'
      case 'ai': return '🤖'
      case 'process': return '⚙️'
      case 'backup': return '💾'
      default: return '📝'
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'add': return 'text-green-600 bg-green-100'
      case 'ai': return 'text-blue-600 bg-blue-100'
      case 'process': return 'text-yellow-600 bg-yellow-100'
      case 'backup': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">داشبورد سیستم</h1>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isConnected ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
          }`}>
            {isConnected ? 'اتصال برقرار' : 'اتصال قطع'}
          </div>
          <div className="text-sm text-gray-500">
            آخرین به‌روزرسانی: {new Date().toLocaleTimeString('fa-IR')}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600">{stat.change}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* System Status and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">وضعیت سیستم</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">وضعیت کلی:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                systemStatus === 'online' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {systemStatus === 'online' ? 'آنلاین' : 'آفلاین'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">اتصال WebSocket:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                connectionStatus === 'connected' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {connectionStatus === 'connected' ? 'برقرار' : 'قطع'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">زبان:</span>
              <span className="text-gray-900">{systemConfig.language === 'fa' ? 'فارسی' : 'English'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">منطقه زمانی:</span>
              <span className="text-gray-900">{systemConfig.timezone}</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">فعالیت‌های اخیر</h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.document}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">عملیات سریع</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-2">📤</div>
            <div className="text-sm font-medium text-gray-900">آپلود سند</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm font-medium text-gray-900">جستجوی سریع</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium text-gray-900">گزارش‌گیری</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="text-sm font-medium text-gray-900">تنظیمات</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard