import React, { useRef, useEffect } from 'react';
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
  RadialLinearScale,
  Filler
} from 'chart.js';
import { 
  Line, 
  Bar, 
  Doughnut, 
  Pie, 
  Radar,
  PolarArea 
} from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

const Chart = ({ 
  type, 
  data, 
  options = {}, 
  height = 300,
  className = ''
}) => {
  const chartRef = useRef(null);

  // Default options with Persian support
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: {
            family: 'Vazirmatn, sans-serif',
            size: 12
          },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        titleFont: {
          family: 'Vazirmatn, sans-serif',
          size: 14
        },
        bodyFont: {
          family: 'Vazirmatn, sans-serif',
          size: 12
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: type === 'line' || type === 'bar' ? {
      x: {
        ticks: {
          font: {
            family: 'Vazirmatn, sans-serif',
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        ticks: {
          font: {
            family: 'Vazirmatn, sans-serif',
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    } : undefined,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  // Merge with custom options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins
    }
  };

  // Chart components mapping
  const chartComponents = {
    line: Line,
    bar: Bar,
    doughnut: Doughnut,
    pie: Pie,
    radar: Radar,
    polarArea: PolarArea
  };

  const ChartComponent = chartComponents[type];

  if (!ChartComponent) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <p>نوع نمودار پشتیبانی نمی‌شود: {type}</p>
      </div>
    );
  }

  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 opacity-50">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <p>داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <ChartComponent
        ref={chartRef}
        data={data}
        options={mergedOptions}
      />
    </div>
  );
};

export default Chart;