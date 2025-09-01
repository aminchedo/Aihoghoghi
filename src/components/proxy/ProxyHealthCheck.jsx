import React from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProxyHealthCheck = ({ proxies = [], loading = false, onTest, testLoading = false }) => {
  const activeProxies = proxies.filter(p => p.status === 'active');
  const inactiveProxies = proxies.filter(p => p.status === 'inactive');
  const untested = proxies.filter(p => !p.last_tested);

  const handleTestAll = () => {
    const proxyIds = proxies.map(p => p.id);
    onTest(proxyIds);
  };

  const handleTestActive = () => {
    const proxyIds = activeProxies.map(p => p.id);
    onTest(proxyIds);
  };

  const handleTestInactive = () => {
    const proxyIds = inactiveProxies.map(p => p.id);
    onTest(proxyIds);
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <LoadingSpinner size="lg" text="در حال بارگذاری اطلاعات پروکسی‌ها..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {proxies.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">کل پروکسی‌ها</div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {activeProxies.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">فعال</div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {inactiveProxies.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">غیرفعال</div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {untested.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">تست نشده</div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          تست سلامت پروکسی‌ها
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleTestAll}
            disabled={testLoading || proxies.length === 0}
            className="btn btn-primary flex items-center justify-center space-x-2 space-x-reverse"
          >
            {testLoading ? <LoadingSpinner size="sm" /> : <span>🔍</span>}
            <span>تست همه ({proxies.length})</span>
          </button>
          
          <button
            onClick={handleTestActive}
            disabled={testLoading || activeProxies.length === 0}
            className="btn btn-success flex items-center justify-center space-x-2 space-x-reverse"
          >
            {testLoading ? <LoadingSpinner size="sm" /> : <span>✅</span>}
            <span>تست فعال‌ها ({activeProxies.length})</span>
          </button>
          
          <button
            onClick={handleTestInactive}
            disabled={testLoading || inactiveProxies.length === 0}
            className="btn btn-warning flex items-center justify-center space-x-2 space-x-reverse"
          >
            {testLoading ? <LoadingSpinner size="sm" /> : <span>🔄</span>}
            <span>تست غیرفعال‌ها ({inactiveProxies.length})</span>
          </button>
        </div>
      </div>

      {/* Health Details */}
      {proxies.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            جزئیات سلامت
          </h3>
          
          <div className="space-y-4">
            {/* Latency Distribution */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                توزیع تأخیر
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded text-center">
                  <div className="font-semibold text-green-800 dark:text-green-200">
                    {proxies.filter(p => p.latency && p.latency < 100).length}
                  </div>
                  <div className="text-green-600 dark:text-green-400">&lt; 100ms</div>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded text-center">
                  <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {proxies.filter(p => p.latency && p.latency >= 100 && p.latency < 300).length}
                  </div>
                  <div className="text-yellow-600 dark:text-yellow-400">100-300ms</div>
                </div>
                <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded text-center">
                  <div className="font-semibold text-red-800 dark:text-red-200">
                    {proxies.filter(p => p.latency && p.latency >= 300).length}
                  </div>
                  <div className="text-red-600 dark:text-red-400">&gt; 300ms</div>
                </div>
              </div>
            </div>

            {/* Country Distribution */}
            {proxies.some(p => p.country) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توزیع کشورها
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    proxies.reduce((acc, proxy) => {
                      if (proxy.country) {
                        acc[proxy.country] = (acc[proxy.country] || 0) + 1;
                      }
                      return acc;
                    }, {})
                  ).map(([country, count]) => (
                    <span
                      key={country}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                    >
                      {country} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Last Test Times */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                آخرین تست‌ها
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">امروز:</span>
                  <span className="font-medium mr-2">
                    {proxies.filter(p => {
                      if (!p.last_tested) return false;
                      const testDate = new Date(p.last_tested);
                      const today = new Date();
                      return testDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">این هفته:</span>
                  <span className="font-medium mr-2">
                    {proxies.filter(p => {
                      if (!p.last_tested) return false;
                      const testDate = new Date(p.last_tested);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return testDate > weekAgo;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {proxies.length === 0 && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏥</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            هیچ پروکسی برای تست وجود ندارد
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            ابتدا پروکسی‌هایی اضافه کنید تا بتوانید سلامت آنها را بررسی کنید.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProxyHealthCheck;