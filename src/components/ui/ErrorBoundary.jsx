import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log to analytics if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-red-900/20 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-lg w-full text-center">
            <div className="text-red-500 mb-6">
              <AlertTriangle className="w-16 h-16 mx-auto" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              خطای غیرمنتظره
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              متأسفانه خطایی در سیستم رخ داده است. لطفاً صفحه را رفرش کنید یا به صفحه اصلی بازگردید.
            </p>
            
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-right">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  جزئیات خطا:
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                  {this.state.error.message}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-red-600 dark:text-red-400">
                      اطلاعات بیشتر (حالت توسعه)
                    </summary>
                    <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                رفرش صفحه
              </button>
              
              <button
                onClick={() => window.location.href = '/Aihoghoghi/'}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                صفحه اصلی
              </button>
            </div>
            
            <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              اگر مشکل ادامه دارد، کنسول مرورگر را بررسی کنید یا با پشتیبانی تماس بگیرید.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;