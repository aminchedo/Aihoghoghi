import React, { useState } from 'react'
import { useSystemContext } from '../../contexts/SystemContext'

const EnhancedSearchInterface = () => {
  const { addSearchHistory } = useSystemContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState({
    documentType: '',
    dateRange: '',
    category: ''
  })

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    
    // Simulate search delay
    setTimeout(() => {
      const mockResults = [
        { id: 1, title: 'قرارداد اجاره', type: 'قرارداد', date: '1402/06/15', category: 'قراردادها' },
        { id: 2, title: 'دادخواست مطالبه وجه', type: 'دادخواست', date: '1402/06/10', category: 'دادخواست‌ها' },
        { id: 3, title: 'رای دادگاه', type: 'رای', date: '1402/06/05', category: 'آرای قضایی' },
      ]
      
      setSearchResults(mockResults)
      setIsSearching(false)
      
      // Add to search history
      addSearchHistory({
        id: Date.now(),
        query: searchQuery,
        results: mockResults.length,
        timestamp: new Date().toISOString()
      })
    }, 1000)
  }

  const documentTypes = ['همه', 'قرارداد', 'دادخواست', 'رای', 'مدرک', 'نامه']
  const categories = ['همه', 'قراردادها', 'دادخواست‌ها', 'آرای قضایی', 'مدارک', 'نامه‌ها']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">جستجوی اسناد</h1>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex space-x-4 space-x-reverse">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در اسناد حقوقی..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSearching ? 'در حال جستجو...' : 'جستجو'}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.documentType}
              onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              نتایج جستجو ({searchResults.length} نتیجه)
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <span className="text-2xl ml-4">📄</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{result.title}</h3>
                      <div className="flex items-center space-x-4 space-x-reverse mt-1 text-sm text-gray-500">
                        <span>نوع: {result.type}</span>
                        <span>دسته: {result.category}</span>
                        <span>تاریخ: {result.date}</span>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    مشاهده
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">نتیجه‌ای یافت نشد</h3>
          <p className="text-gray-500">لطفاً کلمات کلیدی دیگری را امتحان کنید</p>
        </div>
      )}
    </div>
  )
}

export default EnhancedSearchInterface