import React, { useState, useEffect } from 'react';

const ProxySettings = ({ config, onUpdate, onTest }) => {
  const [proxyConfig, setProxyConfig] = useState({
    enabled: false,
    type: 'http',
    host: '',
    port: '',
    username: '',
    password: '',
    auth: false,
    timeout: 30,
    retries: 3,
    rotateProxies: false,
    proxyList: []
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    if (config?.proxy) {
      setProxyConfig({ ...proxyConfig, ...config.proxy });
    }
  }, [config]);

  const handleChange = (field, value) => {
    const newConfig = { ...proxyConfig, [field]: value };
    setProxyConfig(newConfig);
    onUpdate('proxy', newConfig);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      // Simulate proxy test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionStatus({ success: true, message: 'اتصال پروکسی موفقیت‌آمیز بود' });
    } catch (error) {
      setConnectionStatus({ success: false, message: 'خطا در اتصال پروکسی' });
    } finally {
      setTestingConnection(false);
    }
  };

  const addProxy = () => {
    const newProxy = {
      id: Date.now(),
      host: '',
      port: '',
      username: '',
      password: '',
      active: true
    };
    handleChange('proxyList', [...proxyConfig.proxyList, newProxy]);
  };

  const removeProxy = (id) => {
    const updatedList = proxyConfig.proxyList.filter(proxy => proxy.id !== id);
    handleChange('proxyList', updatedList);
  };

  const updateProxy = (id, field, value) => {
    const updatedList = proxyConfig.proxyList.map(proxy =>
      proxy.id === id ? { ...proxy, [field]: value } : proxy
    );
    handleChange('proxyList', updatedList);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          🌐 تنظیمات پروکسی
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          پیکربندی سرور پروکسی برای درخواست‌های شبکه
        </p>
      </div>

      {/* Enable Proxy */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              فعال‌سازی پروکسی
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              استفاده از سرور پروکسی برای تمام درخواست‌ها
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={proxyConfig.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {proxyConfig.enabled && (
        <>
          {/* Proxy Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              پیکربندی پروکسی
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Proxy Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع پروکسی
                </label>
                <select
                  value={proxyConfig.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>

              {/* Host */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  آدرس سرور
                </label>
                <input
                  type="text"
                  value={proxyConfig.host}
                  onChange={(e) => handleChange('host', e.target.value)}
                  placeholder="127.0.0.1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  پورت
                </label>
                <input
                  type="number"
                  value={proxyConfig.port}
                  onChange={(e) => handleChange('port', e.target.value)}
                  placeholder="8080"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تایم‌اوت (ثانیه)
                </label>
                <input
                  type="number"
                  value={proxyConfig.timeout}
                  onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Authentication */}
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="proxy-auth"
                  checked={proxyConfig.auth}
                  onChange={(e) => handleChange('auth', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="proxy-auth" className="mr-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  نیاز به احراز هویت
                </label>
              </div>

              {proxyConfig.auth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام کاربری
                    </label>
                    <input
                      type="text"
                      value={proxyConfig.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      رمز عبور
                    </label>
                    <input
                      type="password"
                      value={proxyConfig.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Test Connection */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    تست اتصال
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    بررسی صحت تنظیمات پروکسی
                  </p>
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !proxyConfig.host || !proxyConfig.port}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {testingConnection ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال تست...
                    </>
                  ) : (
                    <>
                      🔍 تست اتصال
                    </>
                  )}
                </button>
              </div>

              {connectionStatus && (
                <div className={`mt-4 p-3 rounded-lg ${
                  connectionStatus.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <span>{connectionStatus.success ? '✅' : '❌'}</span>
                    <span className="text-sm">{connectionStatus.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              تنظیمات پیشرفته
            </h3>
            
            <div className="space-y-4">
              {/* Retries */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تعداد تلاش مجدد
                </label>
                <input
                  type="number"
                  value={proxyConfig.retries}
                  onChange={(e) => handleChange('retries', parseInt(e.target.value))}
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Proxy Rotation */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rotate-proxies"
                  checked={proxyConfig.rotateProxies}
                  onChange={(e) => handleChange('rotateProxies', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="rotate-proxies" className="mr-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  چرخش خودکار پروکسی‌ها
                </label>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProxySettings;