import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css';

// Import system integration service to ensure it's loaded
import './services/systemIntegration.js';

// Get base path from environment
const basename = import.meta.env.MODE === 'production' ? '/Aihoghoghi' : '/';

// Enhanced initialization for GitHub Pages
console.log('🚀 Iranian Legal Archive - Enhanced Startup');
console.log('📍 Environment:', window.location.hostname.includes('github.io') ? 'GitHub Pages' : 'Local Development');
console.log('🔧 Router basename:', basename);

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Enhanced render with error boundary
const renderApp = () => {
  try {
    root.render(
      <React.StrictMode>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    
    console.log('✅ React app rendered successfully with basename:', basename);
    
    // Notify system integration that React is ready
    if (window.iranianLegalArchive?.systemIntegration) {
      console.log('✅ React application loaded and rendered');
    }
    
  } catch (error) {
    console.error('❌ Failed to render React app:', error);
    
    // Fallback UI
    document.getElementById('root').innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: 'Vazirmatn', sans-serif;
        direction: rtl;
        text-align: center;
        padding: 2rem;
      ">
        <div>
          <div style="font-size: 4rem; margin-bottom: 1rem;">⚖️</div>
          <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">سیستم آرشیو اسناد حقوقی ایران</h1>
          <p style="margin-bottom: 2rem; opacity: 0.9;">خطا در بارگذاری اپلیکیشن</p>
          <button onclick="window.location.reload()" style="
            padding: 1rem 2rem;
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 10px;
            color: white;
            cursor: pointer;
            font-weight: 500;
            font-size: 1rem;
          ">🔄 رفرش صفحه</button>
        </div>
      </div>
    `;
  }
};

// Modern Promise-based initialization with immediate render
const initializeAndRender = async () => {
  try {
    console.log('⏳ Starting app initialization...');
    
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // CRITICAL FIX: Always render app immediately to prevent loading freeze
    console.log('🚀 Rendering app immediately to prevent loading freeze');
    renderApp();
    
    if (isGitHubPages) {
      console.log('🌐 GitHub Pages detected - initializing services in background');
      // Initialize services in background after render (non-blocking)
      setTimeout(() => {
        initializeServicesInBackground();
      }, 100);
    } else {
      // For local development, also initialize in background
      setTimeout(() => {
        initializeServicesWithTimeout().catch(error => {
          console.warn('⚠️ Background service initialization failed:', error.message);
        });
      }, 500);
    }
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    renderApp();
  }
};

// Initialize services with timeout for local development
const initializeServicesWithTimeout = async () => {
  // Wait for system integration service to be available (max 2 seconds)
  let serviceWaitAttempts = 0;
  while (!window.iranianLegalArchive?.systemIntegration && serviceWaitAttempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 100));
    serviceWaitAttempts++;
  }
  
  if (window.iranianLegalArchive?.systemIntegration) {
    const startTime = Date.now();
    await window.iranianLegalArchive.systemIntegration.initialize();
    const initTime = Date.now() - startTime;
    console.log(`✅ System integrated in ${initTime}ms`);
  }
};

// Initialize services in background for GitHub Pages
const initializeServicesInBackground = async () => {
  try {
    console.log('🔄 Initializing services in background...');
    
    // Wait for system integration service (non-blocking)
    let attempts = 0;
    while (!window.iranianLegalArchive?.systemIntegration && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (window.iranianLegalArchive?.systemIntegration) {
      await window.iranianLegalArchive.systemIntegration.initialize();
      console.log('✅ Background services initialized');
      
      // Notify React components that services are ready
      window.dispatchEvent(new CustomEvent('servicesReady', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
  } catch (error) {
    console.warn('⚠️ Background service initialization failed:', error);
    // App continues to work without full services
  }
};

// Start the enhanced initialization
initializeAndRender();