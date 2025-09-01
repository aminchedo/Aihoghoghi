import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  FileText, 
  Search, 
  Settings, 
  Globe, 
  BarChart3, 
  Database,
  Shield,
  Users,
  BookOpen,
  Archive,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  Zap,
  Activity,
  Layers,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  TrendingUp
} from 'lucide-react';

const EnhancedSidebar = ({ open, onClose }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'داشبورد اصلی',
      path: '/dashboard',
      icon: Home,
      description: 'نمای کلی سیستم و آمار',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      submenu: [
        { title: 'آمار کلی', path: '/dashboard', icon: BarChart3, description: 'آمار و گزارش‌های کلی' },
        { title: 'فعالیت‌های اخیر', path: '/dashboard?view=activity', icon: Activity, description: 'آخرین فعالیت‌ها' },
        { title: 'نظارت سیستم', path: '/dashboard?view=monitoring', icon: Eye, description: 'نظارت بر عملکرد سیستم' }
      ]
    },
    {
      id: 'documents',
      title: 'مدیریت اسناد',
      path: '/process',
      icon: FileText,
      description: 'پردازش و تحلیل اسناد حقوقی',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      submenu: [
        { title: 'پردازش دستی', path: '/process?tab=manual', icon: Upload, description: 'آپلود و پردازش تک فایل' },
        { title: 'پردازش دسته‌ای', path: '/process?tab=batch', icon: Layers, description: 'پردازش چندین فایل همزمان' },
        { title: 'تاریخچه پردازش', path: '/process?tab=history', icon: Clock, description: 'مشاهده تاریخچه پردازش‌ها' },
        { title: 'نتایج تحلیل', path: '/process?tab=results', icon: TrendingUp, description: 'نتایج و گزارش‌های تحلیل' }
      ]
    },
    {
      id: 'search',
      title: 'جستجو و بازیابی',
      path: '/search',
      icon: Search,
      description: 'جستجو در پایگاه داده اسناد',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      submenu: [
        { title: 'جستجوی ساده', path: '/search', icon: Search, description: 'جستجو با کلمات کلیدی' },
        { title: 'جستجوی پیشرفته', path: '/search?mode=advanced', icon: Filter, description: 'جستجو با فیلترهای پیشرفته' },
        { title: 'جستجوی معنایی', path: '/search?mode=semantic', icon: Cpu, description: 'جستجو با هوش مصنوعی' },
        { title: 'تاریخچه جستجو', path: '/search?tab=history', icon: Calendar, description: 'مشاهده جستجوهای قبلی' }
      ]
    },
    {
      id: 'scraping',
      title: 'استخراج اطلاعات',
      path: '/scraping',
      icon: Globe,
      description: 'استخراج اطلاعات از منابع آنلاین',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      submenu: [
        { title: 'استخراج خودکار', path: '/scraping', icon: RefreshCw, description: 'استخراج خودکار از منابع' },
        { title: 'منابع قانونی', path: '/scraping?sources=legal', icon: BookOpen, description: 'استخراج از سایت‌های حقوقی' },
        { title: 'پیکربندی منابع', path: '/scraping?tab=sources', icon: Settings, description: 'تنظیم منابع استخراج' },
        { title: 'گزارش‌های استخراج', path: '/scraping?tab=reports', icon: BarChart3, description: 'آمار و گزارش استخراج' }
      ]
    },
    {
      id: 'ai-analysis',
      title: 'تحلیل هوش مصنوعی',
      path: '/ai-analysis',
      icon: Cpu,
      description: 'تحلیل هوشمند اسناد با BERT فارسی',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      submenu: [
        { title: 'تحلیل تک متن', path: '/ai-analysis', icon: Zap, description: 'تحلیل یک متن با هوش مصنوعی' },
        { title: 'تحلیل دسته‌ای', path: '/ai-analysis?mode=batch', icon: Layers, description: 'تحلیل چندین متن همزمان' },
        { title: 'نتایج تحلیل', path: '/ai-analysis?tab=results', icon: TrendingUp, description: 'مشاهده نتایج تحلیل‌ها' },
        { title: 'آمار و گزارش', path: '/ai-analysis?tab=statistics', icon: BarChart3, description: 'آمار عملکرد تحلیلگر' }
      ]
    },
    {
      id: 'proxy',
      title: 'مدیریت پروکسی',
      path: '/proxy',
      icon: Shield,
      description: 'مدیریت سرورهای پروکسی',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      submenu: [
        { title: 'لیست پروکسی‌ها', path: '/proxy', icon: Network, description: 'مشاهده و مدیریت پروکسی‌ها' },
        { title: 'تست سلامت', path: '/proxy?tab=health', icon: Activity, description: 'بررسی وضعیت پروکسی‌ها' },
        { title: 'آمار شبکه', path: '/proxy?tab=stats', icon: BarChart3, description: 'آمار ترافیک و عملکرد' },
        { title: 'افزودن پروکسی', path: '/proxy?tab=add', icon: Upload, description: 'افزودن پروکسی جدید' }
      ]
    },
    {
      id: 'database',
      title: 'پایگاه داده',
      path: '/database',
      icon: Database,
      description: 'مدیریت پایگاه داده اسناد',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      submenu: [
        { title: 'مرور اسناد', path: '/database', icon: Archive, description: 'مشاهده تمام اسناد ذخیره شده' },
        { title: 'آمار پایگاه داده', path: '/database?tab=stats', icon: BarChart3, description: 'آمار و اطلاعات پایگاه داده' },
        { title: 'پشتیبان‌گیری', path: '/database?tab=backup', icon: Download, description: 'تهیه پشتیبان از داده‌ها' },
        { title: 'بازیابی داده', path: '/database?tab=restore', icon: Upload, description: 'بازیابی از پشتیبان' }
      ]
    },
    {
      id: 'settings',
      title: 'تنظیمات',
      path: '/settings',
      icon: Settings,
      description: 'تنظیمات سیستم و کاربری',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-800/20',
      submenu: [
        { title: 'تنظیمات عمومی', path: '/settings', icon: Settings, description: 'تنظیمات کلی سیستم' },
        { title: 'تنظیمات API', path: '/settings?tab=api', icon: Zap, description: 'پیکربندی API و سرویس‌ها' },
        { title: 'تنظیمات پروکسی', path: '/settings?tab=proxy', icon: Shield, description: 'پیکربندی پروکسی' },
        { title: 'واردات/صادرات', path: '/settings?tab=import-export', icon: RefreshCw, description: 'مدیریت تنظیمات' }
      ]
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    searchTerm === '' || 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.submenu?.some(sub => sub.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    closed: {
      x: "100%",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  const menuItemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 }
    },
    closed: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial="closed"
        animate={open ? "open" : "closed"}
        variants={sidebarVariants}
        className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 lg:relative lg:translate-x-0 lg:shadow-lg"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  آرشیو حقوقی
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  نسخه ۲.۰.۰
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="جستجو در منو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence>
              {filteredMenuItems.map((item, index) => {
                const Icon = item.icon;
                const isMenuActive = isActive(item.path);
                const isExpanded = expandedMenus[item.id];

                return (
                  <motion.div
                    key={item.id}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    variants={menuItemVariants}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-1"
                  >
                    {/* Main Menu Item */}
                    <div className="group">
                      <Link
                        to={item.path}
                        onClick={() => {
                          if (item.submenu) {
                            toggleSubmenu(item.id);
                          } else {
                            onClose();
                          }
                        }}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group
                          ${isMenuActive 
                            ? `${item.bgColor} ${item.color} shadow-sm` 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }
                        `}
                      >
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                          ${isMenuActive 
                            ? `${item.color} bg-white dark:bg-gray-800 shadow-sm` 
                            : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                          }
                        `}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.description}
                          </div>
                        </div>

                        {item.submenu && (
                          <div className={`
                            flex-shrink-0 transition-transform duration-200
                            ${isExpanded ? 'rotate-90' : ''}
                          `}>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </Link>

                      {/* Submenu */}
                      <AnimatePresence>
                        {item.submenu && isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-1 mr-8 space-y-1 overflow-hidden"
                          >
                            {item.submenu.map((subItem, subIndex) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = location.pathname === subItem.path || 
                                                 (location.pathname + location.search) === subItem.path;

                              return (
                                <motion.div
                                  key={subItem.path}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: subIndex * 0.05 }}
                                >
                                  <Link
                                    to={subItem.path}
                                    onClick={onClose}
                                    className={`
                                      flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group
                                      ${isSubActive 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                      }
                                    `}
                                  >
                                    <div className={`
                                      flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs
                                      ${isSubActive 
                                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' 
                                        : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                      }
                                    `}>
                                      <SubIcon className="w-3 h-3" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">
                                        {subItem.title}
                                      </div>
                                      {subItem.description && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                          {subItem.description}
                                        </div>
                                      )}
                                    </div>
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  کاربر سیستم
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  دسترسی کامل
                </div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default EnhancedSidebar;