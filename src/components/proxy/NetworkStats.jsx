import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const NetworkStats = ({ stats = null, realTimeMode = true }) => {
  const [networkData, setNetworkData] = useState({
    requests: [],
    responses: [],
    errors: [],
    timestamps: []
  });

  const [currentStats, setCurrentStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalBandwidth: 0,
    activeConnections: 0,
    requestsPerSecond: 0,
    errorRate: 0
  });

  // Mock data generation for demonstration
  useEffect(() => {
    if (realTimeMode) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('fa-IR');
        
        setNetworkData(prev => {
          const newData = {
            requests: [...prev.requests.slice(-19), Math.floor(Math.random() * 100) + 20],
            responses: [...prev.responses.slice(-19), Math.floor(Math.random() * 90) + 15],
            errors: [...prev.errors.slice(-19), Math.floor(Math.random() * 10)],
            timestamps: [...prev.timestamps.slice(-19), timeLabel]
          };
          return newData;
        });

        setCurrentStats({
          totalRequests: Math.floor(Math.random() * 10000) + 5000,
          successfulRequests: Math.floor(Math.random() * 8000) + 4000,
          failedRequests: Math.floor(Math.random() * 500) + 50,
          averageResponseTime: Math.floor(Math.random() * 1000) + 200,
          totalBandwidth: (Math.random() * 100 + 50).toFixed(2),
          activeConnections: Math.floor(Math.random() * 50) + 10,
          requestsPerSecond: Math.floor(Math.random() * 20) + 5,
          errorRate: (Math.random() * 5 + 1).toFixed(2)
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [realTimeMode]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Vazirmatn, sans-serif'
          }
        }
      },
      title: {
        display: true,
        text: 'آمار شبکه در زمان واقعی',
        font: {
          family: 'Vazirmatn, sans-serif',
          size: 16
        }
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: 'Vazirmatn, sans-serif'
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Vazirmatn, sans-serif'
          }
        }
      },
    },
    animation: {
      duration: 1000,
    },
  };

  const chartData = {
    labels: networkData.timestamps,
    datasets: [
      {
        label: 'درخواست‌ها',
        data: networkData.requests,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'پاسخ‌ها',
        data: networkData.responses,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'خطاها',
        data: networkData.errors,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const getStatusColor = (value, thresholds) => {
    if (value <= thresholds.good) return 'text-green-600 dark:text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📊 آمار شبکه
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${realTimeMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {realTimeMode ? 'زنده' : 'غیرفعال'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">کل درخواست‌ها</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStats.totalRequests.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">میانگین زمان پاسخ</p>
              <p className={`text-2xl font-bold ${getStatusColor(currentStats.averageResponseTime, { good: 500, warning: 1000 })}`}>
                {currentStats.averageResponseTime} ms
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">نرخ خطا</p>
              <p className={`text-2xl font-bold ${getStatusColor(parseFloat(currentStats.errorRate), { good: 2, warning: 5 })}`}>
                {currentStats.errorRate}%
              </p>
            </div>
            <div className="text-3xl">❌</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">اتصالات فعال</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currentStats.activeConnections}
              </p>
            </div>
            <div className="text-3xl">🔗</div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            📈 معیارهای عملکرد
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">درخواست در ثانیه</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {currentStats.requestsPerSecond}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">درخواست‌های موفق</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {currentStats.successfulRequests.toLocaleString('fa-IR')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">درخواست‌های ناموفق</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {currentStats.failedRequests.toLocaleString('fa-IR')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">کل پهنای باند</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {currentStats.totalBandwidth} MB/s
              </span>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            ✅ نرخ موفقیت
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">موفقیت‌آمیز</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {((currentStats.successfulRequests / currentStats.totalRequests) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(currentStats.successfulRequests / currentStats.totalRequests) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">ناموفق</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {((currentStats.failedRequests / currentStats.totalRequests) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(currentStats.failedRequests / currentStats.totalRequests) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          🔗 وضعیت اتصالات
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.floor(currentStats.activeConnections * 0.8)}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              اتصالات سالم
            </div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {Math.floor(currentStats.activeConnections * 0.15)}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              اتصالات کند
            </div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {Math.floor(currentStats.activeConnections * 0.05)}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              اتصالات قطع شده
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStats;