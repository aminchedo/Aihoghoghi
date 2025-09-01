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