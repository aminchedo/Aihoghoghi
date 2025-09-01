import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Globe, 
  Zap, 
  Activity,
  Settings,
  Eye,
  Download
} from 'lucide-react';

const AutoStartupStatus = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [autoStartupReady, setAutoStartupReady] = useState(false);

  useEffect(() => {
    // Check for auto-startup service
    const checkAutoStartup = () => {
      if (window.autoStartupService) {
        setAutoStartupReady(true);
        const status = window.autoStartupService.getSystemStatus();
        setSystemStatus(status);
        console.log('📊 AutoStartup Status loaded:', status);
      } else if (window.iranianLegalArchive) {
        // Use basic system info
        setSystemStatus({
          initialized: window.iranianLegalArchive.servicesReady || false,
          services: Object.keys(window.iranianLegalArchive.features || {}),
          sessionId: window.iranianLegalArchive.sessionId,
          environment: window.iranianLegalArchive.isGitHubPages ? 'GitHub Pages' : 'Local'
        });
      }
    };

    // Check immediately and then every 5 seconds
    checkAutoStartup();
    const interval = setInterval(checkAutoStartup, 5000);

    return () => clearInterval(interval);
  }, []);

  const getServiceIcon = (serviceName) => {
    const icons = {
      proxyService: Globe,
      scrapingService: RefreshCw,
      database: Database,
      backgroundTasks: Activity,
      smartProxy: Zap,
      iranianDNS: Globe,
      autoScraping: RefreshCw,
      realTimeAnalysis: Eye
    };
    
    const IconComponent = icons[serviceName] || Settings;
    return <IconComponent className="w-4 h-4" />;
  };

  const getServiceStatus = (serviceName) => {
    if (!systemStatus) return 'unknown';
    
    if (systemStatus.services && systemStatus.services.includes(serviceName)) {
      return 'active';
    }
    
    if (window.iranianLegalArchive?.features?.[serviceName]) {
      return 'enabled';
    }
    
    return 'inactive';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'enabled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'inactive': return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
      default: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  if (!isVisible || !systemStatus) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                وضعیت سیستم خودکار
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {systemStatus.environment} • Session: {systemStatus.sessionId?.substring(0, 8)}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              systemStatus.initialized ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              {systemStatus.initialized ? <CheckCircle className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
              {systemStatus.initialized ? 'آماده' : 'در حال راه‌اندازی'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {systemStatus.serviceCount || systemStatus.services?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">سرویس فعال</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {systemStatus.proxyStats?.iranianDNSCount || 7}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">DNS ایرانی</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {systemStatus.proxyStats?.successRate || '0'}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">نرخ موفقیت</div>
          </div>
        </div>

        {/* Services Status */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            وضعیت سرویس‌ها:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'smartProxy', name: 'پروکسی هوشمند' },
              { key: 'iranianDNS', name: 'DNS ایرانی' },
              { key: 'autoScraping', name: 'اسکرپینگ خودکار' },
              { key: 'realTimeAnalysis', name: 'تحلیل بلادرنگ' },
              { key: 'backgroundSync', name: 'همگام‌سازی پس‌زمینه' },
              { key: 'database', name: 'پایگاه داده' }
            ].map((service) => {
              const status = getServiceStatus(service.key);
              return (
                <div
                  key={service.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(status)}`}
                >
                  {getServiceIcon(service.key)}
                  <span className="text-sm font-medium">{service.name}</span>
                  <div className={`w-2 h-2 rounded-full ml-auto ${
                    status === 'active' ? 'bg-green-500' : 
                    status === 'enabled' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => window.autoStartupService?.performHealthCheck()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span className="text-sm">بررسی سلامت</span>
          </button>
          
          <button
            onClick={() => window.autoStartupService?.startBackgroundScraping()}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">شروع اسکرپینگ</span>
          </button>
          
          <button
            onClick={() => window.autoStartupService?.exportSystemState()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">دانلود وضعیت</span>
          </button>
          
          <button
            onClick={() => {
              const guidance = window.autoStartupService?.getNavigationGuidance();
              alert(JSON.stringify(guidance, null, 2));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm">راهنمای ناوبری</span>
          </button>
        </div>

        {/* Recent Logs */}
        {systemStatus.logs && systemStatus.logs.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              آخرین فعالیت‌ها:
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {systemStatus.logs.slice(-5).map((log, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 flex-1">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AutoStartupStatus;