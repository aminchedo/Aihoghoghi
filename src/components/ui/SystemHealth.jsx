import React from 'react';

const SystemHealth = ({ status, networkStatus }) => {
  const getHealthStatus = () => {
    if (!status) return { status: 'unknown', color: 'gray', text: 'نامشخص' };
    
    // Calculate overall health based on various metrics
    const metrics = [
      status.cpu_usage < 80,
      status.memory_usage < 85,
      status.disk_usage < 90,
      networkStatus?.active_proxies > 0,
    ];
    
    const healthyCount = metrics.filter(Boolean).length;
    const healthPercentage = (healthyCount / metrics.length) * 100;
    
    if (healthPercentage >= 75) {
      return { status: 'healthy', color: 'green', text: 'سالم' };
    } else if (healthPercentage >= 50) {
      return { status: 'warning', color: 'yellow', text: 'هشدار' };
    } else {
      return { status: 'critical', color: 'red', text: 'بحرانی' };
    }
  };

  const health = getHealthStatus();

  const healthItems = [
    {
      label: 'استفاده از CPU',
      value: status?.cpu_usage || 0,
      unit: '%',
      threshold: 80,
      icon: '🖥️',
    },
    {
      label: 'استفاده از حافظه',
      value: status?.memory_usage || 0,
      unit: '%',
      threshold: 85,
      icon: '💾',
    },
    {
      label: 'استفاده از دیسک',
      value: status?.disk_usage || 0,
      unit: '%',
      threshold: 90,
      icon: '💿',
    },
    {
      label: 'پروکسی فعال',
      value: networkStatus?.active_proxies || 0,
      unit: '',
      threshold: 1,
      icon: '🌐',
      isCount: true,
    },
  ];

  const getItemStatus = (value, threshold, isCount = false) => {
    if (isCount) {
      return value >= threshold ? 'good' : 'bad';
    }
    return value < threshold ? 'good' : 'bad';
  };

  const getItemColor = (itemStatus) => {
    return itemStatus === 'good' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (itemStatus) => {
    return itemStatus === 'good' ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          سلامت سیستم
        </h3>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className={`w-3 h-3 rounded-full bg-${health.color}-500`}></div>
          <span className={`text-sm font-medium text-${health.color}-600 dark:text-${health.color}-400`}>
            {health.text}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {healthItems.map((item, index) => {
          const itemStatus = getItemStatus(item.value, item.threshold, item.isCount);
          const progressWidth = item.isCount ? 
            Math.min((item.value / 10) * 100, 100) : // Max 10 for proxy count display
            Math.min(item.value, 100);

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.label}
                  </span>
                </div>
                
                <span className={`text-sm font-medium ${getItemColor(itemStatus)}`}>
                  {item.isCount ? item.value : item.value.toFixed(1)}{item.unit}
                </span>
              </div>
              
              {!item.isCount && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(itemStatus)}`}
                    style={{ width: `${progressWidth}%` }}
                  ></div>
                </div>
              )}
              
              {item.isCount && (
                <div className="flex items-center space-x-1 space-x-reverse">
                  {[...Array(Math.min(item.value, 5))].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-green-500 rounded-full"></div>
                  ))}
                  {[...Array(Math.max(5 - item.value, 0))].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  ))}
                  {item.value > 5 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                      +{item.value - 5}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional System Info */}
      {status && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">زمان فعالیت:</span>
              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {status.uptime ? Math.floor(status.uptime / 3600) : 0} ساعت
              </p>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">آخرین بروزرسانی:</span>
              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {new Date().toLocaleTimeString('fa-IR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Health Recommendations */}
      {health.status !== 'healthy' && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-2 space-x-reverse">
            <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                توصیه‌های بهبود سلامت سیستم:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                {status?.cpu_usage >= 80 && (
                  <li>• استفاده از CPU بالا است - فرآیندهای غیرضروری را متوقف کنید</li>
                )}
                {status?.memory_usage >= 85 && (
                  <li>• حافظه تقریباً پر است - برنامه‌های اضافی را ببندید</li>
                )}
                {status?.disk_usage >= 90 && (
                  <li>• فضای دیسک کم است - فایل‌های غیرضروری را پاک کنید</li>
                )}
                {(!networkStatus?.active_proxies || networkStatus.active_proxies === 0) && (
                  <li>• هیچ پروکسی فعالی وجود ندارد - پروکسی‌ها را بررسی کنید</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;