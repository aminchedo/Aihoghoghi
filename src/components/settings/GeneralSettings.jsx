import React from 'react';

const GeneralSettings = ({ config, onConfigChange, theme, onThemeChange }) => {
  const handleConfigUpdate = (key, value) => {
    onConfigChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          تنظیمات ظاهری
        </h3>
        
        <div className="space-y-4">
          {/* Theme Selection */}
          <div>
            <label className="label">تم رنگی</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <button
                onClick={onThemeChange}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-lg">☀️</span>
                  <span className="text-sm font-medium">روشن</span>
                </div>
              </button>
              
              <button
                onClick={onThemeChange}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-lg">🌙</span>
                  <span className="text-sm font-medium">تیره</span>
                </div>
              </button>
              
              <button
                onClick={onThemeChange}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  theme === 'system'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-lg">🖥️</span>
                  <span className="text-sm font-medium">سیستم</span>
                </div>
              </button>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="label">زبان</label>
            <select
              value={config.language || 'fa'}
              onChange={(e) => handleConfigUpdate('language', e.target.value)}
              className="input"
            >
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              تغییر زبان نیاز به بازنشانی صفحه دارد
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          تنظیمات اعلان‌ها
        </h3>
        
        <div className="space-y-4">
          {/* Notification Position */}
          <div>
            <label className="label">موقعیت اعلان‌ها</label>
            <select
              value={config.notifications?.position || 'top-left'}
              onChange={(e) => handleConfigUpdate('notifications', { 
                ...config.notifications, 
                position: e.target.value 
              })}
              className="input"
            >
              <option value="top-left">بالا راست</option>
              <option value="top-right">بالا چپ</option>
              <option value="bottom-left">پایین راست</option>
              <option value="bottom-right">پایین چپ</option>
              <option value="top-center">بالا وسط</option>
              <option value="bottom-center">پایین وسط</option>
            </select>
          </div>

          {/* Notification Duration */}
          <div>
            <label className="label">مدت نمایش اعلان (ثانیه)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={(config.notifications?.duration || 4000) / 1000}
              onChange={(e) => handleConfigUpdate('notifications', { 
                ...config.notifications, 
                duration: parseInt(e.target.value) * 1000 
              })}
              className="input"
            />
          </div>

          {/* Max Notifications */}
          <div>
            <label className="label">حداکثر تعداد اعلان‌های همزمان</label>
            <select
              value={config.notifications?.maxNotifications || 5}
              onChange={(e) => handleConfigUpdate('notifications', { 
                ...config.notifications, 
                maxNotifications: parseInt(e.target.value) 
              })}
              className="input"
            >
              <option value="3">۳</option>
              <option value="5">۵</option>
              <option value="7">۷</option>
              <option value="10">۱۰</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          تنظیمات عملکرد
        </h3>
        
        <div className="space-y-4">
          {/* Auto Refresh */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                بروزرسانی خودکار
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                بروزرسانی خودکار داده‌ها در صفحات
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoRefresh !== false}
                onChange={(e) => handleConfigUpdate('autoRefresh', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Refresh Interval */}
          {config.autoRefresh !== false && (
            <div>
              <label className="label">فاصله بروزرسانی (ثانیه)</label>
              <select
                value={config.refreshInterval || 30000}
                onChange={(e) => handleConfigUpdate('refreshInterval', parseInt(e.target.value))}
                className="input"
              >
                <option value="5000">۵ ثانیه</option>
                <option value="15000">۱۵ ثانیه</option>
                <option value="30000">۳۰ ثانیه</option>
                <option value="60000">۱ دقیقه</option>
                <option value="300000">۵ دقیقه</option>
              </select>
            </div>
          )}

          {/* Cache Settings */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                کش مرورگر
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ذخیره موقت داده‌ها برای سرعت بیشتر
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.cache?.enabled !== false}
                onChange={(e) => handleConfigUpdate('cache', { 
                  ...config.cache, 
                  enabled: e.target.checked 
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Pagination Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          تنظیمات صفحه‌بندی
        </h3>
        
        <div className="space-y-4">
          {/* Default Page Size */}
          <div>
            <label className="label">تعداد پیش‌فرض آیتم‌ها در هر صفحه</label>
            <select
              value={config.pagination?.defaultPageSize || 20}
              onChange={(e) => handleConfigUpdate('pagination', { 
                ...config.pagination, 
                defaultPageSize: parseInt(e.target.value) 
              })}
              className="input"
            >
              <option value="10">۱۰</option>
              <option value="20">۲۰</option>
              <option value="50">۵۰</option>
              <option value="100">۱۰۰</option>
            </select>
          </div>

          {/* Page Size Options */}
          <div>
            <label className="label">گزینه‌های تعداد آیتم‌ها</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[10, 20, 50, 100, 200].map(size => (
                <label key={size} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(config.pagination?.pageSizeOptions || [10, 20, 50, 100]).includes(size)}
                    onChange={(e) => {
                      const currentOptions = config.pagination?.pageSizeOptions || [10, 20, 50, 100];
                      const newOptions = e.target.checked
                        ? [...currentOptions, size].sort((a, b) => a - b)
                        : currentOptions.filter(s => s !== size);
                      
                      handleConfigUpdate('pagination', { 
                        ...config.pagination, 
                        pageSizeOptions: newOptions 
                      });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 ml-2"
                  />
                  <span className="text-sm">{size}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;