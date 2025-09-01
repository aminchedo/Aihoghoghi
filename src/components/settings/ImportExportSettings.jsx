import React, { useState } from 'react';

const ImportExportSettings = ({ config, onImport, onExport }) => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exportResult, setExportResult] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const exportData = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        settings: config,
        metadata: {
          exportedBy: 'Iranian Legal Archive System',
          totalSettings: Object.keys(config || {}).length
        }
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `legal-archive-settings-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportResult({ success: true, message: 'تنظیمات با موفقیت صادر شد' });
      
      if (onExport) onExport(exportData);
    } catch (error) {
      setExportResult({ success: false, message: 'خطا در صادرات تنظیمات' });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file) => {
    setImporting(true);
    setImportResult(null);
    
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data
      if (!importData.settings || !importData.version) {
        throw new Error('فرمت فایل نامعتبر است');
      }

      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setImportResult({ 
        success: true, 
        message: `تنظیمات با موفقیت وارد شد (نسخه ${importData.version})`,
        data: importData
      });
      
      if (onImport) onImport(importData.settings);
    } catch (error) {
      setImportResult({ 
        success: false, 
        message: `خطا در واردات تنظیمات: ${error.message}` 
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImport(file);
    }
  };

  const resetSettings = async () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید تمام تنظیمات را به حالت پیش‌فرض برگردانید؟')) {
      try {
        // Simulate reset
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const defaultSettings = {
          theme: 'light',
          language: 'fa',
          api: {
            baseUrl: 'http://localhost:8000',
            timeout: 30000,
            retries: 3
          },
          proxy: {
            enabled: false
          },
          processing: {
            batchSize: 10,
            maxFileSize: 50,
            autoProcess: false
          }
        };

        if (onImport) onImport(defaultSettings);
        setImportResult({ 
          success: true, 
          message: 'تنظیمات به حالت پیش‌فرض بازگردانده شد' 
        });
      } catch (error) {
        setImportResult({ 
          success: false, 
          message: 'خطا در بازگردانی تنظیمات' 
        });
      }
    }
  };

  const getConfigStats = () => {
    if (!config) return { total: 0, categories: 0 };
    
    const categories = Object.keys(config).length;
    let total = 0;
    
    const countSettings = (obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          countSettings(obj[key]);
        } else {
          total++;
        }
      });
    };
    
    countSettings(config);
    return { total, categories };
  };

  const stats = getConfigStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          📁 واردات و صادرات تنظیمات
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          پشتیبان‌گیری، بازیابی و انتقال تنظیمات سیستم
        </p>
      </div>

      {/* Current Settings Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          📊 وضعیت فعلی تنظیمات
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              کل تنظیمات
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.categories}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              دسته‌بندی‌ها
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              2.0.0
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              نسخه سیستم
            </div>
          </div>
        </div>
      </div>

      {/* Export Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              📤 صادرات تنظیمات
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              ایجاد فایل پشتیبان از تمام تنظیمات فعلی
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال صادرات...
              </>
            ) : (
              <>
                📤 صادرات تنظیمات
              </>
            )}
          </button>
        </div>

        {exportResult && (
          <div className={`p-3 rounded-lg ${
            exportResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              <span>{exportResult.success ? '✅' : '❌'}</span>
              <span className="text-sm">{exportResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Import Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            📥 واردات تنظیمات
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            بازیابی تنظیمات از فایل پشتیبان
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              انتخاب فایل پشتیبان
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={importing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              فقط فایل‌های JSON قابل قبول هستند
            </p>
          </div>

          {importing && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">در حال واردات تنظیمات...</span>
            </div>
          )}

          {importResult && (
            <div className={`p-3 rounded-lg ${
              importResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              <div className="flex items-center gap-2">
                <span>{importResult.success ? '✅' : '❌'}</span>
                <span className="text-sm">{importResult.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">
              🔄 بازگردانی به تنظیمات پیش‌فرض
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              حذف تمام تنظیمات سفارشی و بازگشت به حالت پیش‌فرض
            </p>
          </div>
          <button
            onClick={resetSettings}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            🔄 بازگردانی
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400">⚠️</span>
            <div className="text-sm text-red-700 dark:text-red-300">
              <strong>هشدار:</strong> این عملیات غیرقابل بازگشت است. تمام تنظیمات سفارشی شما حذف خواهد شد.
              قبل از انجام این کار، حتماً از تنظیمات خود پشتیبان تهیه کنید.
            </div>
          </div>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
          📖 راهنمای استفاده
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>برای پشتیبان‌گیری از تنظیمات، روی دکمه "صادرات تنظیمات" کلیک کنید</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>برای بازیابی تنظیمات، فایل JSON پشتیبان را انتخاب کنید</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>فایل‌های پشتیبان شامل تمام تنظیمات سیستم هستند</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>پس از واردات تنظیمات، ممکن است نیاز به بازآغازی برنامه باشد</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ImportExportSettings;