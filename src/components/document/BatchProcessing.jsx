import React, { useState } from 'react';
import { useConfig } from '../../contexts/ConfigContext';

const BatchProcessing = ({ onProcess, isProcessing = false }) => {
  const { config } = useConfig();
  const [urls, setUrls] = useState('');
  const [useProxy, setUseProxy] = useState(config.proxyEnabled);
  const [batchSize, setBatchSize] = useState(config.batchSize);
  const [maxRetries, setMaxRetries] = useState(config.maxRetries);

  const parseUrls = (text) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && (line.startsWith('http://') || line.startsWith('https://')));
  };

  const urlList = parseUrls(urls);
  const validUrlCount = urlList.length;
  const invalidLines = urls.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://');
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validUrlCount === 0) return;

    onProcess(urlList, { useProxy, batchSize, maxRetries });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrls(prev => prev ? `${prev}\n${text}` : text);
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  const handleClear = () => {
    setUrls('');
  };

  const estimatedTime = Math.ceil(validUrlCount / batchSize) * 30; // 30 seconds per batch estimate

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          پردازش دسته‌ای اسناد
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          آدرس‌های متعدد را به صورت همزمان پردازش کنید. هر آدرس در یک خط جداگانه قرار دهید.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL List Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="urls" className="label">
              لیست آدرس‌ها (هر خط یک آدرس) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                type="button"
                onClick={handlePaste}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isProcessing}
              >
                📋 چسباندن
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isProcessing}
              >
                🗑️ پاک کردن
              </button>
            </div>
          </div>
          
          <textarea
            id="urls"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://example.com/document1&#10;https://example.com/document2&#10;https://example.com/document3"
            rows={10}
            className="input resize-none font-mono text-sm"
            disabled={isProcessing}
            required
          />
          
          {/* URL Statistics */}
          <div className="mt-2 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-green-600 dark:text-green-400">
                ✅ معتبر: {validUrlCount}
              </span>
              {invalidLines.length > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  ❌ نامعتبر: {invalidLines.length}
                </span>
              )}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              خطوط: {urls.split('\n').filter(line => line.trim()).length}
            </div>
          </div>
          
          {invalidLines.length > 0 && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                خطوط نامعتبر:
              </p>
              <div className="text-xs text-red-700 dark:text-red-300 max-h-20 overflow-y-auto">
                {invalidLines.map((line, index) => (
                  <div key={index} className="font-mono">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Processing Options */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            تنظیمات پردازش دسته‌ای
          </h3>
          
          {/* Use Proxy */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                استفاده از پروکسی
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                برای دسترسی بهتر و جلوگیری از محدودیت
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
          
          {/* Batch Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                اندازه دسته
              </label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="input"
                disabled={isProcessing}
              >
                <option value={1}>۱ (کند)</option>
                <option value={3}>۳ (متوسط)</option>
                <option value={5}>۵ (سریع)</option>
                <option value={10}>۱۰ (خیلی سریع)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                تعداد اسناد پردازش همزمان
              </p>
            </div>
            
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
                تلاش مجدد در صورت خطا
              </p>
            </div>
          </div>
          
          {/* Estimation */}
          {validUrlCount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-blue-600 dark:text-blue-400">⏱️</span>
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    برآورد زمان پردازش: {Math.floor(estimatedTime / 60)} دقیقه و {estimatedTime % 60} ثانیه
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    تعداد دسته‌ها: {Math.ceil(validUrlCount / batchSize)} • اندازه هر دسته: {batchSize}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {validUrlCount > 0 
              ? `آماده پردازش ${validUrlCount} سند`
              : 'حداقل یک آدرس معتبر وارد کنید'
            }
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || validUrlCount === 0}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>شروع پردازش دسته‌ای</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Template Examples */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          قالب‌های نمونه
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setUrls(`https://dastour.ir/brows/?lid=15
https://rc.majlis.ir/fa/law
https://www.dastour.ir/brows/?lid=1
https://dastour.ir/brows/?lid=20`)}
            disabled={isProcessing}
            className="text-xs p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-right disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="font-medium mb-1">نمونه قوانین اساسی</div>
            <div className="text-gray-500 dark:text-gray-400">۴ آدرس نمونه</div>
          </button>
          
          <button
            onClick={() => setUrls(`https://rc.majlis.ir/fa/law/show/94262
https://rc.majlis.ir/fa/law/show/94263
https://rc.majlis.ir/fa/law/show/94264`)}
            disabled={isProcessing}
            className="text-xs p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-right disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="font-medium mb-1">نمونه قوانین مجلس</div>
            <div className="text-gray-500 dark:text-gray-400">۳ آدرس نمونه</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchProcessing;