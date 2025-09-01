import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const RecentActivity = ({ logs = [], loading = false }) => {
  const getLogIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
      case 'success':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getLogColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'اکنون';
      if (diffInMinutes < 60) return `${diffInMinutes} دقیقه قبل`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} ساعت قبل`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} روز قبل`;
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          فعالیت‌های اخیر
        </h3>
        {loading && <LoadingSpinner size="sm" />}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start space-x-3 space-x-reverse animate-pulse">
              <div className="skeleton w-6 h-6 rounded-full mt-1"></div>
              <div className="flex-1 space-y-2">
                <div className="skeleton w-3/4 h-4"></div>
                <div className="skeleton w-1/2 h-3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start space-x-3 space-x-reverse">
              <div className="flex-shrink-0 mt-1">
                <span className="text-lg">{getLogIcon(log.level)}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {log.component || 'سیستم'}
                  </p>
                  <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatTime(log.timestamp)}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(log.timestamp)}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {log.message}
                </p>
                
                {log.level && (
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getLogColor(log.level)} bg-opacity-10`}>
                    {log.level.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            فعالیت اخیری وجود ندارد
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            فعالیت‌های سیستم اینجا نمایش داده می‌شوند
          </p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
            مشاهده همه فعالیت‌ها ←
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;