import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Settings, 
  Globe, 
  Server,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Eye,
  Download,
  Filter
} from 'lucide-react';

// Services
import { smartScrapingService } from '../../services/smartScrapingService';
import { realTimeMetricsService } from '../../services/realTimeMetricsService';
import { legalDocumentService } from '../../services/legalDocumentService';

// Components
import LoadingSpinner from '../ui/LoadingSpinner';
import Chart from '../ui/Chart';

const ScrapingDashboard = () => {
  const queryClient = useQueryClient();
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(null);
  const [selectedSites, setSelectedSites] = useState([]);
  const [scrapingConfig, setScrapingConfig] = useState({
    maxDocuments: 10,
    concurrent: 3,
    delay: 2000,
    timeout: 30000
  });
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    site: 'all',
    timeRange: '24h'
  });

  // Real-time scraping stats
  const { data: scrapingStats, isLoading: statsLoading } = useQuery({
    queryKey: ['scrapingStats'],
    queryFn: () => smartScrapingService.getScrapingStats(),
    refetchInterval: 2000,
  });

  // Network status
  const { data: networkStatus, isLoading: networkLoading } = useQuery({
    queryKey: ['networkStatus'],
    queryFn: () => smartScrapingService.getNetworkStatus(),
    refetchInterval: 10000,
  });

  // Recent scraping results
  const { data: recentResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['recentScrapingResults'],
    queryFn: () => {
      // Get recent documents that were scraped
      const recentDocs = legalDocumentService.getRecentDocuments(20);
      return recentDocs.filter(doc => doc.scrapedAt);
    },
    refetchInterval: 5000,
  });

  // Initialize target sites
  useEffect(() => {
    const sites = [
      { id: 'majlis', name: 'مجلس شورای اسلامی', url: 'majlis.ir', enabled: true },
      { id: 'judiciary', name: 'قوه قضائیه', url: 'judiciary.ir', enabled: true },
      { id: 'dotic', name: 'مرکز اسناد ایران', url: 'dotic.ir', enabled: true }
    ];
    setSelectedSites(sites);
  }, []);

  // Start scraping
  const handleStartScraping = useCallback(async () => {
    if (isScrapingActive) return;
    
    setIsScrapingActive(true);
    setScrapingProgress({ current: 0, total: scrapingConfig.maxDocuments, status: 'starting' });
    
    try {
      const enabledSites = selectedSites.filter(site => site.enabled);
      
      if (enabledSites.length === 0) {
        throw new Error('هیچ سایتی انتخاب نشده است');
      }

      addLog('شروع فرآیند استخراج اسناد', 'info');
      
      const result = await smartScrapingService.startScraping({
        maxDocuments: scrapingConfig.maxDocuments,
        concurrent: scrapingConfig.concurrent,
        delay: scrapingConfig.delay,
        onProgress: (progress) => {
          setScrapingProgress(progress);
          addLog(`در حال پردازش: ${progress.current}/${progress.total}`, 'info');
        }
      });
      
      setScrapingProgress({ 
        current: result.successCount, 
        total: result.totalAttempts, 
        status: 'completed' 
      });
      
      addLog(`استخراج کامل شد: ${result.successCount} سند موفق از ${result.totalAttempts} تلاش`, 'success');
      
      // Refresh data
      await queryClient.invalidateQueries();
      
    } catch (error) {
      console.error('Scraping failed:', error);
      addLog(`خطا در استخراج: ${error.message}`, 'error');
      setScrapingProgress(prev => prev ? { ...prev, status: 'error' } : null);
    } finally {
      setTimeout(() => {
        setIsScrapingActive(false);
        setScrapingProgress(null);
      }, 2000);
    }
  }, [isScrapingActive, scrapingConfig, selectedSites, queryClient]);

  // Stop scraping
  const handleStopScraping = useCallback(() => {
    smartScrapingService.stopScraping();
    setIsScrapingActive(false);
    setScrapingProgress(null);
    addLog('فرآیند استخراج متوقف شد', 'warning');
  }, []);

  // Test proxies
  const handleTestProxies = useCallback(async () => {
    addLog('شروع تست پروکسی‌ها', 'info');
    
    try {
      const result = await smartScrapingService.testAllProxies();
      addLog(`تست پروکسی‌ها: ${result.working}/${result.total} فعال`, 
        result.working > 0 ? 'success' : 'error');
      
      await queryClient.invalidateQueries(['networkStatus']);
    } catch (error) {
      addLog(`خطا در تست پروکسی‌ها: ${error.message}`, 'error');
    }
  }, [queryClient]);

  // Add log entry
  const addLog = (message, type = 'info') => {
    const logEntry = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setLogs(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filters.status !== 'all' && log.type !== filters.status) return false;
    
    if (filters.timeRange !== 'all') {
      const logTime = new Date(log.timestamp);
      const now = new Date();
      const hoursAgo = filters.timeRange === '1h' ? 1 : filters.timeRange === '24h' ? 24 : 168;
      const cutoff = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
      
      if (logTime < cutoff) return false;
    }
    
    return true;
  });

  // Get chart data for scraping performance
  const getPerformanceChartData = () => {
    if (!recentResults || recentResults.length === 0) return null;
    
    const last24Hours = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const hourKey = hour.getHours();
      
      const docsInHour = recentResults.filter(doc => {
        const docTime = new Date(doc.scrapedAt);
        return docTime.getHours() === hourKey && 
               docTime.toDateString() === hour.toDateString();
      }).length;
      
      last24Hours.push({
        hour: hourKey,
        count: docsInHour,
        label: `${hourKey}:00`
      });
    }
    
    return {
      labels: last24Hours.map(h => h.label),
      datasets: [{
        label: 'اسناد استخراج شده',
        data: last24Hours.map(h => h.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  const performanceData = getPerformanceChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            داشبورد استخراج اسناد
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            مدیریت و نظارت بر فرآیند استخراج اسناد حقوقی از منابع دولتی
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTestProxies}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <Server className="w-4 h-4" />
            تست پروکسی‌ها
          </motion.button>
          
          {!isScrapingActive ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartScraping}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              شروع استخراج
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStopScraping}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              توقف استخراج
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Scraping Progress */}
      <AnimatePresence>
        {scrapingProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                پیشرفت استخراج
              </h3>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {scrapingProgress.current} از {scrapingProgress.total}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-blue-800 dark:text-blue-200">
                <span>پیشرفت کلی</span>
                <span>{Math.round((scrapingProgress.current / scrapingProgress.total) * 100)}%</span>
              </div>
              
              <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scrapingProgress.current / scrapingProgress.total) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                />
              </div>
              
              <div className="flex items-center justify-between text-sm text-blue-700 dark:text-blue-300">
                <span>وضعیت: {scrapingProgress.status === 'starting' ? 'در حال شروع' : 
                                scrapingProgress.status === 'completed' ? 'تکمیل شده' : 
                                'در حال پردازش'}</span>
                {isScrapingActive && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>فعال</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Scraping Configuration */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            تنظیمات استخراج
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  حداکثر تعداد اسناد
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={scrapingConfig.maxDocuments}
                  onChange={(e) => setScrapingConfig(prev => ({ ...prev, maxDocuments: parseInt(e.target.value) }))}
                  disabled={isScrapingActive}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  درخواست‌های همزمان
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={scrapingConfig.concurrent}
                  onChange={(e) => setScrapingConfig(prev => ({ ...prev, concurrent: parseInt(e.target.value) }))}
                  disabled={isScrapingActive}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تأخیر بین درخواست‌ها (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="10000"
                  step="500"
                  value={scrapingConfig.delay}
                  onChange={(e) => setScrapingConfig(prev => ({ ...prev, delay: parseInt(e.target.value) }))}
                  disabled={isScrapingActive}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  زمان انتظار (ms)
                </label>
                <input
                  type="number"
                  min="10000"
                  max="60000"
                  step="5000"
                  value={scrapingConfig.timeout}
                  onChange={(e) => setScrapingConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  disabled={isScrapingActive}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Target Sites */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">سایت‌های هدف</h4>
            <div className="space-y-2">
              {selectedSites.map((site) => (
                <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={site.enabled}
                      onChange={(e) => {
                        setSelectedSites(prev => prev.map(s => 
                          s.id === site.id ? { ...s, enabled: e.target.checked } : s
                        ));
                      }}
                      disabled={isScrapingActive}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-600 dark:border-gray-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{site.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{site.url}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${site.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">آمار فوری</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">اسناد استخراج شده:</span>
                <span className="font-bold text-blue-600">{scrapingStats?.successCount || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">نرخ موفقیت:</span>
                <span className="font-bold text-green-600">{scrapingStats?.successRate || 0}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">پروکسی‌های فعال:</span>
                <span className="font-bold text-orange-600">{scrapingStats?.activeProxies || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">صف انتظار:</span>
                <span className="font-bold text-purple-600">{scrapingStats?.queueSize || 0}</span>
              </div>
            </div>
          </div>

          {/* Network Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">وضعیت شبکه</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">وضعیت اتصال:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${networkStatus?.connectivity === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`font-medium ${networkStatus?.connectivity === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                    {networkStatus?.connectivity === 'online' ? 'آنلاین' : 'آفلاین'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">DNS فعال:</span>
                <span className="font-medium">{networkStatus?.dnsServers?.working || 0}/{networkStatus?.dnsServers?.total || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">پروکسی‌ها:</span>
                <span className={`font-medium ${networkStatus?.proxies?.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                  {networkStatus?.proxies?.status === 'active' ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Chart */}
      {performanceData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            عملکرد استخراج در 24 ساعت گذشته
          </h3>
          
          <Chart
            type="line"
            data={performanceData}
            height={300}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }}
          />
        </motion.div>
      )}

      {/* Recent Results and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            آخرین نتایج استخراج
          </h3>
          
          {resultsLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : recentResults && recentResults.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentResults.slice(0, 10).map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        منبع: {doc.source} • {doc.wordCount} کلمه
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                          {doc.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.scrapedAt).toLocaleTimeString('fa-IR')}
                        </span>
                      </div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>هنوز نتیجه‌ای ثبت نشده است</p>
            </div>
          )}
        </motion.div>

        {/* Activity Logs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              گزارش فعالیت
            </h3>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">همه</option>
              <option value="info">اطلاعات</option>
              <option value="success">موفق</option>
              <option value="warning">هشدار</option>
              <option value="error">خطا</option>
            </select>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`p-3 rounded-lg text-sm ${
                    log.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                    log.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                    log.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                    'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {log.type === 'success' && <CheckCircle className="w-4 h-4" />}
                      {log.type === 'error' && <XCircle className="w-4 h-4" />}
                      {log.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                      {log.type === 'info' && <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p>{log.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">هیچ گزارشی یافت نشد</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScrapingDashboard;