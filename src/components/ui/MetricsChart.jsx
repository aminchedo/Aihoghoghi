import React, { useEffect, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const MetricsChart = ({ data = {} }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      
      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      // Generate time labels (last 24 hours)
      const labels = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date().getHours() - (23 - i)
        return `${hour < 0 ? hour + 24 : hour}:00`
      })

      // Generate sample data based on current metrics
      const generateDataPoints = (baseValue, variation = 0.1) => {
        return Array.from({ length: 24 }, () => {
          const randomFactor = 1 + (Math.random() - 0.5) * variation
          return Math.round(baseValue * randomFactor)
        })
      }

      const chartData = {
        labels,
        datasets: [
          {
            label: 'اسناد پردازش شده',
            data: generateDataPoints(data.total_documents || 1247, 0.05),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'عملیات موفق',
            data: generateDataPoints(data.successful_operations || 139, 0.1),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'پروکسی فعال',
            data: generateDataPoints(data.active_proxies || 18, 0.15),
            borderColor: 'rgb(139, 92, 246)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
          }
        ]
      }

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                family: 'Vazirmatn',
                size: 12
              }
            }
          },
          title: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: {
              family: 'Vazirmatn'
            },
            bodyFont: {
              family: 'Vazirmatn'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                family: 'Vazirmatn'
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                family: 'Vazirmatn'
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }

      chartInstance.current = new ChartJS(ctx, {
        type: 'line',
        data: chartData,
        options
      })
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return (
    <div className="relative h-64">
      <canvas ref={chartRef} className="w-full h-full"></canvas>
    </div>
  )
}

export default MetricsChart