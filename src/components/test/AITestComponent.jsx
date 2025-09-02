import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Brain, Zap } from 'lucide-react';
import aiService from '../../services/aiService';

const AITestComponent = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const testCases = [
    {
      name: 'تست تحلیل متن ساده',
      text: 'این یک متن نمونه برای تست سیستم تحلیل هوش مصنوعی است.',
      expectedType: 'text-classification'
    },
    {
      name: 'تست سند حقوقی - قرارداد',
      text: 'قرارداد خرید و فروش ملک واقع در تهران بین آقای احمد محمدی به عنوان خریدار و خانم زهرا احمدی به عنوان فروشنده منعقد می‌گردد.',
      expectedType: 'قرارداد'
    },
    {
      name: 'تست سند حقوقی - رای دادگاه',
      text: 'دادگاه عمومی تهران در جلسه مورخ 1402/09/15 با حضور قاضی دکتر رضایی رای زیر را صادر نمود.',
      expectedType: 'رای_دادگاه'
    },
    {
      name: 'تست چندین متن همزمان',
      texts: [
        'قانون اساسی جمهوری اسلامی ایران در ماده یک تصریح می‌کند',
        'شکایت آقای کریمی از شرکت تجاری به دلیل نقض قرارداد',
        'مصوبه شورای شهر در خصوص تغییر کاربری'
      ],
      expectedType: 'batch-analysis'
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    for (const testCase of testCases) {
      setCurrentTest(testCase.name);
      
      try {
        let result;
        const startTime = Date.now();
        
        if (testCase.texts) {
          // Batch analysis test
          result = await aiService.analyzeTexts(testCase.texts);
        } else {
          // Single text analysis test
          result = await aiService.analyzeTexts([testCase.text]);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        setTestResults(prev => [...prev, {
          name: testCase.name,
          status: 'success',
          result: result,
          duration: duration,
          details: `✅ تحلیل موفق - ${result.total} متن تحلیل شد`,
          data: result.ranked || []
        }]);
        
      } catch (error) {
        setTestResults(prev => [...prev, {
          name: testCase.name,
          status: 'error',
          error: error.message,
          details: `❌ خطا: ${error.message}`,
          data: []
        }]);
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunning(false);
    setCurrentTest('');
  };

  const getHealthStatus = async () => {
    try {
      const health = aiService.getHealth();
      const stats = aiService.getStats();
      
      setTestResults(prev => [...prev, {
        name: 'وضعیت سلامت سیستم',
        status: 'info',
        details: `✅ سیستم سالم - ${stats.successRate}% موفقیت`,
        data: { health, stats }
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: 'وضعیت سلامت سیستم',
        status: 'error',
        details: `❌ خطا در دریافت وضعیت: ${error.message}`,
        data: {}
      }]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                تست سیستم هوش مصنوعی
              </h1>
              <p className="text-gray-600">
                آزمایش عملکرد واقعی سیستم تحلیل اسناد حقوقی
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={getHealthStatus}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 space-x-reverse"
            >
              <Zap className="w-4 h-4" />
              <span>وضعیت سیستم</span>
            </button>
            
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 space-x-reverse"
            >
              {isRunning ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              <span>{isRunning ? 'در حال تست...' : 'شروع تست'}</span>
            </button>
          </div>
        </div>

        {isRunning && currentTest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-800 font-medium">
                در حال اجرای: {currentTest}
              </span>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                result.status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : result.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 space-x-reverse">
                  {result.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-600 mt-1" />
                  )}
                  {result.status === 'info' && (
                    <Brain className="w-5 h-5 text-blue-600 mt-1" />
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {result.name}
                    </h3>
                    <p className={`text-sm ${
                      result.status === 'success' 
                        ? 'text-green-700' 
                        : result.status === 'error'
                        ? 'text-red-700'
                        : 'text-blue-700'
                    }`}>
                      {result.details}
                    </p>
                    
                    {result.duration && (
                      <p className="text-xs text-gray-500 mt-1">
                        مدت زمان: {result.duration}ms
                      </p>
                    )}
                    
                    {result.data && result.data.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {result.data.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border text-sm">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900">
                                {item.category || 'نامشخص'}
                              </span>
                              <span className="text-green-600 font-bold">
                                {item.confidence}%
                              </span>
                            </div>
                            <p className="text-gray-600 text-xs">
                              {item.text}
                            </p>
                            {item.legalType && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {item.legalType}
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                  {item.language}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {testResults.length === 0 && !isRunning && (
          <div className="text-center py-12 text-gray-500">
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>برای شروع تست سیستم، روی دکمه "شروع تست" کلیک کنید</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AITestComponent;