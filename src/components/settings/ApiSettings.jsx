import React, { useState } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

const ApiSettings = ({ config, onConfigChange, onTestConnection }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleConfigUpdate = (key, value) => {
    onConfigChange({ [key]: value });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await onTestConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* API Connection */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          اتصال به سرور
        </h3>
        
        <div className="space-y-4">
          {/* API Base URL */}
          <div>
            <label className="label">
              آدرس پایه API <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={config.apiBaseUrl || ''}
              onChange={(e) => handleConfigUpdate('apiBaseUrl', e.target.value)}
              placeholder="http://127.0.0.1:8000/api"
              className="input"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              آدرس کامل API سرور (بدون / در انتها)
            </p>
          </div>

          {/* WebSocket URL */}
          <div>
            <label className="label">آدرس WebSocket</label>
            <input
              type="text"
              value={config.websocketUrl || ''}
              onChange={(e) => handleConfigUpdate('websocketUrl', e.target.value)}
              placeholder="ws://127.0.0.1:8000/ws"
              className="input"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              آدرس WebSocket برای بروزرسانی بلادرنگ
            </p>
          </div>

          {/* Test Connection */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={handleTestConnection}
              disabled={testing || !config.apiBaseUrl}
              className="btn btn-primary flex items-center space-x-2 space-x-reverse disabled:opacity-50"
            >
              {testing ? <LoadingSpinner size="sm" /> : <span>🔍</span>}
              <span>تست اتصال</span>
            </button>

            {testResult && (
              <div className={`flex items-center space-x-2 space-x-reverse ${
                testResult.success 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <span>{testResult.success ? '✅' : '❌'}</span>
                <span className="text-sm">
                  {testResult.success 
                    ? `اتصال موفق (${testResult.status})`
                    : `خطا: ${testResult.error}`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          تنظیمات درخواست
        </h3>
        
        <div className="space-y-4">
          {/* Timeout */}
          <div>
            <label className="label">زمان انتظار (میلی‌ثانیه)</label>
            <input
              type="number"
              min="5000"
              max="120000"
              step="1000"
              value={config.timeout || 30000}
              onChange={(e) => handleConfigUpdate('timeout', parseInt(e.target.value))}
              className="input"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              حداکثر زمان انتظار برای پاسخ سرور (۵-۱۲۰ ثانیه)
            </p>
          </div>

          {/* Max Retries */}
          <div>
            <label className="label">تعداد تلاش مجدد</label>
            <select
              value={config.maxRetries || 3}
              onChange={(e) => handleConfigUpdate('maxRetries', parseInt(e.target.value))}
              className="input"
            >
              <option value="1">۱ بار</option>
              <option value="2">۲ بار</option>
              <option value="3">۳ بار</option>
              <option value="5">۵ بار</option>
              <option value="10">۱۰ بار</option>
            </select>
          </div>

          {/* Batch Size */}
          <div>
            <label className="label">اندازه پیش‌فرض دسته</label>
            <select
              value={config.batchSize || 5}
              onChange={(e) => handleConfigUpdate('batchSize', parseInt(e.target.value))}
              className="input"
            >
              <option value="1">۱ (کند)</option>
              <option value="3">۳ (متوسط)</option>
              <option value="5">۵ (سریع)</option>
              <option value="10">۱۰ (خیلی سریع)</option>
              <option value="20">۲۰ (حداکثر)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              تعداد درخواست‌های همزمان در پردازش دسته‌ای
            </p>
          </div>
        </div>
      </div>

      {/* Authentication */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          احراز هویت
        </h3>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-yellow-600 dark:text-yellow-400">ℹ️</span>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  احراز هویت در نسخه آینده
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  در حال حاضر سیستم نیازی به احراز هویت ندارد. این قابلیت در نسخه‌های آینده اضافه خواهد شد.
                </p>
              </div>
            </div>
          </div>

          {/* Future API Key Field */}
          <div className="opacity-50">
            <label className="label">کلید API (در آینده)</label>
            <input
              type="password"
              placeholder="api_key_here"
              className="input"
              disabled
            />
          </div>

          {/* Future Token Field */}
          <div className="opacity-50">
            <label className="label">توکن احراز هویت (در آینده)</label>
            <textarea
              placeholder="Bearer token here"
              rows={3}
              className="input resize-none"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Headers */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          هدرهای سفارشی
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            هدرهای HTTP که با تمام درخواست‌ها ارسال می‌شوند:
          </p>
          
          {/* Current Headers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <code className="text-sm">Content-Type: application/json</code>
              <span className="text-xs text-gray-500 dark:text-gray-400">پیش‌فرض</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <code className="text-sm">Accept: application/json</code>
              <span className="text-xs text-gray-500 dark:text-gray-400">پیش‌فرض</span>
            </div>
          </div>

          {/* Add Custom Header */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="نام هدر"
                className="input"
              />
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="text"
                  placeholder="مقدار"
                  className="input flex-1"
                />
                <button className="btn btn-secondary px-3 py-2 whitespace-nowrap">
                  افزودن
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Detection */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          تشخیص محیط
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">محیط فعلی:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {process.env.NODE_ENV === 'development' ? 'توسعه' : 'تولید'}
              </p>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">آدرس فعلی:</span>
              <p className="font-medium text-gray-900 dark:text-white font-mono text-xs">
                {window.location.origin}
              </p>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">پروتکل:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {window.location.protocol === 'https:' ? 'امن (HTTPS)' : 'غیرامن (HTTP)'}
              </p>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">پورت:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}
              </p>
            </div>
          </div>

          {/* Auto-detect Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  تشخیص خودکار آدرس API
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  تنظیم خودکار آدرس API بر اساس محیط
                </p>
              </div>
              <button
                onClick={() => {
                  const autoUrl = process.env.NODE_ENV === 'development' 
                    ? 'http://127.0.0.1:8000/api' 
                    : `${window.location.origin}/api`;
                  handleConfigUpdate('apiBaseUrl', autoUrl);
                }}
                className="btn btn-secondary btn-sm"
              >
                تشخیص خودکار
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;