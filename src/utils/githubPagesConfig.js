/**
 * GitHub Pages Configuration Utility
 * Handles environment-specific configuration for GitHub Pages deployment
 */

import { ENVIRONMENT } from '../config/apiEndpoints'

/**
 * Check if running on GitHub Pages
 */
export const isGitHubPages = () => {
  return ENVIRONMENT.isGitHubPages()
}

/**
 * Get GitHub Pages specific configuration
 */
export const getGitHubPagesConfig = () => {
  if (!isGitHubPages()) {
    return null
  }

  return {
    // Use HTTPS and production endpoints for GitHub Pages
    API_ENDPOINTS: {
      BASE: 'https://your-backend-domain.com/api',
      WEB_SOCKET: 'wss://your-backend-domain.com/ws'
    },
    
    // Disable WebSocket auto-connection on GitHub Pages
    // since the backend might not be available
    disableWebSocket: true,
    
    // Use polling fallback for real-time updates
    usePollingFallback: true,
    
    // GitHub Pages specific settings
    deployment: {
      platform: 'github-pages',
      domain: window.location.hostname,
      protocol: 'https'
    }
  }
}

/**
 * Initialize GitHub Pages specific settings
 */
export const initializeGitHubPagesConfig = () => {
  if (!isGitHubPages()) {
    return
  }

  console.log('📦 Initializing GitHub Pages configuration...')
  
  const config = getGitHubPagesConfig()
  
  if (config) {
    // Override global configuration
    window.API_ENDPOINTS = config.API_ENDPOINTS
    
    // Set GitHub Pages specific flags
    window.GITHUB_PAGES_CONFIG = config
    
    console.log('✅ GitHub Pages configuration initialized:', config)
  }
}

/**
 * Check if WebSocket should be disabled
 */
export const shouldDisableWebSocket = () => {
  const config = getGitHubPagesConfig()
  return config?.disableWebSocket || false
}

/**
 * Check if polling fallback should be used
 */
export const shouldUsePollingFallback = () => {
  const config = getGitHubPagesConfig()
  return config?.usePollingFallback || false
}

/**
 * Get deployment information
 */
export const getDeploymentInfo = () => {
  if (isGitHubPages()) {
    return {
      platform: 'github-pages',
      domain: window.location.hostname,
      protocol: 'https',
      environment: 'production'
    }
  }
  
  return {
    platform: 'local',
    domain: window.location.hostname,
    protocol: window.location.protocol.replace(':', ''),
    environment: ENVIRONMENT.isDevelopment() ? 'development' : 'production'
  }
}

export default {
  isGitHubPages,
  getGitHubPagesConfig,
  initializeGitHubPagesConfig,
  shouldDisableWebSocket,
  shouldUsePollingFallback,
  getDeploymentInfo
}