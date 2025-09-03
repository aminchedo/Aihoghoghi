import React from 'react'

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4" dir="rtl">
      <header className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          سیستم آرشیو اسناد حقوقی ایران
        </h1>
        <p className="text-gray-600">
          پلتفرم پیشرفته استخراج و تحلیل اسناد حقوقی
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📊 آمار سیستم
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>اسناد:</span>
              <span className="font-medium">1,247</span>
            </div>
            <div className="flex justify-between">
              <span>موفقیت:</span>
              <span className="font-medium text-green-600">89.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🔍 جستجو
          </h3>
          <input 
            type="text" 
            placeholder="جستجو در اسناد..." 
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🤖 تحلیل هوشمند
          </h3>
          <p className="text-sm text-gray-600">
            سیستم آماده تحلیل اسناد حقوقی
          </p>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🚀 سیستم فعال است
        </h3>
        <p className="text-blue-700">
          تمام سرویس‌های سیستم آرشیو اسناد حقوقی با موفقیت بارگذاری شد.
        </p>
      </div>
    </div>
  )
}

export default Dashboard