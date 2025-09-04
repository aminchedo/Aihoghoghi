import React, { useState } from 'react'

const EnhancedSearchInterface = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    // Simulate search
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSearchResults([
      { id: 1, title: 'قرارداد تجاری 2024', type: 'قرارداد', date: '2024-01-15', relevance: 95 },
      { id: 2, title: 'حکم قضایی شماره 1234', type: 'حکم', date: '2024-01-10', relevance: 87 },
      { id: 3, title: 'ماده قانونی مدنی', type: 'قانون', date: '2024-01-05', relevance: 82 },
    ])
    setIsSearching(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">جستجو در اسناد</h1>
      
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-4 rtl:space-x-reverse">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="عبارت مورد نظر خود را جستجو کنید..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSearching ? 'در حال جستجو...' : 'جستجو'}
          </button>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">جستجوی پیشرفته:</span>
          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            نوع سند
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            تاریخ
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            موضوع
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            نتایج جستجو ({searchResults.length})
          </h3>
          <div className="space-y-4">
            {searchResults.map((result) => (
              <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{result.title}</h4>
                    <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2 text-sm text-gray-500">
                      <span>نوع: {result.type}</span>
                      <span>تاریخ: {result.date}</span>
                      <span>مربوطیت: {result.relevance}%</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
                    مشاهده
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">نکات جستجو</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• از کلمات کلیدی دقیق استفاده کنید</li>
          <li>• برای جستجوی عبارت دقیق از گیومه استفاده کنید</li>
          <li>• از عملگرهای منطقی AND، OR، NOT استفاده کنید</li>
          <li>• تاریخ‌ها را به فرمت YYYY-MM-DD وارد کنید</li>
        </ul>
      </div>
    </div>
  )
}

export default EnhancedSearchInterface