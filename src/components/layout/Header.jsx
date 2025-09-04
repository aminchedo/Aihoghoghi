import React from 'react'
import { useSystemContext } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'

const Header = () => {
  const { systemStatus, user, logout } = useSystemContext()
  const { isConnected } = useWebSocket()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className="text-2xl font-bold text-gray-900">
            سیستم آرشیو اسناد حقوقی ایران
          </h1>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              وضعیت: {isConnected ? 'آنلاین' : 'آفلاین'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="text-sm text-gray-500">
            سیستم: {systemStatus === 'online' ? 'فعال' : 'غیرفعال'}
          </div>
          
          {user ? (
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-700">
                {user.name || user.email}
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                خروج
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              کاربر مهمان
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header