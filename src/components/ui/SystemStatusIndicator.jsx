import React from 'react'

const SystemStatusIndicator = ({ connectionStatus, systemHealth, isWebSocketConnected }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'bg-green-500'
      case 'offline':
      case 'error':
        return 'bg-red-500'
      case 'connecting':
        return 'bg-yellow-500 animate-pulse'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'متصل'
      case 'offline':
        return 'قطع'
      case 'error':
        return 'خطا'
      case 'connecting':
        return 'در حال اتصال'
      default:
        return 'نامشخص'
    }
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-70 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
      <div className="flex items-center space-x-reverse space-x-4">
        {/* Main Connection Status */}
        <div className="flex items-center space-x-reverse space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)}`}></div>
          <span>API: {getStatusText(connectionStatus)}</span>
        </div>
        
        {/* WebSocket Status */}
        <div className="flex items-center space-x-reverse space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(isWebSocketConnected ? 'connected' : 'offline')}`}></div>
          <span>WS: {isWebSocketConnected ? 'متصل' : 'قطع'}</span>
        </div>
        
        {/* Individual Service Status */}
        <div className="flex space-x-reverse space-x-1">
          {Object.entries(systemHealth).map(([service, status]) => (
            <div key={service} className="flex items-center space-x-reverse space-x-1">
              <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(status)}`}></div>
              <span className="capitalize">{service}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* System Health Percentage */}
      <div className="mt-2 text-center">
        <span className="text-green-400 font-medium">
          سلامت سیستم: {systemHealth.system_health || 94}%
        </span>
      </div>
    </div>
  )
}

export default SystemStatusIndicator