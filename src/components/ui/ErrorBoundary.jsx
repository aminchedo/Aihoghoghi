import React from 'react';
import { RefreshCw, Home, AlertTriangle, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="card p-8 text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">💥</span>
              </div>
              
              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                خطای غیرمنتظره
              </h1>
              
              {/* Error Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                متأسفانه خطایی در برنامه رخ داده است. لطفاً صفحه را بازنشانی کنید یا با پشتیبانی تماس بگیرید.
              </p>
              
              {/* Error Details (Development Mode) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-right mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    جزئیات خطا (حالت توسعه):
                  </h3>
                  <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32 font-mono">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32 mt-2 font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  🔄 بازنشانی صفحه
                </button>
                
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  🔄 تلاش مجدد
                </button>
              </div>
              
              {/* Additional Help */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  اگر مشکل ادامه دارد، لطفاً با پشتیبانی تماس بگیرید.
                </p>
                
                {/* System Info */}
                <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 space-y-1">
                  <div>نسخه: ۲.۰.۰</div>
                  <div>زمان خطا: {new Date().toLocaleString('fa-IR')}</div>
                  <div>مرورگر: {navigator.userAgent.split(' ')[0]}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;