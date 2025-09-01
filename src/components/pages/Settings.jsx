import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConfig } from '../../contexts/ConfigContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';

// Components
import SettingsTabs from '../settings/SettingsTabs';
import GeneralSettings from '../settings/GeneralSettings';
import ApiSettings from '../settings/ApiSettings';
import ProxySettings from '../settings/ProxySettings';
import ImportExportSettings from '../settings/ImportExportSettings';

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { config, updateConfig, resetConfig, testConnection } = useConfig();
  const { theme, toggleTheme } = useTheme();
  const { showNotification, showSuccess, showError } = useNotification();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalConfig, setOriginalConfig] = useState(config);

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // Track config changes
  useEffect(() => {
    const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasUnsavedChanges(hasChanges);
  }, [config, originalConfig]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'تغییرات ذخیره نشده وجود دارد. آیا مطمئن هستید؟';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSaveSettings = async () => {
    try {
      // Test connection if API URL changed
      if (originalConfig.apiBaseUrl !== config.apiBaseUrl) {
        showNotification('در حال تست اتصال...', 'info');
        const result = await testConnection();
        
        if (!result.success) {
          showError('اتصال به API ناموفق بود. تنظیمات ذخیره نشد.');
          return;
        }
      }

      setOriginalConfig(config);
      setHasUnsavedChanges(false);
      showSuccess('تنظیمات با موفقیت ذخیره شد');
    } catch (error) {
      showError('خطا در ذخیره تنظیمات: ' + error.message);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید تمام تنظیمات را به حالت پیش‌فرض برگردانید؟')) {
      resetConfig();
      setOriginalConfig(config);
      setHasUnsavedChanges(false);
      showSuccess('تنظیمات به حالت پیش‌فرض برگردانده شد');
    }
  };

  const handleDiscardChanges = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید تغییرات را لغو کنید؟')) {
      updateConfig(originalConfig);
      setHasUnsavedChanges(false);
      showNotification('تغییرات لغو شد', 'info');
    }
  };

  const tabs = [
    {
      id: 'general',
      title: 'تنظیمات عمومی',
      icon: '⚙️',
      description: 'تم، زبان و تنظیمات کلی',
    },
    {
      id: 'api',
      title: 'تنظیمات API',
      icon: '🔌',
      description: 'آدرس سرور و تنظیمات اتصال',
    },
    {
      id: 'proxy',
      title: 'تنظیمات پروکسی',
      icon: '🌐',
      description: 'مدیریت پروکسی و شبکه',
    },
    {
      id: 'import-export',
      title: 'درون‌ریزی/برون‌ریزی',
      icon: '💾',
      description: 'پشتیبان‌گیری و بازگردانی تنظیمات',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            config={config}
            onConfigChange={updateConfig}
            theme={theme}
            onThemeChange={toggleTheme}
          />
        );
      case 'api':
        return (
          <ApiSettings
            config={config}
            onConfigChange={updateConfig}
            onTestConnection={testConnection}
          />
        );
      case 'proxy':
        return (
          <ProxySettings
            config={config}
            onConfigChange={updateConfig}
          />
        );
      case 'import-export':
        return (
          <ImportExportSettings
            config={config}
            onConfigChange={updateConfig}
            onReset={handleResetSettings}
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
            تنظیمات سیستم
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            پیکربندی و تنظیمات سیستم آرشیو حقوقی
          </p>
        </div>
        
        {/* Save/Reset Actions */}
        {hasUnsavedChanges && (
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={handleDiscardChanges}
              className="btn btn-secondary"
            >
              لغو تغییرات
            </button>
            <button
              onClick={handleSaveSettings}
              className="btn btn-primary"
            >
              ذخیره تنظیمات
            </button>
          </div>
        )}
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                تغییرات ذخیره نشده
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                تغییراتی که اعمال کرده‌اید هنوز ذخیره نشده‌اند. برای اعمال تغییرات، روی "ذخیره تنظیمات" کلیک کنید.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <SettingsTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            آخرین تغییر: {new Date().toLocaleString('fa-IR')}
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={handleResetSettings}
              className="btn btn-secondary text-sm"
            >
              بازنشانی همه تنظیمات
            </button>
            
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveSettings}
                className="btn btn-primary text-sm"
              >
                ذخیره همه تغییرات
              </button>
            )}
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="card p-6 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          اطلاعات سیستم
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">نسخه:</span>
            <p className="font-medium text-gray-900 dark:text-white">۲.۰.۰</p>
          </div>
          
          <div>
            <span className="text-gray-500 dark:text-gray-400">تاریخ ساخت:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date().toLocaleDateString('fa-IR')}
            </p>
          </div>
          
          <div>
            <span className="text-gray-500 dark:text-gray-400">محیط:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {process.env.NODE_ENV === 'development' ? 'توسعه' : 'تولید'}
            </p>
          </div>
          
          <div>
            <span className="text-gray-500 dark:text-gray-400">مرورگر:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {navigator.userAgent.split(' ')[0]}
            </p>
          </div>
          
          <div>
            <span className="text-gray-500 dark:text-gray-400">زبان:</span>
            <p className="font-medium text-gray-900 dark:text-white">فارسی</p>
          </div>
          
          <div>
            <span className="text-gray-500 dark:text-gray-400">جهت:</span>
            <p className="font-medium text-gray-900 dark:text-white">راست به چپ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;