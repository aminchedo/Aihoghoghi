import React from 'react';

const SettingsTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8 space-x-reverse overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <span className="text-lg ml-2">{tab.icon}</span>
            <span>{tab.title}</span>
            {tab.description && (
              <span className="hidden lg:block text-xs text-gray-400 dark:text-gray-500 mr-2">
                • {tab.description}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default SettingsTabs;