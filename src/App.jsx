import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import DocumentProcessing from './components/pages/DocumentProcessing';
import ProxyDashboard from './components/pages/ProxyDashboard';
import SearchDatabase from './components/pages/SearchDatabase';
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

  useEffect(() => {
    // Initialize application
    const initializeApp = async () => {
      try {
        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ConfigProvider>
          <NotificationProvider>
            <Router>
              <ErrorBoundary>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-vazir" dir="rtl">
                  <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                  <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                  
                  <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-64' : 'lg:mr-16'} pt-16`}>
                    <div className="p-6">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/process" element={<DocumentProcessing />} />
                        <Route path="/proxy" element={<ProxyDashboard />} />
                        <Route path="/search" element={<SearchDatabase />} />
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