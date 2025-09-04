import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const EnhancedSidebar = () => {
  const location = useLocation()
  
  const menuItems = [
    { path: '/', name: 'داشبورد', icon: '📊', description: 'نمای کلی سیستم' },
    { path: '/search', name: 'جستجو', icon: '🔍', description: 'جستجو در اسناد' },
    { path: '/ai-analysis', name: 'تحلیل هوش مصنوعی', icon: '🤖', description: 'تحلیل خودکار اسناد' },
    { path: '/proxy', name: 'مدیریت پروکسی', icon: '🌐', description: 'تنظیمات شبکه' },
    { path: '/processing', name: 'پردازش اسناد', icon: '📄', description: 'پردازش و تبدیل' },
    { path: '/settings', name: 'تنظیمات', icon: '⚙️', description: 'تنظیمات سیستم' },
  ]

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 text-right">
          منوی اصلی
        </h2>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-6 py-4 text-right hover:bg-gray-50 border-r-4 transition-all duration-200 ${
              location.pathname === item.path
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-transparent text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <span className="text-xl">{item.icon}</span>
                <div className="text-right">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </div>
              {location.pathname === item.path && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </Link>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center text-sm text-gray-600">
          <div>نسخه 2.0.0</div>
          <div className="text-xs text-gray-500 mt-1">Iranian Legal Archive</div>
        </div>
      </div>
    </aside>
  )
}

export default EnhancedSidebar