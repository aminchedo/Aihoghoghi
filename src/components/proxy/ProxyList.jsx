import React from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProxyList = ({ 
  proxies = [], 
  loading = false, 
  selectedProxies = [], 
  onSelectionChange, 
  onTest, 
  onRemove, 
  onRefresh 
}) => {
  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(proxies.map(proxy => proxy.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectProxy = (proxyId, checked) => {
    if (checked) {
      onSelectionChange([...selectedProxies, proxyId]);
    } else {
      onSelectionChange(selectedProxies.filter(id => id !== proxyId));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '🔴';
      case 'testing': return '🟡';
      default: return '⚪';
    }
  };

  const getLatencyColor = (latency) => {
    if (latency < 100) return 'text-green-600 dark:text-green-400';
    if (latency < 300) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <LoadingSpinner size="lg" text="در حال بارگذاری لیست پروکسی‌ها..." />
      </div>
    );
  }

  if (proxies.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🌐</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          هیچ پروکسی یافت نشد
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          لیست پروکسی‌ها خالی است. پروکسی جدید اضافه کنید یا لیست را بروزرسانی کنید.
        </p>
        <button onClick={onRefresh} className="btn btn-primary">
          بروزرسانی لیست
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedProxies.length === proxies.length && proxies.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
              انتخاب همه ({proxies.length})
            </span>
          </label>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button onClick={onRefresh} className="btn btn-secondary btn-sm">
            🔄 بروزرسانی
          </button>
        </div>
      </div>

      {/* Proxy Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  انتخاب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  آدرس
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  کشور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  تأخیر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  آخرین تست
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {proxies.map((proxy) => (
                <tr key={proxy.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProxies.includes(proxy.id)}
                      onChange={(e) => handleSelectProxy(proxy.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg ml-2">{getStatusIcon(proxy.status)}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {proxy.status === 'active' ? 'فعال' : 
                         proxy.status === 'inactive' ? 'غیرفعال' : 
                         proxy.status === 'testing' ? 'در حال تست' : 'نامشخص'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900 dark:text-white">
                      {proxy.host}:{proxy.port}
                    </div>
                    {proxy.type && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {proxy.type.toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {proxy.country && (
                        <>
                          <span className="text-lg ml-1">{proxy.country_flag || '🌐'}</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {proxy.country}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {proxy.latency ? (
                      <span className={`text-sm font-medium ${getLatencyColor(proxy.latency)}`}>
                        {proxy.latency}ms
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {proxy.last_tested ? new Date(proxy.last_tested).toLocaleString('fa-IR') : 'هرگز'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => onTest([proxy.id])}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="تست پروکسی"
                      >
                        🔍
                      </button>
                      <button
                        onClick={() => onRemove([proxy.id])}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="حذف پروکسی"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {proxies.length} پروکسی • {proxies.filter(p => p.status === 'active').length} فعال
        </span>
        {selectedProxies.length > 0 && (
          <span>
            {selectedProxies.length} مورد انتخاب شده
          </span>
        )}
      </div>
    </div>
  );
};

export default ProxyList;