import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSystem } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { API_ENDPOINTS } from '../../contexts/SystemContext'
import { 
  Settings as SettingsIcon, 
  Zap, 
  Globe, 
  Database, 
  Save, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  Trash2,
  Eye,
  Lock,
  Unlock,
  Server,
  Brain
} from 'lucide-react'
import toast from 'react-hot-toast'

const EnhancedSettings = () => {
  const { connectionStatus, callBackendAPI } = useSystem()
  const { isConnected, connect, disconnect } = useWebSocket()
  const [activeTab, setActiveTab] = useState('general')
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [connectionTest, setConnectionTest] = useState(null)

  // Settings state
  const [apiSettings, setApiSettings] = useState({
    baseUrl: API_ENDPOINTS.BASE,
    timeout: 30000,
    retryAttempts: 3,
    websocketUrl: API_ENDPOINTS.WEB_SOCKET
  })

  const [proxySettings, setProxySettings] = useState({
    rotationInterval: 30000,
    maxRetries: 3,
    healthCheckInterval: 60000,
    timeoutThreshold: 5000,
    successRateThreshold: 70
  })

  const [generalSettings, setGeneralSettings] = useState({
    language: 'fa',
    theme: 'system',
    autoRefresh: true,
    refreshInterval: 30000,
    notifications: true,
    soundEnabled: false
  })

  const tabs = [
    { id: 'general', label: 'تنظیمات عمومی', icon: SettingsIcon, description: 'تنظیمات کلی سیستم' },
    { id: 'api', label: 'تنظیمات API', icon: Zap, description: 'پیکربندی اتصال بک‌اند' },
    { id: 'proxy', label: 'تنظیمات پروکسی', icon: Globe, description: 'پیکربندی شبکه پروکسی' },
    { id: 'backup', label: 'پشتیبان‌گیری', icon: Database, description: 'مدیریت داده‌ها' }
  ]

  const testAPIConnection = async () => {
    setIsTesting(true)
    setConnectionTest(null)
    
    try {
      const startTime = Date.now()
      
      // Test different endpoints
      const tests = [
        { name: 'Health Check', endpoint: '/health' },
        { name: 'System Status', endpoint: '/system/status' },
        { name: 'Models Status', endpoint: '/models/status' },
        { name: 'Proxy Status', endpoint: '/proxies/status' }
      ]

      const results = []
      
      for (const test of tests) {
        try {
          const testStart = Date.now()
          await fetch(`${apiSettings.baseUrl}${test.endpoint}`, {
            method: 'GET',
            timeout: apiSettings.timeout
          })
          const testTime = Date.now() - testStart
          
          results.push({
            name: test.name,
            status: 'success',
            responseTime: testTime
          })
        } catch (error) {
          results.push({
            name: test.name,
            status: 'error',
            error: error.message
          })
        }
      }
      
      const totalTime = Date.now() - startTime
      const successCount = results.filter(r => r.status === 'success').length
      
      setConnectionTest({
        success: successCount === tests.length,
        totalTime,
        successRate: (successCount / tests.length) * 100,
        results
      })
      
      if (successCount === tests.length) {
        toast.success('همه تست‌ها موفق بود')
      } else {
        toast.warning(`${successCount}/${tests.length} تست موفق`)
      }
      
    } catch (error) {
      setConnectionTest({
        success: false,
        error: error.message
      })
      toast.error('خطا در تست اتصال: ' + error.message)
    } finally {
      setIsTesting(false)
    }
  }

  const saveSettings = async (settingsType) => {
    setIsSaving(true)
    
    try {
      let settingsData
      let endpoint
      
      switch (settingsType) {
        case 'api':
          settingsData = apiSettings
          endpoint = '/settings/api'
          break
        case 'proxy':
          settingsData = proxySettings
          endpoint = '/settings/proxy'
          break
        case 'general':
          settingsData = generalSettings
          endpoint = '/settings/general'
          break
        default:
          throw new Error('نوع تنظیمات نامشخص')
      }

      await callBackendAPI(endpoint, 'PUT', settingsData)
      toast.success('تنظیمات با موفقیت ذخیره شد')
      
    } catch (error) {
      toast.error('خطا در ذخیره تنظیمات: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const exportSettings = () => {
    const allSettings = {
      api: apiSettings,
      proxy: proxySettings,
      general: generalSettings,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(allSettings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `iranian-legal-archive-settings-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('تنظیمات صادر شد')
  }

  const importSettings = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result)
        
        if (settings.api) setApiSettings(settings.api)
        if (settings.proxy) setProxySettings(settings.proxy)
        if (settings.general) setGeneralSettings(settings.general)
        
        toast.success('تنظیمات وارد شد')
      } catch (error) {
        toast.error('خطا در وارد کردن تنظیمات')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              تنظیمات سیستم
            </h1>
            <p className="text-gray-600">
              پیکربندی و مدیریت سیستم آرشیو حقوقی ایران
            </p>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="flex items-center space-x-reverse space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm">
                {connectionStatus === 'connected' ? 'متصل' : 'قطع'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-reverse">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-reverse space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">تنظیمات عمومی</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        زبان رابط کاربری
                      </label>
                      <select
                        value={generalSettings.language}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="fa">فارسی</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تم ظاهری
                      </label>
                      <select
                        value={generalSettings.theme}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, theme: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="system">خودکار (بر اساس سیستم)</option>
                        <option value="light">روشن</option>
                        <option value="dark">تیره</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        فاصله بروزرسانی (میلی‌ثانیه)
                      </label>
                      <input
                        type="number"
                        value={generalSettings.refreshInterval}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="5000"
                        max="300000"
                        step="5000"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="flex items-center space-x-reverse space-x-3">
                        <input
                          type="checkbox"
                          checked={generalSettings.autoRefresh}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">بروزرسانی خودکار</span>
                      </label>

                      <label className="flex items-center space-x-reverse space-x-3">
                        <input
                          type="checkbox"
                          checked={generalSettings.notifications}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">اعلانات</span>
                      </label>

                      <label className="flex items-center space-x-reverse space-x-3">
                        <input
                          type="checkbox"
                          checked={generalSettings.soundEnabled}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">صدای اعلانات</span>
                      </label>
                    </div>

                    <button
                      onClick={() => saveSettings('general')}
                      disabled={isSaving}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-reverse space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* API Settings Tab */}
            {activeTab === 'api' && (
              <motion.div
                key="api"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">تنظیمات API و اتصال</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        آدرس سرور API
                      </label>
                      <input
                        type="url"
                        value={apiSettings.baseUrl}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                        placeholder="http://127.0.0.1:7860/api"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        آدرس WebSocket
                      </label>
                      <input
                        type="url"
                        value={apiSettings.websocketUrl}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, websocketUrl: e.target.value }))}
                        placeholder="ws://127.0.0.1:7860/ws"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          تایم‌اوت (ms)
                        </label>
                        <input
                          type="number"
                          value={apiSettings.timeout}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="5000"
                          max="120000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          تلاش مجدد
                        </label>
                        <input
                          type="number"
                          value={apiSettings.retryAttempts}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-reverse space-x-3">
                      <button
                        onClick={testAPIConnection}
                        disabled={isTesting}
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-reverse space-x-2"
                      >
                        <Zap className={`w-5 h-5 ${isTesting ? 'animate-pulse' : ''}`} />
                        <span>{isTesting ? 'در حال تست...' : 'تست اتصال'}</span>
                      </button>

                      <button
                        onClick={() => saveSettings('api')}
                        disabled={isSaving}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-reverse space-x-2"
                      >
                        <Save className="w-5 h-5" />
                        <span>ذخیره</span>
                      </button>
                    </div>
                  </div>

                  {/* Connection Test Results */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">نتایج تست اتصال</h4>
                    <div className="bg-gray-50 rounded-lg p-4 min-h-64">
                      {connectionTest ? (
                        <div className="space-y-3">
                          <div className={`flex items-center space-x-reverse space-x-2 ${
                            connectionTest.success ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {connectionTest.success ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                              {connectionTest.success ? 'اتصال موفق' : 'اتصال ناموفق'}
                            </span>
                          </div>
                          
                          {connectionTest.totalTime && (
                            <div className="text-sm text-gray-600">
                              زمان کل: {connectionTest.totalTime}ms
                            </div>
                          )}
                          
                          {connectionTest.successRate && (
                            <div className="text-sm text-gray-600">
                              نرخ موفقیت: {connectionTest.successRate.toFixed(0)}%
                            </div>
                          )}

                          {connectionTest.results && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium">جزئیات تست:</h5>
                              {connectionTest.results.map((result, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span>{result.name}</span>
                                  <div className="flex items-center space-x-reverse space-x-2">
                                    {result.status === 'success' ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-green-600">{result.responseTime}ms</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-red-600">خطا</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>برای تست اتصال کلیک کنید</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Proxy Settings Tab */}
            {activeTab === 'proxy' && (
              <motion.div
                key="proxy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">تنظیمات شبکه پروکسی</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        فاصله چرخش (میلی‌ثانیه)
                      </label>
                      <input
                        type="number"
                        value={proxySettings.rotationInterval}
                        onChange={(e) => setProxySettings(prev => ({ ...prev, rotationInterval: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="10000"
                        max="300000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        حداکثر تلاش مجدد
                      </label>
                      <input
                        type="number"
                        value={proxySettings.maxRetries}
                        onChange={(e) => setProxySettings(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="1"
                        max="10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        آستانه زمان پاسخ (ms)
                      </label>
                      <input
                        type="number"
                        value={proxySettings.timeoutThreshold}
                        onChange={(e) => setProxySettings(prev => ({ ...prev, timeoutThreshold: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="1000"
                        max="30000"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        فاصله بررسی سلامت (ms)
                      </label>
                      <input
                        type="number"
                        value={proxySettings.healthCheckInterval}
                        onChange={(e) => setProxySettings(prev => ({ ...prev, healthCheckInterval: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="30000"
                        max="600000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        آستانه نرخ موفقیت (%)
                      </label>
                      <input
                        type="number"
                        value={proxySettings.successRateThreshold}
                        onChange={(e) => setProxySettings(prev => ({ ...prev, successRateThreshold: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="50"
                        max="100"
                      />
                    </div>

                    <button
                      onClick={() => saveSettings('proxy')}
                      disabled={isSaving}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-reverse space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>ذخیره تنظیمات پروکسی</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Backup Tab */}
            {activeTab === 'backup' && (
              <motion.div
                key="backup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">پشتیبان‌گیری و بازیابی</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">صادرات تنظیمات</h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 mb-3">
                        صادرات همه تنظیمات به فایل JSON
                      </p>
                      <button
                        onClick={exportSettings}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-reverse space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>صادرات تنظیمات</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">وارد کردن تنظیمات</h4>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 mb-3">
                        وارد کردن تنظیمات از فایل JSON
                      </p>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importSettings}
                        className="hidden"
                        id="import-settings"
                      />
                      <button
                        onClick={() => document.getElementById('import-settings').click()}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-reverse space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>وارد کردن تنظیمات</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Database Backup */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">پشتیبان‌گیری پایگاه داده</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-reverse space-x-2">
                      <Database className="w-4 h-4" />
                      <span>پشتیبان کامل</span>
                    </button>
                    <button className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-reverse space-x-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>بازیابی</span>
                    </button>
                    <button className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-reverse space-x-2">
                      <Trash2 className="w-4 h-4" />
                      <span>پاک کردن</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">اطلاعات سیستم</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">نسخه سیستم</div>
            <div className="font-medium">2.0.0</div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">وضعیت API</div>
            <div className={`font-medium ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus === 'connected' ? 'متصل' : 'قطع'}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">WebSocket</div>
            <div className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'فعال' : 'غیرفعال'}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">آخرین بروزرسانی</div>
            <div className="font-medium text-xs">
              {new Date().toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedSettings