import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

/**
 * Resilient API hook with error handling and fallback
 * Prevents 404 errors from breaking the app
 */
export const useResilientAPI = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const {
    autoFetch = true,
    fallbackData = null,
    retryCount = 3,
    retryDelay = 1000,
    ...requestOptions
  } = options;

  const fetchData = useCallback(async (customEndpoint = null) => {
    const targetEndpoint = customEndpoint || endpoint;
    
    if (!targetEndpoint) {
      setError({ message: 'نقطه پایانی مشخص نشده است', code: 'NO_ENDPOINT' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Fetching data from: ${targetEndpoint}`);
      
      const response = await apiService.get(targetEndpoint, requestOptions);
      
      setData(response);
      setIsOffline(false);
      
      console.log(`✅ Data fetched successfully from: ${targetEndpoint}`);
      
    } catch (err) {
      console.error(`❌ API Error for ${targetEndpoint}:`, err);
      
      setError(err);
      
      // Use fallback data if available
      if (fallbackData) {
        console.log('🔄 Using fallback data');
        setData(fallbackData);
        setIsOffline(true);
      } else {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, requestOptions, fallbackData]);

  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback((newEndpoint) => {
    fetchData(newEndpoint);
  }, [fetchData]);

  useEffect(() => {
    if (autoFetch && endpoint) {
      fetchData();
    }
  }, [autoFetch, endpoint, fetchData]);

  return {
    data,
    loading,
    error,
    isOffline,
    retry,
    refetch,
    fetchData
  };
};

/**
 * Hook for API mutations (POST, PUT, DELETE) with error handling
 */
export const useResilientMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (method, endpoint, data = null, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      switch (method.toLowerCase()) {
        case 'post':
          response = await apiService.post(endpoint, data, options);
          break;
        case 'put':
          response = await apiService.put(endpoint, data, options);
          break;
        case 'delete':
          response = await apiService.delete(endpoint, options);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      console.log(`✅ ${method.toUpperCase()} ${endpoint} successful`);
      return response;

    } catch (err) {
      console.error(`❌ ${method.toUpperCase()} ${endpoint} failed:`, err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback((endpoint, data, options) => 
    mutate('post', endpoint, data, options), [mutate]);
  
  const put = useCallback((endpoint, data, options) => 
    mutate('put', endpoint, data, options), [mutate]);
  
  const del = useCallback((endpoint, options) => 
    mutate('delete', endpoint, null, options), [mutate]);

  return {
    loading,
    error,
    post,
    put,
    delete: del,
    mutate
  };
};

/**
 * Hook for checking API connectivity
 */
export const useAPIHealth = () => {
  const [isHealthy, setIsHealthy] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const checkHealth = useCallback(async () => {
    try {
      const healthy = await apiService.checkHealth();
      setIsHealthy(healthy);
      setLastCheck(new Date());
      return healthy;
    } catch (error) {
      setIsHealthy(false);
      setLastCheck(new Date());
      return false;
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isHealthy,
    lastCheck,
    checkHealth
  };
};

export default { useResilientAPI, useResilientMutation, useAPIHealth };