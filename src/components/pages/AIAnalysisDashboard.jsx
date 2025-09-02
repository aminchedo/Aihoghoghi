import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  FileText, 
  BarChart3, 
  Target, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Database,
  Upload,
  Download,
  RefreshCw,
  Eye,
  Filter,
  Settings,
  Cpu,
  Layers,
  PieChart,
  Activity
} from 'lucide-react';
import aiService from '../../services/aiService';

const AIAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [analysisMode, setAnalysisMode] = useState('single');
  const [batchTexts, setBatchTexts] = useState(['']);
  const [stats, setStats] = useState({
    totalAnalyzed: 0,
    successfulAnalyses: 0,
    failedAnalyses: 0,
    averageConfidence: 0,
    runtime: '0s',
    successRate: 0
  });

  const sampleTexts = [
    'قرارداد خرید و فروش ملک واقع در تهران بین آقای احمد محمدی به عنوان خریدار و خانم زهرا احمدی به عنوان فروشنده منعقد می‌گردد. مبلغ معامله پنج میلیارد تومان می‌باشد.',
    'دادگاه عمومی تهران در جلسه مورخ 1402/09/15 با حضور قاضی دکتر رضایی و بررسی پرونده کلاسه 9801234 در خصوص دعوای خواهان علی اکبری علیه خوانده حسن محمدی رای زیر را صادر نمود.',
    'بخشنامه شماره 1234 وزارت دادگستری در خصوص نحوه رسیدگی به پرونده‌های مدنی و اجرای احکام دادگاه‌ها به تمامی دادگاه‌های کشور ابلاغ می‌گردد.',
    'شکایت آقای محمد کریمی از شرکت تجاری پارس به دلیل نقض قرارداد و عدم ایفای تعهدات قراردادی در مهلت مقرر که موجب ضرر و زیان شاکی گردیده است.'
  ];

  const handleSingleAnalysis = async () => {
    if (!inputText.trim()) {
      alert('لطفاً متن مورد نظر را وارد کنید');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeTexts([inputText]);
      setAnalysisResults(result.ranked);
      setStats(aiService.getStats());
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('خطا در تحلیل متن: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchAnalysis = async () => {
    const validTexts = batchTexts.filter(text => text.trim());
    if (validTexts.length === 0) {
      alert('لطفاً حداقل یک متن وارد کنید');
      return;
    }

    setIsAnalyzing(true);
    try {
      const results = await aiService.analyzeTexts(validTexts);
      setAnalysisResults(results.ranked);
      setStats(aiService.getStats());
    } catch (error) {
      console.error('Batch analysis failed:', error);
      alert('خطا در تحلیل دسته‌ای: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSampleAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const results = await aiService.analyzeTexts(sampleTexts);
      setAnalysisResults(results.ranked);
      setStats(aiService.getStats());
    } catch (error) {
      console.error('Sample analysis failed:', error);
      alert('خطا در تحلیل نمونه‌ها: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addBatchText = () => {
    setBatchTexts([...batchTexts, '']);
  };

  const updateBatchText = (index, value) => {
    const updated = [...batchTexts];
    updated[index] = value;
    setBatchTexts(updated);
  };

  const removeBatchText = (index) => {
    if (batchTexts.length > 1) {
      setBatchTexts(batchTexts.filter((_, i) => i !== index));
    }
  };

  const exportResults = () => {
    if (analysisResults.length === 0) {
      alert('نتیجه‌ای برای صادرات وجود ندارد');
      return;
    }

    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        totalResults: analysisResults.length,
        stats: stats,
        generator: 'Iranian Legal Archive AI Analyzer v2.0'
      },
      results: analysisResults
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_analysis_results_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBg = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-100 dark:bg-green-900/20';
    if (confidence >= 0.6) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const tabs = [
    { id: 'analyzer', title: 'تحلیلگر هوش مصنوعی', icon: Brain },
    { id: 'results', title: 'نتایج تحلیل', icon: BarChart3 },
    { id: 'statistics', title: 'آمار و گزارش', icon: PieChart },
    { id: 'settings', title: 'تنظیمات', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🧠 تحلیلگر هوش مصنوعی
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                تحلیل هوشمند اسناد حقوقی با مدل BERT فارسی
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isAnalyzing 
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isAnalyzing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
              }`}></div>
              <span className="text-sm font-medium">
                {isAnalyzing ? 'در حال تحلیل' : 'آماده'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.title}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Analyzer Tab */}
            {activeTab === 'analyzer' && (
              <motion.div
                key="analyzer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Analysis Mode Toggle */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    نوع تحلیل:
                  </span>
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setAnalysisMode('single')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        analysisMode === 'single'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      تک متن
                    </button>
                    <button
                      onClick={() => setAnalysisMode('batch')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        analysisMode === 'batch'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      دسته‌ای
                    </button>
                  </div>
                </div>

                {/* Single Text Analysis */}
                {analysisMode === 'single' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        متن مورد تحلیل
                      </label>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="متن سند حقوقی خود را اینجا وارد کنید..."
                        className="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        تعداد کاراکتر: {inputText.length}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleSingleAnalysis}
                        disabled={isAnalyzing || !inputText.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            در حال تحلیل...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            تحلیل متن
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleSampleAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        تحلیل نمونه‌ها
                      </button>
                    </div>
                  </div>
                )}

                {/* Batch Text Analysis */}
                {analysisMode === 'batch' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        متن‌های مورد تحلیل ({batchTexts.length} متن)
                      </label>
                      <button
                        onClick={addBatchText}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        افزودن متن
                      </button>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {batchTexts.map((text, index) => (
                        <div key={index} className="flex gap-2">
                          <textarea
                            value={text}
                            onChange={(e) => updateBatchText(index, e.target.value)}
                            placeholder={`متن ${index + 1}...`}
                            className="flex-1 h-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                          />
                          {batchTexts.length > 1 && (
                            <button
                              onClick={() => removeBatchText(index)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleBatchAnalysis}
                      disabled={isAnalyzing || batchTexts.every(text => !text.trim())}
                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          در حال تحلیل دسته‌ای...
                        </>
                      ) : (
                        <>
                          <Layers className="w-4 h-4" />
                          تحلیل دسته‌ای
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Quick Stats */}
                {stats.totalAnalyzed > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.totalAnalyzed}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">کل تحلیل‌ها</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.successfulAnalyses}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">موفق</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {Math.round(stats.averageConfidence * 100)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">میانگین اطمینان</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.runtime}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">زمان کل</div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {analysisResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      هنوز تحلیلی انجام نشده
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      برای مشاهده نتایج، ابتدا تحلیل متن را انجام دهید
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        نتایج تحلیل ({analysisResults.length} نتیجه)
                      </h3>
                      <button
                        onClick={exportResults}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        صادرات نتایج
                      </button>
                    </div>

                    {analysisResults.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceBg(result.confidence)} ${getConfidenceColor(result.confidence)}`}>
                                {result.category}
                              </span>
                              <div className="flex items-center gap-1">
                                <Target className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  اطمینان: {Math.round(result.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                              {result.text}
                            </p>
                          </div>
                        </div>

                        {result.legalAnalysis && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                              تحلیل حقوقی تخصصی:
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {result.legalAnalysis.documentType.type}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">نوع سند</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {result.legalAnalysis.legalRelevanceScore}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">ارتباط حقوقی</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {result.legalAnalysis.complexity.level}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">پیچیدگی</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {result.legalAnalysis.sentiment.sentiment}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">احساس کلی</div>
                              </div>
                            </div>

                            {Object.keys(result.legalAnalysis.legalEntities).some(key => 
                              result.legalAnalysis.legalEntities[key].length > 0
                            ) && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  موجودیت‌های حقوقی استخراج شده:
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(result.legalAnalysis.legalEntities).map(([type, entities]) =>
                                    entities.slice(0, 3).map((entity, idx) => (
                                      <span
                                        key={`${type}-${idx}`}
                                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded"
                                      >
                                        {entity}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                            {result.legalAnalysis.keyTerms.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  کلمات کلیدی:
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {result.legalAnalysis.keyTerms.slice(0, 8).map((term, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded"
                                    >
                                      {term.term} ({term.count})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <motion.div
                key="statistics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.totalAnalyzed}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">کل تحلیل‌ها</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {stats.successRate}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">نرخ موفقیت</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(stats.averageConfidence * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">میانگین اطمینان</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.runtime}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">زمان کل</div>
                  </div>
                </div>

                {analysisResults.length > 0 && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      توزیع دسته‌بندی‌ها
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(
                        analysisResults.reduce((acc, result) => {
                          acc[result.category] = (acc[result.category] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([category, count]) => {
                        const percentage = (count / analysisResults.length) * 100;
                        return (
                          <div key={category} className="flex items-center gap-4">
                            <div className="w-24 text-sm text-gray-600 dark:text-gray-300">
                              {category}
                            </div>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                              <div
                                className="bg-purple-600 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="w-16 text-sm text-gray-600 dark:text-gray-300 text-left">
                              {count} ({Math.round(percentage)}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  تنظیمات تحلیلگر
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  این بخش در حال توسعه است
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisDashboard;