import React, { useState } from 'react';

const ProcessingHistory = ({ history = [] }) => {
  const [filter, setFilter] = useState('all');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      case 'queued': return '⏱️';
      default: return '📄';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'تکمیل شده';
      case 'processing': return 'در حال پردازش';
      case 'failed': return 'ناموفق';
      case 'queued': return 'در صف';
      default: return 'نامشخص';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'processing': return 'text-blue-600 dark:text-blue-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      case 'queued': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  // Mock data if no history provided
  const mockHistory = history.length === 0 ? [
    {
      id: 1,
      filename: 'قرارداد_نمونه.pdf',
      status: 'completed',
      startTime: '1402/10/15 14:30',
      endTime: '1402/10/15 14:32',
      processingTime: '2 دقیقه',
      fileSize: '2.5 MB',
      pages: 15,
      extractedText: 1250
    },
    {
      id: 2,
      filename: 'سند_حقوقی.docx',
      status: 'processing',
      startTime: '1402/10/15 15:00',
      endTime: null,
      processingTime: '1 دقیقه',
      fileSize: '1.8 MB',
      pages: 8,
      extractedText: null
    },
    {
      id: 3,
      filename: 'مستندات_پرونده.pdf',
      status: 'failed',
      startTime: '1402/10/15 13:45',
      endTime: '1402/10/15 13:47',
      processingTime: '2 دقیقه',
      fileSize: '5.2 MB',
      pages: null,
      extractedText: null,
      error: 'خطا در خواندن فایل PDF'
    }
  ] : history;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📋 تاریخچه پردازش
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="all">همه</option>
          <option value="completed">تکمیل شده</option>
          <option value="processing">در حال پردازش</option>
          <option value="failed">ناموفق</option>
          <option value="queued">در صف</option>
        </select>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📭</div>
            <p className="text-gray-500 dark:text-gray-400">
              هیچ سابقه پردازشی یافت نشد
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(item.status)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {item.filename}
                    </h3>
                    <span className={`text-sm ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.startTime}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">حجم فایل:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.fileSize}
                  </div>
                </div>
                {item.pages && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">تعداد صفحات:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.pages}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 dark:text-gray-400">زمان پردازش:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.processingTime}
                  </div>
                </div>
                {item.extractedText && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">متن استخراج شده:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.extractedText} کلمه
                    </div>
                  </div>
                )}
              </div>

              {item.error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-red-700 dark:text-red-300 text-sm">
                    <strong>خطا:</strong> {item.error}
                  </div>
                </div>
              )}

              {item.status === 'processing' && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full animate-pulse"
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    در حال پردازش...
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProcessingHistory;