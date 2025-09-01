import React from 'react';

const ProcessingProgress = ({ progress, onCancel }) => {
  const { current, total, processed, failed, currentUrl, startTime } = progress;
  
  const progressPercentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const totalProcessed = processed + failed;
  const successRate = totalProcessed > 0 ? Math.round((processed / totalProcessed) * 100) : 0;
  
  const getElapsedTime = () => {
    if (!startTime) return '0:00';
    
    const elapsed = Math.floor((new Date() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const getEstimatedTime = () => {
    if (!startTime || current === 0) return 'نامشخص';
    
    const elapsed = (new Date() - startTime) / 1000;
    const avgTimePerBatch = elapsed / current;
    const remaining = total - current;
    const estimatedSeconds = Math.round(remaining * avgTimePerBatch);
    
    if (estimatedSeconds < 60) return `${estimatedSeconds} ثانیه`;
    
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    return `${minutes} دقیقه و ${seconds} ثانیه`;
  };

  return (
    <div className="card p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              پردازش در حال انجام
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              دسته {current} از {total} • {progressPercentage}% تکمیل شده
            </p>
          </div>
        </div>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm font-medium"
          >
            لغو پردازش
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">پیشرفت کلی</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {processed}
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 font-medium">
            موفق
          </div>
        </div>
        
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {failed}
          </div>
          <div className="text-xs text-red-700 dark:text-red-300 font-medium">
            ناموفق
          </div>
        </div>
        
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {successRate}%
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            نرخ موفقیت
          </div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {getElapsedTime()}
          </div>
          <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
            زمان سپری شده
          </div>
        </div>
      </div>

      {/* Current URL */}
      {currentUrl && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              در حال پردازش:
            </span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div className="font-mono text-sm text-gray-600 dark:text-gray-400 break-all">
            {currentUrl}
          </div>
        </div>
      )}

      {/* Time Estimates */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>زمان تخمینی باقی‌مانده: {getEstimatedTime()}</span>
        <span>آخرین بروزرسانی: {new Date().toLocaleTimeString('fa-IR')}</span>
      </div>
    </div>
  );
};

export default ProcessingProgress;