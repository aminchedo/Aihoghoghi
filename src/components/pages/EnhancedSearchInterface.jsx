import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSystem } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { 
  Search, 
  Brain, 
  Filter, 
  FileText, 
  Clock, 
  Star,
  Eye,
  Download,
  Share,
  BookOpen,
  Scale,
  Users,
  Heart,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

const EnhancedSearchInterface = () => {
  const { performTextSearch, performSemanticSearch, performNafaqeSearch, documents } = useSystem()
  const { isConnected } = useWebSocket()
  const [activeTab, setActiveTab] = useState('text')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchStats, setSearchStats] = useState(null)
  const [selectedNafaqeType, setSelectedNafaqeType] = useState(null)

  // Search form states
  const [textQuery, setTextQuery] = useState('')
  const [textSource, setTextSource] = useState('')
  const [semanticQuery, setSemanticQuery] = useState('')
  const [semanticPrecision, setSemanticPrecision] = useState('medium')
  const [nafaqeDetails, setNafaqeDetails] = useState('')
  const [advancedTitle, setAdvancedTitle] = useState('')
  const [advancedCategory, setAdvancedCategory] = useState('')

  const tabs = [
    { id: 'text', label: 'جستجوی متنی', icon: Search, description: 'جستجو در محتوای اسناد' },
    { id: 'semantic', label: 'جستجوی معنایی', icon: Brain, description: 'جستجو با درک معنا' },
    { id: 'nafaqe', label: 'جستجوی نفقه', icon: Scale, description: 'جستجوی تخصصی نفقه' },
    { id: 'advanced', label: 'جستجوی پیشرفته', icon: Filter, description: 'جستجو با فیلترهای پیشرفته' }
  ]

  const nafaqeTypes = [
    { id: 'زوجه', label: 'نفقه زوجه', icon: '👩', description: 'نفقه همسر' },
    { id: 'فرزندان', label: 'نفقه فرزندان', icon: '👶', description: 'نفقه فرزندان' },
    { id: 'اقارب', label: 'نفقه اقارب', icon: '👥', description: 'نفقه خویشاوندان' }
  ]

  const sources = [
    { value: '', label: 'همه منابع' },
    { value: 'مجلس شورای اسلامی', label: 'مجلس شورای اسلامی' },
    { value: 'قوه قضاییه', label: 'قوه قضاییه' },
    { value: 'مرکز اسناد ایران', label: 'مرکز اسناد ایران' }
  ]

  const categories = [
    { value: '', label: 'همه دسته‌ها' },
    { value: 'قانون_اساسی', label: 'قانون اساسی' },
    { value: 'نفقه_و_حقوق_خانواده', label: 'نفقه و حقوق خانواده' },
    { value: 'طلاق_و_فسخ_نکاح', label: 'طلاق و فسخ نکاح' },
    { value: 'ارث_و_وصیت', label: 'ارث و وصیت' }
  ]

  const handleTextSearch = async () => {
    if (!textQuery.trim()) {
      toast.error('لطفاً کلیدواژه جستجو را وارد کنید')
      return
    }

    setIsSearching(true)
    try {
      const startTime = Date.now()
      const result = await performTextSearch(textQuery, { source: textSource })
      const searchTime = Date.now() - startTime
      
      setSearchResults(result.results || [])
      setSearchStats({
        total: result.total || result.results?.length || 0,
        searchTime,
        query: textQuery,
        type: 'text'
      })
      
      toast.success(`${result.results?.length || 0} نتیجه یافت شد`)
    } catch (error) {
      toast.error('خطا در جستجو: ' + error.message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSemanticSearch = async () => {
    if (!semanticQuery.trim()) {
      toast.error('لطفاً توضیحات جستجو را وارد کنید')
      return
    }

    setIsSearching(true)
    try {
      const startTime = Date.now()
      const result = await performSemanticSearch(semanticQuery, { precision: semanticPrecision })
      const searchTime = Date.now() - startTime
      
      setSearchResults(result.results || [])
      setSearchStats({
        total: result.total || result.results?.length || 0,
        searchTime,
        query: semanticQuery,
        type: 'semantic',
        precision: semanticPrecision
      })
      
      toast.success(`${result.results?.length || 0} نتیجه معنایی یافت شد`)
    } catch (error) {
      toast.error('خطا در جستجوی معنایی: ' + error.message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleNafaqeSearch = async () => {
    if (!selectedNafaqeType) {
      toast.error('ابتدا نوع نفقه را انتخاب کنید')
      return
    }

    setIsSearching(true)
    try {
      const startTime = Date.now()
      const result = await performNafaqeSearch(nafaqeDetails, selectedNafaqeType)
      const searchTime = Date.now() - startTime
      
      setSearchResults(result.results || [])
      setSearchStats({
        total: result.total || result.results?.length || 0,
        searchTime,
        query: `نفقه ${selectedNafaqeType} ${nafaqeDetails}`,
        type: 'nafaqe',
        nafaqeType: selectedNafaqeType
      })
      
      toast.success(`${result.results?.length || 0} نتیجه نفقه یافت شد`)
    } catch (error) {
      toast.error('خطا در جستجوی نفقه: ' + error.message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAdvancedSearch = async () => {
    setIsSearching(true)
    try {
      const startTime = Date.now()
      const result = await performTextSearch(advancedTitle || '', { 
        category: advancedCategory,
        advanced: true
      })
      const searchTime = Date.now() - startTime
      
      setSearchResults(result.results || [])
      setSearchStats({
        total: result.total || result.results?.length || 0,
        searchTime,
        query: advancedTitle || 'جستجوی پیشرفته',
        type: 'advanced',
        category: advancedCategory
      })
      
      toast.success(`${result.results?.length || 0} نتیجه پیشرفته یافت شد`)
    } catch (error) {
      toast.error('خطا در جستجوی پیشرفته: ' + error.message)
    } finally {
      setIsSearching(false)
    }
  }

  const renderSearchResults = () => {
    if (searchResults.length === 0 && searchStats) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>هیچ نتیجه‌ای یافت نشد</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {searchResults.map((result, index) => (
          <motion.div
            key={result.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{result.title}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{result.content}</p>
                
                <div className="flex items-center space-x-reverse space-x-4 text-xs text-gray-500">
                  <span>منبع: {result.source}</span>
                  <span>تاریخ: {new Date(result.scraped_at).toLocaleDateString('fa-IR')}</span>
                  <span>کلمات: {result.word_count}</span>
                  {result.confidence && (
                    <span className="text-green-600">اطمینان: {(result.confidence * 100).toFixed(0)}%</span>
                  )}
                </div>
                
                {result.classification && (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      result.classification === 'قانون_اساسی' ? 'bg-blue-100 text-blue-800' :
                      result.classification === 'نفقه_و_حقوق_خانواده' ? 'bg-green-100 text-green-800' :
                      result.classification === 'دادنامه' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {result.classification.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-reverse space-x-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50">
                  <Share className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              جستجوی پیشرفته در اسناد حقوقی
            </h1>
            <p className="text-gray-600">
              جستجوی متنی، معنایی و تخصصی در {documents.length.toLocaleString('fa-IR')} سند حقوقی
            </p>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            {isConnected && <Zap className="w-5 h-5 text-green-500 animate-pulse" />}
            <span className="text-sm text-gray-500">
              {isConnected ? 'جستجوی زنده فعال' : 'حالت آفلاین'}
            </span>
          </div>
        </div>
      </div>

      {/* Search Tabs */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-reverse">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-reverse space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Text Search Tab */}
            {activeTab === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کلیدواژه جستجو
                  </label>
                  <input
                    type="text"
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    placeholder="کلیدواژه جستجو را وارد کنید..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    منبع
                  </label>
                  <select
                    value={textSource}
                    onChange={(e) => setTextSource(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sources.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleTextSearch}
                  disabled={isSearching}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-reverse space-x-2"
                >
                  <Search className={`w-5 h-5 ${isSearching ? 'animate-spin' : ''}`} />
                  <span>{isSearching ? 'در حال جستجو...' : 'جستجو در بک‌اند'}</span>
                </button>
              </motion.div>
            )}

            {/* Semantic Search Tab */}
            {activeTab === 'semantic' && (
              <motion.div
                key="semantic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیح کامل
                  </label>
                  <textarea
                    value={semanticQuery}
                    onChange={(e) => setSemanticQuery(e.target.value)}
                    placeholder="توضیح کامل از آنچه می‌خواهید پیدا کنید..."
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    دقت جستجو
                  </label>
                  <select
                    value={semanticPrecision}
                    onChange={(e) => setSemanticPrecision(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="high">دقت بالا (کمتر نتیجه، دقیق‌تر)</option>
                    <option value="medium">دقت متوسط (توازن)</option>
                    <option value="low">دقت پایین (بیشتر نتیجه)</option>
                  </select>
                </div>

                <button
                  onClick={handleSemanticSearch}
                  disabled={isSearching}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-reverse space-x-2"
                >
                  <Brain className={`w-5 h-5 ${isSearching ? 'animate-pulse' : ''}`} />
                  <span>{isSearching ? 'در حال تحلیل معنایی...' : 'جستجوی معنایی با Persian BERT'}</span>
                </button>
              </motion.div>
            )}

            {/* Nafaqe Search Tab */}
            {activeTab === 'nafaqe' && (
              <motion.div
                key="nafaqe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    نوع نفقه
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {nafaqeTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedNafaqeType(type.id)}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          selectedNafaqeType === type.id
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">{type.icon}</div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    جزئیات بیشتر
                  </label>
                  <input
                    type="text"
                    value={nafaqeDetails}
                    onChange={(e) => setNafaqeDetails(e.target.value)}
                    placeholder="جزئیات اضافی برای جستجوی دقیق‌تر..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleNafaqeSearch}
                  disabled={isSearching || !selectedNafaqeType}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-reverse space-x-2"
                >
                  <Scale className={`w-5 h-5 ${isSearching ? 'animate-pulse' : ''}`} />
                  <span>{isSearching ? 'در حال جستجوی نفقه...' : 'جستجوی نفقه در بک‌اند'}</span>
                </button>
              </motion.div>
            )}

            {/* Advanced Search Tab */}
            {activeTab === 'advanced' && (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان سند
                    </label>
                    <input
                      type="text"
                      value={advancedTitle}
                      onChange={(e) => setAdvancedTitle(e.target.value)}
                      placeholder="عنوان یا بخشی از عنوان..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      دسته‌بندی
                    </label>
                    <select
                      value={advancedCategory}
                      onChange={(e) => setAdvancedCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAdvancedSearch}
                  disabled={isSearching}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-reverse space-x-2"
                >
                  <Filter className={`w-5 h-5 ${isSearching ? 'animate-pulse' : ''}`} />
                  <span>{isSearching ? 'در حال جستجوی پیشرفته...' : 'جستجوی پیشرفته در بک‌اند'}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search Results */}
      {(searchStats || searchResults.length > 0) && (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          {/* Search Stats */}
          {searchStats && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-reverse space-x-4">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">
                    {searchStats.total.toLocaleString('fa-IR')} نتیجه
                  </span>
                  <span className="text-gray-500">
                    در {searchStats.searchTime}ms
                  </span>
                  <span className="text-gray-500">
                    برای "{searchStats.query}"
                  </span>
                </div>
                <div className="flex items-center space-x-reverse space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>نوع: {searchStats.type}</span>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">نتایج جستجو</h3>
            {renderSearchResults()}
          </div>
        </div>
      )}

      {/* Search Tips */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">راهنمای جستجو</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <Search className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-blue-900 mb-1">جستجوی متنی</h4>
            <p className="text-xs text-blue-700">جستجوی مستقیم در محتوای اسناد</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-purple-900 mb-1">جستجوی معنایی</h4>
            <p className="text-xs text-purple-700">جستجو بر اساس معنا با Persian BERT</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <Scale className="w-6 h-6 text-green-600 mb-2" />
            <h4 className="font-medium text-green-900 mb-1">جستجوی نفقه</h4>
            <p className="text-xs text-green-700">جستجوی تخصصی در حقوق خانواده</p>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-lg">
            <Filter className="w-6 h-6 text-indigo-600 mb-2" />
            <h4 className="font-medium text-indigo-900 mb-1">جستجوی پیشرفته</h4>
            <p className="text-xs text-indigo-700">جستجو با فیلترهای دقیق</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedSearchInterface;