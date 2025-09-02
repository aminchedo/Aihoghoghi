import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

const SystemHealth = ({ services = {}, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const serviceList = [
    { key: 'scraping', name: 'سرویس استخراج', status: services.scraping || 'unknown' },
    { key: 'ai', name: 'هوش مصنوعی', status: services.ai || 'unknown' },
    { key: 'database', name: 'پایگاه داده', status: services.database || 'unknown' },
    { key: 'network', name: 'شبکه', status: services.network || 'unknown' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy':
        return 'سالم';
      case 'active':
        return 'فعال';
      case 'online':
        return 'آنلاین';
      case 'warning':
        return 'هشدار';
      case 'degraded':
        return 'کاهش عملکرد';
      case 'error':
        return 'خطا';
      case 'offline':
        return 'آفلاین';
      default:
        return 'نامعلوم';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'online':
        return 'text-green-600';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600';
      case 'error':
      case 'offline':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-3">
      {serviceList.map((service, index) => (
        <motion.div
          key={service.key}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div className="flex items-center gap-3">
            {getStatusIcon(service.status)}
            <span className="font-medium text-gray-900 dark:text-white">
              {service.name}
            </span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(service.status)}`}>
            {getStatusText(service.status)}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default SystemHealth;