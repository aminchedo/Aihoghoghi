import React from 'react'

const LoadingOverlay = ({ message = "در حال بارگذاری..." }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
      <div className="text-center text-white">
        {/* Main Logo */}
        <div className="mb-8">
          <div className="text-6xl mb-4">⚖️</div>
          <h1 className="text-2xl font-bold mb-2">سیستم آرشیو اسناد حقوقی ایران</h1>
          <p className="text-blue-200">پورتال جامع اسکرپینگ و تحلیل قوانین اسلامی</p>
        </div>
        
        {/* Loading Animation */}
        <div className="mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-opacity-30 rounded-full mx-auto"></div>
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
        </div>
        
        {/* Loading Message */}
        <p className="text-lg text-blue-100 mb-4">{message}</p>
        
        {/* Loading Steps */}
        <div className="max-w-md mx-auto">
          <div className="space-y-2 text-sm text-blue-200">
            <div className="flex items-center justify-between">
              <span>🔧 راه‌اندازی سرویس‌ها</span>
              <span className="text-green-400">✓</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🤖 بارگذاری مدل‌های Persian BERT</span>
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="flex items-center justify-between">
              <span>🌐 اتصال به شبکه پروکسی ایرانی</span>
              <span className="text-yellow-400">⏳</span>
            </div>
            <div className="flex items-center justify-between">
              <span>📡 اتصال WebSocket</span>
              <span className="text-yellow-400">⏳</span>
            </div>
            <div className="flex items-center justify-between">
              <span>📊 بارگذاری داده‌های اولیه</span>
              <span className="text-yellow-400">⏳</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6 max-w-sm mx-auto">
          <div className="w-full bg-blue-900 bg-opacity-50 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-400 to-green-400 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
          <p className="text-xs text-blue-300 mt-2">در حال تکمیل راه‌اندازی... 75%</p>
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay