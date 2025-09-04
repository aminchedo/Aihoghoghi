import React from 'react'
import { useSystemContext } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'

const EnhancedDashboard = () => {
  const { documents, systemStatus, notifications } = useSystemContext()
  const { isConnected } = useWebSocket()

  const stats = [
    { title: 'کل اسناد', value: documents.length, icon: '📄', color: 'bg-blue-500' },
    { title: 'وضعیت سیستم', value: systemStatus === 'online' ? 'فعال' : 'غیرفعال', icon: '🟢', color: 'bg-green-500' },
    { title: 'اتصال وب‌سوکت', value: isConnected ? 'متصل' : 'قطع', icon: '🔌', color: isConnected ? 'bg-green-500' : 'bg-red-500' },
    { title: 'اعلان‌ها', value: notifications.length, icon: '🔔', color: 'bg-yellow-500' },
  ]

  const recentDocuments = documents.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">داشبورد</h1>
        <div className="text-sm text-gray-500">
          آخرین به‌روزرسانی: {new Date().toLocaleString('fa-IR')}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg text-white text-2xl`}>
                {stat.icon}
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">آخرین اسناد</h2>
        </div>
        <div className="p-6">
          {recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {recentDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-lg ml-3">📄</span>
                    <div>
                      <p className="font-medium text-gray-900">{doc.title || `سند ${index + 1}`}</p>
                      <p className="text-sm text-gray-500">{doc.date || 'تاریخ نامشخص'}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{doc.type || 'نوع نامشخص'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>هیچ سندی یافت نشد</p>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">وضعیت سیستم</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">سرور اصلی</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              systemStatus === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {systemStatus === 'online' ? 'فعال' : 'غیرفعال'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">اتصال وب‌سوکت</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? 'متصل' : 'قطع'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard