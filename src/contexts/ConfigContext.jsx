import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    apiBaseUrl: '/api',
    isGitHubPages: window.location.hostname.includes('github.io'),
    refreshInterval: 5000,
    maxRetries: 3,
    timeout: 30000
  });

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('legalArchive_config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsedConfig }));
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }
  }, []);

  const updateConfig = (newConfig) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('legalArchive_config', JSON.stringify(updatedConfig));
  };

  const getApiUrl = (endpoint) => {
    if (config.isGitHubPages) {
      // For GitHub Pages, use client-side simulation
      return endpoint;
    }
    return `${config.apiBaseUrl}${endpoint}`;
  };

  const value = {
    config,
    updateConfig,
    getApiUrl
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};