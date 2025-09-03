import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Components
import Header from './components/layout/Header';
import EnhancedSidebar from './components/layout/EnhancedSidebar';
import Dashboard from './components/pages/Dashboard';
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

// Create a client with optimized settings for GitHub Pages
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduce retries for faster loading
      retryDelay: 1000,
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst', // Work offline-first
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start with false for immediate render
  const [loadingError, setLoadingError] = useState(null);
  const [servicesReady, setServicesReady] = useState(false);

  useEffect(() => {
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
      console.log('🌐 GitHub Pages mode - lightweight initialization');
      setIsLoading(false);
      
      // Listen for background services to become ready
      const handleServicesReady = () => {
        setServicesReady(true);
        console.log('✅ Background services are now ready');
      };
      
      window.addEventListener('servicesReady', handleServicesReady);
      
      return () => {
        window.removeEventListener('servicesReady', handleServicesReady);
      };
    } else {
      // Local development - use normal initialization
      setIsLoading(true);
      
      const timer = setTimeout(() => {
        setIsLoading(false);
        console.log('⏰ Loading timeout - rendering app anyway');
      }, 3000);
      
      // Listen for service initialization
      const handleServicesReady = () => {
        clearTimeout(timer);
        setIsLoading(false);
        setServicesReady(true);
      };
      
      window.addEventListener('servicesReady', handleServicesReady);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('servicesReady', handleServicesReady);
      };
    }
  }, []);

  // Handle route restoration for GitHub Pages SPA
  useEffect(() => {
    const intendedPath = sessionStorage.getItem('intended_path');
    if (intendedPath) {
      sessionStorage.removeItem('intended_path');
      const routePath = intendedPath.replace('/Aihoghoghi', '');
      if (routePath && routePath !== '/') {
        window.history.replaceState(null, '', routePath);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner message="در حال بارگذاری سیستم..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ConfigProvider>
            <NotificationProvider>
              <Router basename="/Aihoghoghi">
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
                  <EnhancedSidebar 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)}
                    servicesReady={servicesReady}
                  />
                  
                  <div className="flex-1 flex flex-col">
                    <Header 
                      onMenuClick={() => setSidebarOpen(true)}
                      servicesReady={servicesReady}
                    />
                    
                    <main className="flex-1 overflow-auto">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard servicesReady={servicesReady} />} />
                        <Route path="/search" element={<EnhancedSearchDatabase servicesReady={servicesReady} />} />
                        <Route path="/scraping" element={<ScrapingDashboard servicesReady={servicesReady} />} />
                        <Route path="/ai-analysis" element={<AIAnalysisDashboard servicesReady={servicesReady} />} />
                        <Route path="/settings" element={<Settings servicesReady={servicesReady} />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>
                  </div>
                </div>
                
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                      fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif',
                      direction: 'rtl',
                    },
                  }}
                />
              </Router>
            </NotificationProvider>
          </ConfigProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;