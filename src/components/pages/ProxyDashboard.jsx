import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useConfig } from '../../contexts/ConfigContext';
import { useNotification } from '../../contexts/NotificationContext';

// Components
import ProxyTabs from '../proxy/ProxyTabs';
import ProxyList from '../proxy/ProxyList';
import ProxyHealthCheck from '../proxy/ProxyHealthCheck';
import AddProxy from '../proxy/AddProxy';
import NetworkStats from '../proxy/NetworkStats';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

const ProxyDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getApiUrl } = useConfig();
  const { showNotification, showApiError } = useNotification();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'list');
  const [selectedProxies, setSelectedProxies] = useState([]);

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // Fetch proxy list
  const { 
    data: proxyData, 
    isLoading: proxyLoading, 
    error: proxyError 
  } = useQuery({
    queryKey: ['proxyList'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/network/proxies'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch network statistics
  const { 
    data: networkStats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['networkStats'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/network'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Test proxy health mutation
  const testProxyMutation = useMutation({
    mutationFn: async (proxyIds) => {
      const response = await fetch(getApiUrl('/network/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy_ids: proxyIds }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      showNotification(`تست ${data.tested_count} پروکسی تکمیل شد`, 'success');
      queryClient.invalidateQueries(['proxyList']);
      queryClient.invalidateQueries(['networkStats']);
    },
    onError: (error) => {
      showApiError(error, 'خطا در تست پروکسی‌ها');
    },
  });

  // Add proxy mutation
  const addProxyMutation = useMutation({
    mutationFn: async (proxyData) => {
      const response = await fetch(getApiUrl('/network/proxies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxyData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      showNotification('پروکسی جدید با موفقیت اضافه شد', 'success');
      queryClient.invalidateQueries(['proxyList']);
      queryClient.invalidateQueries(['networkStats']);
    },
    onError: (error) => {
      showApiError(error, 'خطا در افزودن پروکسی');
    },
  });

  // Remove proxy mutation
  const removeProxyMutation = useMutation({
    mutationFn: async (proxyIds) => {
      const response = await fetch(getApiUrl('/network/proxies'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy_ids: proxyIds }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      showNotification(`${data.removed_count} پروکسی حذف شد`, 'success');
      queryClient.invalidateQueries(['proxyList']);
      queryClient.invalidateQueries(['networkStats']);
      setSelectedProxies([]);
    },
    onError: (error) => {
      showApiError(error, 'خطا در حذف پروکسی‌ها');
    },
  });

  // Update proxy list mutation
  const updateProxyListMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(getApiUrl('/network/update'), {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      showNotification('لیست پروکسی‌ها بروزرسانی شد', 'success');
      queryClient.invalidateQueries(['proxyList']);
      queryClient.invalidateQueries(['networkStats']);
    },
    onError: (error) => {
      showApiError(error, 'خطا در بروزرسانی لیست پروکسی‌ها');
    },
  });

  const handleTestProxies = (proxyIds) => {
    testProxyMutation.mutate(proxyIds);
  };

  const handleAddProxy = (proxyData) => {
    addProxyMutation.mutate(proxyData);
  };

  const handleRemoveProxies = (proxyIds) => {
    removeProxyMutation.mutate(proxyIds);
  };

  const handleUpdateProxyList = () => {
    updateProxyListMutation.mutate();
  };

  const tabs = [
    {
      id: 'list',
      title: 'لیست پروکسی‌ها',
      icon: '📋',
      description: 'مشاهده و مدیریت پروکسی‌ها',
    },
    {
      id: 'health',
      title: 'تست سلامت',
      icon: '🏥',
      description: 'بررسی وضعیت پروکسی‌ها',
    },
    {
      id: 'add',
      title: 'افزودن پروکسی',
      icon: '➕',
      description: 'اضافه کردن پروکسی جدید',
    },
    {
      id: 'stats',
      title: 'آمار شبکه',
      icon: '📈',
      description: 'آمار و گزارش‌های شبکه',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <ProxyList
            proxies={proxyData?.proxies || []}
            loading={proxyLoading}
            selectedProxies={selectedProxies}
            onSelectionChange={setSelectedProxies}
            onTest={handleTestProxies}
            onRemove={handleRemoveProxies}
            onRefresh={() => queryClient.invalidateQueries(['proxyList'])}
          />
        );
      case 'health':
        return (
          <ProxyHealthCheck
            proxies={proxyData?.proxies || []}
            loading={proxyLoading}
            onTest={handleTestProxies}
            testLoading={testProxyMutation.isLoading}
          />
        );
      case 'add':
        return (
          <AddProxy
            onAdd={handleAddProxy}
            loading={addProxyMutation.isLoading}
          />
        );
      case 'stats':
        return (
          <NetworkStats
            stats={networkStats}
            loading={statsLoading}
            onRefresh={() => queryClient.invalidateQueries(['networkStats'])}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            مدیریت پروکسی و شبکه
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            مدیریت پروکسی‌ها، تست سلامت و نظارت بر شبکه
          </p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* Network Status */}
          {networkStats && (
            <div className="flex items-center space-x-2 space-x-reverse px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                networkStats.active_proxies > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {networkStats.active_proxies} از {networkStats.total_proxies} فعال
              </span>
            </div>
          )}
          
          {/* Update Button */}
          <button
            onClick={handleUpdateProxyList}
            disabled={updateProxyListMutation.isLoading}
            className="btn btn-secondary flex items-center space-x-2 space-x-reverse"
          >
            {updateProxyListMutation.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>بروزرسانی لیست</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {networkStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">کل پروکسی‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {networkStats.total_proxies || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🌐</span>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">فعال</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {networkStats.active_proxies || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">میانگین تأخیر</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {networkStats.avg_latency ? `${networkStats.avg_latency}ms` : 'N/A'}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">نرخ موفقیت</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {networkStats.success_rate ? `${networkStats.success_rate}%` : 'N/A'}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <ProxyTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>

      {/* Error Display */}
      {proxyError && (
        <ErrorMessage
          title="خطا در دریافت لیست پروکسی‌ها"
          message={proxyError.message}
          onRetry={() => queryClient.invalidateQueries(['proxyList'])}
        />
      )}

      {/* Bulk Actions */}
      {selectedProxies.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-40">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedProxies.length} پروکسی انتخاب شده
            </span>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => handleTestProxies(selectedProxies)}
                disabled={testProxyMutation.isLoading}
                className="btn btn-primary btn-sm"
              >
                تست انتخاب شده‌ها
              </button>
              
              <button
                onClick={() => handleRemoveProxies(selectedProxies)}
                disabled={removeProxyMutation.isLoading}
                className="btn btn-danger btn-sm"
              >
                حذف انتخاب شده‌ها
              </button>
              
              <button
                onClick={() => setSelectedProxies([])}
                className="btn btn-secondary btn-sm"
              >
                لغو انتخاب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProxyDashboard;