import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'increase', 
  icon: Icon, 
  color = 'blue',
  loading = false,
  onClick 
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      trend: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'text-green-600 dark:text-green-400',
      trend: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
      trend: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      icon: 'text-orange-600 dark:text-orange-400',
      trend: 'text-orange-600'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
      trend: 'text-red-600'
    }
  };

  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="w-4 h-4" />;
      case 'decrease':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 ${
        onClick ? 'cursor-pointer hover:shadow-xl' : ''
      } transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </h3>
          
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
            </p>
            
            {change !== undefined && change !== null && (
              <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
                {getTrendIcon()}
                <span>
                  {typeof change === 'number' ? change.toLocaleString('fa-IR') : change}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            آخرین بروزرسانی: {new Date().toLocaleTimeString('fa-IR')}
          </div>
        </div>
        
        <div className={`p-3 rounded-full ${colorClasses[color].bg}`}>
          <Icon className={`w-6 h-6 ${colorClasses[color].icon}`} />
        </div>
      </div>
      
      {/* Progress bar for percentage values */}
      {typeof value === 'string' && value.includes('%') && (
        <div className="mt-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: value }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${
                color === 'green' ? 'from-green-500 to-green-600' :
                color === 'blue' ? 'from-blue-500 to-blue-600' :
                color === 'purple' ? 'from-purple-500 to-purple-600' :
                color === 'orange' ? 'from-orange-500 to-orange-600' :
                'from-red-500 to-red-600'
              }`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;