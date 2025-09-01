import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const { isDark } = useTheme();
  const [expandedMenus, setExpandedMenus] = useState({});

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
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
      description: 'نمای کلی سیستم و آمار',
    },
    {
      id: 'process',
      title: 'پردازش اسناد',
      path: '/process',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'پردازش و تحلیل اسناد حقوقی',
      submenu: [
        { title: 'پردازش دستی', path: '/process?tab=manual', icon: '✏️' },
        { title: 'پردازش دسته‌ای', path: '/process?tab=batch', icon: '📁' },
        { title: 'آپلود فایل', path: '/process?tab=upload', icon: '📤' },
        { title: 'تاریخچه پردازش', path: '/process?tab=history', icon: '📊' },
      ]
    },
    {
      id: 'proxy',
      title: 'مدیریت پروکسی',
      path: '/proxy',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      description: 'مدیریت پروکسی و شبکه',
      submenu: [
        { title: 'لیست پروکسی‌ها', path: '/proxy?tab=list', icon: '📋' },
        { title: 'تست سلامت', path: '/proxy?tab=health', icon: '🏥' },
        { title: 'افزودن پروکسی', path: '/proxy?tab=add', icon: '➕' },
        { title: 'آمار شبکه', path: '/proxy?tab=stats', icon: '📈' },
      ]
    },
    {
      id: 'search',
      title: 'پایگاه داده حقوقی',
      path: '/search',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      description: 'جستجو و بررسی اسناد',
      submenu: [
        { title: 'جستجوی متنی', path: '/search?tab=text', icon: '🔍' },
        { title: 'جستجوی هوشمند', path: '/search?tab=semantic', icon: '🧠' },
        { title: 'دسته‌بندی اسناد', path: '/search?tab=categories', icon: '📂' },
        { title: 'آمار پایگاه داده', path: '/search?tab=stats', icon: '📊' },
      ]
    },
    {
      id: 'settings',
      title: 'تنظیمات',
      path: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'تنظیمات سیستم و پیکربندی',
      submenu: [
        { title: 'تنظیمات عمومی', path: '/settings?tab=general', icon: '⚙️' },
        { title: 'تنظیمات API', path: '/settings?tab=api', icon: '🔌' },
        { title: 'تنظیمات پروکسی', path: '/settings?tab=proxy', icon: '🌐' },
        { title: 'درون‌ریزی/برون‌ریزی', path: '/settings?tab=import-export', icon: '💾' },
      ]
    },
  ];

  const isActiveRoute = (path) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => isActiveRoute(item.path.split('?')[0]));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out ${
          open ? 'w-64 translate-x-0' : 'w-16 translate-x-0 lg:translate-x-0'
        } lg:translate-x-0 overflow-y-auto custom-scrollbar`}
      >
        <nav className="p-2">
          {menuItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus[item.id];
            const isActive = isActiveRoute(item.path);
            const hasActiveSubmenu = hasSubmenu && isSubmenuActive(item.submenu);

            return (
              <div key={item.id} className="mb-1">
                {hasSubmenu ? (
                  // Menu item with submenu
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${
                      isActive || hasActiveSubmenu
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className={`transition-colors ${isActive || hasActiveSubmenu ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {item.icon}
                      </span>
                      {open && (
                        <div className="text-right">
                          <span className="block font-medium">{item.title}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </div>
                    {open && (
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ) : (
                  // Regular menu item
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`
                    }
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    <span className={`transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item.icon}
                    </span>
                    {open && (
                      <div className="mr-3 text-right">
                        <span className="block font-medium">{item.title}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    )}
                  </NavLink>
                )}

                {/* Submenu */}
                {hasSubmenu && isExpanded && open && (
                  <div className="mr-8 mt-2 space-y-1">
                    {item.submenu.map((subItem, index) => (
                      <NavLink
                        key={index}
                        to={subItem.path}
                        className={({ isActive }) =>
                          `flex items-center p-2 rounded-md text-sm transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`
                        }
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onClose();
                          }
                        }}
                      >
                        <span className="text-lg ml-2">{subItem.icon}</span>
                        <span>{subItem.title}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {open && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                سیستم آرشیو حقوقی ایران
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                نسخه ۲.۰.۰
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;