import React, { createContext, useContext, useReducer, useEffect } from 'react'

const SystemContext = createContext()

const initialState = {
  user: null,
  isAuthenticated: false,
  systemStatus: 'online',
  notifications: [],
  theme: 'light',
  language: 'fa',
  documents: [],
  searchHistory: [],
  aiModels: [],
  proxySettings: {
    enabled: false,
    servers: [],
    currentServer: null
  }
}

const systemReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload }
    case 'SET_SYSTEM_STATUS':
      return { ...state, systemStatus: action.payload }
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] }
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload }
    case 'ADD_SEARCH_HISTORY':
      return { ...state, searchHistory: [action.payload, ...state.searchHistory.slice(0, 49)] }
    case 'SET_AI_MODELS':
      return { ...state, aiModels: action.payload }
    case 'UPDATE_PROXY_SETTINGS':
      return { ...state, proxySettings: { ...state.proxySettings, ...action.payload } }
    default:
      return state
  }
}

export const SystemContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(systemReducer, initialState)

  useEffect(() => {
    // Load user preferences from localStorage
    const savedTheme = localStorage.getItem('theme')
    const savedLanguage = localStorage.getItem('language')
    
    if (savedTheme) dispatch({ type: 'SET_THEME', payload: savedTheme })
    if (savedLanguage) dispatch({ type: 'SET_LANGUAGE', payload: savedLanguage })
  }, [])

  const value = {
    ...state,
    dispatch,
    login: (userData) => dispatch({ type: 'SET_USER', payload: userData }),
    logout: () => dispatch({ type: 'SET_USER', payload: null }),
    addNotification: (notification) => dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    setTheme: (theme) => {
      localStorage.setItem('theme', theme)
      dispatch({ type: 'SET_THEME', payload: theme })
    },
    setLanguage: (language) => {
      localStorage.setItem('language', language)
      dispatch({ type: 'SET_LANGUAGE', payload: language })
    }
  }

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  )
}

export const useSystemContext = () => {
  const context = useContext(SystemContext)
  if (!context) {
    throw new Error('useSystemContext must be used within a SystemContextProvider')
  }
  return context
}