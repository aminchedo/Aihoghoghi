import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  FileText, 
  TrendingUp, 
  BarChart3,
  CheckCircle,
  Clock,
  Target,
  Layers,
  Eye,
  Play,
  Pause,
  Settings
} from 'lucide-react';

// Services
import { enhancedAIService } from '../../services/enhancedAIService';
import { legalDocumentService } from '../../services/legalDocumentService';

// Components
import LoadingSpinner from '../ui/LoadingSpinner';
import Chart from '../ui/Chart';

const AIAnalysisDashboard = () => {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);

  // AI service stats
  const { data: aiStats, isLoading: aiStatsLoading } = useQuery({
    queryKey: ['aiStats'],
    queryFn: () => enhancedAIService.getAnalysisStats(),
    refetchInterval: 5000,
  });

  // Available documents
  const { data: availableDocuments, isLoading: docsLoading } = useQuery({
    queryKey: ['availableDocuments'],
    queryFn: () => {
      const docs = legalDocumentService.getRecentDocuments(50);
      return docs.filter(doc => doc.content && doc.content.length > 100);
    },
    refetchInterval: 10000,
  });

  // Recent analysis results
  const { data: recentAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['recentAnalyses'],
    queryFn: () => {
      const cached = enhancedAIService.exportAnalysisResults();
      return cached.results.slice(0, 20);
    },
    refetchInterval: 5000,
  });

  // Start analysis
  const handleStartAnalysis = useCallback(async () => {
    if (isAnalyzing || selectedDocuments.length === 0) return;
    
    setIsAnalyzing(true);
    
    try {
      const documentsToAnalyze = availableDocuments.filter(doc => 
        selectedDocuments.includes(doc.id)
      );
      
      const batchResult = await enhancedAIService.batchAnalyze(documentsToAnalyze);
      setAnalysisResults(batchResult.results);
      
      await queryClient.invalidateQueries(['recentAnalyses', 'aiStats']);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, selectedDocuments, availableDocuments, queryClient]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            داشبورد تحلیل هوش مصنوعی
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            تحلیل خودکار اسناد حقوقی با استفاده از مدل‌های زبانی فارسی
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedDocuments.length > 0 && !isAnalyzing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartAnalysis}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              تحلیل {selectedDocuments.length} سند
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* AI Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">تحلیل‌های انجام شده</h3>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {recentAnalyses?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">میانگین اطمینان</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {recentAnalyses?.length > 0 ? 
                  Math.round((recentAnalyses.reduce((sum, a) => sum + (a.overallConfidence || 0), 0) / recentAnalyses.length) * 100) + '%' :
                  '0%'
                }
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">کش تحلیل</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {aiStats?.cacheSize || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Layers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">API متصل</h3>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {aiStats?.hasApiKey ? 'بله' : 'خیر'}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <CheckCircle className={`w-6 h-6 ${aiStats?.hasApiKey ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Document Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          انتخاب اسناد برای تحلیل
        </h3>
        
        {docsLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : availableDocuments && availableDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDocuments.slice(0, 12).map((doc) => (
              <div
                key={doc.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedDocuments.includes(doc.id)
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => {
                  setSelectedDocuments(prev => 
                    prev.includes(doc.id) 
                      ? prev.filter(id => id !== doc.id)
                      : [...prev, doc.id]
                  );
                }}
              >
                <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                  {doc.title}
                </h4>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{doc.category}</span>
                  <span>•</span>
                  <span>{doc.wordCount} کلمه</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>هیچ سندی برای تحلیل موجود نیست</p>
          </div>
        )}
      </motion.div>

      {/* Recent Analysis Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          نتایج تحلیل اخیر
        </h3>
        
        {analysesLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : recentAnalyses && recentAnalyses.length > 0 ? (
          <div className="space-y-3">
            {recentAnalyses.slice(0, 10).map((analysis, index) => (
              <div
                key={analysis.documentId}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {analysis.title}
                </h4>
                
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>اطمینان: {Math.round((analysis.overallConfidence || 0) * 100)}%</span>
                  <span>زمان: {analysis.processingTime}ms</span>
                  {analysis.results?.classification && (
                    <span>دسته: {analysis.results.classification.primaryCategory?.category}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>هیچ نتیجه تحلیلی موجود نیست</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AIAnalysisDashboard;