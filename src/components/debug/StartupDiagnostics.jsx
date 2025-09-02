/**
 * Development component for debugging startup issues
 * Shows real-time startup status and diagnostics
 */

import React, { useState, useEffect } from 'react';
import useServiceInitialization from '../../hooks/useServiceInitialization';

const StartupDiagnostics = () => {
  const {
    isInitialized,
    isLoading,
    error,
    serviceStatus,
    initializationTime,
    retryInitialization,
    getServiceStatus
  } = useServiceInitialization();
  
  const [diagnostics, setDiagnostics] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Update logs in real-time
  useEffect(() => {
    const updateLogs = () => {
      if (window.autoStartupService) {
        setLogs([...window.autoStartupService.startupLog]);
      }
    };
    
    updateLogs();
    const interval = setInterval(updateLogs, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Load diagnostics
  const loadDiagnostics = async () => {
    try {
      if (window.systemDiagnostics) {
        const diag = await window.systemDiagnostics.runDiagnostics();
        setDiagnostics(diag);
      }
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    }
  };
  
  useEffect(() => {
    loadDiagnostics();
  }, [isInitialized]);
  
  const exportDiagnostics = async () => {
    try {
      if (window.autoStartupService) {
        await window.autoStartupService.exportDiagnostics();
      }
    } catch (error) {
      console.error('Failed to export diagnostics:', error);
    }
  };
  
  return (
    <div className="fixed bottom-4 left-4 max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          🔍 Startup Diagnostics
        </h3>
        <button
          onClick={exportDiagnostics}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Export
        </button>
      </div>
      
      {/* Status Overview */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span>Initialization:</span>
          <span className={`px-2 py-1 rounded ${
            isInitialized ? 'bg-green-100 text-green-800' : 
            isLoading ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {isInitialized ? '✅ Ready' : isLoading ? '⏳ Loading' : '❌ Failed'}
          </span>
        </div>
        
        {initializationTime && (
          <div className="flex items-center justify-between text-xs">
            <span>Init Time:</span>
            <span className="text-gray-600 dark:text-gray-400">{initializationTime}ms</span>
          </div>
        )}
        
        {serviceStatus && (
          <div className="flex items-center justify-between text-xs">
            <span>Services:</span>
            <span className="text-gray-600 dark:text-gray-400">{serviceStatus.serviceCount || 0}</span>
          </div>
        )}
        
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
            {error}
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={retryInitialization}
          disabled={isLoading}
          className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          🔄 Retry
        </button>
        <button
          onClick={loadDiagnostics}
          className="flex-1 text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
        >
          🔍 Refresh
        </button>
      </div>
      
      {/* Recent Logs */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Recent Logs ({logs.length})
        </h4>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {logs.slice(-5).map((log, index) => (
            <div key={index} className="text-xs p-1 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-gray-500 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
              <div className={`${
                log.level === 'error' ? 'text-red-600' :
                log.level === 'warn' ? 'text-yellow-600' :
                log.level === 'success' ? 'text-green-600' :
                'text-gray-700 dark:text-gray-300'
              }`}>
                {log.message}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Global Objects Status */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Global Objects
        </h4>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>autoStartupService:</span>
            <span className={!!window.autoStartupService ? 'text-green-600' : 'text-red-600'}>
              {!!window.autoStartupService ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>iranianLegalArchive:</span>
            <span className={!!window.iranianLegalArchive ? 'text-green-600' : 'text-red-600'}>
              {!!window.iranianLegalArchive ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>servicesReady:</span>
            <span className={window.iranianLegalArchive?.servicesReady ? 'text-green-600' : 'text-red-600'}>
              {window.iranianLegalArchive?.servicesReady ? '✅' : '❌'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupDiagnostics;