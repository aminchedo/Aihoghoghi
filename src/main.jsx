import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

// Auto-startup services will be loaded dynamically

// Enhanced initialization for GitHub Pages
console.log('🚀 Iranian Legal Archive - Enhanced Startup');
console.log('📍 Environment:', window.iranianLegalArchive?.isGitHubPages ? 'GitHub Pages' : 'Local Development');

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

// Wait for auto-startup services to be ready, then render
const waitForServices = async () => {
  let attempts = 0;
  const maxAttempts = 20;
  
  while (attempts < maxAttempts) {
    if (window.iranianLegalArchive?.servicesReady || attempts > 10) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
    attempts++;
  }
  
  console.log(`⏳ Waited ${attempts * 250}ms for services`);
  renderApp();
};

// Start the enhanced initialization
waitForServices();