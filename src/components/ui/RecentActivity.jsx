import React from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const RecentActivity = ({ activities = [], loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">هیچ فعالیت اخیری وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div className={`p-2 rounded-full ${
            activity.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
            activity.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
            'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            {activity.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : activity.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <FileText className="w-4 h-4 text-blue-600" />
            )}
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              {activity.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {activity.description}
            </p>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString('fa-IR') : ''}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default RecentActivity;