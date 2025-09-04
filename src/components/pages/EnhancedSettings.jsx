import React, { useState } from 'react'
import { useSystemContext } from '../../contexts/SystemContext'

const EnhancedSettings = () => {
  const { theme, language, setTheme, setLanguage, systemStatus, dispatch } = useSystemContext()
  const [isSaving, setIsSaving] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sound: false
  })
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    sessionTimeout: 30,
    passwordExpiry: 90
  })

  const handleSaveSettings = async () => {
    setIsSaving(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      // Show success message
    }, 1000)
  }

  const handleSystemStatusChange = (newStatus) => {
    dispatch({ type: 'SET_SYSTEM_STATUS', payload: newStatus })
  }

  const themes = [
    { id: 'light', name: 'روشن', icon: '☀️' },
    { id: 'dark', name: 'تاریک', icon: '🌙' },
    { id: 'auto', name: 'خودکار', icon: '🔄' }
  ]

  const languages = [
    { id: 'fa', name: 'فارسی', flag: '🇮🇷' },
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'ar', name: 'العربية', flag: '🇸🇦' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">تنظیمات</h1>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </button>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">تنظیمات ظاهری</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تم</label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.id}
                  onClick={() => setTheme(themeOption.id)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    theme === themeOption.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{themeOption.icon}</div>
                  <div className="text-sm font-medium">{themeOption.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">زبان</label>
            <div className="grid grid-cols-3 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    language === lang.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{lang.flag}</div>
                  <div className="text-sm font-medium">{lang.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">تنظیمات اعلان‌ها</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">اعلان‌های ایمیل</h3>
              <p className="text-sm text-gray-500">دریافت اعلان‌ها از طریق ایمیل</p>
            </div>
            <button
              onClick={() => setNotificationSettings(prev => ({ ...prev, email: !prev.email }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationSettings.email ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationSettings.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">اعلان‌های مرورگر</h3>
              <p className="text-sm text-gray-500">نمایش اعلان‌ها در مرورگر</p>
            </div>
            <button
              onClick={() => setNotificationSettings(prev => ({ ...prev, push: !prev.push }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationSettings.push ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationSettings.push ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">صدا</h3>
              <p className="text-sm text-gray-500">پخش صدای اعلان</p>
            </div>
            <button
              onClick={() => setNotificationSettings(prev => ({ ...prev, sound: !prev.sound }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationSettings.sound ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationSettings.sound ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">تنظیمات امنیتی</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">احراز هویت دو مرحله‌ای</h3>
              <p className="text-sm text-gray-500">افزایش امنیت حساب کاربری</p>
            </div>
            <button
              onClick={() => setSecuritySettings(prev => ({ ...prev, twoFactor: !prev.twoFactor }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                securitySettings.twoFactor ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.twoFactor ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              زمان انقضای نشست (دقیقه)
            </label>
            <select
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={15}>15 دقیقه</option>
              <option value={30}>30 دقیقه</option>
              <option value={60}>1 ساعت</option>
              <option value={120}>2 ساعت</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              انقضای رمز عبور (روز)
            </label>
            <select
              value={securitySettings.passwordExpiry}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 روز</option>
              <option value={60}>60 روز</option>
              <option value={90}>90 روز</option>
              <option value={180}>180 روز</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">تنظیمات سیستم</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت سیستم</label>
            <select
              value={systemStatus}
              onChange={(e) => handleSystemStatusChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="online">فعال</option>
              <option value="maintenance">تعمیر و نگهداری</option>
              <option value="offline">غیرفعال</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">پاک کردن کش</h3>
              <p className="text-sm text-gray-500">حذف فایل‌های موقت سیستم</p>
            </div>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
              پاک کردن
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">بازنشانی تنظیمات</h3>
              <p className="text-sm text-gray-500">بازگردانی تنظیمات به حالت پیش‌فرض</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              بازنشانی
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedSettings