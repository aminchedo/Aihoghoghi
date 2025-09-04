import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const EnhancedSidebar = () => {
  const location = useLocation()
  
  const menuItems = [
    { path: '/', name: 'داشبورد', icon: '📊' },
    { path: '/search', name: 'جستجو', icon: '🔍' },
    { path: '/ai-analysis', name: 'تحلیل هوش مصنوعی', icon: '🤖' },
    { path: '/proxy', name: 'مدیریت پروکسی', icon: '🌐' },
    { path: '/processing', name: 'پردازش اسناد', icon: '📄' },
    { path: '/settings', name: 'تنظیمات', icon: '⚙️' },
  ]

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 text-center">
          منوی اصلی
        </h2>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-6 py-3 text-right hover:bg-gray-50 border-r-4 transition-colors ${
              location.pathname === item.path
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-transparent text-gray-700'
            }`}
          >
            <span className="ml-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          نسخه 1.0.0
        </div>
      </div>
    </aside>
  )
}

export default EnhancedSidebar