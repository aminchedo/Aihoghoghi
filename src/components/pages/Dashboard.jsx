import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Server, 
  Zap, 
  Shield, 
  Clock,
  Users,
  Database,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw
} from 'lucide-react';

// Enhanced Services
import { realTimeMetricsService } from '../../services/realTimeMetricsService';
import { legalDocumentService } from '../../services/legalDocumentService';
import { smartScrapingService } from '../../services/smartScrapingService';
import { enhancedAIService } from '../../services/enhancedAIService';

// UI Components
import StatsCard from '../ui/StatsCard';
import Chart from '../ui/Chart';
import RecentActivity from '../ui/RecentActivity';
import SystemHealth from '../ui/SystemHealth';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds for real-time feel
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Real-time metrics subscription
  useEffect(() => {
    const unsubscribe = realTimeMetricsService.subscribe((metrics) => {
      setSystemMetrics(metrics);
      setLastUpdate(new Date());
    });
    
    // Initial load
    setSystemMetrics(realTimeMetricsService.getMetrics());
    
    return unsubscribe;
  }, []);

  // Enhanced data fetching with real services
  const { data: documentStats, isLoading: docStatsLoading } = useQuery({
    queryKey: ['documentStats'],
    queryFn: () => legalDocumentService.getDocumentStats(),
    refetchInterval: refreshInterval,
  });

  const { data: scrapingStats, isLoading: scrapingStatsLoading } = useQuery({
    queryKey: ['scrapingStats'],
    queryFn: () => smartScrapingService.getScrapingStats(),
    refetchInterval: refreshInterval,
  });

  const { data: aiStats, isLoading: aiStatsLoading } = useQuery({
    queryKey: ['aiStats'],
    queryFn: () => enhancedAIService.getAnalysisStats(),
    refetchInterval: refreshInterval,
  });

  const { data: networkStatus, isLoading: networkLoading } = useQuery({
    queryKey: ['networkStatus'],
    queryFn: () => smartScrapingService.getNetworkStatus(),
    refetchInterval: refreshInterval * 2,
  });

  const { data: recentDocuments, isLoading: recentDocsLoading } = useQuery({
    queryKey: ['recentDocuments'],
    queryFn: () => legalDocumentService.getRecentDocuments(5),
    refetchInterval: refreshInterval,
  });

  // Manual refresh with real-time feedback
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      setLastUpdate(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [queryClient]);

  // Quick actions
  const handleQuickScrape = useCallback(async () => {
    try {
      await smartScrapingService.startScraping({ maxDocuments: 3 });
      await queryClient.invalidateQueries(['documentStats', 'scrapingStats']);
    } catch (error) {
      console.error('Quick scrape failed:', error);
    }
  }, [queryClient]);

  const handleQuickAnalysis = useCallback(async () => {
    try {
      const recentDocs = legalDocumentService.getRecentDocuments(2);
      if (recentDocs.length > 0) {
        await enhancedAIService.analyzeDocument(recentDocs[0]);
        await queryClient.invalidateQueries(['aiStats']);
      }
    } catch (error) {
      console.error('Quick analysis failed:', error);
    }
  }, [queryClient]);

  // Calculate derived metrics
  const performanceSummary = systemMetrics ? realTimeMetricsService.getPerformanceSummary() : null;
  
  const isLoading = docStatsLoading || scrapingStatsLoading || aiStatsLoading || networkLoading;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            داشبورد سیستم آرشیو حقوقی
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            نظارت بر عملکرد سیستم و آمار کلی • آخرین بروزرسانی: {lastUpdate.toLocaleTimeString('fa-IR')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleQuickScrape}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            استخراج سریع
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleQuickAnalysis}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            تحلیل سریع
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            بروزرسانی
          </motion.button>
        </div>
      </motion.div>

      {/* System Health Overview */}
      {performanceSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">سلامت کلی سیستم</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{performanceSummary.overall.health}%</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${performanceSummary.overall.health}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-green-500 to-green-600"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">عملکرد سیستم</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{performanceSummary.overall.performance}%</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${performanceSummary.overall.performance}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">قابلیت اطمینان</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">{performanceSummary.overall.reliability}%</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${performanceSummary.overall.reliability}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Statistics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatsCard
          title="اسناد استخراج شده"
          value={documentStats?.total || 0}
          change={systemMetrics?.scraping?.totalDocuments || 0}
          changeType="increase"
          icon={FileText}
          color="blue"
          loading={docStatsLoading}
        />
        
        <StatsCard
          title="نرخ موفقیت"
          value={`${systemMetrics?.scraping?.successRate || 0}%`}
          change={performanceSummary?.scraping?.averageSuccessRate || 0}
          changeType="increase"
          icon={TrendingUp}
          color="green"
          loading={scrapingStatsLoading}
        />
        
        <StatsCard
          title="تحلیل‌های انجام شده"
          value={systemMetrics?.ai?.documentsAnalyzed || 0}
          change={aiStats?.cacheSize || 0}
          changeType="increase"
          icon={Activity}
          color="purple"
          loading={aiStatsLoading}
        />
        
        <StatsCard
          title="پروکسی‌های فعال"
          value={systemMetrics?.scraping?.activeProxies || 0}
          change={networkStatus?.proxies?.active || 0}
          changeType="neutral"
          icon={Server}
          color="orange"
          loading={networkLoading}
        />
      </motion.div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Categories Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            توزیع دسته‌بندی اسناد
          </h3>
          {documentStats?.categories && Object.keys(documentStats.categories).length > 0 ? (
            <Chart
              type="doughnut"
              data={{
                labels: Object.keys(documentStats.categories),
                datasets: [{
                  data: Object.values(documentStats.categories),
                  backgroundColor: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
                    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
                  ],
                  borderWidth: 2,
                  borderColor: '#ffffff'
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      font: { family: 'Vazirmatn' },
                      usePointStyle: true
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>آمار دسته‌بندی در دسترس نیست</p>
            </div>
          )}
        </motion.div>

        {/* System Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            عملکرد سیستم
          </h3>
          {performanceSummary ? (
            <Chart
              type="radar"
              data={{
                labels: ['استخراج', 'تحلیل هوش مصنوعی', 'پایگاه داده', 'شبکه', 'پردازش'],
                datasets: [{
                  label: 'عملکرد فعلی',
                  data: [
                    performanceSummary.scraping.averageSuccessRate,
                    performanceSummary.ai.analysisAccuracy,
                    Math.max(100 - performanceSummary.database.querySpeed, 0),
                    networkStatus?.connectivity === 'online' ? 95 : 50,
                    performanceSummary.overall.performance
                  ],
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderColor: 'rgb(59, 130, 246)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgb(59, 130, 246)'
                }]
              }}
              options={{
                responsive: true,
                scales: {
                  r: {
                    min: 0,
                    max: 100,
                    ticks: {
                      font: { family: 'Vazirmatn' }
                    }
                  }
                },
                plugins: {
                  legend: {
                    labels: {
                      font: { family: 'Vazirmatn' }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>آمار عملکرد در حال محاسبه...</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            آخرین اسناد استخراج شده
          </h3>
          
          {recentDocsLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : recentDocuments && recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {recentDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {doc.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {doc.date}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {doc.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {doc.wordCount || 0} کلمه
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>هنوز سندی استخراج نشده است</p>
              <button
                onClick={handleQuickScrape}
                className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
              >
                شروع استخراج اسناد
              </button>
            </div>
          )}
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            وضعیت سرویس‌ها
          </h3>
          
          <div className="space-y-4">
            {/* Scraping Service */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${scrapingStats?.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="font-medium text-gray-900 dark:text-white">سرویس استخراج</span>
              </div>
              <span className={`text-sm ${scrapingStats?.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {scrapingStats?.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>

            {/* AI Service */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${aiStats?.hasApiKey ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="font-medium text-gray-900 dark:text-white">سرویس هوش مصنوعی</span>
              </div>
              <span className={`text-sm ${aiStats?.hasApiKey ? 'text-green-600' : 'text-yellow-600'}`}>
                {aiStats?.hasApiKey ? 'متصل' : 'حالت نمایشی'}
              </span>
            </div>

            {/* Database Service */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-medium text-gray-900 dark:text-white">پایگاه داده</span>
              </div>
              <span className="text-sm text-green-600">آماده</span>
            </div>

            {/* Network Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${networkStatus?.connectivity === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium text-gray-900 dark:text-white">اتصال شبکه</span>
              </div>
              <span className={`text-sm ${networkStatus?.connectivity === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                {networkStatus?.connectivity === 'online' ? 'متصل' : 'قطع'}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <div className="flex justify-between">
                <span>زمان آپ‌تایم:</span>
                <span className="font-medium">
                  {systemMetrics?.system?.uptime ? 
                    Math.round(systemMetrics.system.uptime / (60 * 1000)) + ' دقیقه' : 
                    'نامعلوم'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>استفاده حافظه:</span>
                <span className="font-medium">{systemMetrics?.system?.memoryUsage || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>تأخیر شبکه:</span>
                <span className="font-medium">{systemMetrics?.system?.networkLatency || 0}ms</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      {performanceSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            جزئیات عملکرد سیستم
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Scraping Performance */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">استخراج اسناد</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">اسناد در ساعت:</span>
                  <span className="font-medium">{performanceSummary.scraping.documentsPerHour}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">کارایی پروکسی:</span>
                  <span className="font-medium">{performanceSummary.scraping.proxyEfficiency}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">نرخ موفقیت:</span>
                  <span className="font-medium text-green-600">{performanceSummary.scraping.averageSuccessRate}%</span>
                </div>
              </div>
            </div>

            {/* AI Performance */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">هوش مصنوعی</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">دقت تحلیل:</span>
                  <span className="font-medium">{Math.round(performanceSummary.ai.analysisAccuracy)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">سرعت پردازش:</span>
                  <span className="font-medium">{performanceSummary.ai.processingSpeed} doc/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">عملکرد مدل:</span>
                  <span className="font-medium text-purple-600">{Math.round(performanceSummary.ai.modelPerformance)}%</span>
                </div>
              </div>
            </div>

            {/* Database Performance */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">پایگاه داده</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">سرعت کوئری:</span>
                  <span className="font-medium">{performanceSummary.database.querySpeed}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">کارایی ذخیره‌سازی:</span>
                  <span className="font-medium">{performanceSummary.database.storageEfficiency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">سلامت ایندکس:</span>
                  <span className="font-medium text-blue-600">{performanceSummary.database.indexHealth}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-gray-900 dark:text-white font-medium">
                  در حال بروزرسانی داده‌ها...
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;