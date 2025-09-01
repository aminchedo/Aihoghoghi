import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Search, 
  Download, 
  Play, 
  Pause, 
  RefreshCw, 
  Settings,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Filter,
  Eye,
  ExternalLink
} from 'lucide-react';
import webScrapingService from '../../services/webScrapingService';

const ScrapingDashboard = () => {
  const [activeTab, setActiveTab] = useState('scraper');
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [scrapingResults, setScrapingResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [scrapingStats, setScrapingStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    runtime: '0s',
    successRate: 0
  });

  const legalSources = [
    {
      id: 'judiciary',
      name: 'سایت قوه قضائیه',
      url: 'https://www.judiciary.ir',
      description: 'اخبار و اطلاعیه‌های قوه قضائیه',
      status: 'active',
      lastScrape: '۲ ساعت پیش',
      documentsFound: 1250
    },
    {
      id: 'parliament',
      name: 'مرکز پژوهش‌های مجلس',
      url: 'https://rc.majlis.ir',
      description: 'تحقیقات و گزارش‌های مجلس شورای اسلامی',
      status: 'active',
      lastScrape: '۳ ساعت پیش',
      documentsFound: 890
    },
    {
      id: 'government',
      name: 'پایگاه اطلاع‌رسانی دولت',
      url: 'https://www.dolat.ir',
      description: 'اخبار و مصوبات دولت',
      status: 'inactive',
      lastScrape: '۱ روز پیش',
      documentsFound: 2100
    },
    {
      id: 'legal-news',
      name: 'خبرگزاری حقوقی',
      url: 'https://www.legalpress.ir',
      description: 'اخبار و تحلیل‌های حقوقی',
      status: 'error',
      lastScrape: '۵ ساعت پیش',
      documentsFound: 456
    }
  ];

  const handleStartScraping = async () => {
    if (selectedSources.length === 0) {
      alert('لطفاً حداقل یک منبع را انتخاب کنید');
      return;
    }

    setIsScrapingActive(true);
    
    try {
      const results = await webScrapingService.searchLegalSources(searchQuery, {
        sources: selectedSources,
        concurrency: 2
      });
      
      setScrapingResults(results);
      setScrapingStats(webScrapingService.getStats());
    } catch (error) {
      console.error('خطا در استخراج:', error);
    } finally {
      setIsScrapingActive(false);
    }
  };

  const handleDownloadResults = async () => {
    if (scrapingResults.length === 0) {
      alert('هیچ نتیجه‌ای برای دانلود وجود ندارد');
      return;
    }

    try {
      await webScrapingService.saveAsJSON(scrapingResults, `legal_scraping_${Date.now()}.json`);
    } catch (error) {
      console.error('خطا در ذخیره فایل:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'inactive': return 'غیرفعال';
      case 'error': return 'خطا';
      default: return 'نامشخص';
    }
  };

  const tabs = [
    { id: 'scraper', title: 'استخراج داده', icon: Globe },
    { id: 'sources', title: 'منابع', icon: Database },
    { id: 'results', title: 'نتایج', icon: FileText },
    { id: 'stats', title: 'آمار', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🌐 سیستم استخراج اطلاعات
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                استخراج هوشمند اطلاعات از منابع حقوقی آنلاین
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isScrapingActive 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isScrapingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">
                {isScrapingActive ? 'در حال استخراج' : 'آماده'}
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
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
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
            {/* Scraper Tab */}
            {activeTab === 'scraper' && (
              <motion.div
                key="scraper"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Search Input */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      جستجوی کلیدواژه
                    </label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="کلیدواژه‌های مورد نظر را وارد کنید..."
                        className="w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Source Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      انتخاب منابع
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {legalSources.map((source) => (
                        <div
                          key={source.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedSources.includes(source.id)
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                          onClick={() => {
                            setSelectedSources(prev =>
                              prev.includes(source.id)
                                ? prev.filter(id => id !== source.id)
                                : [...prev, source.id]
                            );
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {source.name}
                                </h3>
                                {getStatusIcon(source.status)}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                {source.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>آخرین استخراج: {source.lastScrape}</span>
                                <span>اسناد: {source.documentsFound.toLocaleString('fa-IR')}</span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedSources.includes(source.id)}
                              onChange={() => {}}
                              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleStartScraping}
                      disabled={isScrapingActive || selectedSources.length === 0}
                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isScrapingActive ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          در حال استخراج...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          شروع استخراج
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadResults}
                      disabled={scrapingResults.length === 0}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      دانلود نتایج
                    </button>
                  </div>
                </div>

                {/* Progress */}
                {isScrapingActive && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        در حال استخراج اطلاعات...
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Sources Tab */}
            {activeTab === 'sources' && (
              <motion.div
                key="sources"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4">
                  {legalSources.map((source) => (
                    <div key={source.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Globe className="w-8 h-8 text-purple-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {source.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(source.status)}
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {getStatusText(source.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-sm">مشاهده سایت</span>
                        </a>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {source.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {source.documentsFound.toLocaleString('fa-IR')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">اسناد یافت شده</div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {source.lastScrape}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">آخرین استخراج</div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            ۹۵%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">نرخ موفقیت</div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            ۲.۳s
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">میانگین زمان</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {scrapingResults.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      هنوز نتیجه‌ای وجود ندارد
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      برای مشاهده نتایج، ابتدا عملیات استخراج را انجام دهید
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scrapingResults.map((result, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {result.data?.title || 'بدون عنوان'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                              <span>منبع: {result.source}</span>
                              <span>تاریخ: {new Date(result.timestamp).toLocaleDateString('fa-IR')}</span>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            result.success 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          }`}>
                            {result.success ? 'موفق' : 'ناموفق'}
                          </div>
                        </div>
                        
                        {result.success && result.data?.content && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                            {result.data.content.substring(0, 300)}...
                          </p>
                        )}
                        
                        {result.data?.extractedPatterns && Object.keys(result.data.extractedPatterns).length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              الگوهای استخراج شده:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.keys(result.data.extractedPatterns).map((pattern) => (
                                <span
                                  key={pattern}
                                  className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded"
                                >
                                  {result.data.extractedPatterns[pattern].label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {scrapingStats.totalRequests}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">کل درخواست‌ها</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {scrapingStats.successfulRequests}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">موفق</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {scrapingStats.failedRequests}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">ناموفق</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {scrapingStats.successRate}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">نرخ موفقیت</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ScrapingDashboard;