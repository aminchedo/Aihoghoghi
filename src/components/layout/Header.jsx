import React from 'react'
import { useSystemContext } from '../../contexts/SystemContext'

const Header = () => {
  const { systemStatus, systemConfig } = useSystemContext()

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100'
      case 'loading':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'آنلاین'
      case 'loading':
        return 'در حال بارگذاری'
      case 'error':
        return 'خطا'
      default:
        return 'نامشخص'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">ق</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              سیستم آرشیو اسناد حقوقی ایران
            </h1>
            <p className="text-sm text-gray-500">
              Iranian Legal Archive System
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="text-right">
            <div className="text-sm text-gray-500">
              زبان: {systemConfig.language === 'fa' ? 'فارسی' : 'English'}
            </div>
            <div className="text-sm text-gray-500">
              تم: {systemConfig.theme === 'light' ? 'روشن' : 'تیره'}
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(systemStatus)}`}>
            وضعیت: {getStatusText(systemStatus)}
          </div>
          
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">👤</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header