import React, { useState } from 'react'

const EnhancedProxyDashboard = () => {
  const [activeProxies, setActiveProxies] = useState([
    { id: 1, name: 'Proxy Tehran-1', location: 'تهران', status: 'active', speed: '45ms', uptime: '99.8%' },
    { id: 2, name: 'Proxy Isfahan-1', location: 'اصفهان', status: 'active', speed: '52ms', uptime: '99.5%' },
    { id: 3, name: 'Proxy Shiraz-1', location: 'شیراز', status: 'maintenance', speed: 'N/A', uptime: '0%' },
  ])

  const [proxyStats] = useState({
    total: 12,
    active: 9,
    maintenance: 2,
    offline: 1,
    totalTraffic: '2.4 TB',
    avgResponseTime: '48ms'
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">مدیریت پروکسی</h1>
      
      {/* Proxy Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">کل پروکسی‌ها</p>
              <p className="text-2xl font-bold text-gray-900">{proxyStats.total}</p>
            </div>
            <div className="text-3xl">🌐</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">فعال</p>
              <p className="text-2xl font-bold text-green-600">{proxyStats.active}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ترافیک کل</p>
              <p className="text-2xl font-bold text-blue-600">{proxyStats.totalTraffic}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">میانگین پاسخ</p>
              <p className="text-2xl font-bold text-purple-600">{proxyStats.avgResponseTime}</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Active Proxies */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">پروکسی‌های فعال</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            اضافه کردن پروکسی
          </button>
        </div>
        
        <div className="space-y-4">
          {activeProxies.map((proxy) => (
            <div key={proxy.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className={`w-3 h-3 rounded-full ${
                  proxy.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <div>
                  <h4 className="font-medium text-gray-900">{proxy.name}</h4>
                  <div className="text-sm text-gray-500">
                    موقعیت: {proxy.location} | سرعت: {proxy.speed} | آپتایم: {proxy.uptime}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  تنظیمات
                </button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  تست
                </button>
                <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50">
                  غیرفعال
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proxy Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Proxy */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">افزودن پروکسی جدید</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نام پروکسی</label>
              <input
                type="text"
                placeholder="مثال: Proxy Tehran-2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">آدرس IP</label>
              <input
                type="text"
                placeholder="192.168.1.100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">پورت</label>
              <input
                type="number"
                placeholder="8080"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>
            
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              افزودن پروکسی
            </button>
          </div>
        </div>

        {/* Proxy Monitoring */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">مانیتورینگ</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">وضعیت شبکه</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">عالی</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">کیفیت اتصال</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">95%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">آخرین به‌روزرسانی</span>
              <span className="text-sm text-gray-500">2 دقیقه پیش</span>
            </div>
            
            <div className="pt-4">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                به‌روزرسانی وضعیت
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Analytics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">تحلیل ترافیک</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium text-gray-900">ترافیک ورودی</div>
            <div className="text-2xl font-bold text-blue-600">1.2 TB</div>
            <div className="text-sm text-green-600">+12% از ماه گذشته</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">📉</div>
            <div className="font-medium text-gray-900">ترافیک خروجی</div>
            <div className="text-2xl font-bold text-green-600">1.1 TB</div>
            <div className="text-sm text-green-600">+8% از ماه گذشته</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-medium text-gray-900">میانگین سرعت</div>
            <div className="text-2xl font-bold text-purple-600">48ms</div>
            <div className="text-sm text-green-600">-5% از ماه گذشته</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedProxyDashboard