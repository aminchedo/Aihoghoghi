import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  FileText, 
  Tag,
  Clock,
  BarChart3,
  Layers,
  Settings,
  RefreshCw,
  ChevronDown,
  X
} from 'lucide-react';

const SearchDatabase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      setSearchResults([
        {
          id: 1,
          title: 'نمونه سند حقوقی ۱',
          content: 'این یک نمونه سند حقوقی برای نمایش نتایج جستجو است.',
          date: '1402/10/15',
          category: 'اسناد مدنی'
        },
        {
          id: 2,
          title: 'نمونه سند حقوقی ۲',
          content: 'این یک نمونه دیگر از سند حقوقی برای نمایش نتایج جستجو است.',
          date: '1402/10/10',
          category: 'اسناد کیفری'
        }
      ]);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🔍 جستجو در پایگاه داده
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          جستجو در اسناد حقوقی آرشیو شده
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی کلمات کلیدی در اسناد..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال جستجو...
              </>
            ) : (
              <>
                🔍 جستجو
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            نتایج جستجو ({searchResults.length} نتیجه)
          </h2>
          <div className="space-y-4">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {result.title}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {result.date}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {result.content}
                </p>
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {result.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && !loading && searchResults.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            نتیجه‌ای یافت نشد
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            برای عبارت "{searchQuery}" نتیجه‌ای پیدا نشد. لطفاً کلمات کلیدی دیگری امتحان کنید.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchDatabase;