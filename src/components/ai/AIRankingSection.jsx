import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Target,
  Award,
  Eye,
  Clock
} from 'lucide-react';
import aiAnalysisService from '../../services/aiAnalysisService';

const AIRankingSection = ({ 
  texts = [], 
  title = "🧠 رتبه‌بندی هوش مصنوعی", 
  showDetails = true,
  autoAnalyze = false,
  className = ""
}) => {
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [backendStatus, setBackendStatus] = useState('unknown');

  useEffect(() => {
    checkBackendHealth();
    
    if (autoAnalyze && texts.length > 0) {
      handleAnalyze();
    }
  }, [texts, autoAnalyze]);

  const checkBackendHealth = async () => {
    const isHealthy = await aiAnalysisService.checkHealth();
    setBackendStatus(isHealthy ? 'healthy' : 'offline');
  };

  const handleAnalyze = async () => {
    if (texts.length === 0) {
      setError('هیچ متنی برای تحلیل وجود ندارد');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await aiAnalysisService.analyzeContent(texts);
      setAnalysisResults(result.ranked || []);
      setStats(result.stats);
      
      if (result.isLocal) {
        setError('⚠️ سرور هوش مصنوعی در دسترس نیست. از تحلیل محلی استفاده شد.');
      }
    } catch (err) {
      setError(err.message);
      setAnalysisResults([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBg = (confidence) => {
    if (confidence >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (confidence >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'قرارداد': '📄',
      'رای_دادگاه': '⚖️',
      'قانون': '📜',
      'دادخواست': '📝',
      'شکایت': '🚨',
      'مصوبه': '✅',
      'اخبار': '📰'
    };
    return icons[category] || '📋';
  };

  if (texts.length === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300">
            هیچ متنی برای تحلیل هوش مصنوعی وجود ندارد
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{texts.length} متن</span>
                <span>•</span>
                <div className={`flex items-center gap-1 ${
                  backendStatus === 'healthy' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    backendStatus === 'healthy' ? 'bg-green-500' : 'bg-orange-500'
                  }`}></div>
                  {backendStatus === 'healthy' ? 'آنلاین' : 'آفلاین'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!autoAnalyze && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    تحلیل...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    تحلیل
                  </>
                )}
              </button>
            )}
            
            {analysisResults.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300">در حال تحلیل با هوش مصنوعی...</p>
              <div className="mt-3 w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!isAnalyzing && analysisResults.length > 0 && (
        <div className="p-4">
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {stats.averageConfidence}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">میانگین اطمینان</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stats.successRate}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">نرخ موفقیت</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {analysisResults.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">تحلیل شده</div>
              </div>
            </div>
          )}

          {/* Top Results */}
          <div className="space-y-3">
            {analysisResults.slice(0, isExpanded ? analysisResults.length : 3).map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>

                {/* Category Icon */}
                <div className="text-2xl">
                  {getCategoryIcon(result.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBg(result.confidence)} ${getConfidenceColor(result.confidence)}`}>
                      {result.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Target className="w-3 h-3" />
                      {result.confidence}%
                    </div>
                    {result.isLocal && (
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs rounded">
                        محلی
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {result.text}
                  </p>
                  
                  {showDetails && isExpanded && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>طول: {result.textLength} کاراکتر</span>
                        <span>زبان: {result.language}</span>
                        {result.legalScore > 0 && (
                          <span>امتیاز حقوقی: {result.legalScore}</span>
                        )}
                      </div>
                      
                      {result.entities && Object.values(result.entities).some(arr => arr.length > 0) && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(result.entities).map(([type, entities]) =>
                              entities.slice(0, 2).map((entity, idx) => (
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
                    </div>
                  )}
                </div>

                {/* Confidence Bar */}
                <div className="flex-shrink-0 w-16">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        result.confidence >= 80 ? 'bg-green-500' :
                        result.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {analysisResults.length > 3 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium transition-colors"
              >
                {isExpanded 
                  ? `نمایش کمتر` 
                  : `نمایش ${analysisResults.length - 3} مورد دیگر`
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isAnalyzing && analysisResults.length === 0 && !error && texts.length > 0 && (
        <div className="p-6 text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            برای مشاهده رتبه‌بندی هوش مصنوعی، دکمه تحلیل را کلیک کنید
          </p>
        </div>
      )}
    </div>
  );
};

export default AIRankingSection;