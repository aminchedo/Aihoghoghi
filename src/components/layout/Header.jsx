import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useNotification } from '../../contexts/NotificationContext';

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  const { config, backendStatus, testConnection } = useConfig();
  const { showConnectionStatus } = useNotification();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnectionTesting, setIsConnectionTesting] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Test backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      setIsConnectionTesting(true);
      try {
        await testConnection();
      } catch (error) {
        console.error('Connection test failed:', error);
      } finally {
        setIsConnectionTesting(false);
      }
    };

    checkConnection();
  }, [testConnection]);

  const handleConnectionTest = async () => {
    setIsConnectionTesting(true);
    try {
      const result = await testConnection();
      if (result.success) {
        showConnectionStatus('connected');
      } else {
        showConnectionStatus('error');
      }
    } catch (error) {
      showConnectionStatus('error');
    } finally {
      setIsConnectionTesting(false);
    }
  };

  const getPageTitle = () => {
    const pathMap = {
      '/dashboard': 'داشبورد اصلی',
      '/process': 'پردازش اسناد',
      '/proxy': 'مدیریت پروکسی',
      '/search': 'جستجو در پایگاه داده',
      '/settings': 'تنظیمات',
    };
    return pathMap[location.pathname] || 'سیستم آرشیو حقوقی';
  };

  const getStatusIcon = () => {
    if (isConnectionTesting) {
      return (
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      );
    }

    switch (backendStatus) {
      case 'connected':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'error':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
    }
  };

  const getStatusText = () => {
    if (isConnectionTesting) return 'در حال بررسی...';
    
    switch (backendStatus) {
      case 'connected':
        return 'متصل';
      case 'error':
        return 'قطع شده';
      default:
        return 'نامشخص';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50 h-16">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Right side - Menu button and title */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <span className="text-white text-lg font-bold">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  سیستم آرشیو اسناد حقوقی ایران
                </p>
              </div>
            </div>
          </div>

          {/* Left side - Status, time, and controls */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Connection status */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleConnectionTest}
                className="flex items-center space-x-2 space-x-reverse px-3 py-1.5 rounded-md text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isConnectionTesting}
              >
                {getStatusIcon()}
                <span className="text-gray-700 dark:text-gray-300">
                  {getStatusText()}
                </span>
              </button>
            </div>

            {/* Current time */}
            <div className="hidden sm:flex flex-col items-end text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {currentTime.toLocaleTimeString('fa-IR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {currentTime.toLocaleDateString('fa-IR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;