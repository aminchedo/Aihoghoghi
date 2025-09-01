import React, { createContext, useContext, useEffect, useState } from 'react';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

const DEFAULT_CONFIG = {
  apiBaseUrl: process.env.NODE_ENV === 'development' 
    ? 'http://127.0.0.1:8000/api' 
    : `${window.location.origin}/api`,
  websocketUrl: process.env.NODE_ENV === 'development'
    ? 'ws://127.0.0.1:8000/ws'
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
  proxyEnabled: true,
  batchSize: 5,
  maxRetries: 3,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  timeout: 30000, // 30 seconds
  theme: 'light',
  language: 'fa',
  notifications: {
    position: 'top-left',
    duration: 4000,
    maxNotifications: 5,
  },
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },
  cache: {
    enabled: true,
    duration: 5 * 60 * 1000, // 5 minutes
  },
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        return { ...DEFAULT_CONFIG, ...parsed };
      } catch (error) {
        console.error('Failed to parse saved config:', error);
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState('unknown'); // unknown, connected, error

  useEffect(() => {
    // Save config to localStorage whenever it changes
    localStorage.setItem('appConfig', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateConfig = (updates) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...updates,
    }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem('appConfig');
  };

  const exportConfig = () => {
    const configToExport = {
      ...config,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    
    const blob = new Blob([JSON.stringify(configToExport, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `legal-archive-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importConfig = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target.result);
          
          // Validate imported config
          if (typeof importedConfig !== 'object' || importedConfig === null) {
            throw new Error('Invalid config format');
          }
          
          // Merge with default config to ensure all required fields exist
          const newConfig = { ...DEFAULT_CONFIG, ...importedConfig };
          
          // Remove metadata fields
          delete newConfig.exportedAt;
          delete newConfig.version;
          
          setConfig(newConfig);
          resolve(newConfig);
        } catch (error) {
          reject(new Error('Failed to parse config file: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read config file'));
      };
      
      reader.readAsText(file);
    });
  };

  const testConnection = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/status`, {
        method: 'GET',
        timeout: config.timeout,
      });
      
      if (response.ok) {
        setBackendStatus('connected');
        return { success: true, status: response.status };
      } else {
        setBackendStatus('error');
        return { success: false, status: response.status, error: response.statusText };
      }
    } catch (error) {
      setBackendStatus('error');
      return { success: false, error: error.message };
    }
  };

  const getApiUrl = (endpoint) => {
    const baseUrl = config.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  };

  const getWebSocketUrl = () => {
    return config.websocketUrl;
  };

  const value = {
    config,
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,
    testConnection,
    getApiUrl,
    getWebSocketUrl,
    isOnline,
    backendStatus,
    setBackendStatus,
    DEFAULT_CONFIG,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};