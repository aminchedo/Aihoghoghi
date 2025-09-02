import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

// Import autoStartupService to ensure it's loaded
import './services/autoStartupService.js';

// Enhanced initialization for GitHub Pages
console.log('🚀 Iranian Legal Archive - Enhanced Startup');
console.log('📍 Environment:', window.location.hostname.includes('github.io') ? 'GitHub Pages' : 'Local Development');

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Enhanced render with error boundary
const renderApp = () => {
  try {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ React app rendered successfully');
    
    // Notify auto-startup service that React is ready
    if (window.autoStartupService) {
      window.autoStartupService.log('✅ React application loaded and rendered');
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

// Modern Promise-based initialization
const initializeAndRender = async () => {
  try {
    console.log('⏳ Waiting for services to initialize...');
    
    // Wait for autoStartupService to be available
    let serviceWaitAttempts = 0;
    while (!window.autoStartupService && serviceWaitAttempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      serviceWaitAttempts++;
    }
    
    if (!window.autoStartupService) {
      console.warn('⚠️ AutoStartupService not available, rendering app anyway');
      renderApp();
      return;
    }
    
    // Use the Promise-based initialization API
    const startTime = Date.now();
    await window.autoStartupService.getInitializationPromise();
    const initTime = Date.now() - startTime;
    
    console.log(`✅ Services initialized successfully in ${initTime}ms`);
    renderApp();
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    
    // Render app anyway with error state
    renderApp();
    
    // Dispatch error event for React components to handle
    window.dispatchEvent(new CustomEvent('servicesInitializationError', {
      detail: { error: error.message, timestamp: new Date().toISOString() }
    }));
  }
};

// Start the enhanced initialization
initializeAndRender();