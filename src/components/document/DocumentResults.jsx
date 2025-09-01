import React, { useState } from 'react';

const DocumentResults = ({ results = [] }) => {
  const [selectedResult, setSelectedResult] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, grid

  // Mock data if no results provided
  const mockResults = results.length === 0 ? [
    {
      id: 1,
      filename: 'قرارداد_نمونه.pdf',
      extractedText: 'این یک نمونه متن استخراج شده از سند حقوقی است که شامل اطلاعات مهم قراردادی می‌باشد...',
      entities: [
        { type: 'person', value: 'احمد محمدی', confidence: 0.95 },
        { type: 'organization', value: 'شرکت فناوری پارس', confidence: 0.92 },
        { type: 'date', value: '1402/10/15', confidence: 0.98 },
        { type: 'amount', value: '۵۰۰,۰۰۰ تومان', confidence: 0.89 }
      ],
      categories: ['قرارداد', 'مدنی', 'تجاری'],
      confidence: 0.94,
      processingTime: '2.3 ثانیه',
      wordCount: 1250,
      sentiment: 'neutral'
    },
    {
      id: 2,
      filename: 'رای_دادگاه.pdf',
      extractedText: 'رای شماره ۱۲۳۴ دادگاه عمومی تهران در خصوص پرونده کلاسه ۹۸۰۱۲۳...',
      entities: [
        { type: 'court', value: 'دادگاه عمومی تهران', confidence: 0.96 },
        { type: 'case_number', value: '۹۸۰۱۲۳', confidence: 0.99 },
        { type: 'judge', value: 'قاضی رضایی', confidence: 0.91 }
      ],
      categories: ['رای دادگاه', 'کیفری', 'حکم'],
      confidence: 0.97,
      processingTime: '3.1 ثانیه',
      wordCount: 2150,
      sentiment: 'formal'
    }
  ] : results;

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      case 'neutral': return '😐';
      case 'formal': return '📋';
      default: return '❓';
    }
  };

  const getSentimentText = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'مثبت';
      case 'negative': return 'منفی';
      case 'neutral': return 'خنثی';
      case 'formal': return 'رسمی';
      default: return 'نامشخص';
    }
  };

  const getEntityTypeIcon = (type) => {
    switch (type) {
      case 'person': return '👤';
      case 'organization': return '🏢';
      case 'date': return '📅';
      case 'amount': return '💰';
      case 'court': return '⚖️';
      case 'case_number': return '📋';
      case 'judge': return '👨‍⚖️';
      default: return '🏷️';
    }
  };

  const getEntityTypeText = (type) => {
    switch (type) {
      case 'person': return 'شخص';
      case 'organization': return 'سازمان';
      case 'date': return 'تاریخ';
      case 'amount': return 'مبلغ';
      case 'court': return 'دادگاه';
      case 'case_number': return 'شماره پرونده';
      case 'judge': return 'قاضی';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📊 نتایج تحلیل
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            📋 لیست
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            ⊞ شبکه‌ای
          </button>
        </div>
      </div>

      {/* Results */}
      {mockResults.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <p className="text-gray-500 dark:text-gray-400">
            هنوز نتیجه‌ای برای نمایش وجود ندارد
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
          {mockResults.map((result) => (
            <div
              key={result.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedResult(result)}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    📄 {result.filename}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>⏱️ {result.processingTime}</span>
                    <span>📝 {result.wordCount} کلمه</span>
                    <span>🎯 {Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSentimentIcon(result.sentiment)}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {getSentimentText(result.sentiment)}
                  </span>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {result.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Extracted Text Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  متن استخراج شده:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {result.extractedText}
                </p>
              </div>

              {/* Entities */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  موجودیت‌های شناسایی شده:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.entities.slice(0, 4).map((entity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                    >
                      <span>{getEntityTypeIcon(entity.type)}</span>
                      <span className="font-medium">{entity.value}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({Math.round(entity.confidence * 100)}%)
                      </span>
                    </div>
                  ))}
                  {result.entities.length > 4 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                      +{result.entities.length - 4} بیشتر
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📄 {selectedResult.filename}
                </h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Full Content */}
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Math.round(selectedResult.confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">دقت</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedResult.wordCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">کلمه</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedResult.entities.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">موجودیت</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedResult.processingTime}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">زمان پردازش</div>
                  </div>
                </div>

                {/* Full Text */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    متن کامل:
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 max-h-60 overflow-y-auto">
                    {selectedResult.extractedText}
                  </div>
                </div>

                {/* All Entities */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    تمام موجودیت‌های شناسایی شده:
                  </h3>
                  <div className="space-y-2">
                    {selectedResult.entities.map((entity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getEntityTypeIcon(entity.type)}</span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {entity.value}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {getEntityTypeText(entity.type)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {Math.round(entity.confidence * 100)}% اطمینان
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentResults;