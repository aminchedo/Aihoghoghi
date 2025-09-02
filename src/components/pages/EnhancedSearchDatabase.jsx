import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Search, 
  Database, 
  Filter, 
  FileText,
  Tag,
  Globe,
  BarChart3,
  Clock
} from 'lucide-react';

// Services
import { legalDocumentService } from '../../services/legalDocumentService';

// Components
import LoadingSpinner from '../ui/LoadingSpinner';
import Chart from '../ui/Chart';

const EnhancedSearchDatabase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Database statistics
  const { data: dbStats, isLoading: dbStatsLoading } = useQuery({
    queryKey: ['databaseStats'],
    queryFn: () => legalDocumentService.getDocumentStats(),
    refetchInterval: 10000,
  });

  // Perform search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const results = legalDocumentService.fullTextSearch(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults({ results: [], totalFound: 0, error: error.message });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

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
            <Database className="w-8 h-8 text-blue-600" />
            جستجو در پایگاه اسناد
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            جستجوی پیشرفته در {dbStats?.total || 0} سند حقوقی
          </p>
        </div>
      </motion.div>

      {/* Search Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو در اسناد حقوقی..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-lg"
              dir="rtl"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            جستجو
          </button>
        </div>
      </motion.div>

      {/* Search Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          نتایج جستجو
          {searchResults && (
            <span className="text-sm font-normal text-gray-500 mr-2">
              ({searchResults.totalFound} نتیجه)
            </span>
          )}
        </h3>
        
        {isSearching ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : searchResults ? (
          searchResults.results.length > 0 ? (
            <div className="space-y-3">
              {searchResults.results.map((result) => (
                <div
                  key={result.document.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {result.document.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {result.document.content.substring(0, 200)}...
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {result.document.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {result.document.source}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result.document.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>نتیجه‌ای یافت نشد</p>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>برای شروع، کلمه کلیدی وارد کنید</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EnhancedSearchDatabase;