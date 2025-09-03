import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// CRITICAL: Complete Service Worker Shutdown for GitHub Pages
console.log('🚫 Disabling Service Workers for GitHub Pages...')

// Method 1: Unregister all existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister().then(function(success) {
        if (success) {
          console.log('✅ Service Worker unregistered successfully:', registration.scope)
        }
      })
    }
  }).catch(function(error) {
    console.log('Service Worker unregistration failed:', error)
  })
}

// Method 2: Clear all caches
if ('caches' in window) {
  caches.keys().then(function(names) {
    names.forEach(function(name) {
      caches.delete(name).then(function(success) {
        if (success) {
          console.log('✅ Cache deleted:', name)
        }
      })
    })
  })
}

// Method 3: Prevent new service worker registration
if ('serviceWorker' in navigator) {
  // Override the register method to prevent future registrations
  const originalRegister = navigator.serviceWorker.register
  navigator.serviceWorker.register = function() {
    console.log('🚫 Service Worker registration blocked for GitHub Pages')
    return Promise.reject(new Error('Service Worker registration disabled for GitHub Pages'))
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)