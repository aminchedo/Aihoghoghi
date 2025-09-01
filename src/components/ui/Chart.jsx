import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Chart = ({ type = 'line', data, options = {}, height = 300, loading = false }) => {
  const { isDark } = useTheme();
  const chartRef = useRef();

  // Default options with RTL and dark mode support
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    locale: 'fa-IR',
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        rtl: true,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Vazirmatn, sans-serif',
            size: 12,
          },
          color: isDark ? '#f3f4f6' : '#374151',
        },
      },
      tooltip: {
        rtl: true,
        titleAlign: 'right',
        bodyAlign: 'right',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f3f4f6' : '#111827',
        bodyColor: isDark ? '#d1d5db' : '#374151',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        titleFont: {
          family: 'Vazirmatn, sans-serif',
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          family: 'Vazirmatn, sans-serif',
          size: 12,
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toLocaleString('fa-IR');
            return label;
          },
        },
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
          drawBorder: false,
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: {
            family: 'Vazirmatn, sans-serif',
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
          drawBorder: false,
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: {
            family: 'Vazirmatn, sans-serif',
            size: 11,
          },
          callback: function(value) {
            return value.toLocaleString('fa-IR');
          },
        },
      },
    } : undefined,
    ...options,
  };

  // Chart component based on type
  const renderChart = () => {
    const commonProps = {
      ref: chartRef,
      data,
      options: defaultOptions,
      height,
    };

    switch (type) {
      case 'bar':
        return <Bar {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'line':
      default:
        return <Line {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"
        style={{ height }}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 animate-spin">
            <div className="w-3 h-3 bg-blue-600 rounded-full mt-1 mr-1"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">در حال بارگذاری نمودار...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
        style={{ height }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative">
      {renderChart()}
    </div>
  );
};

export default Chart;