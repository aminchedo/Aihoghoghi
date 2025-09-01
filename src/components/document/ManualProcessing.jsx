import React, { useState } from 'react';
import { useConfig } from '../../contexts/ConfigContext';

const ManualProcessing = ({ onProcess, isProcessing = false }) => {
  const { config } = useConfig();
  const [url, setUrl] = useState('');
  const [useProxy, setUseProxy] = useState(config.proxyEnabled);
  const [maxRetries, setMaxRetries] = useState(config.maxRetries);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return;
    }

    onProcess([cleanUrl], { useProxy, maxRetries });
    setUrl('');
  };

  const isValidUrl = (str) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const urlError = url && !isValidUrl(url) ? 'آدرس وارد شده معتبر نیست' : '';

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          پردازش تک سند
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          آدرس سند حقوقی مورد نظر را وارد کنید تا پردازش و تحلیل شود.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="label">
            آدرس سند (URL) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/legal-document"
              className={`input pr-10 ${urlError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={isProcessing}
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </div>
          {urlError && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {urlError}
            </p>
          )}
        </div>

        {/* Processing Options */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            تنظیمات پردازش
          </h3>
          
          {/* Use Proxy */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                استفاده از پروکسی
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                برای دسترسی بهتر و سرعت بالاتر
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="sr-only peer"
                disabled={isProcessing}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {/* Max Retries */}
          <div>
            <label className="label">
              تعداد تلاش مجدد
            </label>
            <select
              value={maxRetries}
              onChange={(e) => setMaxRetries(parseInt(e.target.value))}
              className="input"
              disabled={isProcessing}
            >
              <option value={1}>۱ بار</option>
              <option value={2}>۲ بار</option>
              <option value={3}>۳ بار</option>
              <option value={5}>۵ بار</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              تعداد دفعات تلاش مجدد در صورت خطا
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            پردازش ممکن است چند دقیقه طول بکشد
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || !url.trim() || urlError}
            className="btn btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -mr-1 ml-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>در حال پردازش...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>شروع پردازش</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          آدرس‌های نمونه
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            'https://dastour.ir/brows/?lid=15',
            'https://rc.majlis.ir/fa/law',
            'https://www.dastour.ir/brows/?lid=1',
          ].map((sampleUrl, index) => (
            <button
              key={index}
              onClick={() => setUrl(sampleUrl)}
              disabled={isProcessing}
              className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              نمونه {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManualProcessing;