import React, { useState } from 'react'
import { useSystemContext } from '../../contexts/SystemContext'

const EnhancedSettings = () => {
  const { systemConfig, updateSystemConfig } = useSystemContext()
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', name: 'عمومی', icon: '⚙️' },
    { id: 'security', name: 'امنیت', icon: '🔒' },
    { id: 'notifications', name: 'اعلان‌ها', icon: '🔔' },
    { id: 'backup', name: 'پشتیبان‌گیری', icon: '💾' },
    { id: 'advanced', name: 'پیشرفته', icon: '🔧' },
  ]

  const [settings, setSettings] = useState({
    language: systemConfig.language || 'fa',
    theme: systemConfig.theme || 'light',
    timezone: systemConfig.timezone || 'Asia/Tehran',
    autoSave: true,
    notifications: true,
    emailNotifications: false,
    backupFrequency: 'daily',
    maxFileSize: '10MB',
    sessionTimeout: 30,
  })

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    updateSystemConfig({ [key]: value })
  }

  const handleSaveSettings = () => {
    // Simulate saving settings
    console.log('Saving settings:', settings)
    // Here you would typically make an API call
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">زبان سیستم</label>
        <select
          value={settings.language}
          onChange={(e) => handleSettingChange('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="fa">فارسی</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">تم</label>
        <select
          value={settings.theme}
          onChange={(e) => handleSettingChange('theme', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="light">روشن</option>
          <option value="dark">تیره</option>
          <option value="auto">خودکار</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">منطقه زمانی</label>
        <select
          value={settings.timezone}
          onChange={(e) => handleSettingChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="Asia/Tehran">تهران (UTC+3:30)</option>
          <option value="Asia/Dubai">دبی (UTC+4)</option>
          <option value="Europe/London">لندن (UTC+0)</option>
          <option value="America/New_York">نیویورک (UTC-5)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">اندازه حداکثر فایل</label>
        <select
          value={settings.maxFileSize}
          onChange={(e) => handleSettingChange('maxFileSize', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="5MB">5 مگابایت</option>
          <option value="10MB">10 مگابایت</option>
          <option value="25MB">25 مگابایت</option>
          <option value="50MB">50 مگابایت</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">زمان انقضای نشست (دقیقه)</label>
        <input
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="15"
          max="120"
        />
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">رمز عبور فعلی</label>
        <input
          type="password"
          placeholder="رمز عبور فعلی خود را وارد کنید"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">رمز عبور جدید</label>
        <input
          type="password"
          placeholder="رمز عبور جدید را وارد کنید"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">تأیید رمز عبور جدید</label>
        <input
          type="password"
          placeholder="رمز عبور جدید را دوباره وارد کنید"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="pt-4">
        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          تغییر رمز عبور
        </button>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">احراز هویت دو مرحله‌ای</h4>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <input type="checkbox" id="2fa" className="rounded" />
          <label htmlFor="2fa" className="text-sm text-gray-700">
            فعال‌سازی احراز هویت دو مرحله‌ای
          </label>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <input
            type="checkbox"
            id="notifications"
            checked={settings.notifications}
            onChange={(e) => handleSettingChange('notifications', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="notifications" className="text-sm font-medium text-gray-700">
            فعال‌سازی اعلان‌های سیستم
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <input
            type="checkbox"
            id="emailNotifications"
            checked={settings.emailNotifications}
            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
            اعلان‌های ایمیلی
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">آدرس ایمیل</label>
        <input
          type="email"
          placeholder="example@iranian-legal-archive.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">نوع اعلان‌ها</label>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <input type="checkbox" id="notif-success" className="rounded" defaultChecked />
            <label htmlFor="notif-success" className="text-sm text-gray-700">عملیات موفق</label>
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <input type="checkbox" id="notif-error" className="rounded" defaultChecked />
            <label htmlFor="notif-error" className="text-sm text-gray-700">خطاها</label>
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <input type="checkbox" id="notif-warning" className="rounded" />
            <label htmlFor="notif-warning" className="text-sm text-gray-700">هشدارها</label>
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <input type="checkbox" id="notif-info" className="rounded" />
            <label htmlFor="notif-info" className="text-sm text-gray-700">اطلاعات</label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">فرکانس پشتیبان‌گیری</label>
        <select
          value={settings.backupFrequency}
          onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="hourly">ساعتی</option>
          <option value="daily">روزانه</option>
          <option value="weekly">هفتگی</option>
          <option value="monthly">ماهانه</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">مکان ذخیره</label>
        <input
          type="text"
          placeholder="/backup/iranian-legal-archive"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">حفظ نسخه‌ها</label>
        <input
          type="number"
          placeholder="30"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="1"
          max="365"
        />
        <p className="text-sm text-gray-500 mt-1">تعداد نسخه‌های پشتیبان که نگهداری می‌شوند</p>
      </div>

      <div className="pt-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-3">
          پشتیبان‌گیری دستی
        </button>
        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          بازیابی
        </button>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">آخرین پشتیبان‌گیری</h4>
        <p className="text-sm text-blue-800">آخرین پشتیبان‌گیری: 2024-01-15 ساعت 02:00</p>
        <p className="text-sm text-blue-800">حجم: 2.4 GB | وضعیت: موفق</p>
      </div>
    </div>
  )

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <input type="checkbox" id="autoSave" className="rounded" checked={settings.autoSave} />
          <label htmlFor="autoSave" className="text-sm font-medium text-gray-700">
            ذخیره خودکار تغییرات
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">سطح لاگ</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>خطا</option>
          <option>هشدار</option>
          <option>اطلاعات</option>
          <option>Debug</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">محدودیت درخواست API</label>
        <input
          type="number"
          placeholder="1000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="100"
          max="10000"
        />
        <p className="text-sm text-gray-500 mt-1">تعداد درخواست‌های مجاز در هر ساعت</p>
      </div>

      <div className="pt-4">
        <button className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 mr-3">
          پاک کردن کش
        </button>
        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          بازنشانی تنظیمات
        </button>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings()
      case 'security':
        return renderSecuritySettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'backup':
        return renderBackupSettings()
      case 'advanced':
        return renderAdvancedSettings()
      default:
        return renderGeneralSettings()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">تنظیمات سیستم</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 rtl:space-x-reverse px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="ml-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
          
          <div className="border-t pt-6 mt-8">
            <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse">
              <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                لغو
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ذخیره تنظیمات
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedSettings