import React, { useState, useEffect } from 'react';
import { useResilientAPI } from '../../hooks/useResilientAPI';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useConfig } from '../../contexts/ConfigContext';
import { useNotification } from '../../contexts/NotificationContext';

// Components
import StatsCard from '../ui/StatsCard';
import Chart from '../ui/Chart';
import RecentActivity from '../ui/RecentActivity';
import SystemHealth from '../ui/SystemHealth';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import AutoStartupStatus from '../ui/AutoStartupStatus';

const Dashboard = () => {
  const { getApiUrl, config } = useConfig();
  const { showApiError } = useNotification();
  const queryClient = useQueryClient();
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  // Resilient API for additional system health data
  const { 
    data: healthData, 
    loading: healthLoading, 
    error: healthError,
    refetch: refetchHealth 
  } = useResilientAPI('/health', {
    fallbackData: {
      status: 'unknown',
      services: {
        database: 'unknown',
        ai: 'unknown',
        scraping: 'unknown'
      }
    }
  });

  // Fetch system status
  const { data: systemStatus, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/status'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: true,
  });

  // Fetch system statistics
  const { data: systemStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['systemStats'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/stats'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: true,
  });

  // Fetch network status
  const { data: networkStatus, isLoading: networkLoading } = useQuery({
    queryKey: ['networkStatus'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/network'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: refreshInterval * 2, // Less frequent for network status
  });

  // Fetch recent logs
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['recentLogs'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/logs?limit=10'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: refreshInterval,
  });

  // Handle errors
  useEffect(() => {
    if (statusError) {
      showApiError(statusError, 'خطا در دریافت وضعیت سیستم');
    }
    if (statsError) {
      showApiError(statsError, 'خطا در دریافت آمار سیستم');
    }
  }, [statusError, statsError, showApiError]);

  // Manual refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setRefreshInterval(prev => prev === 0 ? 30000 : 0);
  };

  const isLoading = statusLoading || statsLoading;

  // Prepare stats cards data
  const statsCards = [
    {
      title: 'کل عملیات',
      value: systemStats?.session?.total_operations || 0,
      change: '+12%',
      changeType: 'positive',
      icon: '📊',
      description: 'تعداد کل عملیات انجام شده',
    },
    {
      title: 'عملیات موفق',
      value: systemStats?.session?.successful_operations || 0,
      change: '+8%',
      changeType: 'positive',
      icon: '✅',
      description: 'عملیات با موفقیت انجام شده',
    },
    {
      title: 'پروکسی فعال',
      value: networkStatus?.active_proxies || 0,
      change: networkStatus?.total_proxies ? `از ${networkStatus.total_proxies}` : '0',
      changeType: networkStatus?.active_proxies > 0 ? 'positive' : 'negative',
      icon: '🌐',
      description: 'تعداد پروکسی‌های فعال',
    },
    {
      title: 'کارهای در صف',
      value: systemStatus?.current_batch || 0,
      change: systemStatus?.is_processing ? 'در حال پردازش' : 'آماده',
      changeType: systemStatus?.is_processing ? 'warning' : 'neutral',
      icon: '⏳',
      description: 'وضعیت صف پردازش',
    },
  ];

  // Prepare chart data for operations over time
  const chartData = {
    labels: ['۶ ساعت قبل', '۵ ساعت قبل', '۴ ساعت قبل', '۳ ساعت قبل', '۲ ساعت قبل', '۱ ساعت قبل', 'اکنون'],
    datasets: [
      {
        label: 'عملیات موفق',
        data: [12, 19, 15, 25, 22, 30, 28],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'عملیات ناموفق',
        data: [2, 3, 2, 5, 2, 4, 3],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Startup Status */}
      <AutoStartupStatus />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            داشبورد اصلی
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            نمای کلی از وضعیت سیستم آرشیو حقوقی
          </p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={toggleAutoRefresh}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              refreshInterval > 0
                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {refreshInterval > 0 ? '🔄 بروزرسانی خودکار' : '⏸️ بروزرسانی متوقف'}
          </button>
          
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 بروزرسانی
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <StatsCard key={index} {...card} />
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Chart */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                روند عملیات
              </h2>
              <div className="flex space-x-2 space-x-reverse">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
                  موفق
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full ml-1"></div>
                  ناموفق
                </span>
              </div>
            </div>
            <Chart type="line" data={chartData} height={300} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <RecentActivity logs={recentLogs?.logs || []} loading={logsLoading} />
          <SystemHealth 
            status={systemStats?.system_health}
            networkStatus={networkStatus}
          />
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Processing Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            وضعیت پردازش
          </h3>
          
          {systemStatus?.is_processing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">پردازش فعال</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-1"></div>
                  در حال اجرا
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">پیشرفت</span>
                  <span className="font-medium">
                    {systemStatus.current_batch}/{systemStatus.total_batches}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(systemStatus.current_batch / systemStatus.total_batches) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {systemStatus.current_url && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">در حال پردازش:</p>
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">
                    {systemStatus.current_url}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💤</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">سیستم در حالت آماده باش</p>
            </div>
          )}
        </div>

        {/* Database Stats */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            آمار پایگاه داده
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">کل اسناد</span>
              <span className="font-semibold text-lg">
                {systemStats?.documents?.total_documents || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">دسته‌بندی شده</span>
              <span className="font-semibold text-lg text-green-600">
                {systemStats?.documents?.classified_documents || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">منابع فعال</span>
              <span className="font-semibold text-lg text-blue-600">
                {systemStats?.sources?.total || 0}
              </span>
            </div>
            
            {systemStats?.sources?.categories && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">دسته‌بندی منابع:</p>
                <div className="flex flex-wrap gap-1">
                  {systemStats.sources.categories.slice(0, 3).map((category, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                      {category}
                    </span>
                  ))}
                  {systemStats.sources.categories.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                      +{systemStats.sources.categories.length - 3} بیشتر
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            عملیات سریع
          </h3>
          
          <div className="space-y-3">
            <button 
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              onClick={() => window.location.href = '/process'}
            >
              <span className="ml-2">📄</span>
              پردازش سند جدید
            </button>
            
            <button 
              className="w-full flex items-center justify-center px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              onClick={() => window.location.href = '/search'}
            >
              <span className="ml-2">🔍</span>
              جستجو در پایگاه داده
            </button>
            
            <button 
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              onClick={() => window.location.href = '/proxy'}
            >
              <span className="ml-2">🌐</span>
              مدیریت پروکسی
            </button>
          </div>
        </div>
      </div>

      {/* Error States */}
      {statusError && (
        <ErrorMessage 
          title="خطا در دریافت وضعیت سیستم"
          message={statusError.message}
          onRetry={() => queryClient.invalidateQueries(['systemStatus'])}
        />
      )}
      
      {statsError && (
        <ErrorMessage 
          title="خطا در دریافت آمار سیستم"
          message={statsError.message}
          onRetry={() => queryClient.invalidateQueries(['systemStats'])}
        />
      )}
    </div>
  );
};

export default Dashboard;