import React from 'react';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description,
  loading = false 
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return '↗️';
      case 'negative':
        return '↘️';
      case 'warning':
        return '⚠️';
      default:
        return '→';
    }
  };

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton w-20 h-4"></div>
          <div className="skeleton w-8 h-8 rounded-full"></div>
        </div>
        <div className="skeleton w-16 h-8 mb-2"></div>
        <div className="skeleton w-24 h-3"></div>
      </div>
    );
  }

  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-xl">{icon}</span>
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
          </p>
          {change && (
            <div className={`flex items-center text-sm ${getChangeColor()}`}>
              <span className="ml-1">{getChangeIcon()}</span>
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatsCard;