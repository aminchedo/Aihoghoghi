import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIRankingSection from '../ai/AIRankingSection';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  FileText, 
  Tag,
  Clock,
  BarChart3,
  Layers,
  Settings,
  RefreshCw,
  ChevronDown,
  X,
  Database,
  Zap,
  BookOpen,
  Archive,
  TrendingUp,
  Users,
  Globe
} from 'lucide-react';

const EnhancedSearchDatabase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [searchMode, setSearchMode] = useState('simple');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    source: '',
    language: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for demonstration
  const mockResults = [
    {
      id: 1,
      title: 'قرارداد خرید و فروش ملک شماره ۱۲۳',
      content: 'این قرارداد در تاریخ ۱۴۰۲/۰۸/۱۵ بین خریدار آقای احمد محمدی و فروشنده خانم زهرا احمدی منعقد گردیده است. موضوع قرارداد خرید و فروش یک واحد مسکونی به مساحت ۱۲۰ متر مربع در منطقه ۳ تهران می‌باشد.',
      date: '1402/08/15',
      category: 'قراردادها',
      source: 'آرشیو اسناد',
      language: 'fa',
      tags: ['ملک', 'خرید و فروش', 'قرارداد'],
      relevanceScore: 95,
      extractedEntities: ['احمد محمدی', 'زهرا احمدی', 'منطقه ۳ تهران'],
      documentType: 'قرارداد',
      size: '2.5 KB'
    },
    {
      id: 2,
      title: 'رای دادگاه در پرونده کلاسه ۹۸۰۱۲۳۴',
      content: 'دادگاه عمومی تهران در جلسه مورخ ۱۴۰۲/۰۹/۱۰ با حضور قاضی جناب آقای دکتر رضایی و با بررسی پرونده کلاسه ۹۸۰۱۲۳۴ در خصوص دعوای خواهان علی اکبری علیه خوانده حسن محمدی رای زیر را صادر نمود.',
      date: '1402/09/10',
      category: 'آرای قضایی',
      source: 'دادگاه عمومی',
      language: 'fa',
      tags: ['رای دادگاه', 'دعوا', 'قضایی'],
      relevanceScore: 88,
      extractedEntities: ['دکتر رضایی', 'علی اکبری', 'حسن محمدی'],
      documentType: 'رای قضایی',
      size: '4.2 KB'
    },
    {
      id: 3,
      title: 'مصوبه شورای شهر درباره تغییر کاربری',
      content: 'شورای اسلامی شهر تهران در جلسه ۴۵۲ مورخ ۱۴۰۲/۱۰/۰۵ با اکثریت آرا تصویب نمود که تغییر کاربری قطعه زمین واقع در خیابان ولیعصر از مسکونی به تجاری مجاز اعلام گردد.',
      date: '1402/10/05',
      category: 'مصوبات',
      source: 'شورای شهر',
      language: 'fa',
      tags: ['شورای شهر', 'تغییر کاربری', 'مصوبه'],
      relevanceScore: 82,
      extractedEntities: ['شورای شهر تهران', 'خیابان ولیعصر'],
      documentType: 'مصوبه',
      size: '1.8 KB'
    }
  ];

  const categories = [
    'همه دسته‌ها',
    'قراردادها',
    'آرای قضایی',
    'مصوبات',
    'قوانین',
    'آیین‌نامه‌ها',
    'بخشنامه‌ها'
  ];

  const sources = [
    'همه منابع',
    'آرشیو اسناد',
    'دادگاه عمومی',
    'شورای شهر',
    'مجلس شورای اسلامی',
    'قوه قضائیه'
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Filter mock results based on query
      const filteredResults = mockResults.filter(result =>
        result.title.includes(searchQuery) ||
        result.content.includes(searchQuery) ||
        result.tags.some(tag => tag.includes(searchQuery))
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = () => {
    // Advanced search logic would go here
    handleSearch();
  };

  const tabs = [
    { id: 'search', title: 'جستجو', icon: Search },
    { id: 'browse', title: 'مرور', icon: Archive },
    { id: 'analytics', title: 'تحلیل', icon: BarChart3 },
    { id: 'settings', title: 'تنظیمات', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🔍 جستجو در پایگاه داده
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                جستجو و بازیابی هوشمند در اسناد حقوقی
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">
                {mockResults.length.toLocaleString('fa-IR')} سند
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.title}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Search Tab */}
            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Search Mode Toggle */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    نوع جستجو:
                  </span>
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setSearchMode('simple')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        searchMode === 'simple'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      ساده
                    </button>
                    <button
                      onClick={() => setSearchMode('advanced')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        searchMode === 'advanced'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      پیشرفته
                    </button>
                    <button
                      onClick={() => setSearchMode('semantic')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        searchMode === 'semantic'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Zap className="w-4 h-4 inline ml-1" />
                      معنایی
                    </button>
                  </div>
                </div>

                {/* Search Input */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        searchMode === 'semantic' 
                          ? 'سؤال خود را به زبان طبیعی بپرسید...'
                          : 'کلیدواژه‌های مورد نظر را وارد کنید...'
                      }
                      className="w-full pr-12 pl-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg transition-colors ${
                          showFilters
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filters */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              دسته‌بندی
                            </label>
                            <select
                              value={filters.category}
                              onChange={(e) => setFilters({...filters, category: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                            >
                              {categories.map((cat, index) => (
                                <option key={index} value={cat === 'همه دسته‌ها' ? '' : cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              منبع
                            </label>
                            <select
                              value={filters.source}
                              onChange={(e) => setFilters({...filters, source: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                            >
                              {sources.map((source, index) => (
                                <option key={index} value={source === 'همه منابع' ? '' : source}>
                                  {source}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              از تاریخ
                            </label>
                            <input
                              type="text"
                              value={filters.dateFrom}
                              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                              placeholder="1402/01/01"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              تا تاریخ
                            </label>
                            <input
                              type="text"
                              value={filters.dateTo}
                              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                              placeholder="1402/12/29"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Search Button */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={searchMode === 'advanced' ? handleAdvancedSearch : handleSearch}
                      disabled={loading || !searchQuery.trim()}
                      className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          در حال جستجو...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          جستجو
                        </>
                      )}
                    </button>

                    {searchResults.length > 0 && (
                      <button
                        onClick={() => {/* Export logic */}}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        دانلود نتایج
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Results */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">در حال جستجو...</p>
                    </div>
                  </div>
                )}

                {!loading && searchResults.length > 0 && (
                  <div className="space-y-6">
                    {/* AI Ranking Section */}
                    <AIRankingSection 
                      texts={searchResults.map(result => result.content)}
                      title="🧠 رتبه‌بندی هوشمند نتایج"
                      showDetails={true}
                      autoAnalyze={true}
                      className="mb-6"
                    />

                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        نتایج جستجو ({searchResults.length} نتیجه)
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">مرتب‌سازی:</span>
                        <select className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white">
                          <option>مرتبط‌ترین</option>
                          <option>جدیدترین</option>
                          <option>قدیمی‌ترین</option>
                          <option>بیشترین مشاهده</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {searchResults.map((result) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {result.title}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {result.date}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tag className="w-4 h-4" />
                                  {result.category}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Globe className="w-4 h-4" />
                                  {result.source}
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" />
                                  {result.relevanceScore}%
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                            {result.content}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {result.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{result.documentType}</span>
                              <span>{result.size}</span>
                            </div>
                          </div>

                          {result.extractedEntities.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                موجودیت‌های استخراج شده:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {result.extractedEntities.map((entity, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded"
                                  >
                                    {entity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {!loading && searchQuery && searchResults.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      نتیجه‌ای یافت نشد
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      برای عبارت "{searchQuery}" نتیجه‌ای پیدا نشد.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      پاک کردن جستجو
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Browse Tab */}
            {activeTab === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  مرور اسناد
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  این بخش در حال توسعه است
                </p>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  تحلیل داده‌ها
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  این بخش در حال توسعه است
                </p>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  تنظیمات جستجو
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  این بخش در حال توسعه است
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearchDatabase;