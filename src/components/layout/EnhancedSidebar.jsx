import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  FileText, 
  Brain, 
  Database, 
  Globe, 
  Settings, 
  Server,
  Activity,
  Search,
  Home,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  HelpCircle,
  LogOut
} from 'lucide-react';

// Services
import { realTimeMetricsService } from '../../services/realTimeMetricsService';

const EnhancedSidebar = ({ open, onClose }) => {
  const location = useLocation();
  const [metrics, setMetrics] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Subscribe to real-time metrics
  useEffect(() => {
    const unsubscribe = realTimeMetricsService.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });
    
    // Initial load
    setMetrics(realTimeMetricsService.getMetrics());
    
    return unsubscribe;
  }, []);

  const navigationItems = [
    {
      name: 'داشبورد',
      href: '/dashboard',
      icon: BarChart3,
      description: 'نمای کلی سیستم',
      badge: null
    },
    {
      name: 'استخراج اسناد',
      href: '/scraping',
      icon: Globe,
      description: 'استخراج خودکار اسناد',
      badge: metrics?.scraping?.activeProxies > 0 ? 'فعال' : null,
      badgeColor: 'green'
    },
    {
      name: 'تحلیل هوش مصنوعی',
      href: '/ai-analysis',
      icon: Brain,
      description: 'تحلیل متن با AI',
      badge: metrics?.ai?.documentsAnalyzed > 0 ? metrics.ai.documentsAnalyzed : null,
      badgeColor: 'purple'
    },
    {
      name: 'جستجو در پایگاه',
      href: '/search',
      icon: Search,
      description: 'جستجوی پیشرفته',
      badge: null
    },
    {
      name: 'مدیریت اسناد',
      href: '/documents',
      icon: FileText,
      description: 'مدیریت اسناد',
      badge: metrics?.database?.totalRecords > 0 ? metrics.database.totalRecords : null,
      badgeColor: 'blue'
    },
    {
      name: 'پروکسی و شبکه',
      href: '/proxy',
      icon: Server,
      description: 'مدیریت پروکسی',
      badge: null
    },
    {
      name: 'تنظیمات',
      href: '/settings',
      icon: Settings,
      description: 'تنظیمات سیستم',
      badge: null
    }
  ];

  const quickActions = [
    {
      name: 'استخراج سریع',
      icon: Zap,
      action: () => {
        // Trigger quick scraping
        window.dispatchEvent(new CustomEvent('quickScrape'));
      },
      color: 'green'
    },
    {
      name: 'تحلیل سریع',
      icon: Brain,
      action: () => {
        // Trigger quick analysis
        window.dispatchEvent(new CustomEvent('quickAnalysis'));
      },
      color: 'purple'
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ 
          x: open ? 0 : -300,
          width: isCollapsed ? 64 : 256
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-50 shadow-xl ${
          isCollapsed ? 'w-16' : 'w-64'
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-sm">آرشیو حقوقی</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">سیستم مدیریت اسناد</p>
                </div>
              </motion.div>
            )}
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* System Status Indicator */}
        {!isCollapsed && metrics && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">وضعیت سیستم</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  realTimeMetricsService.calculateOverallHealth() > 80 ? 'bg-green-500' :
                  realTimeMetricsService.calculateOverallHealth() > 60 ? 'bg-yellow-500' : 'bg-red-500'
                } animate-pulse`} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {realTimeMetricsService.calculateOverallHealth()}%
                </span>
              </div>
            </div>
            
            <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${realTimeMetricsService.calculateOverallHealth()}%` }}
                transition={{ duration: 1 }}
                className={`h-full ${
                  realTimeMetricsService.calculateOverallHealth() > 80 ? 'bg-green-500' :
                  realTimeMetricsService.calculateOverallHealth() > 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <div className={`p-1.5 rounded-md ${
                    isActive 
                      ? 'bg-blue-100 dark:bg-blue-800' 
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      
                      {item.badge && (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          item.badgeColor === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          item.badgeColor === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                          item.badgeColor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Quick Actions */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 border-t border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">اقدامات سریع</h3>
            
            <div className="space-y-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (index * 0.05) }}
                    onClick={action.action}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                      action.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30' :
                      action.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30' :
                      'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {action.name}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* System Metrics */}
        {!isCollapsed && metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 border-t border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">آمار لحظه‌ای</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">اسناد:</span>
                <span className="font-medium text-blue-600">{metrics.database?.totalRecords || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">تحلیل‌ها:</span>
                <span className="font-medium text-purple-600">{metrics.ai?.documentsAnalyzed || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">نرخ موفقیت:</span>
                <span className="font-medium text-green-600">{metrics.scraping?.successRate || 0}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">آپ‌تایم:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {metrics.system?.uptime ? Math.round(metrics.system.uptime / (60 * 1000)) + 'م' : '0م'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 border-t border-gray-200 dark:border-gray-700"
        >
          {!isCollapsed ? (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                سیستم آرشیو اسناد حقوقی ایران
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                نسخه 2.0.0
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </motion.div>
      </motion.aside>
    </>
  );
};

export default EnhancedSidebar;