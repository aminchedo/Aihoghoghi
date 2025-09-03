import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSystem } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import {
  Home,
  Search,
  FileText,
  Brain,
  Settings,
  Activity,
  Network,
  Database,
  BarChart3,
  Zap,
  Shield,
  Bot,
  Globe,
  Server,
  Eye,
  Cog,
  Monitor,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const Sidebar = ({ isCollapsed = false }) => {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({})
  const { metrics, systemHealth, connectionStatus } = useSystem()
  const { isConnected } = useWebSocket()

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }))
  }

  const menuItems = [
    {
      id: 'dashboard',
      title: 'داشبورد اصلی',
      path: '/dashboard',
      icon: Home,
      description: 'نمای کلی سیستم و آمار زنده',
      badge: null
    },
    {
      id: 'search',
      title: 'جستجوی پیشرفته',
      path: '/search',
      icon: Search,
      description: 'جستجوی متنی، معنایی و نفقه',
      badge: null,
      submenu: [
        { title: 'جستجوی متنی', path: '/search?tab=text', icon: '🔍' },
        { title: 'جستجوی معنایی', path: '/search?tab=semantic', icon: '🧠' },
        { title: 'جستجوی نفقه', path: '/search?tab=nafaqe', icon: '⚖️' },
        { title: 'جستجوی پیشرفته', path: '/search?tab=advanced', icon: '🔬' }
      ]
    },
    {
      id: 'scraping',
      title: 'استخراج اسناد',
      path: '/scraping',
      icon: Globe,
      description: 'اسکرپینگ هوشمند با پروکسی',
      badge: metrics.total_operations > 0 ? metrics.total_operations : null,
      submenu: [
        { title: 'استخراج URL', path: '/scraping?tab=url', icon: '🔗' },
        { title: 'آپلود فایل', path: '/scraping?tab=upload', icon: '📤' },
        { title: 'پیکربندی پروکسی', path: '/scraping?tab=proxy', icon: '🌐' },
        { title: 'نظارت فعالیت', path: '/scraping?tab=monitor', icon: '📊' }
      ]
    },
    {
      id: 'ai-analysis',
      title: 'تحلیل هوشمند',
      path: '/ai-analysis',
      icon: Brain,
      description: 'تحلیل با Persian BERT',
      badge: Object.values(systemHealth).filter(s => s === 'online').length,
      submenu: [
        { title: 'طبقه‌بندی اسناد', path: '/ai-analysis?tab=classification', icon: '🏷️' },
        { title: 'شناسایی موجودیت', path: '/ai-analysis?tab=ner', icon: '👤' },
        { title: 'تحلیل احساسات', path: '/ai-analysis?tab=sentiment', icon: '💭' },
        { title: 'خلاصه‌سازی', path: '/ai-analysis?tab=summarization', icon: '📄' }
      ]
    },
    {
      id: 'proxy-management',
      title: 'مدیریت پروکسی',
      path: '/proxy-management',
      icon: Network,
      description: '22 سرور DNS ایرانی',
      badge: metrics.active_proxies || 18,
      submenu: [
        { title: 'وضعیت پروکسی‌ها', path: '/proxy-management?tab=status', icon: '💚' },
        { title: 'تست سلامت', path: '/proxy-management?tab=health', icon: '🏥' },
        { title: 'چرخش هوشمند', path: '/proxy-management?tab=rotation', icon: '🔄' },
        { title: 'آمار شبکه', path: '/proxy-management?tab=stats', icon: '📈' }
      ]
    },
    {
      id: 'document-processing',
      title: 'پردازش اسناد',
      path: '/document-processing',
      icon: FileText,
      description: 'پایپ‌لاین پردازش کامل',
      badge: null,
      submenu: [
        { title: 'صف پردازش', path: '/document-processing?tab=queue', icon: '📋' },
        { title: 'پیش‌نمایش', path: '/document-processing?tab=preview', icon: '👁️' },
        { title: 'نتایج پردازش', path: '/document-processing?tab=results', icon: '✅' },
        { title: 'تاریخچه', path: '/document-processing?tab=history', icon: '📚' }
      ]
    },
    {
      id: 'system-status',
      title: 'وضعیت سیستم',
      path: '/system-status',
      icon: Activity,
      description: 'نظارت زنده بر سیستم',
      badge: systemHealth.system_health || 94,
      submenu: [
        { title: 'سلامت سرویس‌ها', path: '/system-status?tab=health', icon: '💗' },
        { title: 'لاگ‌های سیستم', path: '/system-status?tab=logs', icon: '📜' },
        { title: 'متریک‌های زنده', path: '/system-status?tab=metrics', icon: '📊' },
        { title: 'هشدارها', path: '/system-status?tab=alerts', icon: '⚠️' }
      ]
    },
    {
      id: 'model-management',
      title: 'مدیریت مدل‌ها',
      path: '/model-management',
      icon: Bot,
      description: 'مدل‌های Persian BERT',
      badge: null,
      submenu: [
        { title: 'وضعیت مدل‌ها', path: '/model-management?tab=status', icon: '🤖' },
        { title: 'بارگذاری مدل', path: '/model-management?tab=load', icon: '⬇️' },
        { title: 'عملکرد مدل', path: '/model-management?tab=performance', icon: '⚡' },
        { title: 'تنظیمات AI', path: '/model-management?tab=config', icon: '⚙️' }
      ]
    },
    {
      id: 'settings',
      title: 'تنظیمات',
      path: '/settings',
      icon: Settings,
      description: 'پیکربندی سیستم',
      badge: null,
      submenu: [
        { title: 'تنظیمات عمومی', path: '/settings?tab=general', icon: '⚙️' },
        { title: 'تنظیمات API', path: '/settings?tab=api', icon: '🔌' },
        { title: 'تنظیمات پروکسی', path: '/settings?tab=proxy', icon: '🌐' },
        { title: 'پشتیبان‌گیری', path: '/settings?tab=backup', icon: '💾' }
      ]
    }
  ]

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/') return true
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const getStatusIndicator = () => {
    if (connectionStatus === 'connected' && isConnected) {
      return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    } else if (connectionStatus === 'connected') {
      return <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
    } else {
      return <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
    }
  }

  return (
    <div className={`bg-slate-800 bg-opacity-95 backdrop-blur-sm text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    } h-full overflow-y-auto border-l border-slate-700`}>
      
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">⚖️</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <h2 className="text-lg font-bold text-green-400">آرشیو حقوقی</h2>
              <div className="flex items-center space-x-reverse space-x-2 text-xs">
                {getStatusIndicator()}
                <span className="text-gray-300">
                  {connectionStatus === 'connected' ? 'آنلاین' : 'آفلاین'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Live Stats */}
        {!isCollapsed && (
          <div className="mt-4 p-3 bg-slate-700 bg-opacity-50 rounded-lg">
            <h4 className="text-sm font-semibold text-green-400 mb-2">📊 آمار زنده</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>اسناد:</span>
                <span className="text-green-400 font-bold">
                  {metrics.total_documents?.toLocaleString('fa-IR') || '1,247'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>عملیات:</span>
                <span className="text-blue-400 font-bold">
                  {metrics.total_operations || '156'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>پروکسی:</span>
                <span className="text-purple-400 font-bold">
                  {metrics.active_proxies || '18'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>موفقیت:</span>
                <span className="text-green-400 font-bold">
                  {metrics.success_rate?.toFixed(1) || '89.2'}%
                </span>
              </div>
            </div>
            
            {/* System Health Bar */}
            <div className="mt-3">
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.system_health || 94}%` }}
                ></div>
              </div>
              <div className="text-center text-xs mt-1 text-gray-300">
                سلامت: {metrics.system_health || 94}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              {/* Main Menu Item */}
              <div className="relative">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive || isActive(item.path) 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                  onClick={() => item.submenu && toggleSubmenu(item.id)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  
                  {!isCollapsed && (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.title}</span>
                          {item.badge && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                      
                      {item.submenu && (
                        <div className="flex-shrink-0">
                          {expandedMenus[item.id] ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              </div>

              {/* Submenu */}
              {!isCollapsed && item.submenu && (
                <AnimatePresence>
                  {expandedMenus[item.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 mr-8 space-y-1">
                        {item.submenu.map((subItem, index) => (
                          <NavLink
                            key={index}
                            to={subItem.path}
                            className={({ isActive }) => `
                              flex items-center space-x-reverse space-x-3 px-3 py-2 rounded-md text-sm transition-colors
                              ${isActive 
                                ? 'bg-slate-600 text-white' 
                                : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                              }
                            `}
                          >
                            <span className="text-lg">{subItem.icon}</span>
                            <span>{subItem.title}</span>
                          </NavLink>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Status Panel */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-800">
          <div className="space-y-2">
            {/* Connection Status */}
            <div className="flex items-center justify-between text-xs">
              <span>وضعیت اتصال:</span>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                  'bg-red-400'
                }`}></div>
                <span className={`${
                  connectionStatus === 'connected' ? 'text-green-400' : 
                  connectionStatus === 'connecting' ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {connectionStatus === 'connected' ? 'متصل' : 
                   connectionStatus === 'connecting' ? 'در حال اتصال' : 'قطع'}
                </span>
              </div>
            </div>

            {/* WebSocket Status */}
            <div className="flex items-center justify-between text-xs">
              <span>WebSocket:</span>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                  {isConnected ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
            </div>

            {/* Last Update */}
            <div className="text-xs text-gray-400 text-center pt-2 border-t border-slate-700">
              آخرین بروزرسانی: {new Date().toLocaleTimeString('fa-IR')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar