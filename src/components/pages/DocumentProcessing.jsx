import React from 'react'

const DocumentProcessing = () => {
  return (
    <div className="container mx-auto p-4" dir="rtl">
      <header className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          پردازش اسناد
        </h1>
        <p className="text-gray-600">
          بارگذاری و پردازش اسناد حقوقی
        </p>
      </header>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            پردازش اسناد
          </h3>
          <p className="text-gray-600">
            بخش پردازش اسناد در حال توسعه است
          </p>
        </div>
      </div>
    </div>
  )
}

export default DocumentProcessing