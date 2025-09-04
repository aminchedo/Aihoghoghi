import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Sun, 
  Moon, 
  Monitor,
  Settings,
  LogOut,
  Shield,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react'

// Contexts
import { useSystem } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'

const Header = ({ onMenuClick }) => {
  const [theme, setTheme] = useState('system')
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Get system state from contexts
  const { metrics, connectionStatus, systemHealth, loadSystemMetrics } = useSystem()
  const { isConnected, lastMessage } = useWebSocket()

  // Listen for WebSocket messages to create notifications
  useEffect(() => {
    if (lastMessage) {
      const notification = {
        id: Date.now(),
        message: lastMessage.message || 'بروزرسانی سیستم',
        type: lastMessage.type || 'info',
        timestamp: new Date()
      }
      setNotifications(prev => [notification, ...prev.slice(0, 9)])
    }
  }, [lastMessage])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Apply theme to document
  const applyTheme = (newTheme) => {
    const root = window.document.documentElement;
    
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Change theme
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Mock notifications for demonstration
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        title: 'استخراج موفق',
        message: '5 سند جدید از مجلس شورای اسلامی استخراج شد',
        type: 'success',
        time: '2 دقیقه پیش'
      },
      {
        id: 2,
        title: 'تحلیل کامل شد',
        message: 'تحلیل هوش مصنوعی 3 سند با دقت 94% انجام شد',
        type: 'info',
        time: '5 دقیقه پیش'
      },
      {
        id: 3,
        title: 'هشدار پروکسی',
        message: '2 پروکسی از دسترس خارج شده‌اند',
        type: 'warning',
        time: '10 دقیقه پیش'
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const themeOptions = [
    { value: 'light', label: 'روشن', icon: Sun },
    { value: 'dark', label: 'تیره', icon: Moon },
    { value: 'system', label: 'سیستم', icon: Monitor }
  ];

  const getSystemHealthTextColor = () => {
    const health = realTimeMetricsService.calculateOverallHealth();
    if (health > 80) return 'text-green-500';
    if (health > 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSystemHealthBgColor = () => {
    const health = realTimeMetricsService.calculateOverallHealth();
    if (health > 80) return 'bg-green-500';
    if (health > 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* System Status */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getSystemHealthTextColor()} animate-pulse`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  سیستم سالم
                </span>
              </div>
              
              {metrics && (
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {metrics.database?.totalRecords || 0} سند
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {metrics.scraping?.successRate || 0}% موفقیت
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Center - Time */}
          <div className="hidden md:flex items-center">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {currentTime.toLocaleTimeString('fa-IR')}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {currentTime.toLocaleDateString('fa-IR', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="hidden lg:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجوی سریع..."
                  className="w-64 px-3 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">اعلان‌ها</h3>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' :
                              notification.type === 'error' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">اعلانی موجود نیست</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  const themes = ['light', 'dark', 'system'];
                  const currentIndex = themes.indexOf(theme);
                  const nextTheme = themes[(currentIndex + 1) % themes.length];
                  changeTheme(nextTheme);
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="تغییر تم"
              >
                {theme === 'light' && <Sun className="w-5 h-5" />}
                {theme === 'dark' && <Moon className="w-5 h-5" />}
                {theme === 'system' && <Monitor className="w-5 h-5" />}
              </button>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium">کاربر سیستم</span>
              </button>
              
              {/* User Dropdown */}
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-900 dark:text-white">کاربر سیستم</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">مدیر آرشیو حقوقی</p>
                  </div>
                  
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                      تنظیمات حساب
                    </button>
                    
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Activity className="w-4 h-4" />
                      گزارش فعالیت
                    </button>
                    
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <LogOut className="w-4 h-4" />
                      خروج از سیستم
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getSystemHealthBgColor()}`} />
                  <span className="text-gray-600 dark:text-gray-400">
                    سلامت سیستم: {realTimeMetricsService.calculateOverallHealth()}%
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {metrics.database?.totalRecords || 0} سند
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {metrics.scraping?.successRate || 0}% موفقیت
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-gray-500 dark:text-gray-400">
                  آپ‌تایم: {metrics.system?.uptime ? Math.round(metrics.system.uptime / (60 * 1000)) + ' دقیقه' : '0 دقیقه'}
                </span>
                
                <button
                  onClick={() => {
                    // Trigger system refresh
                    window.dispatchEvent(new CustomEvent('systemRefresh'));
                  }}
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  بروزرسانی
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;