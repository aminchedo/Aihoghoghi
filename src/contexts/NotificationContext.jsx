import React, { createContext, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useConfig } from './ConfigContext';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { config } = useConfig();

  const showNotification = useCallback((message, type = 'info', options = {}) => {
    const defaultOptions = {
      duration: config.notifications.duration,
      position: config.notifications.position,
      style: {
        direction: 'rtl',
        fontFamily: 'Vazirmatn, sans-serif',
        fontSize: '14px',
        ...options.style,
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };

    switch (type) {
      case 'success':
        return toast.success(message, {
          ...mergedOptions,
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        });
      
      case 'error':
        return toast.error(message, {
          ...mergedOptions,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        });
      
      case 'warning':
        return toast(message, {
          ...mergedOptions,
          icon: '⚠️',
          style: {
            ...mergedOptions.style,
            background: '#fbbf24',
            color: '#ffffff',
          },
        });
      
      case 'info':
        return toast(message, {
          ...mergedOptions,
          icon: 'ℹ️',
          style: {
            ...mergedOptions.style,
            background: '#3b82f6',
            color: '#ffffff',
          },
        });
      
      case 'loading':
        return toast.loading(message, mergedOptions);
      
      default:
        return toast(message, mergedOptions);
    }
  }, [config.notifications]);

  const showSuccess = useCallback((message, options) => {
    return showNotification(message, 'success', options);
  }, [showNotification]);

  const showError = useCallback((message, options) => {
    return showNotification(message, 'error', options);
  }, [showNotification]);

  const showWarning = useCallback((message, options) => {
    return showNotification(message, 'warning', options);
  }, [showNotification]);

  const showInfo = useCallback((message, options) => {
    return showNotification(message, 'info', options);
  }, [showNotification]);

  const showLoading = useCallback((message, options) => {
    return showNotification(message, 'loading', options);
  }, [showNotification]);

  const dismissNotification = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  const showPromise = useCallback((promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'در حال پردازش...',
        success: messages.success || 'عملیات با موفقیت انجام شد',
        error: messages.error || 'خطایی رخ داده است',
      },
      {
        style: {
          direction: 'rtl',
          fontFamily: 'Vazirmatn, sans-serif',
        },
        ...options,
      }
    );
  }, []);

  const showCustom = useCallback((component, options = {}) => {
    return toast.custom(component, {
      duration: config.notifications.duration,
      position: config.notifications.position,
      ...options,
    });
  }, [config.notifications]);

  // API-specific notification helpers
  const showApiError = useCallback((error, customMessage) => {
    let message = customMessage || 'خطایی در ارتباط با سرور رخ داده است';
    
    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          message = 'درخواست نامعتبر - لطفاً اطلاعات ورودی را بررسی کنید';
          break;
        case 401:
          message = 'عدم احراز هویت - لطفاً مجدداً وارد شوید';
          break;
        case 403:
          message = 'عدم دسترسی - شما مجاز به انجام این عملیات نیستید';
          break;
        case 404:
          message = 'آدرس یافت نشد - لطفاً از صحت آدرس اطمینان حاصل کنید';
          break;
        case 409:
          message = 'عملیات دیگری در حال انجام است - لطفاً منتظر بمانید';
          break;
        case 429:
          message = 'تعداد درخواست‌ها زیاد است - لطفاً کمی صبر کنید';
          break;
        case 500:
          message = 'خطای داخلی سرور - لطفاً بعداً تلاش کنید';
          break;
        case 502:
          message = 'سرور در دسترس نیست';
          break;
        case 503:
          message = 'سرویس موقتاً در دسترس نیست';
          break;
        default:
          message = `خطای ${error.response.status}: ${error.response.statusText || 'نامشخص'}`;
      }
    } else if (error?.message) {
      if (error.message.includes('fetch')) {
        message = 'عدم اتصال به سرور - لطفاً اتصال اینترنت خود را بررسی کنید';
      } else if (error.message.includes('timeout')) {
        message = 'زمان انتظار تمام شد - لطفاً مجدداً تلاش کنید';
      } else {
        message = error.message;
      }
    }
    
    return showError(message);
  }, [showError]);

  const showConnectionStatus = useCallback((status) => {
    switch (status) {
      case 'connected':
        return showSuccess('اتصال به سرور برقرار شد');
      case 'disconnected':
        return showWarning('اتصال به سرور قطع شد');
      case 'reconnecting':
        return showInfo('در حال تلاش برای اتصال مجدد...');
      case 'error':
        return showError('خطا در اتصال به سرور');
      default:
        return showInfo(`وضعیت اتصال: ${status}`);
    }
  }, [showSuccess, showWarning, showInfo, showError]);

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showPromise,
    showCustom,
    showApiError,
    showConnectionStatus,
    dismissNotification,
    dismissAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};