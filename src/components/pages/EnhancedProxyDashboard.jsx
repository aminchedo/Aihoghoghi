import React, { useState } from 'react'
import { useSystemContext } from '../../contexts/SystemContext'

const EnhancedProxyDashboard = () => {
  const { proxySettings, dispatch } = useSystemContext()
  const [newProxy, setNewProxy] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    type: 'http'
  })
  const [isAdding, setIsAdding] = useState(false)

  const handleAddProxy = async (e) => {
    e.preventDefault()
    if (!newProxy.name || !newProxy.host || !newProxy.port) return

    setIsAdding(true)
    
    // Simulate API call
    setTimeout(() => {
      const proxy = {
        id: Date.now(),
        ...newProxy,
        status: 'active',
        lastUsed: new Date().toISOString()
      }
      
      dispatch({
        type: 'UPDATE_PROXY_SETTINGS',
        payload: {
          servers: [...proxySettings.servers, proxy]
        }
      })
      
      setNewProxy({ name: '', host: '', port: '', username: '', password: '', type: 'http' })
      setIsAdding(false)
    }, 1000)
  }

  const handleToggleProxy = (proxyId) => {
    const updatedServers = proxySettings.servers.map(proxy =>
      proxy.id === proxyId
        ? { ...proxy, status: proxy.status === 'active' ? 'inactive' : 'active' }
        : proxy
    )
    
    dispatch({
      type: 'UPDATE_PROXY_SETTINGS',
      payload: { servers: updatedServers }
    })
  }

  const handleDeleteProxy = (proxyId) => {
    const updatedServers = proxySettings.servers.filter(proxy => proxy.id !== proxyId)
    
    dispatch({
      type: 'UPDATE_PROXY_SETTINGS',
      payload: { servers: updatedServers }
    })
  }

  const handleToggleGlobalProxy = () => {
    dispatch({
      type: 'UPDATE_PROXY_SETTINGS',
      payload: { enabled: !proxySettings.enabled }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">مدیریت پروکسی</h1>
      </div>

      {/* Global Proxy Toggle */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">فعال‌سازی سراسری پروکسی</h2>
            <p className="text-sm text-gray-500 mt-1">
              فعال‌سازی این گزینه باعث می‌شود تمام درخواست‌ها از طریق پروکسی فعال ارسال شوند
            </p>
          </div>
          <button
            onClick={handleToggleGlobalProxy}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              proxySettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                proxySettings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Add New Proxy */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">افزودن پروکسی جدید</h2>
        <form onSubmit={handleAddProxy} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نام پروکسی</label>
              <input
                type="text"
                value={newProxy.name}
                onChange={(e) => setNewProxy({ ...newProxy, name: e.target.value })}
                placeholder="نام پروکسی"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع پروکسی</label>
              <select
                value={newProxy.type}
                onChange={(e) => setNewProxy({ ...newProxy, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">آدرس سرور</label>
              <input
                type="text"
                value={newProxy.host}
                onChange={(e) => setNewProxy({ ...newProxy, host: e.target.value })}
                placeholder="192.168.1.1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">پورت</label>
              <input
                type="number"
                value={newProxy.port}
                onChange={(e) => setNewProxy({ ...newProxy, port: e.target.value })}
                placeholder="8080"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نام کاربری (اختیاری)</label>
              <input
                type="text"
                value={newProxy.username}
                onChange={(e) => setNewProxy({ ...newProxy, username: e.target.value })}
                placeholder="نام کاربری"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رمز عبور (اختیاری)</label>
              <input
                type="password"
                value={newProxy.password}
                onChange={(e) => setNewProxy({ ...newProxy, password: e.target.value })}
                placeholder="رمز عبور"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isAdding || !newProxy.name || !newProxy.host || !newProxy.port}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isAdding ? 'در حال افزودن...' : 'افزودن پروکسی'}
          </button>
        </form>
      </div>

      {/* Proxy List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            لیست پروکسی‌ها ({proxySettings.servers.length})
          </h2>
        </div>
        <div className="p-6">
          {proxySettings.servers.length > 0 ? (
            <div className="space-y-4">
              {proxySettings.servers.map((proxy) => (
                <div key={proxy.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`w-3 h-3 rounded-full ${
                      proxy.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{proxy.name}</h3>
                      <p className="text-sm text-gray-500">
                        {proxy.type.toUpperCase()} - {proxy.host}:{proxy.port}
                      </p>
                      <p className="text-xs text-gray-400">
                        آخرین استفاده: {new Date(proxy.lastUsed).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleToggleProxy(proxy.id)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        proxy.status === 'active'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {proxy.status === 'active' ? 'غیرفعال' : 'فعال'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteProxy(proxy.id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>هیچ پروکسی‌ای تعریف نشده است</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedProxyDashboard