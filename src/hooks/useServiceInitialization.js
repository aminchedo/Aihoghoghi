/**
 * Custom hook for managing service initialization state
 * Provides a clean React interface for the autoStartupService
 */

import { useState, useEffect, useCallback } from 'react';

export const useServiceInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [initializationTime, setInitializationTime] = useState(null);

  // Retry initialization function
  const retryInitialization = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setIsInitialized(false);
    
    try {
      console.log('🔄 Retrying service initialization...');
      
      if (window.autoStartupService) {
        // Force re-initialization
        window.autoStartupService.isInitialized = false;
        window.autoStartupService.initializationPromise = null;
        
        const startTime = Date.now();
        const status = await window.autoStartupService.getInitializationPromise();
        const endTime = Date.now();
        
        setServiceStatus(status);
        setInitializationTime(endTime - startTime);
        setIsInitialized(true);
        setIsLoading(false);
        
        console.log(`✅ Retry successful in ${endTime - startTime}ms`);
      } else {
        throw new Error('AutoStartupService not available');
      }
    } catch (err) {
      console.error('❌ Retry failed:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  // Get current service status
  const getServiceStatus = useCallback(() => {
    if (window.autoStartupService) {
      return window.autoStartupService.getSystemStatus();
    }
    return null;
  }, []);

  // Check if specific service is available
  const isServiceAvailable = useCallback((serviceName) => {
    return window.iranianLegalArchive?.features?.[serviceName] || false;
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const handleServicesReady = (event) => {
      if (!isMounted) return;
      
      console.log('✅ useServiceInitialization: Services ready');
      setServiceStatus(event.detail.status);
      setIsInitialized(true);
      setIsLoading(false);
      setError(null);
    };
    
    const handleServicesError = (event) => {
      if (!isMounted) return;
      
      console.error('❌ useServiceInitialization: Services error');
      setError(event.detail.error);
      setIsLoading(false);
    };
    
    // Add event listeners
    window.addEventListener('servicesReady', handleServicesReady);
    window.addEventListener('servicesError', handleServicesError);
    
    // Check if already initialized
    if (window.iranianLegalArchive?.servicesReady) {
      setIsInitialized(true);
      setIsLoading(false);
      setServiceStatus(getServiceStatus());
    }
    
    // Cleanup
    return () => {
      isMounted = false;
      window.removeEventListener('servicesReady', handleServicesReady);
      window.removeEventListener('servicesError', handleServicesError);
    };
  }, [getServiceStatus]);

  return {
    isInitialized,
    isLoading,
    error,
    serviceStatus,
    initializationTime,
    retryInitialization,
    getServiceStatus,
    isServiceAvailable
  };
};

export default useServiceInitialization;