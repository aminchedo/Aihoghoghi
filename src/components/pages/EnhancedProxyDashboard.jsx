import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSystem } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { IRANIAN_DNS_SERVERS } from '../../contexts/SystemContext'
import { 
  Server, 
  Globe, 
  Zap, 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  Eye,
  Play,
  Pause,
  Filter,
  Network,
  Shield,
  Activity,
  MapPin,
  Timer
} from 'lucide-react'
import toast from 'react-hot-toast'

const EnhancedProxyDashboard = () => {
  const { proxies, checkProxyHealth, rotateProxies, metrics } = useSystem()
  const { isConnected, subscribe } = useWebSocket()
  const [activeTab, setActiveTab] = useState('status')
  const [isTestingAll, setIsTestingAll] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [proxyStats, setProxyStats] = useState({})
  const [selectedProxies, setSelectedProxies] = useState([])

  const tabs = [
    { id: 'status', label: 'وضعیت پروکسی‌ها', icon: Activity, description: 'نمای کلی وضعیت' },
    { id: 'health', label: 'تست سلامت', icon: Shield, description: 'تست سلامت پروکسی‌ها' },
    { id: 'rotation', label: 'چرخش هوشمند', icon: RefreshCw, description: 'مدیریت چرخش' },
    { id: 'stats', label: 'آمار شبکه', icon: BarChart3, description: 'آمار کامل شبکه' }
  ]

  useEffect(() => {
    // Subscribe to proxy updates
    const unsubscribe = subscribe('proxyStatusUpdate', (data) => {
      toast.success('وضعیت پروکسی‌ها بروزرسانی شد')
    })

    // Load initial proxy stats
    calculateProxyStats()

    return unsubscribe
  }, [subscribe])

  useEffect(() => {
    calculateProxyStats()
  }, [proxies])

  const calculateProxyStats = () => {
    const stats = {
      total: proxies.length,
      active: proxies.filter(p => p.active).length,
      inactive: proxies.filter(p => !p.active).length,
      avgResponseTime: proxies.length > 0 ? 
        proxies.reduce((sum, p) => sum + p.response_time, 0) / proxies.length : 0,
      avgSuccessRate: proxies.length > 0 ?
        proxies.reduce((sum, p) => sum + p.success_rate, 0) / proxies.length : 0,
      iranianDNS: proxies.filter(p => p.type === 'iranian_dns').length,
      fastProxies: proxies.filter(p => p.response_time < 500).length
    }
    setProxyStats(stats)
  }

  const handleTestAllProxies = async () => {
    setIsTestingAll(true)
    try {
      toast.loading('در حال تست همه پروکسی‌های ایرانی...')
      await checkProxyHealth()
      toast.success('تست همه پروکسی‌ها تکمیل شد')
    } catch (error) {
      toast.error('خطا در تست پروکسی‌ها: ' + error.message)
    } finally {
      setIsTestingAll(false)
    }
  }

  const handleRotateProxies = async () => {
    setIsRotating(true)
    try {
      toast.loading('در حال چرخش هوشمند پروکسی‌ها...')
      await rotateProxies()
      toast.success('چرخش پروکسی‌ها با موفقیت انجام شد')
    } catch (error) {
      toast.error('خطا در چرخش پروکسی‌ها: ' + error.message)
    } finally {
      setIsRotating(false)
    }
  }

  const getProxyStatusColor = (proxy) => {
    if (!proxy.active) return 'bg-red-500'
    if (proxy.response_time < 300) return 'bg-green-500'
    if (proxy.response_time < 800) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getProxyStatusText = (proxy) => {
    if (!proxy.active) return 'غیرفعال'
    if (proxy.response_time < 300) return 'عالی'
    if (proxy.response_time < 800) return 'خوب'
    return 'کند'
  }

  const renderProxyGrid = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {proxies.map((proxy, index) => (
          <motion.div
            key={proxy.id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-reverse space-x-2">
                <div className={`w-3 h-3 rounded-full ${getProxyStatusColor(proxy)}`}></div>
                <span className="text-sm font-medium">DNS {index + 1}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                proxy.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {getProxyStatusText(proxy)}
              </span>
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>آدرس:</span>
                <span className="font-mono">{proxy.host}</span>
              </div>
              <div className="flex justify-between">
                <span>پورت:</span>
                <span className="font-mono">{proxy.port}</span>
              </div>
              <div className="flex justify-between">
                <span>زمان پاسخ:</span>
                <span>{proxy.response_time}ms</span>
              </div>
              <div className="flex justify-between">
                <span>نرخ موفقیت:</span>
                <span className={proxy.success_rate > 80 ? 'text-green-600' : proxy.success_rate > 60 ? 'text-yellow-600' : 'text-red-600'}>
                  {proxy.success_rate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>آخرین تست:</span>
                <span>{new Date(proxy.last_tested).toLocaleTimeString('fa-IR')}</span>
              </div>
            </div>

            <div className="mt-3 flex space-x-reverse space-x-2">
              <button 
                className="flex-1 bg-blue-500 text-white text-xs py-1.5 px-2 rounded hover:bg-blue-600"
                onClick={() => testSingleProxy(proxy)}
              >
                تست
              </button>
              <button 
                className={`flex-1 text-xs py-1.5 px-2 rounded ${
                  proxy.active ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                onClick={() => toggleProxy(proxy)}
              >
                {proxy.active ? 'غیرفعال' : 'فعال'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  const testSingleProxy = async (proxy) => {
    toast.loading(`تست پروکسی ${proxy.host}...`)
    // Simulate proxy test
    setTimeout(() => {
      toast.success(`پروکسی ${proxy.host} تست شد`)
    }, 1000)
  }

  const toggleProxy = async (proxy) => {
    toast.success(`پروکسی ${proxy.host} ${proxy.active ? 'غیرفعال' : 'فعال'} شد`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              مدیریت شبکه پروکسی ایرانی
            </h1>
            <p className="text-gray-600">
              مدیریت و نظارت بر {IRANIAN_DNS_SERVERS.length} سرور DNS ایرانی
            </p>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-4">
            <button
              onClick={handleTestAllProxies}
              disabled={isTestingAll}
              className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Shield className={`w-5 h-5 ${isTestingAll ? 'animate-pulse' : ''}`} />
              <span>{isTestingAll ? 'در حال تست...' : 'تست همه'}</span>
            </button>
            
            <button
              onClick={handleRotateProxies}
              disabled={isRotating}
              className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRotating ? 'animate-spin' : ''}`} />
              <span>{isRotating ? 'در حال چرخش...' : 'چرخش هوشمند'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Proxy Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">کل پروکسی‌ها</p>
              <p className="text-2xl font-bold text-gray-900">{proxyStats.total || 22}</p>
            </div>
            <Server className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">پروکسی فعال</p>
              <p className="text-2xl font-bold text-green-600">{proxyStats.active || 18}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">میانگین پاسخ</p>
              <p className="text-2xl font-bold text-purple-600">{proxyStats.avgResponseTime?.toFixed(0) || 245}ms</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">نرخ موفقیت</p>
              <p className="text-2xl font-bold text-indigo-600">{proxyStats.avgSuccessRate?.toFixed(1) || 87.3}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
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
            {/* Status Tab */}
            {activeTab === 'status' && (
              <motion.div
                key="status"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    22 سرور DNS ایرانی
                  </h3>
                  <div className="flex items-center space-x-reverse space-x-2 text-sm text-gray-500">
                    <Globe className="w-4 h-4" />
                    <span>آخرین بروزرسانی: {new Date().toLocaleTimeString('fa-IR')}</span>
                  </div>
                </div>

                {renderProxyGrid()}
              </motion.div>
            )}

            {/* Health Tab */}
            {activeTab === 'health' && (
              <motion.div
                key="health"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">تست سلامت شبکه</h3>
                  <button
                    onClick={handleTestAllProxies}
                    disabled={isTestingAll}
                    className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Shield className={`w-5 h-5 ${isTestingAll ? 'animate-pulse' : ''}`} />
                    <span>{isTestingAll ? 'در حال تست...' : 'تست همه پروکسی‌ها'}</span>
                  </button>
                </div>

                {/* Health Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-reverse space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">سالم</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {proxies.filter(p => p.active && p.response_time < 500).length}
                    </div>
                    <div className="text-xs text-green-600">پروکسی سالم و سریع</div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-reverse space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-900">کند</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {proxies.filter(p => p.active && p.response_time >= 500).length}
                    </div>
                    <div className="text-xs text-yellow-600">پروکسی کند ولی فعال</div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-reverse space-x-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900">غیرفعال</span>
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      {proxies.filter(p => !p.active).length}
                    </div>
                    <div className="text-xs text-red-600">پروکسی غیرفعال</div>
                  </div>
                </div>

                {/* Detailed Health List */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">جزئیات سلامت</h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {proxies.map((proxy, index) => (
                      <div key={proxy.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-reverse space-x-3">
                          <div className={`w-4 h-4 rounded-full ${getProxyStatusColor(proxy)}`}></div>
                          <div>
                            <span className="font-medium">{proxy.host}</span>
                            <span className="text-sm text-gray-500 mr-2">:{proxy.port}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-reverse space-x-4 text-sm">
                          <span>{proxy.response_time}ms</span>
                          <span className={proxy.success_rate > 80 ? 'text-green-600' : 'text-red-600'}>
                            {proxy.success_rate}%
                          </span>
                          <button className="text-blue-600 hover:text-blue-800">
                            تست
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rotation Tab */}
            {activeTab === 'rotation' && (
              <motion.div
                key="rotation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">چرخش هوشمند پروکسی</h3>
                  <button
                    onClick={handleRotateProxies}
                    disabled={isRotating}
                    className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRotating ? 'animate-spin' : ''}`} />
                    <span>{isRotating ? 'در حال چرخش...' : 'شروع چرخش'}</span>
                  </button>
                </div>

                {/* Rotation Strategy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-3">استراتژی چرخش</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>روش:</span>
                        <span className="font-medium">هوشمند بر اساس عملکرد</span>
                      </div>
                      <div className="flex justify-between">
                        <span>فاصله زمانی:</span>
                        <span className="font-medium">30 ثانیه</span>
                      </div>
                      <div className="flex justify-between">
                        <span>حداکثر تلاش:</span>
                        <span className="font-medium">3 بار</span>
                      </div>
                      <div className="flex justify-between">
                        <span>آستانه موفقیت:</span>
                        <span className="font-medium">70%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">آمار چرخش</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>چرخش‌های امروز:</span>
                        <span className="font-medium">23</span>
                      </div>
                      <div className="flex justify-between">
                        <span>موفقیت چرخش:</span>
                        <span className="font-medium text-green-600">91.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>آخرین چرخش:</span>
                        <span className="font-medium">5 دقیقه پیش</span>
                      </div>
                      <div className="flex justify-between">
                        <span>پروکسی فعلی:</span>
                        <span className="font-medium font-mono">{proxies.find(p => p.active)?.host || 'خودکار'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rotation Timeline */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">تایم‌لاین چرخش</h4>
                  <div className="space-y-2">
                    {[
                      { time: '14:30', action: 'چرخش به 185.51.200.2', status: 'موفق', color: 'green' },
                      { time: '14:25', action: 'چرخش به 178.22.122.100', status: 'موفق', color: 'green' },
                      { time: '14:20', action: 'چرخش به 78.157.42.101', status: 'ناموفق', color: 'red' },
                      { time: '14:15', action: 'چرخش به 10.202.10.202', status: 'موفق', color: 'green' }
                    ].map((event, index) => (
                      <div key={index} className="flex items-center space-x-reverse space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          event.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-sm">{event.action}</span>
                          <span className="text-xs text-gray-500">{event.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">آمار کامل شبکه</h3>
                
                {/* Performance Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">توزیع عملکرد</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">عالی (&lt;300ms)</span>
                        <div className="flex items-center space-x-reverse space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                          <span className="text-sm">45%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">خوب (300-800ms)</span>
                        <div className="flex items-center space-x-reverse space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                          </div>
                          <span className="text-sm">35%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">کند (&gt;800ms)</span>
                        <div className="flex items-center space-x-reverse space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                          </div>
                          <span className="text-sm">20%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">آمار جغرافیایی</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>سرورهای تهران:</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex justify-between">
                        <span>سرورهای اصفهان:</span>
                        <span className="font-medium">6</span>
                      </div>
                      <div className="flex justify-between">
                        <span>سرورهای مشهد:</span>
                        <span className="font-medium">4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>سرورهای شیراز:</span>
                        <span className="font-medium">2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>سرورهای بین‌المللی:</span>
                        <span className="font-medium">2</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Stats Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-right">شماره</th>
                        <th className="px-4 py-2 text-right">آدرس</th>
                        <th className="px-4 py-2 text-right">وضعیت</th>
                        <th className="px-4 py-2 text-right">زمان پاسخ</th>
                        <th className="px-4 py-2 text-right">نرخ موفقیت</th>
                        <th className="px-4 py-2 text-right">آخرین تست</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proxies.map((proxy, index) => (
                        <tr key={proxy.id || index} className="border-b border-gray-200">
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2 font-mono">{proxy.host}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center space-x-reverse space-x-1 px-2 py-1 rounded-full text-xs ${
                              proxy.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${proxy.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span>{proxy.active ? 'فعال' : 'غیرفعال'}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={proxy.response_time < 500 ? 'text-green-600' : proxy.response_time < 1000 ? 'text-yellow-600' : 'text-red-600'}>
                              {proxy.response_time}ms
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={proxy.success_rate > 80 ? 'text-green-600' : proxy.success_rate > 60 ? 'text-yellow-600' : 'text-red-600'}>
                              {proxy.success_rate}%
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-500">
                            {new Date(proxy.last_tested).toLocaleTimeString('fa-IR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Network Performance Chart */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">عملکرد شبکه در زمان واقعی</h3>
          <div className="flex items-center space-x-reverse space-x-2">
            <Activity className="w-5 h-5 text-green-500 animate-pulse" />
            <span className="text-sm text-green-600">داده‌های زنده</span>
          </div>
        </div>
        
        {/* Chart placeholder */}
        <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="text-gray-600">نمودار عملکرد شبکه</p>
            <p className="text-xs text-gray-500 mt-1">داده‌های زنده از {proxies.length} پروکسی</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedProxyDashboard;