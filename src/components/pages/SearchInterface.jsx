import React from 'react'

const SearchInterface = () => {
  return (
    <div className="container mx-auto p-4" dir="rtl">
      <header className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          جستجوی پیشرفته
        </h1>
        <p className="text-gray-600">
          جستجو در پایگاه داده اسناد حقوقی
        </p>
      </header>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            جستجو در اسناد
          </label>
          <input 
            type="text" 
            placeholder="کلیدواژه مورد نظر را وارد کنید..." 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            جستجوی هوشمند
          </h3>
          <p className="text-gray-600">
            سیستم جستجوی پیشرفته در حال توسعه است
          </p>
        </div>
      </div>
    </div>
  )
}

export default SearchInterface