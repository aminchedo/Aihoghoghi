/**
 * Iranian Legal Archive System - Enhanced JavaScript v2.0
 * Advanced UI interactions, API integration, real-time updates, and data visualization
 * Features: WebSocket support, Chart.js integration, Advanced navigation, Dark mode, RTL support
 */

// Enhanced Global State Management
const AppState = {
    // Core State
    isProcessing: false,
    currentSection: 'home',
    currentSubsection: null,
    theme: localStorage.getItem('theme') || 'light',
    
    // Data State
    searchTerm: '',
    documents: [],
    processedDocuments: [],
    systemStats: {},
    proxyStats: {},
    
    // UI State
    sidebarCollapsed: false,
    activeTab: 'manual',
    tableFilters: {
        search: '',
        status: '',
        source: ''
    },
    tablePagination: {
        page: 1,
        pageSize: 20,
        total: 0
    },
    
    // Charts and Visualization
    charts: {},
    chartData: {
        operations: [],
        performance: [],
        categories: {}
    },
    
    // Real-time Communication
    websocket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectInterval: null,
    
    // API Management
    apiRetryAttempts: 0,
    maxApiRetryAttempts: 3,
    backendStatus: 'unknown',
    lastApiCall: null,
    
    // Processing State
    processingQueue: [],
    processingStats: {
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        remaining: 0
    },
    
    // Configuration
    config: {
        apiBaseUrl: localStorage.getItem('apiBaseUrl') || '',
        proxyEnabled: true,
        batchSize: 3,
        retryCount: 2,
        autoRefresh: true,
        refreshInterval: 30000
    }
};

// API Base URL - configurable for different environments
const API_BASE = (() => {
    // Check if we're in development mode or if a custom API URL is set
    const customApiUrl = localStorage.getItem('apiBaseUrl');
    if (customApiUrl) {
        return customApiUrl;
    }
    
    // Default to current origin with /api prefix
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://127.0.0.1:7860/api';
    }
    
    return window.location.origin + '/api';
})();

console.log('API Base URL:', API_BASE);

// Utility Functions
class Utils {
    static async fetchAPI(endpoint, options = {}, retryCount = 0) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                timeout: 30000, // 30 second timeout
                ...options
            });
            
            if (!response.ok) {
                let errorMessage = `خطای ${response.status}`;
                
                // Provide user-friendly error messages
                switch (response.status) {
                    case 404:
                        errorMessage = 'آدرس API یافت نشد - لطفاً از اجرای صحیح سرور اطمینان حاصل کنید';
                        break;
                    case 500:
                        errorMessage = 'خطای داخلی سرور - لطفاً مجدداً تلاش کنید';
                        break;
                    case 503:
                        errorMessage = 'سرویس در دسترس نیست - سیستم در حال راه‌اندازی است';
                        break;
                    case 409:
                        errorMessage = 'عملیات دیگری در حال انجام است - لطفاً منتظر بمانید';
                        break;
                    case 400:
                        errorMessage = 'درخواست نامعتبر - لطفاً اطلاعات ورودی را بررسی کنید';
                        break;
                    default:
                        errorMessage = `خطای ${response.status}: ${response.statusText}`;
                }
                
                AppState.backendStatus = 'error';
                this.updateBackendStatus('error');
                throw new Error(errorMessage);
            }
            
            // Success - update backend status
            AppState.backendStatus = 'connected';
            AppState.apiRetryAttempts = 0;
            this.updateBackendStatus('connected');
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            AppState.backendStatus = 'error';
            this.updateBackendStatus('error');
            
            // Check if it's a network error and retry
            if (error.name === 'TypeError' && error.message.includes('fetch') && retryCount < AppState.maxApiRetryAttempts) {
                this.showToast(`اتصال ناموفق - تلاش مجدد ${retryCount + 1}/${AppState.maxApiRetryAttempts}`, 'warning', 3000);
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
                return this.fetchAPI(endpoint, options, retryCount + 1);
            }
            
            // Final error handling
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showToast('خطا در اتصال به سرور - لطفاً اتصال اینترنت و وضعیت سرور را بررسی کنید', 'error', 10000);
                this.showBackendInstructions();
            } else {
                this.showToast(error.message, 'error', 8000);
            }
            
            throw error;
        }
    }

    static async checkServerHealth() {
        try {
            const response = await fetch(`${API_BASE}/status`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });
            
            if (response.ok) {
                console.log('✅ Server is healthy');
                return true;
            } else {
                console.warn('⚠️ Server responded but with error:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Server health check failed:', error);
            this.showToast('سرور در دسترس نیست. لطفاً بررسی کنید که سرور FastAPI در حال اجرا باشد.', 'error', 10000);
            return false;
        }
    }

    static updateBackendStatus(status) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (statusIndicator && statusText) {
            switch (status) {
                case 'connected':
                    statusIndicator.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse';
                    statusText.textContent = 'متصل';
                    break;
                case 'error':
                    statusIndicator.className = 'w-3 h-3 bg-red-500 rounded-full animate-pulse';
                    statusText.textContent = 'خطا';
                    break;
                case 'connecting':
                    statusIndicator.className = 'w-3 h-3 bg-yellow-500 rounded-full animate-pulse';
                    statusText.textContent = 'در حال اتصال';
                    break;
                default:
                    statusIndicator.className = 'w-3 h-3 bg-gray-500 rounded-full';
                    statusText.textContent = 'نامشخص';
            }
        }
    }

    static showBackendInstructions() {
        const instructionsHtml = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 class="text-red-800 font-bold mb-2">🚨 سرور در دسترس نیست</h3>
                <p class="text-red-700 mb-3">برای حل مشکل، مراحل زیر را دنبال کنید:</p>
                <ol class="list-decimal list-inside text-red-700 space-y-1 text-sm">
                    <li>اطمینان از اجرای سرور: <code class="bg-red-100 px-2 py-1 rounded">uvicorn web_server:app --reload --host 0.0.0.0 --port 7860</code></li>
                    <li>بررسی اتصال اینترنت</li>
                    <li>بررسی آدرس سرور: <code class="bg-red-100 px-2 py-1 rounded">http://127.0.0.1:7860</code></li>
                    <li>بررسی فایروال و تنظیمات امنیتی</li>
                    <li>مراجعه به لاگ‌های سرور برای جزئیات بیشتر</li>
                </ol>
                <button onclick="location.reload()" class="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    🔄 تلاش مجدد
                </button>
            </div>
        `;
        
        // Show instructions in the main content area
        const mainContent = document.querySelector('main') || document.body;
        const existingInstructions = document.getElementById('backend-instructions');
        
        if (!existingInstructions) {
            const instructionsDiv = document.createElement('div');
            instructionsDiv.id = 'backend-instructions';
            instructionsDiv.innerHTML = instructionsHtml;
            mainContent.insertBefore(instructionsDiv, mainContent.firstChild);
        }
    }

    static showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.className = `toast ${type} animate-slide-up`;
        toast.innerHTML = `
            <div class="flex items-center space-x-3 space-x-reverse">
                <span class="text-lg">${icons[type] || icons.info}</span>
                <span class="flex-1">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                    ✕
                </button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    static formatDate(date) {
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        }).format(date);
    }

    static formatTime(date) {
        return new Intl.DateTimeFormat('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static validateURL(url) {
        try {
            new URL(url);
            return url.startsWith('http://') || url.startsWith('https://');
        } catch {
            return false;
        }
    }

    static truncateText(text, maxLength = 200) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('کپی شد', 'success', 2000);
        }).catch(() => {
            this.showToast('خطا در کپی کردن', 'error');
        });
    }

    static downloadFile(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    static extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return '';
        }
    }

    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Enhanced Navigation Manager
class NavigationManager {
    static init() {
        this.setupSidebarToggle();
        this.setupNavigation();
        this.setupSubmenuHandlers();
        this.setupBreadcrumbs();
        this.setupKeyboardShortcuts();
    }

    static setupSidebarToggle() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');

        if (sidebarToggle && sidebar && mainContent) {
            sidebarToggle.addEventListener('click', () => {
                AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
                
                if (AppState.sidebarCollapsed) {
                    sidebar.classList.add('-translate-x-full');
                    mainContent.classList.remove('mr-64');
                    mainContent.classList.add('mr-0');
                } else {
                    sidebar.classList.remove('-translate-x-full');
                    mainContent.classList.add('mr-64');
                    mainContent.classList.remove('mr-0');
                }
            });
        }
    }

    static setupNavigation() {
        // Main navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                const sectionName = href.replace('#', '');
                this.navigateToSection(sectionName);
            });
        });

        // Submenu links
        document.querySelectorAll('.nav-sublink').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                const subsectionName = href.replace('#', '');
                this.navigateToSubsection(subsectionName);
            });
        });
    }

    static setupSubmenuHandlers() {
        document.querySelectorAll('.nav-group > .nav-link').forEach(groupLink => {
            groupLink.addEventListener('click', (e) => {
                const group = groupLink.parentElement;
                const submenu = group.querySelector('.nav-submenu');
                const arrow = groupLink.querySelector('i[id$="-arrow"]');
                
                if (submenu && arrow) {
                    const isOpen = !submenu.classList.contains('hidden');
                    
                    // Close all other submenus
                    document.querySelectorAll('.nav-submenu').forEach(menu => {
                        if (menu !== submenu) {
                            menu.classList.add('hidden');
                        }
                    });
                    
                    document.querySelectorAll('i[id$="-arrow"]').forEach(arr => {
                        if (arr !== arrow) {
                            arr.classList.remove('rotate-90');
                        }
                    });
                    
                    // Toggle current submenu
                    if (isOpen) {
                        submenu.classList.add('hidden');
                        arrow.classList.remove('rotate-90');
                    } else {
                        submenu.classList.remove('hidden');
                        arrow.classList.add('rotate-90');
                    }
                }
            });
        });
    }

    static setupBreadcrumbs() {
        this.updateBreadcrumbs();
    }

    static setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateToSection('home');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateToSection('process');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateToSection('proxy');
                        break;
                    case '4':
                        e.preventDefault();
                        this.navigateToSection('search');
                        break;
                    case '5':
                        e.preventDefault();
                        this.navigateToSection('settings');
                        break;
                }
            }
        });
    }

    static navigateToSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
            AppState.currentSection = sectionName;
        }
        
        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            link.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow-lg');
            link.classList.add('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        });
        
        const activeLink = document.querySelector(`[href="#${sectionName}"]`);
        if (activeLink && !activeLink.closest('.nav-submenu')) {
            activeLink.classList.add('active');
            activeLink.classList.add('bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow-lg');
            activeLink.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        }
        
        this.updateBreadcrumbs();
        this.onSectionChange(sectionName);
    }

    static navigateToSubsection(subsectionName) {
        AppState.currentSubsection = subsectionName;
        this.updateBreadcrumbs();
        
        // Handle specific subsection logic
        if (subsectionName.startsWith('process-')) {
            this.navigateToSection('process');
        } else if (subsectionName.startsWith('proxy-')) {
            this.navigateToSection('proxy');
        } else if (subsectionName.startsWith('search-')) {
            this.navigateToSection('search');
        } else if (subsectionName.startsWith('settings-')) {
            this.navigateToSection('settings');
        }
    }

    static updateBreadcrumbs() {
        const breadcrumb = document.getElementById('breadcrumb');
        const breadcrumbPath = document.getElementById('breadcrumb-path');
        
        if (!breadcrumb || !breadcrumbPath) return;
        
        const sectionNames = {
            'home': 'داشبورد اصلی',
            'process': 'پردازش اسناد',
            'proxy': 'داشبورد پروکسی',
            'search': 'پایگاه داده حقوقی',
            'settings': 'تنظیمات',
            'logs': 'گزارش‌ها'
        };
        
        let pathText = sectionNames[AppState.currentSection] || 'خانه';
        breadcrumbPath.textContent = pathText;
        
        if (AppState.currentSection !== 'home') {
            breadcrumb.classList.remove('hidden');
        } else {
            breadcrumb.classList.add('hidden');
        }
    }

    static onSectionChange(sectionName) {
        // Initialize section-specific functionality
        switch (sectionName) {
            case 'home':
                if (typeof DashboardManager !== 'undefined') DashboardManager.init();
                break;
            case 'process':
                if (typeof DocumentProcessor !== 'undefined') DocumentProcessor.init();
                break;
        }
    }
}

// Tab Management System
class TabManager {
    static init() {
        this.setupTabHandlers();
    }

    static setupTabHandlers() {
        // Document processing tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.id;
                
                if (tabId === 'manual-tab') {
                    this.switchTab('manual');
                } else if (tabId === 'file-tab') {
                    this.switchTab('file');
                } else if (tabId === 'bulk-tab') {
                    this.switchTab('bulk');
                }
            });
        });
    }

    static switchTab(tabName) {
        AppState.activeTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active', 'border-primary-500', 'text-primary-600');
            button.classList.add('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Show active tab
        const activeButton = document.getElementById(`${tabName}-tab`);
        const activeContent = document.getElementById(`${tabName}-input`) || document.getElementById(`${tabName}-input-tab`);
        
        if (activeButton) {
            activeButton.classList.add('active', 'border-primary-500', 'text-primary-600');
            activeButton.classList.remove('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
        }
        
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
        
        // Handle specific tab logic
        switch (tabName) {
            case 'manual':
                document.getElementById('manual-input')?.classList.remove('hidden');
                break;
            case 'file':
                document.getElementById('file-input-tab')?.classList.remove('hidden');
                break;
            case 'bulk':
                document.getElementById('bulk-input-tab')?.classList.remove('hidden');
                break;
        }
    }
}

// WebSocket Management
class WebSocketManager {
    static init() {
        this.connect();
    }

    static connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            AppState.websocket = new WebSocket(wsUrl);
            
            AppState.websocket.onopen = () => {
                console.log('🔌 WebSocket connected');
                AppState.reconnectAttempts = 0;
                Utils.showToast('اتصال برقرار شد', 'success', 2000);
            };
            
            AppState.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
            
            AppState.websocket.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.handleDisconnect();
            };
            
            AppState.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                Utils.showToast('خطا در اتصال بلادرنگ', 'warning', 3000);
            };
            
        } catch (error) {
            console.error('Failed to establish WebSocket connection:', error);
        }
    }

    static handleMessage(data) {
        switch (data.type) {
            case 'progress_update':
                SystemMonitor.updateProgress(data.progress, data.message);
                AppState.isProcessing = data.is_processing;
                break;
                
            case 'processing_complete':
                SystemMonitor.updateProgress(1.0, data.message);
                AppState.isProcessing = false;
                SystemMonitor.showProgressSection(false);
                Utils.showToast('پردازش با موفقیت تکمیل شد', 'success');
                
                // Refresh documents and stats
                setTimeout(() => {
                    DocumentProcessor.loadProcessedDocuments();
                    SystemMonitor.updateStats();
                }, 1000);
                break;
                
            case 'processing_error':
                SystemMonitor.updateProgress(0, data.message);
                AppState.isProcessing = false;
                SystemMonitor.showProgressSection(false);
                Utils.showToast(data.message, 'error');
                break;
                
            case 'status_update':
                if (data.is_processing) {
                    SystemMonitor.updateProgress(data.progress, data.message);
                }
                break;
                
            case 'database_population_complete':
                SystemMonitor.updateProgress(1.0, data.message);
                AppState.isProcessing = false;
                SystemMonitor.showProgressSection(false);
                Utils.showToast('پایگاه داده حقوقی با موفقیت پر شد', 'success');
                
                // Refresh legal database stats
                if (AppState.currentSection === 'legal-db') {
                    setTimeout(() => {
                        loadLegalDatabaseStats();
                    }, 1000);
                }
                break;
                
            case 'database_population_error':
                SystemMonitor.updateProgress(0, data.message);
                AppState.isProcessing = false;
                SystemMonitor.showProgressSection(false);
                Utils.showToast(data.message, 'error');
                break;
                
            default:
                console.log('Unknown WebSocket message type:', data.type);
        }
    }

    static handleDisconnect() {
        if (AppState.reconnectAttempts < AppState.maxReconnectAttempts) {
            AppState.reconnectAttempts++;
            const delay = Math.pow(2, AppState.reconnectAttempts) * 1000; // Exponential backoff
            
            console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${AppState.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            Utils.showToast('اتصال بلادرنگ قطع شد', 'warning');
        }
    }

    static send(data) {
        if (AppState.websocket && AppState.websocket.readyState === WebSocket.OPEN) {
            AppState.websocket.send(JSON.stringify(data));
        }
    }
}

// Theme Management
class ThemeManager {
    static init() {
        this.applyTheme(AppState.theme);
        document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme.bind(this));
    }

    static toggleTheme() {
        AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(AppState.theme);
        localStorage.setItem('theme', AppState.theme);
    }

    static applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.getElementById('theme-icon');
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// Navigation Management
class NavigationManager {
    static init() {
        // Add click listeners to navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Sidebar toggle for mobile
        document.getElementById('sidebar-toggle').addEventListener('click', this.toggleSidebar);
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.getElementById('sidebar-toggle');
            
            if (window.innerWidth <= 1024 && 
                !sidebar.contains(e.target) && 
                !toggle.contains(e.target) && 
                sidebar.classList.contains('open')) {
                this.toggleSidebar();
            }
        });
    }

    static showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            AppState.currentSection = sectionName;
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionName}`) {
                link.classList.add('active');
            }
        });
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    static async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'home':
                await SystemMonitor.updateStats();
                await SystemMonitor.loadRecentLogs();
                break;
            case 'dashboard':
                await DashboardManager.loadCharts();
                break;
            case 'process':
                await DocumentProcessor.loadProcessedDocuments();
                break;
            case 'legal-db':
                await loadLegalDatabaseStats();
                break;
        }
    }

    static toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('sidebar-open');
    }
}

// System Monitoring
class SystemMonitor {
    static init() {
        this.updateClock();
        this.updateStats();
        
        // Update clock every second
        setInterval(this.updateClock, 1000);
        
        // Update stats every 30 seconds
        setInterval(this.updateStats.bind(this), 30000);
        
        // Check processing status every 2 seconds
        setInterval(this.checkProcessingStatus.bind(this), 2000);
    }

    static updateClock() {
        const now = new Date();
        document.getElementById('current-time').textContent = Utils.formatTime(now);
        document.getElementById('current-date').textContent = Utils.formatDate(now);
    }

    static async updateStats() {
        try {
            const stats = await Utils.fetchAPI('/stats');
            AppState.systemStats = stats;
            
            // Update dashboard cards
            document.getElementById('total-operations').textContent = stats.total_operations || 0;
            document.getElementById('successful-operations').textContent = stats.successful_operations || 0;
            document.getElementById('active-proxies').textContent = stats.active_proxies || 0;
            document.getElementById('cache-size').textContent = stats.cache_size || 0;
            
            // Update quick stats in sidebar
            document.getElementById('quick-proxy-count').textContent = stats.active_proxies || 0;
            document.getElementById('quick-cache-count').textContent = stats.cache_size || 0;
            document.getElementById('quick-success-count').textContent = stats.successful_operations || 0;
            
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    static async checkProcessingStatus() {
        try {
            const status = await Utils.fetchAPI('/status');
            
            if (status.is_processing !== AppState.isProcessing) {
                AppState.isProcessing = status.is_processing;
                this.updateStatusIndicator(status);
                
                if (status.is_processing) {
                    this.showProgressSection(true);
                    this.updateProgress(status.progress, status.message);
                } else {
                    this.showProgressSection(false);
                }
            } else if (status.is_processing) {
                this.updateProgress(status.progress, status.message);
            }
            
        } catch (error) {
            console.error('Failed to check processing status:', error);
        }
    }

    static updateStatusIndicator(status) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        if (status.is_processing) {
            indicator.className = 'w-3 h-3 bg-yellow-500 rounded-full animate-pulse';
            text.textContent = 'در حال پردازش';
        } else {
            indicator.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse';
            text.textContent = 'آماده';
        }
    }

    static showProgressSection(show) {
        const section = document.getElementById('progress-section');
        if (show) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    }

    static updateProgress(progress, message) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressPercentage = document.getElementById('progress-percentage');
        const currentOperation = document.getElementById('current-operation');
        
        const percentage = Math.round(progress * 100);
        
        progressBar.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
        progressText.textContent = message || 'در حال پردازش...';
        currentOperation.textContent = message || '';
    }

    static async loadRecentLogs() {
        try {
            const response = await Utils.fetchAPI('/logs?limit=10');
            const logsContainer = document.getElementById('recent-logs');
            
            if (response.logs && response.logs.length > 0) {
                logsContainer.innerHTML = response.logs.map(log => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex-1">
                            <span class="font-medium">${log.operation}</span>
                            <p class="text-sm text-gray-600">${log.message}</p>
                        </div>
                        <span class="text-xs text-gray-400">${log.timestamp}</span>
                    </div>
                `).join('');
            } else {
                logsContainer.innerHTML = '<p class="text-gray-500">هنوز فعالیتی ثبت نشده است</p>';
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    }
}

// Document Processing
class DocumentProcessor {
    static init() {
        // File input handler
        document.getElementById('file-input').addEventListener('change', this.handleFileUpload.bind(this));
        
        // Search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', Utils.debounce(this.filterDocuments.bind(this), 300));
        
        // Drag and drop for file upload
        this.initDragAndDrop();
    }

    static initDragAndDrop() {
        const dropZone = document.querySelector('.file-upload-area');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', this.handleFileDrop.bind(this), false);
    }

    static preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    static async handleFileDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await this.processFile(files[0]);
        }
    }

    static async handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            await this.processFile(file);
        }
    }

    static async processFile(file) {
        if (!file.name.match(/\.(txt|csv)$/i)) {
            Utils.showToast('فقط فایل‌های .txt و .csv پشتیبانی می‌شوند', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${API_BASE}/upload-urls`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Update URLs input
            document.getElementById('urls-input').value = result.urls.join('\n');
            
            // Show file info
            const fileInfo = document.getElementById('file-info');
            fileInfo.textContent = `✅ ${result.count} آدرس از فایل "${file.name}" بارگذاری شد`;
            fileInfo.classList.remove('hidden');
            
            Utils.showToast(`${result.count} آدرس با موفقیت بارگذاری شد`, 'success');
            
        } catch (error) {
            Utils.showToast(`خطا در بارگذاری فایل: ${error.message}`, 'error');
        }
    }

    static async processDocuments() {
        const urlsText = document.getElementById('urls-input').value.trim();
        const enableProxy = document.getElementById('enable-proxy').checked;
        const batchSize = parseInt(document.getElementById('batch-size').value);
        
        if (!urlsText) {
            Utils.showToast('لطفاً آدرس‌ها را وارد کنید', 'warning');
            return;
        }
        
        // Validate URLs
        const urls = urlsText.split('\n').map(url => url.trim()).filter(url => url);
        const invalidUrls = urls.filter(url => !Utils.validateURL(url));
        
        if (invalidUrls.length > 0) {
            Utils.showToast(`${invalidUrls.length} آدرس نامعتبر یافت شد`, 'warning');
        }
        
        const validUrls = urls.filter(url => Utils.validateURL(url));
        
        if (validUrls.length === 0) {
            Utils.showToast('هیچ آدرس معتبری یافت نشد', 'error');
            return;
        }
        
        if (validUrls.length > 100) {
            Utils.showToast('حداکثر 100 آدرس در هر بار پردازش مجاز است', 'error');
            return;
        }

        try {
            // Disable process button
            const processBtn = document.getElementById('process-btn');
            processBtn.disabled = true;
            processBtn.textContent = '⏳ در حال پردازش...';
            
            const response = await Utils.fetchAPI('/process-urls', {
                method: 'POST',
                body: JSON.stringify({
                    urls: validUrls,
                    enable_proxy: enableProxy,
                    batch_size: batchSize
                })
            });
            
            Utils.showToast(`پردازش ${validUrls.length} آدرس شروع شد`, 'success');
            
        } catch (error) {
            Utils.showToast(`خطا در شروع پردازش: ${error.message}`, 'error');
        } finally {
            // Re-enable process button after a delay
            setTimeout(() => {
                const processBtn = document.getElementById('process-btn');
                processBtn.disabled = false;
                processBtn.textContent = '⚡ شروع پردازش';
            }, 2000);
        }
    }

    static async loadProcessedDocuments() {
        try {
            const response = await Utils.fetchAPI('/processed-documents?limit=50');
            AppState.documents = response.documents || [];
            this.renderDocuments();
        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    }

    static renderDocuments() {
        const container = document.getElementById('documents-list');
        
        if (AppState.documents.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">هنوز سندی پردازش نشده است</p>';
            return;
        }
        
        let filteredDocs = AppState.documents;
        
        // Apply search filter
        if (AppState.searchTerm) {
            filteredDocs = AppState.documents.filter(doc => 
                doc.title?.toLowerCase().includes(AppState.searchTerm.toLowerCase()) ||
                doc.url?.toLowerCase().includes(AppState.searchTerm.toLowerCase()) ||
                doc.content?.toLowerCase().includes(AppState.searchTerm.toLowerCase())
            );
        }
        
        container.innerHTML = filteredDocs.map(doc => this.renderDocumentCard(doc)).join('');
    }

    static renderDocumentCard(doc) {
        const qualityClass = this.getQualityClass(doc.quality_score);
        const qualityText = this.getQualityText(doc.quality_score);
        
        return `
            <div class="document-card">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <h4 class="font-semibold text-lg mb-1">${doc.title || 'بدون عنوان'}</h4>
                        <p class="text-sm text-gray-500 break-all" dir="ltr">${doc.url}</p>
                    </div>
                    <span class="quality-badge ${qualityClass}">${qualityText}</span>
                </div>
                
                <div class="mb-3">
                    <p class="text-gray-600 text-sm leading-relaxed">
                        ${Utils.truncateText(doc.content || 'محتوا در دسترس نیست')}
                        ${doc.content && doc.content.length > 200 ? 
                            '<button onclick="toggleFullContent(this)" class="text-primary-500 hover:text-primary-600 mr-2">نمایش کامل</button>' : ''}
                    </p>
                </div>
                
                <div class="flex items-center justify-between text-sm text-gray-500">
                    <span>📊 تعداد کلمات: ${doc.word_count || 0}</span>
                    <span>🏷️ ${doc.classification || 'طبقه‌بندی نشده'}</span>
                </div>
                
                ${doc.content && doc.content.length > 200 ? 
                    `<div class="full-content hidden mt-3 p-3 bg-gray-50 rounded-lg">
                        <p class="text-sm leading-relaxed">${doc.content}</p>
                        <button onclick="toggleFullContent(this)" class="text-primary-500 hover:text-primary-600 mt-2">بستن</button>
                    </div>` : ''}
            </div>
        `;
    }

    static getQualityClass(score) {
        if (score >= 0.8) return 'quality-excellent';
        if (score >= 0.6) return 'quality-good';
        if (score >= 0.4) return 'quality-average';
        return 'quality-poor';
    }

    static getQualityText(score) {
        if (score >= 0.8) return 'عالی';
        if (score >= 0.6) return 'خوب';
        if (score >= 0.4) return 'متوسط';
        return 'ضعیف';
    }

    static filterDocuments() {
        AppState.searchTerm = document.getElementById('search-input').value;
        this.renderDocuments();
    }
}

// Dashboard Management
class DashboardManager {
    static async loadCharts() {
        try {
            // Load proxy chart
            await this.createProxyChart();
            
            // Load performance chart
            await this.createPerformanceChart();
            
        } catch (error) {
            console.error('Failed to load charts:', error);
        }
    }

    static async createProxyChart() {
        const ctx = document.getElementById('proxy-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (AppState.charts.proxyChart) {
            AppState.charts.proxyChart.destroy();
        }
        
        const stats = AppState.systemStats;
        
        AppState.charts.proxyChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['پروکسی فعال', 'پروکسی غیرفعال'],
                datasets: [{
                    data: [stats.active_proxies || 0, Math.max(0, 50 - (stats.active_proxies || 0))],
                    backgroundColor: [
                        '#10b981',
                        '#ef4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    }
                }
            }
        });
    }

    static async createPerformanceChart() {
        const ctx = document.getElementById('performance-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (AppState.charts.performanceChart) {
            AppState.charts.performanceChart.destroy();
        }
        
        const stats = AppState.systemStats;
        
        AppState.charts.performanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['کل عملیات', 'موفق', 'ناموفق'],
                datasets: [{
                    label: 'تعداد',
                    data: [
                        stats.total_operations || 0,
                        stats.successful_operations || 0,
                        stats.failed_operations || 0
                    ],
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#ef4444'
                    ],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Export Management
class ExportManager {
    static async exportDocuments(format) {
        try {
            Utils.showToast('در حال آماده‌سازی فایل خروجی...', 'info');
            
            const response = await fetch(`${API_BASE}/export/${format}`);
            
            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }
            
            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `legal_documents_${new Date().toISOString().slice(0, 10)}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            Utils.showToast(`فایل ${format.toUpperCase()} با موفقیت دانلود شد`, 'success');
            
            // Update export history
            this.updateExportHistory(format);
            
        } catch (error) {
            Utils.showToast(`خطا در خروجی‌گیری: ${error.message}`, 'error');
        }
    }

    static updateExportHistory(format) {
        const historyContainer = document.getElementById('export-history');
        const now = new Date().toLocaleString('fa-IR');
        
        const historyItem = document.createElement('div');
        historyItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
        historyItem.innerHTML = `
            <span>📄 ${format.toUpperCase()}</span>
            <span class="text-xs text-gray-500">${now}</span>
        `;
        
        // Add to top of history
        if (historyContainer.children.length === 1 && historyContainer.textContent.includes('هنوز خروجی‌ای')) {
            historyContainer.innerHTML = '';
        }
        
        historyContainer.insertBefore(historyItem, historyContainer.firstChild);
        
        // Keep only last 5 items
        while (historyContainer.children.length > 5) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }
}

// Global Functions (called from HTML)
async function updateProxies() {
    try {
        const updateBtn = document.getElementById('update-proxies-btn');
        updateBtn.disabled = true;
        updateBtn.textContent = '⏳ در حال بروزرسانی...';
        
        await Utils.fetchAPI('/update-proxies', {
            method: 'POST',
            body: JSON.stringify({ include_fresh: true })
        });
        
        Utils.showToast('بروزرسانی پروکسی‌ها شروع شد', 'success');
        
    } catch (error) {
        Utils.showToast(`خطا در بروزرسانی پروکسی: ${error.message}`, 'error');
    } finally {
        setTimeout(() => {
            const updateBtn = document.getElementById('update-proxies-btn');
            updateBtn.disabled = false;
            updateBtn.textContent = '🔄 بروزرسانی پروکسی‌ها';
        }, 3000);
    }
}

function showSection(sectionName) {
    NavigationManager.showSection(sectionName);
}

function processDocuments() {
    DocumentProcessor.processDocuments();
}

function clearUrls() {
    document.getElementById('urls-input').value = '';
    document.getElementById('file-info').classList.add('hidden');
    Utils.showToast('آدرس‌ها پاک شد', 'info');
}

function toggleSearch() {
    const searchBar = document.getElementById('search-bar');
    const searchToggle = document.getElementById('search-toggle');
    
    if (searchBar.classList.contains('hidden')) {
        searchBar.classList.remove('hidden');
        searchToggle.textContent = '✕ بستن';
        document.getElementById('search-input').focus();
    } else {
        searchBar.classList.add('hidden');
        searchToggle.textContent = '🔍 جستجو';
        document.getElementById('search-input').value = '';
        AppState.searchTerm = '';
        DocumentProcessor.renderDocuments();
    }
}

function toggleFullContent(button) {
    const card = button.closest('.document-card');
    const fullContent = card.querySelector('.full-content');
    
    if (fullContent.classList.contains('hidden')) {
        fullContent.classList.remove('hidden');
        button.textContent = 'بستن';
    } else {
        fullContent.classList.add('hidden');
        button.textContent = 'نمایش کامل';
    }
}

async function clearCache() {
    if (confirm('آیا مطمئن هستید که می‌خواهید کش را پاک کنید؟')) {
        try {
            await Utils.fetchAPI('/cache', { method: 'DELETE' });
            Utils.showToast('کش با موفقیت پاک شد', 'success');
            await SystemMonitor.updateStats();
        } catch (error) {
            Utils.showToast(`خطا در پاک کردن کش: ${error.message}`, 'error');
        }
    }
}

function exportDocuments(format) {
    ExportManager.exportDocuments(format);
}

// Legal Database Functions
async function loadLegalDatabaseStats() {
    try {
        const stats = await Utils.fetchAPI('/legal-db/stats');
        
        // Update stats display
        document.getElementById('legal-db-total').textContent = stats.total_documents || 0;
        document.getElementById('legal-db-sources').textContent = Object.keys(stats.sources || {}).length;
        document.getElementById('legal-db-categories').textContent = Object.keys(stats.categories || {}).length;
        
        // Update source statistics
        const sourcesContainer = document.getElementById('legal-sources-stats');
        if (stats.sources && Object.keys(stats.sources).length > 0) {
            sourcesContainer.innerHTML = Object.entries(stats.sources)
                .map(([source, count]) => `
                    <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span class="font-medium">${source}</span>
                        <span class="bg-primary-500 text-white px-2 py-1 rounded text-sm">${count}</span>
                    </div>
                `).join('');
        } else {
            sourcesContainer.innerHTML = '<p class="text-gray-500">هنوز سندی ثبت نشده</p>';
        }
        
        // Update category statistics
        const categoriesContainer = document.getElementById('legal-categories-stats');
        if (stats.categories && Object.keys(stats.categories).length > 0) {
            categoriesContainer.innerHTML = Object.entries(stats.categories)
                .map(([category, count]) => `
                    <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span class="font-medium">${category}</span>
                        <span class="bg-secondary-500 text-white px-2 py-1 rounded text-sm">${count}</span>
                    </div>
                `).join('');
        } else {
            categoriesContainer.innerHTML = '<p class="text-gray-500">هنوز دسته‌بندی نشده</p>';
        }
        
    } catch (error) {
        Utils.showToast(`خطا در بارگذاری آمار پایگاه داده: ${error.message}`, 'error');
    }
}

async function searchLegalDocuments() {
    const query = document.getElementById('legal-search-input').value.trim();
    const source = document.getElementById('legal-source-filter').value;
    const category = document.getElementById('legal-category-filter').value;
    
    if (!query && !source && !category) {
        Utils.showToast('لطفاً حداقل یکی از فیلدهای جستجو را پر کنید', 'warning');
        return;
    }
    
    try {
        let results;
        
        if (query) {
            // Text search
            const response = await Utils.fetchAPI(`/legal-db/search?q=${encodeURIComponent(query)}`);
            results = response.results;
        } else {
            // Filter by source/category
            let url = '/legal-db/documents?';
            if (source) url += `source=${encodeURIComponent(source)}&`;
            if (category) url += `category=${encodeURIComponent(category)}&`;
            
            const response = await Utils.fetchAPI(url);
            results = response.documents;
        }
        
        displayLegalDocuments(results);
        document.getElementById('legal-search-count').textContent = results.length;
        
    } catch (error) {
        Utils.showToast(`خطا در جستجو: ${error.message}`, 'error');
    }
}

async function loadAllLegalDocuments() {
    try {
        const response = await Utils.fetchAPI('/legal-db/documents?limit=100');
        displayLegalDocuments(response.documents);
        document.getElementById('legal-search-count').textContent = response.documents.length;
    } catch (error) {
        Utils.showToast(`خطا در بارگذاری اسناد: ${error.message}`, 'error');
    }
}

function displayLegalDocuments(documents) {
    const container = document.getElementById('legal-documents-results');
    
    if (!documents || documents.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-4">🔍</div>
                <p>هیچ سندی یافت نشد</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = documents.map(doc => {
        const analysis = doc.analysis ? JSON.parse(doc.analysis) : {};
        const keyTerms = analysis.key_terms || [];
        const entities = analysis.legal_entities || [];
        
        return `
            <div class="legal-document-card border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <h4 class="font-semibold text-lg text-gray-800 mb-1">${doc.title || 'بدون عنوان'}</h4>
                        <div class="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 mb-2">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">${doc.source}</span>
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded">${doc.category}</span>
                            <span>امتیاز: ${(doc.reliability_score * 100).toFixed(0)}%</span>
                        </div>
                        <p class="text-sm text-gray-500 break-all" dir="ltr">${doc.url}</p>
                    </div>
                </div>
                
                <div class="mb-3">
                    <p class="text-gray-700 text-sm leading-relaxed">
                        ${Utils.truncateText(doc.content || 'محتوا در دسترس نیست', 300)}
                    </p>
                </div>
                
                ${keyTerms.length > 0 ? `
                    <div class="mb-3">
                        <p class="text-xs font-medium text-gray-600 mb-1">کلیدواژه‌های حقوقی:</p>
                        <div class="flex flex-wrap gap-1">
                            ${keyTerms.slice(0, 8).map(term => 
                                `<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">${term.term} (${term.count})</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${entities.length > 0 ? `
                    <div class="mb-3">
                        <p class="text-xs font-medium text-gray-600 mb-1">نهادهای حقوقی:</p>
                        <div class="text-xs text-gray-600">
                            ${entities.slice(0, 5).join('، ')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>📅 ${new Date(doc.timestamp).toLocaleDateString('fa-IR')}</span>
                    <button onclick="showLegalDocumentDetails('${doc.id}')" class="text-primary-500 hover:text-primary-600">
                        📖 جزئیات کامل
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function populateLegalDatabase() {
    try {
        const response = await Utils.fetchAPI('/legal-db/populate', {
            method: 'POST',
            body: JSON.stringify({ max_docs_per_source: 5 })
        });
        
        Utils.showToast('شروع پر کردن پایگاه داده حقوقی...', 'info');
        
    } catch (error) {
        Utils.showToast(`خطا در شروع پر کردن پایگاه داده: ${error.message}`, 'error');
    }
}

async function searchNafaqeDefinition() {
    try {
        Utils.showToast('در حال جستجوی تعریف نفقه...', 'info');
        
        const response = await Utils.fetchAPI('/legal-db/search-nafaqe', {
            method: 'POST'
        });
        
        if (response.success) {
            Utils.showToast('تعریف نفقه با موفقیت یافت شد', 'success');
            
            // Display the نفقه document
            const nafaqeDoc = response.document;
            displayLegalDocuments([nafaqeDoc]);
            document.getElementById('legal-search-count').textContent = '1';
            
            // Also update search input
            document.getElementById('legal-search-input').value = 'نفقه';
            
        } else {
            Utils.showToast('تعریف نفقه یافت نشد', 'warning');
        }
        
    } catch (error) {
        Utils.showToast(`خطا در جستجوی نفقه: ${error.message}`, 'error');
    }
}

function clearLegalSearch() {
    document.getElementById('legal-search-input').value = '';
    document.getElementById('legal-source-filter').value = '';
    document.getElementById('legal-category-filter').value = '';
    
    const container = document.getElementById('legal-documents-results');
    container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-4">📚</div>
            <p>برای مشاهده اسناد، جستجو کنید یا پایگاه داده را پر کنید</p>
            <button onclick="loadAllLegalDocuments()" class="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                📄 نمایش همه اسناد
            </button>
        </div>
    `;
    
    document.getElementById('legal-search-count').textContent = '0';
    Utils.showToast('جستجو پاک شد', 'info');
}

function showLegalDocumentDetails(documentId) {
    // This would show a modal with full document details
    Utils.showToast(`نمایش جزئیات سند ${documentId}`, 'info');
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (AppState.currentSection === 'process') {
            toggleSearch();
        }
    }
    
    // Ctrl/Cmd + Enter for process
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (AppState.currentSection === 'process' && !AppState.isProcessing) {
            processDocuments();
        }
    }
    
    // Escape to close modals/search
    if (e.key === 'Escape') {
        const searchBar = document.getElementById('search-bar');
        if (!searchBar.classList.contains('hidden')) {
            toggleSearch();
        }
    }
});

// Dashboard Management System
class DashboardManager {
    static init() {
        this.setupRefreshButton();
        this.setupQuickActions();
        this.startAutoRefresh();
        this.loadDashboardData();
    }

    static setupRefreshButton() {
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }
    }

    static setupQuickActions() {
        // Setup quick action buttons
        const refreshProxiesBtn = document.querySelector('button[onclick="refreshProxies()"]');
        if (refreshProxiesBtn) {
            refreshProxiesBtn.onclick = () => this.refreshProxies();
        }

        const clearCacheBtn = document.querySelector('button[onclick="clearCache()"]');
        if (clearCacheBtn) {
            clearCacheBtn.onclick = () => this.clearCache();
        }
    }

    static async refreshDashboard() {
        try {
            Utils.showToast('در حال بروزرسانی داشبورد...', 'info', 2000);
            
            // Update all dashboard data
            await Promise.all([
                this.updateSystemStats(),
                this.updateCharts(),
                this.updateActivityFeed(),
                this.updateSystemHealth()
            ]);
            
            // Update last refresh time
            const now = new Date();
            const lastRefreshEl = document.getElementById('last-refresh');
            if (lastRefreshEl) {
                lastRefreshEl.textContent = Utils.formatTime(now);
            }
            
            Utils.showToast('داشبورد بروزرسانی شد', 'success', 3000);
        } catch (error) {
            console.error('Dashboard refresh failed:', error);
            Utils.showToast('خطا در بروزرسانی داشبورد', 'error');
        }
    }

    static async updateSystemStats() {
        try {
            const stats = await Utils.fetchAPI('/status');
            
            // Update stat cards
            this.updateStatCard('total-operations', stats.total_operations || 0, '+' + (stats.operations_today || 0));
            this.updateStatCard('successful-operations', stats.successful_operations || 0);
            this.updateStatCard('active-proxies', stats.active_proxies || 0);
            this.updateStatCard('cache-size', stats.cache_size || 0);
            
            // Update progress bars
            this.updateProgressBar('total-operations-progress', (stats.operations_today || 0) / 100 * 100);
            this.updateProgressBar('success-rate-progress', stats.success_rate || 0);
            this.updateProgressBar('proxy-health-progress', stats.proxy_health || 100);
            this.updateProgressBar('cache-usage-progress', stats.cache_usage || 0);
            
            // Update success rate
            const successRate = stats.success_rate || 0;
            const successRateEl = document.getElementById('success-rate');
            if (successRateEl) {
                successRateEl.textContent = `${Math.round(successRate)}%`;
            }
            
        } catch (error) {
            console.error('Failed to update system stats:', error);
        }
    }

    static updateStatCard(elementId, value, change = null) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value.toLocaleString('fa-IR');
            
            if (change) {
                const changeElement = document.getElementById(`${elementId}-change`);
                if (changeElement) {
                    changeElement.textContent = change;
                }
            }
        }
    }

    static updateProgressBar(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    static async updateCharts() {
        if (typeof ChartManager !== 'undefined') {
            await ChartManager.updateAllCharts();
        }
    }

    static async updateActivityFeed() {
        try {
            const logs = await Utils.fetchAPI('/logs?limit=10');
            const feedElement = document.getElementById('recent-logs');
            
            if (feedElement && logs && logs.length > 0) {
                feedElement.innerHTML = logs.map(log => `
                    <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="w-2 h-2 ${this.getStatusColor(log.level)} rounded-full ml-3"></div>
                        <div class="flex-1">
                            <p class="text-sm text-gray-600 dark:text-gray-300">${Utils.sanitizeHtml(log.message)}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${Utils.formatTime(new Date(log.timestamp))}</p>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to update activity feed:', error);
        }
    }

    static async updateSystemHealth() {
        try {
            // API Status
            const apiStatus = await this.checkApiHealth();
            this.updateHealthStatus('api-status', apiStatus);
            
            // Database Status
            const dbStatus = await this.checkDatabaseHealth();
            this.updateHealthStatus('db-status', dbStatus);
            
            // Proxy Network Status
            const proxyStatus = await this.checkProxyHealth();
            this.updateHealthStatus('proxy-network-status', proxyStatus);
            
            // WebSocket Status
            const wsStatus = AppState.websocket && AppState.websocket.readyState === WebSocket.OPEN ? 'healthy' : 'error';
            this.updateHealthStatus('websocket-status', wsStatus);
            
        } catch (error) {
            console.error('Failed to update system health:', error);
        }
    }

    static async checkApiHealth() {
        try {
            const response = await Utils.fetchAPI('/status');
            return 'healthy';
        } catch {
            return 'error';
        }
    }

    static async checkDatabaseHealth() {
        try {
            const response = await Utils.fetchAPI('/legal-db/stats');
            return 'healthy';
        } catch {
            return 'error';
        }
    }

    static async checkProxyHealth() {
        try {
            const response = await Utils.fetchAPI('/network');
            return response.healthy_proxies > 0 ? 'healthy' : 'warning';
        } catch {
            return 'error';
        }
    }

    static updateHealthStatus(elementId, status) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const statusDot = element.querySelector('.w-2.h-2');
        const statusText = element.querySelector('span');
        
        if (statusDot && statusText) {
            switch (status) {
                case 'healthy':
                    statusDot.className = 'w-2 h-2 bg-green-500 rounded-full ml-2';
                    statusText.textContent = 'سالم';
                    break;
                case 'warning':
                    statusDot.className = 'w-2 h-2 bg-yellow-500 rounded-full ml-2';
                    statusText.textContent = 'هشدار';
                    break;
                case 'error':
                    statusDot.className = 'w-2 h-2 bg-red-500 rounded-full ml-2';
                    statusText.textContent = 'خطا';
                    break;
            }
        }
    }

    static getStatusColor(level) {
        switch (level) {
            case 'error': return 'bg-red-500';
            case 'warning': return 'bg-yellow-500';
            case 'info': return 'bg-blue-500';
            case 'success': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    }

    static async refreshProxies() {
        try {
            Utils.showToast('در حال بروزرسانی پروکسی‌ها...', 'info');
            const result = await Utils.fetchAPI('/network/update-proxies', { method: 'POST' });
            Utils.showToast('پروکسی‌ها بروزرسانی شدند', 'success');
            this.updateSystemStats();
        } catch (error) {
            Utils.showToast('خطا در بروزرسانی پروکسی‌ها', 'error');
        }
    }

    static async clearCache() {
        try {
            Utils.showToast('در حال پاک‌سازی کش...', 'info');
            const result = await Utils.fetchAPI('/cache', { method: 'DELETE' });
            Utils.showToast('کش پاک‌سازی شد', 'success');
            this.updateSystemStats();
        } catch (error) {
            Utils.showToast('خطا در پاک‌سازی کش', 'error');
        }
    }

    static startAutoRefresh() {
        if (AppState.config.autoRefresh) {
            setInterval(() => {
                this.updateSystemStats();
                this.updateActivityFeed();
                this.updateSystemHealth();
            }, AppState.config.refreshInterval);
        }
    }

    static async loadDashboardData() {
        await this.refreshDashboard();
    }
}

// Chart Management System
class ChartManager {
    static init() {
        this.initializeCharts();
        this.setupChartControls();
    }

    static initializeCharts() {
        // Operations Chart
        this.createOperationsChart();
        
        // Performance Chart
        this.createPerformanceChart();
        
        // Category Chart
        this.createCategoryChart();
    }

    static createOperationsChart() {
        const ctx = document.getElementById('operations-chart');
        if (!ctx) return;

        AppState.charts.operations = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(24),
                datasets: [{
                    label: 'کل عملیات',
                    data: this.generateSampleData(24, 0, 100),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'عملیات موفق',
                    data: this.generateSampleData(24, 0, 80),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            font: { family: 'Vazirmatn' }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(156, 163, 175, 0.1)' }
                    },
                    x: {
                        grid: { color: 'rgba(156, 163, 175, 0.1)' }
                    }
                }
            }
        });
    }

    static createPerformanceChart() {
        const ctx = document.getElementById('performance-chart');
        if (!ctx) return;

        AppState.charts.performance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['موفق', 'ناموفق', 'در انتظار'],
                datasets: [{
                    data: [75, 15, 10],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            font: { family: 'Vazirmatn' }
                        }
                    }
                }
            }
        });
    }

    static createCategoryChart() {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        AppState.charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['قوانین', 'مقررات', 'آراء', 'بخشنامه‌ها', 'سایر'],
                datasets: [{
                    label: 'تعداد اسناد',
                    data: [45, 32, 28, 15, 8],
                    backgroundColor: [
                        '#3b82f6',
                        '#8b5cf6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(156, 163, 175, 0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    static setupChartControls() {
        const timeframeSelect = document.getElementById('performance-timeframe');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', (e) => {
                this.updatePerformanceChart(e.target.value);
            });
        }
    }

    static generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        
        for (let i = hours - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
            labels.push(time.getHours().toString().padStart(2, '0') + ':00');
        }
        
        return labels;
    }

    static generateSampleData(points, min, max) {
        return Array.from({ length: points }, () => 
            Math.floor(Math.random() * (max - min + 1)) + min
        );
    }

    static async updateAllCharts() {
        try {
            // Update operations chart with real data
            if (AppState.charts.operations) {
                const operationsData = await Utils.fetchAPI('/stats/operations');
                if (operationsData) {
                    AppState.charts.operations.data.datasets[0].data = operationsData.total || [];
                    AppState.charts.operations.data.datasets[1].data = operationsData.successful || [];
                    AppState.charts.operations.update();
                }
            }

            // Update performance chart
            if (AppState.charts.performance) {
                const performanceData = await Utils.fetchAPI('/stats/performance');
                if (performanceData) {
                    AppState.charts.performance.data.datasets[0].data = [
                        performanceData.successful || 0,
                        performanceData.failed || 0,
                        performanceData.pending || 0
                    ];
                    AppState.charts.performance.update();
                }
            }

            // Update category chart
            if (AppState.charts.category) {
                const categoryData = await Utils.fetchAPI('/stats/categories');
                if (categoryData) {
                    AppState.charts.category.data.datasets[0].data = Object.values(categoryData);
                    AppState.charts.category.update();
                }
            }
        } catch (error) {
            console.error('Failed to update charts:', error);
        }
    }

    static updatePerformanceChart(timeframe) {
        // Update chart based on selected timeframe
        console.log('Updating performance chart for timeframe:', timeframe);
    }
}

// Proxy Management System
class ProxyManager {
    static init() {
        this.setupProxyControls();
        this.setupProxyCharts();
        this.setupProxyFilters();
        this.loadProxyData();
    }

    static setupProxyControls() {
        // Test all proxies button
        const testAllBtn = document.getElementById('test-all-proxies');
        if (testAllBtn) {
            testAllBtn.addEventListener('click', () => this.testAllProxies());
        }

        // Add proxy button
        const addProxyBtn = document.getElementById('add-proxy-btn');
        if (addProxyBtn) {
            addProxyBtn.addEventListener('click', () => this.showAddProxyModal());
        }

        // Update proxies button
        const updateBtn = document.getElementById('update-proxies-btn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateProxies());
        }

        // Bulk test button
        const bulkTestBtn = document.getElementById('bulk-test-btn');
        if (bulkTestBtn) {
            bulkTestBtn.addEventListener('click', () => this.bulkTestProxies());
        }

        // Import proxies button
        const importBtn = document.getElementById('import-proxies-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importProxies());
        }
    }

    static setupProxyCharts() {
        this.createProxyPerformanceChart();
        this.createProxyDistributionChart();
    }

    static createProxyPerformanceChart() {
        const ctx = document.getElementById('proxy-performance-chart');
        if (!ctx) return;

        AppState.charts.proxyPerformance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(24),
                datasets: [{
                    label: 'پروکسی فعال',
                    data: this.generateSampleData(24, 0, 50),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'زمان پاسخ میانگین (ms)',
                    data: this.generateSampleData(24, 100, 500),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            font: { family: 'Vazirmatn' }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'تعداد پروکسی'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'زمان پاسخ (ms)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    x: {
                        grid: { color: 'rgba(156, 163, 175, 0.1)' }
                    }
                }
            }
        });
    }

    static createProxyDistributionChart() {
        const ctx = document.getElementById('proxy-distribution-chart');
        if (!ctx) return;

        AppState.charts.proxyDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['ایران', 'آمریکا', 'آلمان', 'فرانسه', 'سایر'],
                datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: [
                        '#10b981',
                        '#3b82f6', 
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            font: { family: 'Vazirmatn' }
                        }
                    }
                }
            }
        });
    }

    static setupProxyFilters() {
        // Search filter
        const searchInput = document.getElementById('proxy-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterProxies();
            }, 300));
        }

        // Status filter
        const statusFilter = document.getElementById('proxy-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterProxies());
        }

        // Country filter
        const countryFilter = document.getElementById('proxy-country-filter');
        if (countryFilter) {
            countryFilter.addEventListener('change', () => this.filterProxies());
        }

        // Type filter
        const typeFilter = document.getElementById('proxy-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterProxies());
        }
    }

    static generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        
        for (let i = hours - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
            labels.push(time.getHours().toString().padStart(2, '0') + ':00');
        }
        
        return labels;
    }

    static generateSampleData(points, min, max) {
        return Array.from({ length: points }, () => 
            Math.floor(Math.random() * (max - min + 1)) + min
        );
    }

    static async loadProxyData() {
        try {
            const data = await Utils.fetchAPI('/network');
            this.updateProxyStats(data);
            this.updateProxyTable(data.proxies || []);
        } catch (error) {
            console.error('Failed to load proxy data:', error);
            Utils.showToast('خطا در بارگیری اطلاعات پروکسی', 'error');
        }
    }

    static updateProxyStats(data) {
        const proxyManager = data.proxy_manager || {};
        
        // Update stat cards
        document.getElementById('total-proxies').textContent = proxyManager.total_proxies || 0;
        document.getElementById('active-proxies-count').textContent = proxyManager.active_proxies || 0;
        document.getElementById('failed-proxies-count').textContent = proxyManager.failed_proxies || 0;
        
        // Update percentages
        const total = proxyManager.total_proxies || 0;
        const active = proxyManager.active_proxies || 0;
        const failed = proxyManager.failed_proxies || 0;
        
        if (total > 0) {
            document.getElementById('active-percentage').textContent = `${Math.round((active / total) * 100)}%`;
            document.getElementById('failed-percentage').textContent = `${Math.round((failed / total) * 100)}%`;
        }
        
        // Update response time
        document.getElementById('avg-response-time').textContent = `${proxyManager.avg_response_time || 0}ms`;
        
        // Update proxy sources
        document.getElementById('proxy-sources').textContent = `${proxyManager.sources || 0} منبع`;
    }

    static updateProxyTable(proxies) {
        const tableBody = document.getElementById('proxy-table-body');
        if (!tableBody) return;

        if (proxies.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-server text-3xl mb-2 block"></i>
                        هیچ پروکسی یافت نشد
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = proxies.map(proxy => `
            <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="py-3 px-2">
                    <input type="checkbox" class="proxy-checkbox rounded" data-proxy-id="${proxy.id}">
                </td>
                <td class="py-3 px-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs ${this.getStatusColor(proxy.status)}">
                        <i class="fas ${this.getStatusIcon(proxy.status)} ml-1"></i>
                        ${this.getStatusText(proxy.status)}
                    </span>
                </td>
                <td class="py-3 px-2 font-mono text-sm">${proxy.host}:${proxy.port}</td>
                <td class="py-3 px-2">
                    <span class="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs">${proxy.type.toUpperCase()}</span>
                </td>
                <td class="py-3 px-2">
                    <div class="flex items-center">
                        <img src="https://flagcdn.com/w20/${proxy.country.toLowerCase()}.png" alt="${proxy.country}" class="w-4 h-3 ml-2">
                        ${proxy.country}
                    </div>
                </td>
                <td class="py-3 px-2">${proxy.response_time || '-'}ms</td>
                <td class="py-3 px-2 text-xs text-gray-500">${proxy.last_tested ? Utils.formatTime(new Date(proxy.last_tested)) : 'هرگز'}</td>
                <td class="py-3 px-2">
                    <div class="flex items-center space-x-1 space-x-reverse">
                        <button onclick="ProxyManager.testProxy('${proxy.id}')" class="p-1 text-blue-500 hover:text-blue-700" title="تست پروکسی">
                            <i class="fas fa-play text-xs"></i>
                        </button>
                        <button onclick="ProxyManager.editProxy('${proxy.id}')" class="p-1 text-yellow-500 hover:text-yellow-700" title="ویرایش">
                            <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button onclick="ProxyManager.deleteProxy('${proxy.id}')" class="p-1 text-red-500 hover:text-red-700" title="حذف">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    static getStatusColor(status) {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'testing': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    static getStatusIcon(status) {
        switch (status) {
            case 'active': return 'fa-check-circle';
            case 'inactive': return 'fa-pause-circle';
            case 'testing': return 'fa-spinner fa-spin';
            case 'failed': return 'fa-times-circle';
            default: return 'fa-question-circle';
        }
    }

    static getStatusText(status) {
        switch (status) {
            case 'active': return 'فعال';
            case 'inactive': return 'غیرفعال';
            case 'testing': return 'در حال تست';
            case 'failed': return 'خراب';
            default: return 'نامشخص';
        }
    }

    static async testAllProxies() {
        try {
            Utils.showToast('شروع تست همه پروکسی‌ها...', 'info');
            const result = await Utils.fetchAPI('/network/test-all', { method: 'POST' });
            Utils.showToast('تست پروکسی‌ها شروع شد', 'success');
            
            // Refresh data after a delay
            setTimeout(() => this.loadProxyData(), 2000);
        } catch (error) {
            Utils.showToast('خطا در تست پروکسی‌ها', 'error');
        }
    }

    static async updateProxies() {
        try {
            Utils.showToast('در حال بروزرسانی پروکسی‌ها...', 'info');
            const result = await Utils.fetchAPI('/network/update-proxies', { method: 'POST' });
            Utils.showToast('پروکسی‌ها بروزرسانی شدند', 'success');
            this.loadProxyData();
        } catch (error) {
            Utils.showToast('خطا در بروزرسانی پروکسی‌ها', 'error');
        }
    }

    static async testProxy(proxyId) {
        try {
            Utils.showToast('در حال تست پروکسی...', 'info');
            const result = await Utils.fetchAPI(`/network/test-proxy/${proxyId}`, { method: 'POST' });
            Utils.showToast('تست پروکسی تکمیل شد', 'success');
            this.loadProxyData();
        } catch (error) {
            Utils.showToast('خطا در تست پروکسی', 'error');
        }
    }

    static async deleteProxy(proxyId) {
        if (!confirm('آیا از حذف این پروکسی اطمینان دارید؟')) return;
        
        try {
            await Utils.fetchAPI(`/network/proxy/${proxyId}`, { method: 'DELETE' });
            Utils.showToast('پروکسی حذف شد', 'success');
            this.loadProxyData();
        } catch (error) {
            Utils.showToast('خطا در حذف پروکسی', 'error');
        }
    }

    static filterProxies() {
        // Implement filtering logic
        console.log('Filtering proxies...');
        this.loadProxyData();
    }

    static showAddProxyModal() {
        Utils.showToast('قابلیت افزودن پروکسی به زودی اضافه می‌شود', 'info');
    }

    static bulkTestProxies() {
        const selectedProxies = document.querySelectorAll('.proxy-checkbox:checked');
        if (selectedProxies.length === 0) {
            Utils.showToast('لطفاً پروکسی‌هایی را برای تست انتخاب کنید', 'warning');
            return;
        }
        
        Utils.showToast(`تست ${selectedProxies.length} پروکسی شروع شد`, 'info');
        this.testAllProxies();
    }

    static importProxies() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.csv';
        input.onchange = (e) => {
            if (e.target.files.length > 0) {
                Utils.showToast('وارد کردن فایل پروکسی به زودی اضافه می‌شود', 'info');
            }
        };
        input.click();
    }

    static showHealthPanel() {
        // Navigate to proxy health submenu
        NavigationManager.navigateToSection('proxy');
        Utils.showToast('نمایش پنل سلامت پروکسی‌ها', 'info');
    }

    static showManagementPanel() {
        // Navigate to proxy management submenu
        NavigationManager.navigateToSection('proxy');
        Utils.showToast('نمایش پنل مدیریت پروکسی‌ها', 'info');
    }

    static showStatsPanel() {
        // Navigate to proxy stats submenu
        NavigationManager.navigateToSection('proxy');
        Utils.showToast('نمایش آمار پروکسی‌ها', 'info');
    }
}

// Search Management System
class SearchManager {
    static init() {
        this.setupSearchControls();
        this.setupSearchFilters();
        this.setupSearchCharts();
        this.loadSearchData();
    }

    static setupSearchControls() {
        // Main search button
        const searchBtn = document.getElementById('main-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        // Search input with Enter key support
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            
            // Auto-suggest on input
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.showSearchSuggestions(searchInput.value);
            }, 300));
        }

        // Search type buttons
        document.querySelectorAll('.search-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const searchType = btn.id.replace('-search-btn', '').replace('-btn', '');
                this.switchSearchType(searchType);
            });
        });

        // Quick search buttons
        document.querySelectorAll('.quick-search-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.textContent.trim();
                document.getElementById('main-search-input').value = query;
                this.performSearch();
            });
        });

        // Advanced search toggle
        const advancedToggle = document.getElementById('advanced-search-toggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => this.toggleAdvancedFilters());
        }

        // Filter buttons
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    static setupSearchFilters() {
        // Results sorting
        const resultsSort = document.getElementById('results-sort');
        if (resultsSort) {
            resultsSort.addEventListener('change', (e) => {
                this.sortResults(e.target.value);
            });
        }
    }

    static setupSearchCharts() {
        this.createSearchSourcesChart();
    }

    static createSearchSourcesChart() {
        const ctx = document.getElementById('search-sources-chart');
        if (!ctx) return;

        AppState.charts.searchSources = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['مجلس', 'قضاییه', 'دفتر تدوین', 'سایر'],
                datasets: [{
                    data: [40, 30, 20, 10],
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            font: { family: 'Vazirmatn' }
                        }
                    }
                }
            }
        });
    }

    static switchSearchType(type) {
        // Update button states
        document.querySelectorAll('.search-type-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        });

        const activeBtn = document.getElementById(`${type}-search-btn`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-blue-500', 'text-white');
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        }

        // Update search placeholder based on type
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) {
            switch (type) {
                case 'text':
                    searchInput.placeholder = 'جستجوی متنی در اسناد... (مثال: قانون مدنی، ماده 1234)';
                    break;
                case 'semantic':
                    searchInput.placeholder = 'جستجوی معنایی... (مثال: قوانین مربوط به ارث و میراث)';
                    break;
                case 'nafaqe':
                    searchInput.placeholder = 'جستجو در موضوع نفقه... (مثال: نفقه زن، نفقه فرزندان)';
                    break;
            }
        }

        AppState.currentSearchType = type;
    }

    static async performSearch() {
        const query = document.getElementById('main-search-input').value.trim();
        if (!query) {
            Utils.showToast('لطفاً عبارت جستجو را وارد کنید', 'warning');
            return;
        }

        try {
            Utils.showToast('در حال جستجو...', 'info');
            
            const searchType = AppState.currentSearchType || 'text';
            const startTime = Date.now();
            
            let endpoint, payload;
            
            switch (searchType) {
                case 'semantic':
                    endpoint = '/legal-db/search';
                    payload = { query, search_type: 'semantic' };
                    break;
                case 'nafaqe':
                    endpoint = '/legal-db/search-nafaqe';
                    payload = { query };
                    break;
                default:
                    endpoint = '/search';
                    payload = { query };
            }

            const results = await Utils.fetchAPI(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const searchTime = Date.now() - startTime;
            
            this.displaySearchResults(results, query, searchTime);
            this.updateSearchAnalytics(results, searchTime);
            this.addToSearchHistory(query, searchType);
            
            Utils.showToast(`${results.length || 0} نتیجه یافت شد`, 'success');
            
        } catch (error) {
            console.error('Search failed:', error);
            Utils.showToast('خطا در جستجو', 'error');
            this.displaySearchError(error.message);
        }
    }

    static displaySearchResults(results, query, searchTime) {
        const container = document.getElementById('search-results-container');
        if (!container) return;

        if (!results || results.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-search-minus text-4xl mb-4"></i>
                    <h4 class="text-lg font-medium mb-2">نتیجه‌ای یافت نشد</h4>
                    <p class="text-sm">برای "${Utils.sanitizeHtml(query)}" نتیجه‌ای در پایگاه داده موجود نیست</p>
                    <div class="mt-4">
                        <button onclick="SearchManager.suggestAlternatives('${query}')" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                            <i class="fas fa-lightbulb ml-1"></i>
                            پیشنهاد جستجوهای مشابه
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map((result, index) => `
            <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer" onclick="SearchManager.viewDocument('${result.id}')">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800 dark:text-white mb-2 hover:text-primary-600 transition-colors">
                            ${Utils.sanitizeHtml(result.title || 'بدون عنوان')}
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            ${Utils.sanitizeHtml(result.excerpt || result.content || '').substring(0, 200)}...
                        </p>
                        <div class="flex items-center space-x-4 space-x-reverse text-xs text-gray-500 dark:text-gray-400">
                            <span class="flex items-center">
                                <i class="fas fa-building ml-1"></i>
                                ${result.source || 'نامشخص'}
                            </span>
                            <span class="flex items-center">
                                <i class="fas fa-calendar ml-1"></i>
                                ${result.date ? Utils.formatDate(new Date(result.date)) : 'تاریخ نامشخص'}
                            </span>
                            <span class="flex items-center">
                                <i class="fas fa-tag ml-1"></i>
                                ${result.category || 'دسته‌بندی نشده'}
                            </span>
                            ${result.score ? `<span class="flex items-center"><i class="fas fa-star ml-1"></i>${Math.round(result.score * 100)}% مطابقت</span>` : ''}
                        </div>
                    </div>
                    <div class="flex flex-col items-center space-y-2">
                        <span class="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">#${index + 1}</span>
                        <button onclick="event.stopPropagation(); SearchManager.bookmarkDocument('${result.id}')" class="p-1 text-yellow-500 hover:text-yellow-600">
                            <i class="fas fa-bookmark text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Update results count
        document.getElementById('search-results-count').textContent = `${results.length} نتیجه`;
        
        // Show pagination if needed
        if (results.length > 10) {
            document.getElementById('search-pagination').classList.remove('hidden');
        }
    }

    static displaySearchError(errorMessage) {
        const container = document.getElementById('search-results-container');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <h4 class="text-lg font-medium mb-2">خطا در جستجو</h4>
                <p class="text-sm">${Utils.sanitizeHtml(errorMessage)}</p>
                <button onclick="SearchManager.performSearch()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    <i class="fas fa-redo ml-1"></i>
                    تلاش مجدد
                </button>
            </div>
        `;
    }

    static showSearchSuggestions(query) {
        if (!query || query.length < 2) {
            document.getElementById('search-suggestions').classList.add('hidden');
            return;
        }

        // Show suggestions (mock implementation)
        const suggestions = ['قانون مدنی', 'احکام نفقه', 'قوانین ارث', 'مقررات خانواده'];
        const filtered = suggestions.filter(s => s.includes(query));
        
        if (filtered.length > 0) {
            const suggestionsEl = document.getElementById('search-suggestions');
            const suggestionsContainer = suggestionsEl.querySelector('.space-y-1');
            
            suggestionsContainer.innerHTML = filtered.map(suggestion => `
                <button class="w-full text-right p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm" onclick="SearchManager.selectSuggestion('${suggestion}')">
                    ${Utils.sanitizeHtml(suggestion)}
                </button>
            `).join('');
            
            suggestionsEl.classList.remove('hidden');
        }
    }

    static selectSuggestion(suggestion) {
        document.getElementById('main-search-input').value = suggestion;
        document.getElementById('search-suggestions').classList.add('hidden');
        this.performSearch();
    }

    static toggleAdvancedFilters() {
        const filtersEl = document.getElementById('advanced-filters');
        if (filtersEl) {
            filtersEl.classList.toggle('hidden');
        }
    }

    static applyFilters() {
        Utils.showToast('فیلترها اعمال شد', 'success');
        this.performSearch();
    }

    static clearFilters() {
        // Clear all filter inputs
        document.getElementById('source-filter').value = '';
        document.getElementById('document-type-filter').value = '';
        document.getElementById('date-from-filter').value = '';
        document.getElementById('date-to-filter').value = '';
        
        Utils.showToast('فیلترها پاک شدند', 'info');
    }

    static updateSearchAnalytics(results, searchTime) {
        document.getElementById('analytics-total').textContent = results.length || 0;
        document.getElementById('analytics-time').textContent = `${searchTime}ms`;
        document.getElementById('analytics-accuracy').textContent = results.length > 0 ? 'بالا' : 'پایین';
    }

    static addToSearchHistory(query, type) {
        const historyEl = document.getElementById('recent-searches');
        if (!historyEl) return;

        const historyItem = `
            <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-600 rounded text-sm">
                <span>${Utils.sanitizeHtml(query)}</span>
                <div class="flex items-center space-x-2 space-x-reverse">
                    <span class="text-xs text-gray-500">${type}</span>
                    <button onclick="SearchManager.selectSuggestion('${query}')" class="text-blue-500 hover:text-blue-600">
                        <i class="fas fa-redo text-xs"></i>
                    </button>
                </div>
            </div>
        `;

        // Remove "no searches" message if present
        if (historyEl.textContent.includes('هنوز جستجویی انجام نشده')) {
            historyEl.innerHTML = '';
        }

        historyEl.insertAdjacentHTML('afterbegin', historyItem);

        // Keep only last 5 searches
        const items = historyEl.querySelectorAll('div');
        if (items.length > 5) {
            items[items.length - 1].remove();
        }
    }

    static async viewDocument(documentId) {
        try {
            Utils.showToast('در حال بارگیری جزئیات سند...', 'info');
            const document = await Utils.fetchAPI(`/legal-db/documents/${documentId}`);
            this.showDocumentModal(document);
        } catch (error) {
            Utils.showToast('خطا در بارگیری سند', 'error');
        }
    }

    static showDocumentModal(document) {
        // Create and show document modal (implementation would go here)
        Utils.showToast('نمایش جزئیات سند', 'info');
    }

    static bookmarkDocument(documentId) {
        Utils.showToast('سند به علاقه‌مندی‌ها اضافه شد', 'success');
    }

    static suggestAlternatives(query) {
        Utils.showToast(`جستجوی جایگزین برای "${query}" به زودی اضافه می‌شود`, 'info');
    }

    static switchToTextSearch() {
        this.switchSearchType('text');
        NavigationManager.navigateToSection('search');
    }

    static switchToSemanticSearch() {
        this.switchSearchType('semantic');
        NavigationManager.navigateToSection('search');
    }

    static switchToNafaqeSearch() {
        this.switchSearchType('nafaqe');
        NavigationManager.navigateToSection('search');
    }

    static sortResults(sortBy) {
        Utils.showToast(`مرتب‌سازی بر اساس ${sortBy}`, 'info');
        // Implementation would sort and re-display results
    }

    static async loadSearchData() {
        try {
            // Load search statistics and update charts
            const stats = await Utils.fetchAPI('/legal-db/stats');
            if (stats && AppState.charts.searchSources) {
                // Update chart with real data if available
                AppState.charts.searchSources.update();
            }
        } catch (error) {
            console.error('Failed to load search data:', error);
        }
    }
}

// Settings Management System
class SettingsManager {
    static init() {
        this.setupSettingsTabs();
        this.setupSettingsControls();
        this.loadSettings();
    }

    static setupSettingsTabs() {
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = btn.id.replace('-tab', '');
                this.switchSettingsTab(tabId);
            });
        });
    }

    static switchSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-primary-500', 'text-primary-600');
            btn.classList.add('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
        });

        // Update tab content
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Show active tab
        const activeBtn = document.getElementById(`${tabName}-tab`);
        const activeContent = document.getElementById(`${tabName}-content`);

        if (activeBtn) {
            activeBtn.classList.add('active', 'border-primary-500', 'text-primary-600');
            activeBtn.classList.remove('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
        }

        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
    }

    static setupSettingsControls() {
        // API connection test
        const testApiBtn = document.getElementById('test-api-connection');
        if (testApiBtn) {
            testApiBtn.addEventListener('click', () => this.testApiConnection());
        }

        // Theme buttons
        const lightThemeBtn = document.getElementById('light-theme-btn');
        const darkThemeBtn = document.getElementById('dark-theme-btn');
        
        if (lightThemeBtn) {
            lightThemeBtn.addEventListener('click', () => this.setTheme('light'));
        }
        
        if (darkThemeBtn) {
            darkThemeBtn.addEventListener('click', () => this.setTheme('dark'));
        }

        // Font size slider
        const fontSizeSlider = document.getElementById('font-size-slider');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                this.updateFontSize(e.target.value);
            });
        }

        // Save settings button
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAllSettings());
        }

        // Test all settings
        const testAllBtn = document.getElementById('test-all-settings');
        if (testAllBtn) {
            testAllBtn.addEventListener('click', () => this.testAllSettings());
        }

        // Export/Import settings
        const exportBtn = document.getElementById('export-settings-btn');
        const importBtn = document.getElementById('import-settings-btn');
        const resetBtn = document.getElementById('reset-settings-btn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSettings());
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => this.importSettings());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }
    }

    static async testApiConnection() {
        const apiUrl = document.getElementById('api-base-url').value;
        const indicator = document.getElementById('api-status-indicator');
        
        try {
            indicator.innerHTML = '<div class="w-2 h-2 bg-yellow-500 rounded-full ml-2 animate-pulse"></div><span class="text-sm">در حال تست...</span>';
            
            const response = await fetch(`${apiUrl}/status`);
            const isHealthy = response.ok;
            
            if (isHealthy) {
                indicator.innerHTML = '<div class="w-2 h-2 bg-green-500 rounded-full ml-2"></div><span class="text-sm text-green-600">متصل</span>';
                Utils.showToast('اتصال به API موفقیت‌آمیز بود', 'success');
            } else {
                indicator.innerHTML = '<div class="w-2 h-2 bg-red-500 rounded-full ml-2"></div><span class="text-sm text-red-600">خطا</span>';
                Utils.showToast('خطا در اتصال به API', 'error');
            }
            
            document.getElementById('last-api-check').textContent = Utils.formatTime(new Date());
            
        } catch (error) {
            indicator.innerHTML = '<div class="w-2 h-2 bg-red-500 rounded-full ml-2"></div><span class="text-sm text-red-600">خطا</span>';
            Utils.showToast('خطا در اتصال به API', 'error');
        }
    }

    static setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        localStorage.setItem('theme', theme);
        AppState.theme = theme;
        
        Utils.showToast(`تم ${theme === 'dark' ? 'تاریک' : 'روشن'} فعال شد`, 'success');
    }

    static updateFontSize(size) {
        document.getElementById('font-size-value').textContent = `${size}px`;
        document.body.style.fontSize = `${size}px`;
        localStorage.setItem('fontSize', size);
    }

    static saveAllSettings() {
        const settings = {
            api: {
                baseUrl: document.getElementById('api-base-url').value,
                timeout: document.getElementById('api-timeout').value,
                retryCount: document.getElementById('api-retry-count').value
            },
            proxy: {
                enabled: document.getElementById('enable-proxy-global').checked,
                strategy: document.getElementById('proxy-selection-strategy').value,
                healthCheckInterval: document.getElementById('health-check-interval').value,
                timeout: document.getElementById('proxy-timeout').value,
                autoSources: document.getElementById('auto-proxy-sources').checked,
                customSources: document.getElementById('custom-proxy-sources').value
            },
            ui: {
                theme: AppState.theme,
                fontFamily: document.getElementById('font-family').value,
                fontSize: document.getElementById('font-size-slider').value,
                animations: document.getElementById('enable-animations').checked,
                sound: document.getElementById('enable-sound').checked,
                autoSave: document.getElementById('auto-save').checked,
                autoRefreshInterval: document.getElementById('auto-refresh-interval').value
            },
            advanced: {
                maxConcurrent: document.getElementById('max-concurrent').value,
                cacheSize: document.getElementById('cache-size-limit').value,
                compression: document.getElementById('enable-compression').checked,
                sslVerification: document.getElementById('enable-ssl-verification').checked,
                clearDataOnExit: document.getElementById('clear-data-on-exit').checked,
                userAgent: document.getElementById('custom-user-agent').value
            }
        };

        // Save to localStorage
        localStorage.setItem('systemSettings', JSON.stringify(settings));
        
        // Update AppState
        Object.assign(AppState.config, settings);
        
        Utils.showToast('تنظیمات ذخیره شدند', 'success');
    }

    static loadSettings() {
        try {
            const savedSettings = localStorage.getItem('systemSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // Apply API settings
                if (settings.api) {
                    document.getElementById('api-base-url').value = settings.api.baseUrl || '';
                    document.getElementById('api-timeout').value = settings.api.timeout || 30;
                    document.getElementById('api-retry-count').value = settings.api.retryCount || 2;
                }
                
                // Apply proxy settings
                if (settings.proxy) {
                    document.getElementById('enable-proxy-global').checked = settings.proxy.enabled !== false;
                    document.getElementById('proxy-selection-strategy').value = settings.proxy.strategy || 'fastest';
                    document.getElementById('health-check-interval').value = settings.proxy.healthCheckInterval || 5;
                    document.getElementById('proxy-timeout').value = settings.proxy.timeout || 10;
                    document.getElementById('auto-proxy-sources').checked = settings.proxy.autoSources !== false;
                    document.getElementById('custom-proxy-sources').value = settings.proxy.customSources || '';
                }
                
                // Apply UI settings
                if (settings.ui) {
                    this.setTheme(settings.ui.theme || 'light');
                    document.getElementById('font-family').value = settings.ui.fontFamily || 'vazirmatn';
                    document.getElementById('font-size-slider').value = settings.ui.fontSize || 14;
                    document.getElementById('enable-animations').checked = settings.ui.animations !== false;
                    document.getElementById('enable-sound').checked = settings.ui.sound || false;
                    document.getElementById('auto-save').checked = settings.ui.autoSave !== false;
                    document.getElementById('auto-refresh-interval').value = settings.ui.autoRefreshInterval || 30;
                    
                    this.updateFontSize(settings.ui.fontSize || 14);
                }
                
                // Apply advanced settings
                if (settings.advanced) {
                    document.getElementById('max-concurrent').value = settings.advanced.maxConcurrent || 5;
                    document.getElementById('cache-size-limit').value = settings.advanced.cacheSize || 100;
                    document.getElementById('enable-compression').checked = settings.advanced.compression !== false;
                    document.getElementById('enable-ssl-verification').checked = settings.advanced.sslVerification !== false;
                    document.getElementById('clear-data-on-exit').checked = settings.advanced.clearDataOnExit || false;
                    document.getElementById('custom-user-agent').value = settings.advanced.userAgent || '';
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    static async testAllSettings() {
        Utils.showToast('شروع تست همه تنظیمات...', 'info');
        
        const tests = [
            { name: 'API Connection', test: () => this.testApiConnection() },
            { name: 'Theme System', test: () => this.testThemeSystem() },
            { name: 'Font System', test: () => this.testFontSystem() }
        ];

        let passed = 0;
        
        for (const test of tests) {
            try {
                await test.test();
                passed++;
            } catch (error) {
                console.error(`Test failed: ${test.name}`, error);
            }
        }
        
        Utils.showToast(`${passed}/${tests.length} تست موفق`, passed === tests.length ? 'success' : 'warning');
    }

    static testThemeSystem() {
        const currentTheme = AppState.theme;
        this.setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        setTimeout(() => this.setTheme(currentTheme), 500);
        return Promise.resolve();
    }

    static testFontSystem() {
        const currentSize = document.getElementById('font-size-slider').value;
        this.updateFontSize(16);
        setTimeout(() => this.updateFontSize(currentSize), 500);
        return Promise.resolve();
    }

    static exportSettings() {
        const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
        const dataStr = JSON.stringify(settings, null, 2);
        Utils.downloadFile(dataStr, `legal-archive-settings-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        Utils.showToast('تنظیمات صادر شد', 'success');
    }

    static importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const settings = JSON.parse(event.target.result);
                        localStorage.setItem('systemSettings', JSON.stringify(settings));
                        this.loadSettings();
                        Utils.showToast('تنظیمات وارد شد', 'success');
                    } catch (error) {
                        Utils.showToast('خطا در وارد کردن تنظیمات', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    static resetSettings() {
        if (confirm('آیا از بازنشانی همه تنظیمات اطمینان دارید؟')) {
            localStorage.removeItem('systemSettings');
            localStorage.removeItem('theme');
            localStorage.removeItem('fontSize');
            location.reload();
        }
    }

    static showApiSettings() {
        this.switchSettingsTab('api-settings');
    }

    static showProxySettings() {
        this.switchSettingsTab('proxy-settings');
    }

    static showThemeSettings() {
        this.switchSettingsTab('theme-settings');
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iranian Legal Archive System v2.0 - Enhanced Web UI Initialized');
    
    // Initialize core managers first
    ThemeManager.init();
    NavigationManager.init();
    TabManager.init();
    
    // Initialize system managers
    SystemMonitor.init();
    WebSocketManager.init();
    
    // Initialize feature managers
    DocumentProcessor.init();
    ProxyManager.init();
    SearchManager.init();
    SettingsManager.init();
    
    // Initialize UI enhancement managers
    if (typeof DashboardManager !== 'undefined') DashboardManager.init();
    if (typeof ChartManager !== 'undefined') ChartManager.init();
    
    // Load initial data
    SystemMonitor.updateStats();
    
    // Show welcome message
    setTimeout(() => {
        Utils.showToast('سیستم آرشیو اسناد حقوقی آماده است', 'success');
    }, 1000);
});

// Error Handling
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
    Utils.showToast('خطای غیرمنتظره در رابط کاربری', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
    Utils.showToast('خطا در پردازش درخواست', 'error');
});

// Performance Monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`⚡ Page loaded in ${Math.round(loadTime)}ms`);
        
        if (loadTime > 3000) {
            Utils.showToast('بارگذاری صفحه کندتر از حد انتظار بود', 'warning');
        }
    });
}

// Service Worker Registration (for offline capability)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}