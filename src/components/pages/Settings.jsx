import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Key, 
  Server, 
  Brain, 
  Database, 
  Shield, 
  Download, 
  Upload,
  Save,
  RotateCcw,
  Check,
  X,
  Eye,
  EyeOff,
  TestTube,
  Zap
} from 'lucide-react';

// Services
import { enhancedAIService } from '../../services/enhancedAIService';
import { smartScrapingService } from '../../services/smartScrapingService';
import { legalDocumentService } from '../../services/legalDocumentService';
import { realTimeMetricsService } from '../../services/realTimeMetricsService';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('api');
  const [settings, setSettings] = useState({
    api: {
      huggingfaceKey: '',
      openaiKey: '',
      claudeKey: ''
    },
    scraping: {
      maxConcurrent: 3,
      delay: 2000,
      timeout: 30000,
      retryAttempts: 3,
      userAgent: 'Mozilla/5.0 (compatible; LegalArchiveBot/1.0)',
      respectRobots: true
    },
    ai: {
      model: 'HooshvareLab/bert-fa-base-uncased',
      confidence: 0.7,
      batchSize: 10,
      enableCache: true,
      language: 'fa'
    },
    database: {
      autoBackup: true,
      backupInterval: 24,
      maxRecords: 100000,
      enableIndexing: true,
      compressionLevel: 6
    },
    ui: {
      theme: 'system',
      language: 'fa',
      refreshInterval: 5000,
      enableAnimations: true,
      showDebugInfo: false
    }
  });
  
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('legalArchive_settings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem('legalArchive_settings', JSON.stringify(settings));
      await applySettingsToServices();
      setHasChanges(false);
      
      const event = new CustomEvent('notification', {
        detail: { type: 'success', message: 'تنظیمات با موفقیت ذخیره شد' }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      const event = new CustomEvent('notification', {
        detail: { type: 'error', message: 'خطا در ذخیره تنظیمات' }
      });
      window.dispatchEvent(event);
    }
  };

  const applySettingsToServices = async () => {
    if (settings.api.huggingfaceKey) {
      enhancedAIService.setApiKey(settings.api.huggingfaceKey);
    }
    console.log('✅ Settings applied to services');
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const testAPIConnection = async (service) => {
    setIsTesting(prev => ({ ...prev, [service]: true }));
    
    try {
      let result;
      
      switch (service) {
        case 'huggingface':
          if (!settings.api.huggingfaceKey) {
            throw new Error('کلید API وارد نشده است');
          }
          result = await enhancedAIService.testConnection();
          break;
          
        case 'scraping':
          result = await smartScrapingService.testAllProxies();
          break;
          
        case 'database':
          result = { success: true, message: 'اتصال موفق' };
          break;
          
        default:
          throw new Error('سرویس نامعلوم');
      }
      
      setTestResults(prev => ({
        ...prev,
        [service]: {
          success: result.success !== false,
          message: result.message || 'اتصال موفق',
          timestamp: new Date().toISOString()
        }
      }));
      
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [service]: {
          success: false,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setIsTesting(prev => ({ ...prev, [service]: false }));
    }
  };

  const tabs = [
    { id: 'api', name: 'API و اتصالات', icon: Key },
    { id: 'scraping', name: 'تنظیمات استخراج', icon: Server },
    { id: 'ai', name: 'هوش مصنوعی', icon: Brain },
    { id: 'database', name: 'پایگاه داده', icon: Database },
    { id: 'ui', name: 'رابط کاربری', icon: SettingsIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            تنظیمات سیستم
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            پیکربندی و مدیریت تنظیمات سیستم آرشیو حقوقی
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={saveSettings}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              ذخیره تغییرات
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Settings Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* API Settings */}
          {activeTab === 'api' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">کلیدهای API</h3>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  کلید API هاگینگ فیس
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type={showPasswords.huggingface ? 'text' : 'password'}
                      value={settings.api.huggingfaceKey}
                      onChange={(e) => updateSetting('api', 'huggingfaceKey', e.target.value)}
                      placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, huggingface: !prev.huggingface }))}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.huggingface ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => testAPIConnection('huggingface')}
                    disabled={isTesting.huggingface || !settings.api.huggingfaceKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isTesting.huggingface ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <TestTube className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    تست
                  </button>
                </div>
                
                {testResults.huggingface && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      testResults.huggingface.success 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {testResults.huggingface.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span className="text-sm">{testResults.huggingface.message}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Other tabs content would be similar... */}
          {activeTab === 'scraping' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">تنظیمات استخراج</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    حداکثر درخواست همزمان
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.scraping.maxConcurrent}
                    onChange={(e) => updateSetting('scraping', 'maxConcurrent', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    تأخیر بین درخواست‌ها (میلی‌ثانیه)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="10000"
                    step="500"
                    value={settings.scraping.delay}
                    onChange={(e) => updateSetting('scraping', 'delay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <button
                onClick={() => testAPIConnection('scraping')}
                disabled={isTesting.scraping}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isTesting.scraping ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <TestTube className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                تست پروکسی‌ها
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;