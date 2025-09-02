import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showSuccess = useCallback((message) => {
    toast.success(message, {
      duration: 4000,
      style: {
        direction: 'rtl',
        fontFamily: 'Vazirmatn, sans-serif',
      }
    });
  }, []);

  const showError = useCallback((message) => {
    toast.error(message, {
      duration: 6000,
      style: {
        direction: 'rtl',
        fontFamily: 'Vazirmatn, sans-serif',
      }
    });
  }, []);

  const showWarning = useCallback((message) => {
    toast(message, {
      icon: '⚠️',
      duration: 5000,
      style: {
        direction: 'rtl',
        fontFamily: 'Vazirmatn, sans-serif',
      }
    });
  }, []);

  const showInfo = useCallback((message) => {
    toast(message, {
      icon: 'ℹ️',
      duration: 4000,
      style: {
        direction: 'rtl',
        fontFamily: 'Vazirmatn, sans-serif',
      }
    });
  }, []);

  const showApiError = useCallback((error, context = '') => {
    const message = context ? `${context}: ${error.message}` : error.message;
    showError(message);
  }, [showError]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    
    // Show toast based on type
    switch (notification.type) {
      case 'success':
        showSuccess(notification.message);
        break;
      case 'error':
        showError(notification.message);
        break;
      case 'warning':
        showWarning(notification.message);
        break;
      case 'info':
        showInfo(notification.message);
        break;
      default:
        showInfo(notification.message);
    }
  }, [showSuccess, showError, showWarning, showInfo]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    notifications,
    addNotification,
    clearNotifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showApiError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};