import React, { createContext, useContext, useState, useEffect } from 'react'

const SystemContext = createContext()

export const useSystemContext = () => {
  const context = useContext(SystemContext)
  if (!context) {
    throw new Error('useSystemContext must be used within a SystemContextProvider')
  }
  return context
}

export const SystemContextProvider = ({ children }) => {
  const [systemStatus, setSystemStatus] = useState('initializing')
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [systemConfig, setSystemConfig] = useState({})
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    // Initialize system
    const initializeSystem = async () => {
      try {
        setSystemStatus('loading')
        // Simulate system initialization
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSystemStatus('online')
        setSystemConfig({
          language: 'fa',
          theme: 'light',
          timezone: 'Asia/Tehran'
        })
      } catch (error) {
        setSystemStatus('error')
        console.error('System initialization failed:', error)
      }
    }

    initializeSystem()
  }, [])

  const addNotification = (notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }])
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const updateSystemConfig = (newConfig) => {
    setSystemConfig(prev => ({ ...prev, ...newConfig }))
  }

  const value = {
    systemStatus,
    user,
    setUser,
    permissions,
    setPermissions,
    systemConfig,
    updateSystemConfig,
    notifications,
    addNotification,
    removeNotification
  }

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  )
}