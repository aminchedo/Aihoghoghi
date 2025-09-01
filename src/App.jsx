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

// Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { NotificationProvider } from './contexts/NotificationContext';

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

  useEffect(() => {
    // Initialize application with auto-startup integration
    const initializeApp = async () => {
      const startTime = Date.now();
      
      try {
        console.log('🚀 Initializing Iranian Legal Archive System...');
        console.log('🔗 Connecting to auto-startup services...');
        
        // Wait for auto-startup service to be ready
        let attempts = 0;
        while (!window.autoStartupService && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        if (window.autoStartupService) {
          console.log('✅ Auto-startup service connected');
          
          // Get navigation guidance for returning users
          const guidance = window.autoStartupService.getNavigationGuidance();
          console.log('🧭 Navigation guidance:', guidance);
          
          // Start background scraping if enabled
          if (window.iranianLegalArchive?.features?.autoScraping) {
            console.log('🔄 Starting background scraping...');
            setTimeout(() => {
              window.autoStartupService.startBackgroundScraping();
            }, 5000);
          }
        } else {
          console.warn('⚠️ Auto-startup service not available, continuing with basic initialization');
        }
        
        // Clear any existing HTML loading screen immediately
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
        
        // Ensure DOM is ready
        if (document.readyState !== 'complete') {
          await new Promise(resolve => {
            if (document.readyState === 'complete') {
              resolve();
            } else {
              window.addEventListener('load', resolve, { once: true });
            }
          });
        }
        
        // Minimum loading time for smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const loadTime = Date.now() - startTime;
        console.log(`✅ App initialized successfully in ${loadTime}ms`);
        console.log('🎯 Current location:', window.location.href);
        console.log('🎯 Base URL:', import.meta.env.BASE_URL);
        setInitializationComplete(true);
        
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setLoadingError(error.message);
        // Still allow app to load even if initialization fails
        setInitializationComplete(true);
      } finally {
        // Always set loading to false to prevent infinite loading
        setTimeout(() => setIsLoading(false), 100);
      }
    };

    initializeApp();
    
    // Failsafe: Force app to load after 3 seconds maximum
    const failsafeTimeout = setTimeout(() => {
      console.warn('⚠️ Failsafe timeout reached, forcing app display');
      setIsLoading(false);
      setInitializationComplete(true);
    }, 3000);

    return () => {
      clearTimeout(failsafeTimeout);
    };
  }, []);

  // Loading screen with timeout fallback
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            {/* Modern animated loading spinner */}
            <div className="w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
            </div>
            
            {/* Loading text with animation */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white animate-pulse">
                🏛️ سیستم آرشیو اسناد حقوقی ایران
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
                در حال بارگذاری...
              </p>
            </div>
            
            {/* Progress indicator */}
            <div className="mt-6 w-64 mx-auto">
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Fallback message after 5 seconds */}
          <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
            در صورت طولانی شدن بارگذاری، صفحه را رفرش کنید
          </div>
        </div>
      </div>
    );
  }

  // Error screen if initialization failed
  if (loadingError && !initializationComplete) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            خطا در بارگذاری
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">
            {loadingError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ConfigProvider>
          <NotificationProvider>
            <Router basename={import.meta.env.BASE_URL}>
              <ErrorBoundary>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-vazir" dir="rtl">
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