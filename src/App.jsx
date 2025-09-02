import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Components
import Header from './components/layout/Header';
import EnhancedSidebar from './components/layout/EnhancedSidebar';
import Dashboard from './components/pages/Dashboard';
import DocumentProcessing from './components/pages/DocumentProcessing';
import ProxyDashboard from './components/pages/ProxyDashboard';
import EnhancedSearchDatabase from './components/pages/EnhancedSearchDatabase';
import ScrapingDashboard from './components/pages/ScrapingDashboard';
import AIAnalysisDashboard from './components/pages/AIAnalysisDashboard';
import Settings from './components/pages/Settings';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AITestComponent from './components/test/AITestComponent';
import StartupDiagnostics from './components/debug/StartupDiagnostics';

// Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Utils
import githubPagesConfig from './utils/githubPagesConfig';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [githubConfig, setGithubConfig] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);

  useEffect(() => {
    let isComponentMounted = true;
    
    // Initialize application with modern event-driven approach
    const initializeApp = async () => {
      const startTime = Date.now();
      
      try {
        console.log('🚀 Initializing Iranian Legal Archive System...');
        
        // Initialize GitHub Pages configuration
        setGithubConfig(githubPagesConfig);
        
        // Setup environment-specific features
        if (githubPagesConfig.isGitHubPages) {
          console.log('🌐 GitHub Pages environment detected');
          githubPagesConfig.setupClientSideAPI();
        }
        
        // Clear any existing HTML loading screens immediately
        const htmlLoader = document.querySelector('.loading-container');
        const initialLoader = document.getElementById('initial-loader');
        
        if (htmlLoader) {
          htmlLoader.style.display = 'none';
          htmlLoader.remove();
        }
        if (initialLoader) {
          initialLoader.style.display = 'none';
          initialLoader.remove();
        }
        
        // Clear any loading timeouts from HTML
        if (window.cleanupHTMLLoader) {
          window.cleanupHTMLLoader();
        }
        
        // Event listeners for service initialization
        const handleServicesReady = (event) => {
          if (!isComponentMounted) return;
          
          console.log('✅ Services ready event received:', event.detail);
          setServiceStatus(event.detail.status);
          setInitializationComplete(true);
          
          // Start background scraping if enabled
          if (window.iranianLegalArchive?.features?.autoScraping) {
            console.log('🔄 Starting background scraping...');
            setTimeout(() => {
              window.autoStartupService?.startBackgroundScraping();
            }, 5000);
          }
          
          // Smooth transition delay
          setTimeout(() => {
            if (isComponentMounted) {
              setIsLoading(false);
            }
          }, 300);
        };
        
        const handleServicesError = (event) => {
          if (!isComponentMounted) return;
          
          console.error('❌ Services initialization failed:', event.detail);
          setLoadingError(event.detail.error);
          setInitializationComplete(true);
          
          // Still allow app to load with error state
          setTimeout(() => {
            if (isComponentMounted) {
              setIsLoading(false);
            }
          }, 300);
        };
        
        const handleInitializationError = (event) => {
          if (!isComponentMounted) return;
          
          console.error('❌ Critical initialization error:', event.detail);
          setLoadingError(event.detail.error);
          setInitializationComplete(true);
          setIsLoading(false);
        };
        
        // Add event listeners
        window.addEventListener('servicesReady', handleServicesReady);
        window.addEventListener('servicesError', handleServicesError);
        window.addEventListener('servicesInitializationError', handleInitializationError);
        
        // Check if services are already ready (in case events fired before listeners were added)
        if (window.iranianLegalArchive?.servicesReady) {
          console.log('✅ Services already ready');
          setInitializationComplete(true);
          setTimeout(() => {
            if (isComponentMounted) {
              setIsLoading(false);
            }
          }, 300);
        }
        
        const loadTime = Date.now() - startTime;
        console.log(`✅ App initialization setup completed in ${loadTime}ms`);
        
        // Cleanup function
        return () => {
          window.removeEventListener('servicesReady', handleServicesReady);
          window.removeEventListener('servicesError', handleServicesError);
          window.removeEventListener('servicesInitializationError', handleInitializationError);
        };
        
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        if (isComponentMounted) {
          setLoadingError(error.message);
          setInitializationComplete(true);
          setIsLoading(false);
        }
      }
    };

    // Start initialization and store cleanup function
    let cleanup;
    initializeApp().then(cleanupFn => {
      cleanup = cleanupFn;
    });
    
    // Failsafe: Force app to load after 8 seconds maximum (increased for better UX)
    const failsafeTimeout = setTimeout(() => {
      if (isComponentMounted) {
        console.warn('⚠️ Failsafe timeout reached, forcing app display');
        setIsLoading(false);
        setInitializationComplete(true);
      }
    }, 8000);

    // Cleanup function for useEffect
    return () => {
      isComponentMounted = false;
      clearTimeout(failsafeTimeout);
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  // Enhanced loading screen with real-time status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="relative">
            {/* Modern animated loading spinner */}
            <div className="w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
            </div>
            
            {/* Loading text with animation */}
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                🏛️ سیستم آرشیو اسناد حقوقی ایران
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300">
                در حال بارگذاری آرشیو حقوقی...
              </p>
              
              {/* Service status indicators */}
              {serviceStatus && (
                <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    وضعیت سرویس‌ها:
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>✅ سرویس‌های فعال: {serviceStatus.serviceCount || 0}</div>
                    <div>🆔 شناسه جلسه: {serviceStatus.sessionId?.slice(-8) || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced progress indicator */}
            <div className="mt-8 w-80 mx-auto">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Help text */}
          <div className="mt-10 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>🔄 راه‌اندازی سرویس‌های پس‌زمینه</div>
            <div>در صورت طولانی شدن فرآیند، صفحه را رفرش کنید</div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error screen with better UX
  if (loadingError && !initializationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-red-900/20 flex items-center justify-center">
        <div className="text-center p-8 max-w-lg mx-auto">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-semibold text-red-800 dark:text-red-200 mb-4">
            خطا در راه‌اندازی سیستم
          </h2>
          <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg mb-6 backdrop-blur-sm">
            <p className="text-red-700 dark:text-red-300 text-sm mb-2 font-medium">
              جزئیات خطا:
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm font-mono bg-red-50 dark:bg-red-900/30 p-2 rounded">
              {loadingError}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              🔄 تلاش مجدد
            </button>
            
            <button
              onClick={() => {
                // Try to continue anyway
                setLoadingError(null);
                setInitializationComplete(true);
                setIsLoading(false);
              }}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              ⚡ ادامه بدون سرویس‌ها
            </button>
          </div>
          
          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            💡 اگر مشکل ادامه دارد، کنسول مرورگر را بررسی کنید
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ConfigProvider>
          <NotificationProvider>
            <Router basename="/Aihoghoghi">
              <ErrorBoundary>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-vazir" dir="rtl">
                  {/* Service initialization warning banner */}
                  {loadingError && initializationComplete && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
                      <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center">
                          <div className="text-yellow-600 dark:text-yellow-400 ml-3">⚠️</div>
                          <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              برخی سرویس‌ها با مشکل مواجه شدند
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                              عملکرد ممکن است محدود باشد. برای رفع مشکل صفحه را رفرش کنید.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setLoadingError(null)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 text-sm font-medium"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                  <EnhancedSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                  
                  <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-64' : 'lg:mr-16'} pt-16`}>
                    <div className="p-6">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/process" element={<DocumentProcessing />} />
                        <Route path="/proxy" element={<ProxyDashboard />} />
                        <Route path="/search" element={<EnhancedSearchDatabase />} />
                        <Route path="/scraping" element={<ScrapingDashboard />} />
                        <Route path="/ai-analysis" element={<AIAnalysisDashboard />} />
                        <Route path="/ai-test" element={<AITestComponent />} />
                        <Route path="/database" element={<EnhancedSearchDatabase />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </div>
                  </main>

                  <Toaster
                    position="top-left"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        direction: 'rtl',
                        fontFamily: 'Vazirmatn, sans-serif',
                      },
                      success: {
                        iconTheme: {
                          primary: '#10b981',
                          secondary: '#ffffff',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#ffffff',
                        },
                      },
                    }}
                  />
                  
                  {/* Development diagnostics component */}
                  {import.meta.env.DEV && <StartupDiagnostics />}
                </div>
              </ErrorBoundary>
            </Router>
          </NotificationProvider>
        </ConfigProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;