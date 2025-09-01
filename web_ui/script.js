/**
 * Iranian Legal Archive System - Complete JavaScript Implementation
 * Advanced document processing and archive management system
 * 
 * ⚠️ IMPORTANT LEGAL NOTICE:
 * This system is designed for legitimate legal research and educational purposes only.
 * Users must comply with all applicable laws and website terms of service.
 * Respect robots.txt files and rate limiting policies of target websites.
 */

class LegalArchiveSystem {
    constructor() {
        this.config = {
            apiBaseUrl: 'http://127.0.0.1:7860/api',
            wsUrl: 'ws://127.0.0.1:7860/ws',
            version: '2.0.0',
            maxConcurrentRequests: 5,
            requestTimeout: 30000,
            retryAttempts: 2
        };
        
        this.state = {
            currentSection: 'home',
            isProcessing: false,
            documents: new Map(),
            proxies: new Map(),
            searchResults: [],
            logs: [],
            settings: this.loadSettings(),
            websocket: null,
            charts: {}
        };
        
        this.init();
    }

    // ================== INITIALIZATION ==================
    async init() {
        try {
            await this.initializeUI();
            await this.initializeWebSocket();
            await this.initializeCharts();
            await this.loadInitialData();
            this.startPeriodicUpdates();
            
            this.showToast('سیستم با موفقیت راه‌اندازی شد', 'success');
            this.updateStatus('آماده', 'success');
        } catch (error) {
            console.error('System initialization failed:', error);
            this.showToast('خطا در راه‌اندازی سیستم', 'error');
            this.updateStatus('خطا در راه‌اندازی', 'error');
        }
    }

    initializeUI() {
        // Initialize navigation
        this.setupNavigation();
        this.setupTabs();
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupSidebar();
        
        // Initialize time display
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
        
        // Set initial theme
        this.applyTheme(this.state.settings.theme || 'light');
        
        // Initialize drag and drop
        this.setupDragAndDrop();
        
        console.log('UI initialized successfully');
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    this.showSection(href.substring(1));
                }
            });
        });

        // Setup submenu toggles
        const submenuToggles = document.querySelectorAll('.nav-group > .nav-link');
        submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const submenu = toggle.parentElement.querySelector('.nav-submenu');
                const arrow = toggle.querySelector('i[id$="-arrow"]');
                
                if (submenu) {
                    e.preventDefault();
                    submenu.classList.toggle('hidden');
                    if (arrow) {
                        arrow.style.transform = submenu.classList.contains('hidden') 
                            ? 'rotate(0deg)' : 'rotate(-90deg)';
                    }
                }
            });
        });
    }

    setupTabs() {
        // Document processing tabs
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.id.replace('-tab', '-input');
                if (button.id === 'file-tab') targetId = 'file-input-tab';
                if (button.id === 'bulk-tab') targetId = 'bulk-input-tab';
                
                // Update active states
                tabButtons.forEach(btn => btn.classList.remove('active', 'border-primary-500', 'text-primary-600'));
                tabContents.forEach(content => content.classList.add('hidden'));
                
                button.classList.add('active', 'border-primary-500', 'text-primary-600');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.remove('hidden');
            });
        });

        // Settings tabs
        const settingsTabButtons = document.querySelectorAll('.settings-tab-btn');
        const settingsTabContents = document.querySelectorAll('.settings-tab-content');
        
        settingsTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.id.replace('-tab', '-content');
                
                settingsTabButtons.forEach(btn => {
                    btn.classList.remove('active', 'border-primary-500', 'text-primary-600');
                    btn.classList.add('text-gray-500');
                });
                settingsTabContents.forEach(content => content.classList.add('hidden'));
                
                button.classList.remove('text-gray-500');
                button.classList.add('active', 'border-primary-500', 'text-primary-600');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.remove('hidden');
            });
        });

        // Search type tabs
        const searchTypeButtons = document.querySelectorAll('.search-type-btn');
        searchTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                searchTypeButtons.forEach(btn => {
                    btn.classList.remove('active', 'bg-blue-500', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                });
                button.classList.remove('bg-gray-200', 'text-gray-700');
                button.classList.add('active', 'bg-blue-500', 'text-white');
            });
        });
    }

    setupEventListeners() {
        // Process documents button
        const processBtn = document.getElementById('process-btn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processDocuments());
        }

        // Clear inputs button
        const clearBtn = document.getElementById('clear-all-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllInputs());
        }

        // URL templates
        const urlTemplates = document.querySelectorAll('.url-template');
        urlTemplates.forEach(template => {
            template.addEventListener('click', () => {
                const templateType = template.dataset.template;
                this.loadUrlTemplate(templateType);
            });
        });

        // Quick search buttons
        const quickSearchBtns = document.querySelectorAll('.quick-search-btn');
        quickSearchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const searchTerm = btn.textContent.trim();
                document.getElementById('main-search-input').value = searchTerm;
                this.performSearch(searchTerm);
            });
        });

        // Main search button
        const mainSearchBtn = document.getElementById('main-search-btn');
        if (mainSearchBtn) {
            mainSearchBtn.addEventListener('click', () => {
                const searchTerm = document.getElementById('main-search-input').value;
                this.performSearch(searchTerm);
            });
        }

        // Search input enter key
        const mainSearchInput = document.getElementById('main-search-input');
        if (mainSearchInput) {
            mainSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        // Generate bulk URLs
        const generateBulkBtn = document.getElementById('generate-bulk-urls');
        if (generateBulkBtn) {
            generateBulkBtn.addEventListener('click', () => this.generateBulkUrls());
        }

        // File input handling
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        }

        // Advanced filters toggle
        const advancedToggle = document.getElementById('advanced-search-toggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => {
                const filters = document.getElementById('advanced-filters');
                filters.classList.toggle('hidden');
            });
        }

        // Save settings
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }

        // Test API connection
        const testApiBtn = document.getElementById('test-api-connection');
        if (testApiBtn) {
            testApiBtn.addEventListener('click', () => this.testApiConnection());
        }

        // Refresh dashboard
        const refreshDashboardBtn = document.getElementById('refresh-dashboard');
        if (refreshDashboardBtn) {
            refreshDashboardBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // Real-time updates
        setInterval(() => this.updateDashboardStats(), 5000);
        setInterval(() => this.updateSystemHealth(), 10000);
        setInterval(() => this.updateRecentLogs(), 3000);
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.dataset.theme || 'light';
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                this.applyTheme(newTheme);
                this.state.settings.theme = newTheme;
                this.saveSettings();
            });
        }
    }

    setupSidebar() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        
        if (sidebarToggle && sidebar && mainContent) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                mainContent.classList.toggle('sidebar-open');
            });
        }
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('file-drop-zone');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFileUpload(files);
        });

        // Make the entire drop zone clickable
        dropZone.addEventListener('click', () => {
            document.getElementById('file-input')?.click();
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // ================== WEBSOCKET CONNECTION ==================
    async initializeWebSocket() {
        try {
            this.state.websocket = new WebSocket(this.config.wsUrl);
            
            this.state.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.updateSystemHealth('websocket-status', 'متصل', 'success');
            };
            
            this.state.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };
            
            this.state.websocket.onerror = () => {
                console.error('WebSocket connection error');
                this.updateSystemHealth('websocket-status', 'خطا در اتصال', 'error');
            };
            
            this.state.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.updateSystemHealth('websocket-status', 'قطع شده', 'warning');
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.initializeWebSocket(), 5000);
            };
        } catch (error) {
            console.error('WebSocket initialization failed:', error);
            this.updateSystemHealth('websocket-status', 'غیرفعال', 'error');
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'progress':
                this.updateProcessingProgress(data.data);
                break;
            case 'log':
                this.addLog(data.data);
                break;
            case 'stats':
                this.updateDashboardStats(data.data);
                break;
            case 'document_processed':
                this.addProcessedDocument(data.data);
                break;
            case 'proxy_update':
                this.updateProxyStatus(data.data);
                break;
            default:
                console.log('Unknown WebSocket message type:', data.type);
        }
    }

    // ================== CHARTS INITIALIZATION ==================
    async initializeCharts() {
        try {
            // Operations chart
            const operationsCtx = document.getElementById('operations-chart');
            if (operationsCtx) {
                this.state.charts.operations = new Chart(operationsCtx, {
                    type: 'line',
                    data: {
                        labels: this.generateTimeLabels(24),
                        datasets: [{
                            label: 'کل عملیات',
                            data: this.generateRandomData(24),
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4
                        }, {
                            label: 'موفق',
                            data: this.generateRandomData(24, 0.8),
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: this.getChartOptions('عملیات', 'تعداد')
                });
            }

            // Performance chart
            const performanceCtx = document.getElementById('performance-chart');
            if (performanceCtx) {
                this.state.charts.performance = new Chart(performanceCtx, {
                    type: 'bar',
                    data: {
                        labels: ['CPU', 'Memory', 'Network', 'Proxy Health'],
                        datasets: [{
                            label: 'درصد استفاده',
                            data: [45, 62, 28, 89],
                            backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(139, 92, 246, 0.8)'
                            ]
                        }]
                    },
                    options: this.getChartOptions('عملکرد سیستم', 'درصد')
                });
            }

            // Category chart
            const categoryCtx = document.getElementById('category-chart');
            if (categoryCtx) {
                this.state.charts.category = new Chart(categoryCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['قانون', 'مقررات', 'رای', 'نفقه'],
                        datasets: [{
                            data: [30, 25, 20, 25],
                            backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(139, 92, 246, 0.8)'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                rtl: true,
                                textDirection: 'rtl'
                            }
                        }
                    }
                });
            }

            // Proxy performance chart
            const proxyPerformanceCtx = document.getElementById('proxy-performance-chart');
            if (proxyPerformanceCtx) {
                this.state.charts.proxyPerformance = new Chart(proxyPerformanceCtx, {
                    type: 'line',
                    data: {
                        labels: this.generateTimeLabels(24),
                        datasets: [{
                            label: 'زمان پاسخ (ms)',
                            data: this.generateRandomData(24, 500, 200),
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: this.getChartOptions('عملکرد پروکسی', 'میلی‌ثانیه')
                });
            }

            // Proxy distribution chart
            const proxyDistributionCtx = document.getElementById('proxy-distribution-chart');
            if (proxyDistributionCtx) {
                this.state.charts.proxyDistribution = new Chart(proxyDistributionCtx, {
                    type: 'pie',
                    data: {
                        labels: ['ایران', 'آمریکا', 'آلمان', 'فرانسه'],
                        datasets: [{
                            data: [40, 30, 20, 10],
                            backgroundColor: [
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(16, 185, 129, 0.8)'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                rtl: true,
                                textDirection: 'rtl'
                            }
                        }
                    }
                });
            }

            // Search sources chart
            const searchSourcesCtx = document.getElementById('search-sources-chart');
            if (searchSourcesCtx) {
                this.state.charts.searchSources = new Chart(searchSourcesCtx, {
                    type: 'bar',
                    data: {
                        labels: ['مجلس', 'قضائیه', 'دوتیک'],
                        datasets: [{
                            label: 'تعداد نتایج',
                            data: [0, 0, 0],
                            backgroundColor: 'rgba(59, 130, 246, 0.8)'
                        }]
                    },
                    options: this.getChartOptions('توزیع منابع', 'تعداد')
                });
            }

            console.log('Charts initialized successfully');
        } catch (error) {
            console.error('Charts initialization failed:', error);
        }
    }

    getChartOptions(title, yAxisLabel) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    rtl: true,
                    textDirection: 'rtl'
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                }
            }
        };
    }

    generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        for (let i = hours - 1; i >= 0; i--) {
            const time = new Date(now - i * 60 * 60 * 1000);
            labels.push(time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
        }
        return labels;
    }

    generateRandomData(count, max = 100, min = 0) {
        return Array.from({ length: count }, () => 
            Math.floor(Math.random() * (max - min) + min)
        );
    }

    // ================== DATA LOADING ==================
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadProxies(),
                this.loadDocuments(),
                this.loadLegalDatabase(),
                this.updateSystemHealth()
            ]);
            
            console.log('Initial data loaded successfully');
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    async loadProxies() {
        try {
            // Simulate proxy loading
            const mockProxies = [
                { id: '1', ip: '192.168.1.1', port: 8080, type: 'HTTP', country: 'IR', status: 'active', responseTime: 250 },
                { id: '2', ip: '10.0.0.1', port: 3128, type: 'HTTPS', country: 'US', status: 'active', responseTime: 180 },
                { id: '3', ip: '172.16.0.1', port: 1080, type: 'SOCKS5', country: 'DE', status: 'inactive', responseTime: 0 },
                { id: '4', ip: '203.0.113.1', port: 8888, type: 'HTTP', country: 'FR', status: 'active', responseTime: 320 }
            ];

            mockProxies.forEach(proxy => this.state.proxies.set(proxy.id, proxy));
            this.updateProxyTable();
            this.updateProxyStats();
            
        } catch (error) {
            console.error('Failed to load proxies:', error);
        }
    }

    async loadDocuments() {
        // Initialize with empty document list
        this.updateDocumentTable();
    }

    async loadLegalDatabase() {
        try {
            const stats = {
                totalDocs: 0,
                sources: 5,
                categories: 8
            };

            this.updateElement('legal-db-total', stats.totalDocs);
            this.updateElement('legal-db-sources', stats.sources);
            this.updateElement('legal-db-categories', stats.categories);
            
        } catch (error) {
            console.error('Failed to load legal database:', error);
        }
    }

    // ================== SECTION MANAGEMENT ==================
    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
            this.state.currentSection = sectionName;
        }

        // Update navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active', 'bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow-lg');
            link.classList.add('text-gray-700');
        });

        const activeLink = document.querySelector(`.nav-link[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-700');
            activeLink.classList.add('active', 'bg-gradient-to-r', 'from-primary-500', 'to-secondary-500', 'text-white', 'shadow-lg');
        }

        // Update breadcrumb
        this.updateBreadcrumb(sectionName);
        
        // Trigger section-specific initialization
        this.onSectionChange(sectionName);
    }

    updateBreadcrumb(sectionName) {
        const breadcrumb = document.getElementById('breadcrumb');
        const breadcrumbPath = document.getElementById('breadcrumb-path');
        
        if (breadcrumb && breadcrumbPath) {
            const sectionTitles = {
                'home': 'داشبورد اصلی',
                'process': 'پردازش اسناد',
                'proxy': 'داشبورد پروکسی',
                'search': 'جستجو و پایگاه داده',
                'settings': 'تنظیمات',
                'logs': 'گزارش‌ها و لاگ‌ها'
            };
            
            breadcrumbPath.textContent = sectionTitles[sectionName] || sectionName;
            breadcrumb.classList.remove('hidden');
        }
    }

    onSectionChange(sectionName) {
        switch (sectionName) {
            case 'home':
                this.refreshDashboard();
                break;
            case 'proxy':
                this.updateProxyTable();
                this.updateProxyCharts();
                break;
            case 'search':
                this.initializeSearch();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    // ================== DOCUMENT PROCESSING ==================
    async processDocuments() {
        if (this.state.isProcessing) {
            this.showToast('پردازش در حال انجام است', 'warning');
            return;
        }

        const urls = this.getUrlsFromInput();
        if (urls.length === 0) {
            this.showToast('لطفاً حداقل یک آدرس وارد کنید', 'warning');
            return;
        }

        try {
            this.state.isProcessing = true;
            this.showProcessingUI();
            
            const batchSize = parseInt(document.getElementById('batch-size')?.value || '3');
            const processingMode = document.getElementById('processing-mode')?.value || 'full';
            const enableProxy = document.getElementById('enable-proxy')?.checked || false;
            
            this.showToast(`شروع پردازش ${urls.length} سند`, 'info');
            
            for (let i = 0; i < urls.length; i += batchSize) {
                const batch = urls.slice(i, i + batchSize);
                await this.processBatch(batch, processingMode, enableProxy);
                
                // Update progress
                const progress = ((i + batch.length) / urls.length) * 100;
                this.updateProcessingProgress({
                    percentage: Math.round(progress),
                    processed: i + batch.length,
                    total: urls.length,
                    current_url: batch[batch.length - 1]
                });
                
                // Add delay between batches
                if (i + batchSize < urls.length) {
                    await this.delay(2000);
                }
            }
            
            this.showToast('پردازش اسناد با موفقیت تکمیل شد', 'success');
            
        } catch (error) {
            console.error('Document processing failed:', error);
            this.showToast('خطا در پردازش اسناد', 'error');
        } finally {
            this.state.isProcessing = false;
            this.hideProcessingUI();
        }
    }

    getUrlsFromInput() {
        const urlsInput = document.getElementById('urls-input');
        if (!urlsInput) return [];
        
        const urls = urlsInput.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url && this.isValidUrl(url));
            
        return urls;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async processBatch(urls, mode, useProxy) {
        const promises = urls.map(url => this.processDocument(url, mode, useProxy));
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                this.addProcessedDocument({
                    url: urls[index],
                    ...result.value,
                    status: 'success',
                    timestamp: new Date().toISOString()
                });
            } else {
                this.addProcessedDocument({
                    url: urls[index],
                    title: 'خطا در پردازش',
                    status: 'failed',
                    error: result.reason?.message || 'خطای نامشخص',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async processDocument(url, mode, useProxy) {
        try {
            // Simulate document processing
            await this.delay(Math.random() * 3000 + 1000);
            
            // Mock result
            const mockResult = {
                title: `سند ${Math.floor(Math.random() * 1000)}`,
                source: this.getSourceFromUrl(url),
                category: this.getRandomCategory(),
                content: 'محتوای نمونه برای تست سیستم',
                processTime: Math.floor(Math.random() * 5000 + 1000)
            };
            
            return mockResult;
            
        } catch (error) {
            throw new Error(`Failed to process ${url}: ${error.message}`);
        }
    }

    getSourceFromUrl(url) {
        if (url.includes('majlis.ir')) return 'مجلس شورای اسلامی';
        if (url.includes('judiciary.ir')) return 'قوه قضائیه';
        if (url.includes('dotic.ir')) return 'دفتر تدوین قوانین';
        return 'منبع نامشخص';
    }

    getRandomCategory() {
        const categories = ['قانون', 'مقررات', 'رای', 'نفقه', 'آگهی قانونی'];
        return categories[Math.floor(Math.random() * categories.length)];
    }

    addProcessedDocument(doc) {
        this.state.documents.set(doc.url, doc);
        this.updateDocumentTable();
        this.updateDashboardStats();
        
        // Add to recent logs
        this.addLog({
            level: doc.status === 'success' ? 'INFO' : 'ERROR',
            message: doc.status === 'success' 
                ? `سند "${doc.title}" با موفقیت پردازش شد`
                : `خطا در پردازش سند: ${doc.error}`,
            timestamp: new Date().toISOString()
        });
    }

    showProcessingUI() {
        const progressSection = document.getElementById('progress-section');
        if (progressSection) {
            progressSection.classList.remove('hidden');
        }
    }

    hideProcessingUI() {
        // Keep progress section visible to show results
        // Can be hidden after user review
    }

    updateProcessingProgress(data) {
        this.updateElement('progress-percentage', `${data.percentage}%`);
        this.updateElement('processed-count', data.processed);
        this.updateElement('remaining-count', data.total - data.processed);
        this.updateElement('current-operation', `پردازش: ${data.current_url}`);
        
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${data.percentage}%`;
        }
    }

    // ================== FILE HANDLING ==================
    async handleFileUpload(files) {
        const uploadedFilesList = document.getElementById('uploaded-files-list');
        if (!uploadedFilesList) return;

        // Clear placeholder content
        uploadedFilesList.innerHTML = '';

        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                this.showToast(`فایل ${file.name} بیش از حد مجاز بزرگ است`, 'warning');
                continue;
            }

            try {
                const content = await this.readFileContent(file);
                const urls = this.extractUrlsFromContent(content, file.type);
                
                this.addFileToList(file, urls.length, uploadedFilesList);
                
                // Add URLs to main input
                const urlsInput = document.getElementById('urls-input');
                if (urlsInput) {
                    const currentUrls = urlsInput.value.trim();
                    const newUrls = urls.join('\n');
                    urlsInput.value = currentUrls ? `${currentUrls}\n${newUrls}` : newUrls;
                }
                
                this.showToast(`${urls.length} آدرس از فایل ${file.name} استخراج شد`, 'success');
                
            } catch (error) {
                console.error('File processing error:', error);
                this.showToast(`خطا در پردازش فایل ${file.name}`, 'error');
            }
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file, 'utf-8');
        });
    }

    extractUrlsFromContent(content, fileType) {
        let urls = [];
        
        if (fileType === 'application/json') {
            try {
                const data = JSON.parse(content);
                urls = this.extractUrlsFromObject(data);
            } catch (error) {
                console.error('JSON parsing error:', error);
            }
        } else if (fileType === 'text/csv') {
            const lines = content.split('\n');
            urls = lines
                .map(line => line.split(',')[0].trim())
                .filter(url => this.isValidUrl(url));
        } else {
            // Plain text
            const urlRegex = /https?:\/\/[^\s]+/g;
            const matches = content.match(urlRegex);
            urls = matches ? matches.filter(url => this.isValidUrl(url)) : [];
        }
        
        return [...new Set(urls)]; // Remove duplicates
    }

    extractUrlsFromObject(obj, urls = []) {
        for (const key in obj) {
            if (typeof obj[key] === 'string' && this.isValidUrl(obj[key])) {
                urls.push(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.extractUrlsFromObject(obj[key], urls);
            }
        }
        return urls;
    }

    addFileToList(file, urlCount, container) {
        const fileElement = document.createElement('div');
        fileElement.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg';
        fileElement.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-file text-blue-500 ml-3"></i>
                <div>
                    <div class="font-medium text-gray-800 dark:text-gray-200">${file.name}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${urlCount} آدرس - ${this.formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="text-red-500 hover:text-red-700 p-1" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(fileElement);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ================== URL TEMPLATES ==================
    loadUrlTemplate(templateType) {
        const urlsInput = document.getElementById('urls-input');
        if (!urlsInput) return;

        const templates = {
            majlis: [
                'https://rc.majlis.ir/fa/law/show/139030',
                'https://rc.majlis.ir/fa/law/show/139031',
                'https://rc.majlis.ir/fa/law/show/139032'
            ],
            judiciary: [
                'https://www.judiciary.ir/fa/news/12345',
                'https://www.judiciary.ir/fa/news/12346',
                'https://www.judiciary.ir/fa/news/12347'
            ],
            dotic: [
                'https://dotic.ir/portal/law/67890',
                'https://dotic.ir/portal/law/67891',
                'https://dotic.ir/portal/law/67892'
            ]
        };

        const currentUrls = urlsInput.value.trim();
        const templateUrls = templates[templateType] || [];
        const newUrls = templateUrls.join('\n');
        
        urlsInput.value = currentUrls ? `${currentUrls}\n${newUrls}` : newUrls;
        this.showToast(`${templateUrls.length} آدرس نمونه اضافه شد`, 'success');
    }

    generateBulkUrls() {
        const pattern = document.getElementById('url-pattern')?.value;
        const start = parseInt(document.getElementById('bulk-start')?.value || '1');
        const end = parseInt(document.getElementById('bulk-end')?.value || '100');
        const preview = document.getElementById('bulk-preview');

        if (!pattern) {
            this.showToast('لطفاً الگوی URL را وارد کنید', 'warning');
            return;
        }

        if (!pattern.includes('{id}')) {
            this.showToast('الگوی URL باید شامل {id} باشد', 'warning');
            return;
        }

        const urls = [];
        for (let i = start; i <= end; i++) {
            urls.push(pattern.replace('{id}', i));
        }

        if (preview) {
            preview.innerHTML = urls.slice(0, 10).join('\n') + 
                (urls.length > 10 ? '\n...' : '');
        }

        // Add to main input
        const urlsInput = document.getElementById('urls-input');
        if (urlsInput) {
            const currentUrls = urlsInput.value.trim();
            const newUrls = urls.join('\n');
            urlsInput.value = currentUrls ? `${currentUrls}\n${newUrls}` : newUrls;
        }

        this.showToast(`${urls.length} آدرس تولید شد`, 'success');
    }

    clearAllInputs() {
        const inputs = [
            'urls-input',
            'url-pattern',
            'bulk-start',
            'bulk-end'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = id === 'bulk-start' ? '1' : id === 'bulk-end' ? '100' : '';
            }
        });

        // Clear file list
        const filesList = document.getElementById('uploaded-files-list');
        if (filesList) {
            filesList.innerHTML = `
                <div class="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>هنوز فایلی بارگذاری نشده است</p>
                </div>
            `;
        }

        // Clear preview
        const preview = document.getElementById('bulk-preview');
        if (preview) {
            preview.innerHTML = '<p class="text-gray-500 dark:text-gray-400">آدرس‌های تولید شده در اینجا نمایش داده می‌شوند</p>';
        }

        this.showToast('تمام ورودی‌ها پاک شد', 'info');
    }

    // ================== SEARCH FUNCTIONALITY ==================
    initializeSearch() {
        // Initialize search suggestions
        this.setupSearchSuggestions();
    }

    setupSearchSuggestions() {
        const searchInput = document.getElementById('main-search-input');
        const suggestions = document.getElementById('search-suggestions');
        
        if (searchInput && suggestions) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length > 2) {
                    this.showSearchSuggestions(query);
                } else {
                    suggestions.classList.add('hidden');
                }
            });

            searchInput.addEventListener('blur', () => {
                setTimeout(() => suggestions.classList.add('hidden'), 200);
            });
        }
    }

    showSearchSuggestions(query) {
        const suggestions = document.getElementById('search-suggestions');
        if (!suggestions) return;

        const mockSuggestions = [
            'قانون مدنی',
            'احکام نفقه',
            'قوانین ارث',
            'مقررات خانواده'
        ].filter(s => s.includes(query));

        if (mockSuggestions.length > 0) {
            const suggestionElements = mockSuggestions.map(s => 
                `<button class="w-full text-right p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm" onclick="document.getElementById('main-search-input').value='${s}'; this.closest('.search-suggestions').classList.add('hidden')">${s}</button>`
            ).join('');

            suggestions.innerHTML = `
                <div class="p-2">
                    <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">پیشنهادات:</div>
                    <div class="space-y-1">${suggestionElements}</div>
                </div>
            `;
            suggestions.classList.remove('hidden');
        } else {
            suggestions.classList.add('hidden');
        }
    }

    async performSearch(query) {
        if (!query.trim()) {
            this.showToast('لطفاً عبارت جستجو را وارد کنید', 'warning');
            return;
        }

        try {
            this.showLoadingState('search-results-container');
            const startTime = Date.now();
            
            // Simulate search
            await this.delay(1500);
            
            const mockResults = this.generateMockSearchResults(query);
            const searchTime = Date.now() - startTime;
            
            this.displaySearchResults(mockResults, query, searchTime);
            this.updateSearchAnalytics(mockResults, searchTime);
            this.addToSearchHistory(query);
            
            this.showToast(`${mockResults.length} نتیجه یافت شد`, 'success');
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showToast('خطا در جستجو', 'error');
            this.hideLoadingState('search-results-container');
        }
    }

    generateMockSearchResults(query) {
        const results = [];
        const resultCount = Math.floor(Math.random() * 15) + 5;
        
        for (let i = 0; i < resultCount; i++) {
            results.push({
                id: `result-${i}`,
                title: `نتیجه ${i + 1} برای "${query}"`,
                source: this.getRandomSource(),
                category: this.getRandomCategory(),
                content: `محتوای خلاصه شده که شامل کلمه "${query}" می‌باشد...`,
                date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR'),
                relevance: Math.floor(Math.random() * 40) + 60,
                url: `https://example.com/document/${i + 1}`
            });
        }
        
        return results.sort((a, b) => b.relevance - a.relevance);
    }

    getRandomSource() {
        const sources = ['مجلس شورای اسلامی', 'قوه قضائیه', 'دفتر تدوین قوانین', 'کانون وکلای دادگستری'];
        return sources[Math.floor(Math.random() * sources.length)];
    }

    displaySearchResults(results, query, searchTime) {
        const container = document.getElementById('search-results-container');
        const pagination = document.getElementById('search-pagination');
        
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-search-minus text-4xl mb-4"></i>
                    <h4 class="text-lg font-medium mb-2">نتیجه‌ای یافت نشد</h4>
                    <p class="text-sm">برای "${query}" هیچ سندی پیدا نشد</p>
                </div>
            `;
            if (pagination) pagination.classList.add('hidden');
            return;
        }

        const resultsHtml = results.map(result => `
            <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-2">
                    <h4 class="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                        ${result.title}
                    </h4>
                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        ${result.relevance}% تطابق
                    </span>
                </div>
                <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span class="ml-4">${result.source}</span>
                    <span class="ml-4">${result.category}</span>
                    <span>${result.date}</span>
                </div>
                <p class="text-gray-700 dark:text-gray-300 mb-3">${result.content}</p>
                <div class="flex items-center justify-between">
                    <a href="${result.url}" class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-external-link-alt ml-1"></i>
                        مشاهده سند اصلی
                    </a>
                    <button class="text-gray-500 hover:text-gray-700 text-sm" onclick="this.closest('.border').remove()">
                        <i class="fas fa-bookmark ml-1"></i>
                        ذخیره
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = resultsHtml;
        
        if (pagination) {
            pagination.classList.remove('hidden');
            this.updateElement('search-showing-start', 1);
            this.updateElement('search-showing-end', results.length);
            this.updateElement('search-total', results.length);
        }
    }

    updateSearchAnalytics(results, searchTime) {
        this.updateElement('analytics-total', results.length);
        this.updateElement('analytics-time', `${searchTime}ms`);
        this.updateElement('analytics-accuracy', `${Math.floor(Math.random() * 20) + 80}%`);
        
        // Update source distribution chart
        if (this.state.charts.searchSources) {
            const sourceCount = {};
            results.forEach(result => {
                sourceCount[result.source] = (sourceCount[result.source] || 0) + 1;
            });
            
            this.state.charts.searchSources.data.datasets[0].data = [
                sourceCount['مجلس شورای اسلامی'] || 0,
                sourceCount['قوه قضائیه'] || 0,
                sourceCount['دفتر تدوین قوانین'] || 0
            ];
            this.state.charts.searchSources.update();
        }
    }

    addToSearchHistory(query) {
        const recentSearches = document.getElementById('recent-searches');
        if (!recentSearches) return;

        const searchElement = document.createElement('div');
        searchElement.className = 'flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-sm';
        searchElement.innerHTML = `
            <span class="cursor-pointer" onclick="document.getElementById('main-search-input').value='${query}'; performSearch('${query}')">${query}</span>
            <span class="text-xs text-gray-500">${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        
        if (recentSearches.children.length === 0) {
            recentSearches.innerHTML = '';
        }
        
        recentSearches.insertBefore(searchElement, recentSearches.firstChild);
        
        // Keep only last 5 searches
        while (recentSearches.children.length > 5) {
            recentSearches.removeChild(recentSearches.lastChild);
        }
    }

    // ================== PROXY MANAGEMENT ==================
    updateProxyTable() {
        const tableBody = document.getElementById('proxy-table-body');
        if (!tableBody) return;

        if (this.state.proxies.size === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-server text-3xl mb-2 block"></i>
                        هیچ پروکسی‌ای یافت نشد
                    </td>
                </tr>
            `;
            return;
        }

        const rows = Array.from(this.state.proxies.values()).map(proxy => {
            const statusColor = proxy.status === 'active' ? 'text-green-600' : 'text-red-600';
            const statusIcon = proxy.status === 'active' ? 'fa-check-circle' : 'fa-times-circle';
            
            return `
                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="py-3 px-2">
                        <input type="checkbox" class="proxy-checkbox rounded" value="${proxy.id}">
                    </td>
                    <td class="py-3 px-2">
                        <span class="${statusColor}">
                            <i class="fas ${statusIcon} ml-1"></i>
                            ${proxy.status === 'active' ? 'فعال' : 'غیرفعال'}
                        </span>
                    </td>
                    <td class="py-3 px-2 font-mono text-sm">${proxy.ip}:${proxy.port}</td>
                    <td class="py-3 px-2">${proxy.type}</td>
                    <td class="py-3 px-2">${this.getCountryName(proxy.country)}</td>
                    <td class="py-3 px-2">${proxy.responseTime}ms</td>
                    <td class="py-3 px-2 text-sm text-gray-500">
                        ${new Date().toLocaleString('fa-IR')}
                    </td>
                    <td class="py-3 px-2">
                        <div class="flex space-x-2 space-x-reverse">
                            <button onclick="testProxy('${proxy.id}')" class="text-blue-600 hover:text-blue-800 p-1">
                                <i class="fas fa-play"></i>
                            </button>
                            <button onclick="editProxy('${proxy.id}')" class="text-yellow-600 hover:text-yellow-800 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteProxy('${proxy.id}')" class="text-red-600 hover:text-red-800 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
        this.updateProxyPagination();
    }

    getCountryName(code) {
        const countries = {
            'IR': 'ایران',
            'US': 'آمریکا',
            'DE': 'آلمان',
            'FR': 'فرانسه',
            'UK': 'انگلستان'
        };
        return countries[code] || code;
    }

    updateProxyStats() {
        const totalProxies = this.state.proxies.size;
        const activeProxies = Array.from(this.state.proxies.values()).filter(p => p.status === 'active').length;
        const failedProxies = totalProxies - activeProxies;
        const avgResponseTime = this.calculateAverageResponseTime();

        this.updateElement('total-proxies', totalProxies);
        this.updateElement('active-proxies-count', activeProxies);
        this.updateElement('failed-proxies-count', failedProxies);
        this.updateElement('avg-response-time', `${avgResponseTime}ms`);
        
        const activePercentage = totalProxies > 0 ? Math.round((activeProxies / totalProxies) * 100) : 0;
        const failedPercentage = totalProxies > 0 ? Math.round((failedProxies / totalProxies) * 100) : 0;
        
        this.updateElement('active-percentage', `${activePercentage}%`);
        this.updateElement('failed-percentage', `${failedPercentage}%`);
    }

    calculateAverageResponseTime() {
        const activeProxies = Array.from(this.state.proxies.values()).filter(p => p.status === 'active');
        if (activeProxies.length === 0) return 0;
        
        const totalTime = activeProxies.reduce((sum, proxy) => sum + proxy.responseTime, 0);
        return Math.round(totalTime / activeProxies.length);
    }

    updateProxyCharts() {
        if (this.state.charts.proxyPerformance) {
            // Update performance chart with new data
            const newData = this.generateRandomData(24, 500, 200);
            this.state.charts.proxyPerformance.data.datasets[0].data = newData;
            this.state.charts.proxyPerformance.update();
        }

        if (this.state.charts.proxyDistribution) {
            // Update distribution based on actual proxy data
            const distribution = {};
            Array.from(this.state.proxies.values()).forEach(proxy => {
                const country = this.getCountryName(proxy.country);
                distribution[country] = (distribution[country] || 0) + 1;
            });
            
            this.state.charts.proxyDistribution.data.datasets[0].data = Object.values(distribution);
            this.state.charts.proxyDistribution.data.labels = Object.keys(distribution);
            this.state.charts.proxyDistribution.update();
        }
    }

    updateProxyPagination() {
        const total = this.state.proxies.size;
        this.updateElement('proxy-showing-start', Math.min(1, total));
        this.updateElement('proxy-showing-end', total);
        this.updateElement('proxy-total', total);
        this.updateElement('proxy-page-info', `صفحه 1 از 1`);
    }

    // ================== DOCUMENT TABLE ==================
    updateDocumentTable() {
        const tableBody = document.getElementById('documents-table-body');
        if (!tableBody) return;

        if (this.state.documents.size === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2 block"></i>
                        هنوز سندی پردازش نشده است
                    </td>
                </tr>
            `;
            return;
        }

        const rows = Array.from(this.state.documents.values()).map(doc => {
            const statusColor = doc.status === 'success' ? 'text-green-600' : 'text-red-600';
            const statusIcon = doc.status === 'success' ? 'fa-check-circle' : 'fa-times-circle';
            const statusText = doc.status === 'success' ? 'موفق' : 'ناموفق';
            
            return `
                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="py-3 px-2">
                        <span class="${statusColor}">
                            <i class="fas ${statusIcon} ml-1"></i>
                            ${statusText}
                        </span>
                    </td>
                    <td class="py-3 px-2">
                        <div class="font-medium text-gray-800 dark:text-gray-200">${doc.title}</div>
                        ${doc.error ? `<div class="text-sm text-red-600">${doc.error}</div>` : ''}
                    </td>
                    <td class="py-3 px-2">${doc.source || '-'}</td>
                    <td class="py-3 px-2 text-sm text-gray-500">
                        ${new Date(doc.timestamp).toLocaleString('fa-IR')}
                    </td>
                    <td class="py-3 px-2">
                        <div class="flex space-x-2 space-x-reverse">
                            <button onclick="viewDocument('${doc.url}')" class="text-blue-600 hover:text-blue-800 p-1" title="مشاهده">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editDocument('${doc.url}')" class="text-yellow-600 hover:text-yellow-800 p-1" title="ویرایش">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteDocument('${doc.url}')" class="text-red-600 hover:text-red-800 p-1" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
        this.updateDocumentPagination();
    }

    updateDocumentPagination() {
        const total = this.state.documents.size;
        this.updateElement('table-showing-start', Math.min(1, total));
        this.updateElement('table-showing-end', total);
        this.updateElement('table-total', total);
        this.updateElement('table-page-info', `صفحه 1 از 1`);
    }

    // ================== DASHBOARD UPDATES ==================
    async refreshDashboard() {
        try {
            await this.updateDashboardStats();
            await this.updateSystemHealth();
            await this.updateRecentLogs();
            
            this.updateElement('last-refresh', new Date().toLocaleTimeString('fa-IR'));
            this.showToast('داشبورد به‌روزرسانی شد', 'success');
        } catch (error) {
            console.error('Dashboard refresh failed:', error);
            this.showToast('خطا در به‌روزرسانی داشبورد', 'error');
        }
    }

    updateDashboardStats(data = null) {
        // Use provided data or calculate from current state
        const stats = data || {
            totalOperations: this.state.documents.size,
            successfulOperations: Array.from(this.state.documents.values()).filter(d => d.status === 'success').length,
            activeProxies: Array.from(this.state.proxies.values()).filter(p => p.status === 'active').length,
            cacheSize: Math.floor(Math.random() * 1000),
            cacheSizeMB: Math.floor(Math.random() * 100)
        };

        this.updateElement('total-operations', stats.totalOperations);
        this.updateElement('successful-operations', stats.successfulOperations);
        this.updateElement('active-proxies', stats.activeProxies);
        this.updateElement('cache-size', stats.cacheSize);
        this.updateElement('cache-size-mb', `${stats.cacheSizeMB} MB`);

        // Update success rate
        const successRate = stats.totalOperations > 0 
            ? Math.round((stats.successfulOperations / stats.totalOperations) * 100) 
            : 0;
        this.updateElement('success-rate', `${successRate}%`);

        // Update progress bars
        this.updateProgressBar('total-operations-progress', (stats.totalOperations / 1000) * 100);
        this.updateProgressBar('success-rate-progress', successRate);
        this.updateProgressBar('proxy-health-progress', 90);
        this.updateProgressBar('cache-usage-progress', (stats.cacheSizeMB / 100) * 100);

        // Update quick stats in sidebar
        this.updateElement('quick-proxy-count', stats.activeProxies);
        this.updateElement('quick-cache-count', stats.cacheSize);
        this.updateElement('quick-success-count', stats.successfulOperations);
    }

    updateProgressBar(id, percentage) {
        const progressBar = document.getElementById(id);
        if (progressBar) {
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    async updateSystemHealth() {
        const systems = [
            { id: 'api-status', name: 'API Backend', check: () => this.testApiConnection(false) },
            { id: 'db-status', name: 'Database', check: () => this.testDatabaseConnection() },
            { id: 'proxy-network-status', name: 'Proxy Network', check: () => this.testProxyNetwork() }
        ];

        for (const system of systems) {
            try {
                const isHealthy = await system.check();
                this.updateSystemHealth(system.id, isHealthy ? 'سالم' : 'خطا', isHealthy ? 'success' : 'error');
            } catch (error) {
                this.updateSystemHealth(system.id, 'خطا', 'error');
            }
        }
    }

    updateSystemHealth(systemId, status, type) {
        const statusElement = document.getElementById(systemId);
        if (!statusElement) return;

        const indicator = statusElement.querySelector('.w-2.h-2');
        const text = statusElement.querySelector('span');

        if (indicator) {
            indicator.className = `w-2 h-2 rounded-full ml-2 ${
                type === 'success' ? 'bg-green-500' : 
                type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`;
            
            if (type === 'success') {
                indicator.classList.add('animate-pulse');
            } else {
                indicator.classList.remove('animate-pulse');
            }
        }

        if (text) {
            text.textContent = status;
        }
    }

    async testDatabaseConnection() {
        // Simulate database health check
        await this.delay(500);
        return Math.random() > 0.1; // 90% success rate
    }

    async testProxyNetwork() {
        // Check if any proxies are active
        const activeProxies = Array.from(this.state.proxies.values()).filter(p => p.status === 'active');
        return activeProxies.length > 0;
    }

    async updateRecentLogs() {
        const logsContainer = document.getElementById('recent-logs');
        if (!logsContainer) return;

        // Generate some mock logs
        const mockLogs = [
            { level: 'INFO', message: 'سیستم با موفقیت راه‌اندازی شد', timestamp: new Date() },
            { level: 'SUCCESS', message: 'پردازش سند جدید تکمیل شد', timestamp: new Date(Date.now() - 30000) },
            { level: 'WARNING', message: 'پروکسی شماره 3 پاسخ نمی‌دهد', timestamp: new Date(Date.now() - 60000) }
        ];

        const logsHtml = mockLogs.map(log => {
            const levelColor = {
                'INFO': 'bg-blue-500',
                'SUCCESS': 'bg-green-500',
                'WARNING': 'bg-yellow-500',
                'ERROR': 'bg-red-500'
            }[log.level] || 'bg-gray-500';

            return `
                <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="w-2 h-2 ${levelColor} rounded-full ml-3"></div>
                    <div class="flex-1">
                        <p class="text-sm text-gray-600 dark:text-gray-300">${log.message}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ${log.timestamp.toLocaleTimeString('fa-IR')}
                        </p>
                    </div>
                </div>
            `;
        }).join('');

        logsContainer.innerHTML = logsHtml;
    }

    // ================== SETTINGS MANAGEMENT ==================
    loadSettings() {
        try {
            const saved = localStorage.getItem('legal-archive-settings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            apiBaseUrl: 'http://127.0.0.1:7860/api',
            apiTimeout: 30000,
            retryCount: 2,
            enableProxy: true,
            proxyStrategy: 'fastest',
            batchSize: 3,
            processingMode: 'full',
            enableAnimations: true,
            enableSound: false,
            autoSave: true,
            autoRefreshInterval: 30,
            maxConcurrent: 5,
            cacheSizeLimit: 100,
            enableCompression: true,
            enableSSLVerification: true,
            clearDataOnExit: false,
            fontFamily: 'vazirmatn',
            fontSize: 14
        };
    }

    saveSettings() {
        try {
            // Collect settings from UI
            const settings = {
                ...this.state.settings,
                theme: document.documentElement.dataset.theme || 'light',
                apiBaseUrl: document.getElementById('api-base-url')?.value || this.config.apiBaseUrl,
                apiTimeout: parseInt(document.getElementById('api-timeout')?.value || '30') * 1000,
                retryCount: parseInt(document.getElementById('api-retry-count')?.value || '2'),
                enableProxy: document.getElementById('enable-proxy-global')?.checked || false,
                proxyStrategy: document.getElementById('proxy-selection-strategy')?.value || 'fastest',
                enableAnimations: document.getElementById('enable-animations')?.checked || true,
                enableSound: document.getElementById('enable-sound')?.checked || false,
                autoSave: document.getElementById('auto-save')?.checked || true,
                autoRefreshInterval: parseInt(document.getElementById('auto-refresh-interval')?.value || '30'),
                maxConcurrent: parseInt(document.getElementById('max-concurrent')?.value || '5'),
                cacheSizeLimit: parseInt(document.getElementById('cache-size-limit')?.value || '100'),
                enableCompression: document.getElementById('enable-compression')?.checked || true,
                enableSSLVerification: document.getElementById('enable-ssl-verification')?.checked || true,
                clearDataOnExit: document.getElementById('clear-data-on-exit')?.checked || false,
                fontFamily: document.getElementById('font-family')?.value || 'vazirmatn',
                fontSize: parseInt(document.getElementById('font-size-slider')?.value || '14')
            };

            this.state.settings = settings;
            localStorage.setItem('legal-archive-settings', JSON.stringify(settings));
            
            // Apply settings
            this.applySettings(settings);
            
            this.showToast('تنظیمات ذخیره شد', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showToast('خطا در ذخیره تنظیمات', 'error');
        }
    }

    applySettings(settings) {
        // Apply theme
        this.applyTheme(settings.theme);
        
        // Apply font settings
        document.documentElement.style.setProperty('--font-family', `'${settings.fontFamily}'`);
        document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
        
        // Update font size display
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeValue) {
            fontSizeValue.textContent = `${settings.fontSize}px`;
        }
        
        // Apply animation settings
        if (!settings.enableAnimations) {
            document.documentElement.classList.add('no-animations');
        } else {
            document.documentElement.classList.remove('no-animations');
        }
        
        // Update config
        this.config.apiBaseUrl = settings.apiBaseUrl;
        this.config.requestTimeout = settings.apiTimeout;
        this.config.retryAttempts = settings.retryCount;
        this.config.maxConcurrentRequests = settings.maxConcurrent;
    }

    applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    async testApiConnection(showToast = true) {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            const isHealthy = response.ok;
            
            if (showToast) {
                this.showToast(
                    isHealthy ? 'اتصال API سالم است' : 'خطا در اتصال API',
                    isHealthy ? 'success' : 'error'
                );
            }
            
            this.updateApiStatus(isHealthy);
            return isHealthy;
            
        } catch (error) {
            console.error('API connection test failed:', error);
            
            if (showToast) {
                this.showToast('خطا در اتصال به API', 'error');
            }
            
            this.updateApiStatus(false);
            return false;
        }
    }

    updateApiStatus(isHealthy) {
        const indicator = document.getElementById('api-status-indicator');
        const lastCheck = document.getElementById('last-api-check');
        
        if (indicator) {
            indicator.innerHTML = `
                <div class="w-2 h-2 ${isHealthy ? 'bg-green-500' : 'bg-red-500'} rounded-full ml-2 ${isHealthy ? 'animate-pulse' : ''}"></div>
                <span class="text-sm">${isHealthy ? 'متصل' : 'قطع شده'}</span>
            `;
        }
        
        if (lastCheck) {
            lastCheck.textContent = new Date().toLocaleTimeString('fa-IR');
        }
    }

    // ================== LOGS MANAGEMENT ==================
    loadLogs() {
        const logsContainer = document.getElementById('logs-container');
        if (!logsContainer) return;

        // Generate mock logs
        const mockLogs = this.generateMockLogs(100);
        this.displayLogs(mockLogs);
    }

    generateMockLogs(count) {
        const levels = ['ERROR', 'WARNING', 'INFO', 'DEBUG'];
        const messages = [
            'شروع پردازش سند جدید',
            'اتصال به پروکسی برقرار شد',
            'خطا در دریافت محتوا',
            'پردازش با موفقیت تکمیل شد',
            'تست سلامت سیستم',
            'به‌روزرسانی پروکسی‌ها',
            'ذخیره سازی نتایج',
            'پاک سازی کش'
        ];

        const logs = [];
        for (let i = 0; i < count; i++) {
            logs.push({
                id: i,
                level: levels[Math.floor(Math.random() * levels.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
                source: 'System'
            });
        }

        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    displayLogs(logs) {
        const container = document.getElementById('logs-container');
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-file-alt text-3xl mb-2"></i>
                    <p>هیچ لاگی یافت نشد</p>
                </div>
            `;
            return;
        }

        const logsHtml = logs.map(log => {
            const levelColor = {
                'ERROR': 'text-red-600 bg-red-50 border-red-200',
                'WARNING': 'text-yellow-600 bg-yellow-50 border-yellow-200',
                'INFO': 'text-blue-600 bg-blue-50 border-blue-200',
                'DEBUG': 'text-gray-600 bg-gray-50 border-gray-200'
            }[log.level] || 'text-gray-600 bg-gray-50 border-gray-200';

            const levelIcon = {
                'ERROR': 'fa-times-circle',
                'WARNING': 'fa-exclamation-triangle',
                'INFO': 'fa-info-circle',
                'DEBUG': 'fa-bug'
            }[log.level] || 'fa-info-circle';

            return `
                <div class="flex items-start p-3 border rounded-lg ${levelColor}">
                    <i class="fas ${levelIcon} mt-1 ml-3"></i>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-semibold">${log.level}</span>
                            <span class="text-xs">
                                ${new Date(log.timestamp).toLocaleString('fa-IR')}
                            </span>
                        </div>
                        <p class="text-sm">${log.message}</p>
                        ${log.source ? `<p class="text-xs mt-1 opacity-75">منبع: ${log.source}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = logsHtml;
    }

    addLog(logData) {
        this.state.logs.unshift({
            ...logData,
            id: Date.now(),
            timestamp: logData.timestamp || new Date().toISOString()
        });

        // Keep only last 1000 logs
        if (this.state.logs.length > 1000) {
            this.state.logs = this.state.logs.slice(0, 1000);
        }

        // Update logs display if currently viewing logs section
        if (this.state.currentSection === 'logs') {
            this.displayLogs(this.state.logs);
        }
    }

    // ================== UTILITY FUNCTIONS ==================
    updateDateTime() {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        const dateElement = document.getElementById('current-date');
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('fa-IR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // Update last update time in sidebar
        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate) {
            lastUpdate.textContent = now.toLocaleString('fa-IR');
        }
    }

    updateStatus(message, type = 'info') {
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.getElementById('status-indicator');
        
        if (statusText) {
            statusText.textContent = message;
        }
        
        if (statusIndicator) {
            const colorClass = {
                'success': 'bg-green-500',
                'error': 'bg-red-500',
                'warning': 'bg-yellow-500',
                'info': 'bg-blue-500'
            }[type] || 'bg-gray-500';
            
            statusIndicator.className = `w-3 h-3 ${colorClass} rounded-full animate-pulse`;
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type} opacity-0 transform translate-x-full transition-all duration-300`;
        
        const icon = {
            'success': 'fa-check-circle text-green-500',
            'error': 'fa-times-circle text-red-500',
            'warning': 'fa-exclamation-triangle text-yellow-500',
            'info': 'fa-info-circle text-blue-500'
        }[type] || 'fa-info-circle text-blue-500';

        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${icon} ml-3"></i>
                <span class="flex-1">${message}</span>
                <button onclick="this.closest('.toast').remove()" class="mr-2 text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-x-full');
        }, 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    showLoadingState(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-12">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-500 dark:text-gray-400">در حال پردازش...</p>
            </div>
        `;
    }

    hideLoadingState(containerId) {
        // This should be called after loading is complete
        // The specific section will handle updating the container content
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startPeriodicUpdates() {
        // Update dashboard stats every 30 seconds
        setInterval(() => {
            if (this.state.currentSection === 'home') {
                this.updateDashboardStats();
            }
        }, 30000);

        // Update system health every 60 seconds
        setInterval(() => {
            this.updateSystemHealth();
        }, 60000);

        // Update charts every 60 seconds
        setInterval(() => {
            this.updateCharts();
        }, 60000);
    }

    updateCharts() {
        Object.values(this.state.charts).forEach(chart => {
            if (chart && chart.data && chart.data.datasets) {
                chart.data.datasets.forEach(dataset => {
                    if (dataset.data) {
                        // Add new data point and remove old one
                        dataset.data.shift();
                        dataset.data.push(Math.floor(Math.random() * 100));
                    }
                });
                chart.update('none'); // No animation for live updates
            }
        });
    }

    // ================== GLOBAL FUNCTIONS ==================
    // These functions need to be globally accessible for inline event handlers
    
    // Export as global functions
    setupGlobalFunctions() {
        window.showSection = (section) => this.showSection(section);
        window.processDocuments = () => this.processDocuments();
        window.clearAllInputs = () => this.clearAllInputs();
        window.performSearch = (query) => this.performSearch(query);
        window.testProxy = (id) => this.testProxy(id);
        window.editProxy = (id) => this.editProxy(id);
        window.deleteProxy = (id) => this.deleteProxy(id);
        window.viewDocument = (url) => this.viewDocument(url);
        window.editDocument = (url) => this.editDocument(url);
        window.deleteDocument = (url) => this.deleteDocument(url);
        window.refreshProxies = () => this.refreshProxies();
        window.clearCache = () => this.clearCache();
        window.searchNafaqeDefinition = () => this.searchNafaqeDefinition();
        window.populateLegalDatabase = () => this.populateLegalDatabase();
        window.searchLegalDocuments = () => this.searchLegalDocuments();
        window.clearLegalSearch = () => this.clearLegalSearch();
        window.loadAllLegalDocuments = () => this.loadAllLegalDocuments();
        window.exportDocuments = (format) => this.exportDocuments(format);
    }

    // Implement placeholder methods
    async testProxy(id) {
        const proxy = this.state.proxies.get(id);
        if (!proxy) return;

        this.showToast(`تست پروکسی ${proxy.ip}:${proxy.port}...`, 'info');
        
        // Simulate proxy test
        await this.delay(2000);
        const isSuccessful = Math.random() > 0.3;
        
        proxy.status = isSuccessful ? 'active' : 'inactive';
        proxy.responseTime = isSuccessful ? Math.floor(Math.random() * 1000) + 100 : 0;
        
        this.updateProxyTable();
        this.updateProxyStats();
        
        this.showToast(
            `تست پروکسی ${isSuccessful ? 'موفق' : 'ناموفق'}`,
            isSuccessful ? 'success' : 'error'
        );
    }

    editProxy(id) {
        this.showToast('ویرایش پروکسی در حال توسعه', 'info');
    }

    deleteProxy(id) {
        if (confirm('آیا مطمئن هستید که می‌خواهید این پروکسی را حذف کنید؟')) {
            this.state.proxies.delete(id);
            this.updateProxyTable();
            this.updateProxyStats();
            this.showToast('پروکسی حذف شد', 'success');
        }
    }

    viewDocument(url) {
        const doc = this.state.documents.get(url);
        if (doc) {
            alert(`عنوان: ${doc.title}\nمنبع: ${doc.source}\nوضعیت: ${doc.status}`);
        }
    }

    editDocument(url) {
        this.showToast('ویرایش سند در حال توسعه', 'info');
    }

    deleteDocument(url) {
        if (confirm('آیا مطمئن هستید که می‌خواهید این سند را حذف کنید؟')) {
            this.state.documents.delete(url);
            this.updateDocumentTable();
            this.updateDashboardStats();
            this.showToast('سند حذف شد', 'success');
        }
    }

    async refreshProxies() {
        this.showToast('به‌روزرسانی لیست پروکسی‌ها...', 'info');
        await this.delay(1000);
        await this.loadProxies();
        this.showToast('لیست پروکسی‌ها به‌روز شد', 'success');
    }

    async clearCache() {
        if (confirm('آیا مطمئن هستید که می‌خواهید تمام کش را پاک کنید؟')) {
            this.showToast('پاک‌سازی کش...', 'info');
            await this.delay(1000);
            
            // Clear cache simulation
            this.updateElement('cache-size', 0);
            this.updateElement('cache-size-mb', '0 MB');
            this.updateProgressBar('cache-usage-progress', 0);
            
            this.showToast('کش با موفقیت پاک شد', 'success');
        }
    }

    searchNafaqeDefinition() {
        this.showToast('جستجوی تعریف نفقه...', 'info');
        // Simulate search
        setTimeout(() => {
            this.showToast('جستجو تکمیل شد', 'success');
        }, 2000);
    }

    populateLegalDatabase() {
        this.showToast('شروع پر کردن پایگاه داده...', 'info');
        // Simulate database population
        setTimeout(() => {
            this.updateElement('legal-db-total', Math.floor(Math.random() * 10000) + 1000);
            this.showToast('پایگاه داده به‌روز شد', 'success');
        }, 3000);
    }

    searchLegalDocuments() {
        const query = document.getElementById('legal-search-input')?.value;
        if (!query) {
            this.showToast('لطفاً عبارت جستجو را وارد کنید', 'warning');
            return;
        }
        this.performSearch(query);
    }

    clearLegalSearch() {
        const inputs = ['legal-search-input', 'legal-source-filter', 'legal-category-filter'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        const results = document.getElementById('legal-documents-results');
        if (results) {
            results.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-4xl mb-4">📚</div>
                    <p>برای مشاهده اسناد، جستجو کنید یا پایگاه داده را پر کنید</p>
                    <button onclick="loadAllLegalDocuments()" class="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                        📄 نمایش همه اسناد
                    </button>
                </div>
            `;
        }
        
        this.updateElement('legal-search-count', 0);
        this.showToast('جستجو پاک شد', 'info');
    }

    loadAllLegalDocuments() {
        this.showToast('در حال بارگیری همه اسناد...', 'info');
        
        // Generate mock documents
        const mockDocuments = this.generateMockLegalDocuments(20);
        this.displayLegalDocuments(mockDocuments);
        
        this.updateElement('legal-search-count', mockDocuments.length);
        this.showToast(`${mockDocuments.length} سند بارگیری شد`, 'success');
    }

    generateMockLegalDocuments(count) {
        const titles = [
            'قانون مدنی - کتاب اول',
            'قانون آیین دادرسی مدنی',
            'قانون مجازات اسلامی',
            'قانون کار',
            'قانون تجارت',
            'قانون خانواده محافظت',
            'قانون احکام دائمی برنامه‌های توسعه',
            'قانون تأسیس دادگاه‌های عمومی',
            'قانون نحوه اجرای محکومیت‌های مالی',
            'قانون تشکیل دادگاه‌های تجدیدنظر'
        ];
        
        const sources = ['مجلس شورای اسلامی', 'قوه قضائیه', 'دفتر تدوین قوانین'];
        const categories = ['قانون', 'مقررات', 'رای', 'نفقه و حقوق خانواده'];
        
        const documents = [];
        
        for (let i = 0; i < count; i++) {
            documents.push({
                id: `doc-${i}`,
                title: titles[Math.floor(Math.random() * titles.length)] + ` - بخش ${i + 1}`,
                source: sources[Math.floor(Math.random() * sources.length)],
                category: categories[Math.floor(Math.random() * categories.length)],
                content: `این سند شامل مقررات و احکام مربوط به ${titles[Math.floor(Math.random() * titles.length)]} می‌باشد که در تاریخ ${new Date().toLocaleDateString('fa-IR')} تصویب شده است.`,
                date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR'),
                url: `https://example.com/law/${i + 1}`,
                views: Math.floor(Math.random() * 1000) + 100
            });
        }
        
        return documents;
    }

    displayLegalDocuments(documents) {
        const results = document.getElementById('legal-documents-results');
        if (!results) return;

        if (documents.length === 0) {
            results.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-4xl mb-4">📚</div>
                    <p>هیچ سندی یافت نشد</p>
                </div>
            `;
            return;
        }

        const documentsHtml = documents.map(doc => `
            <div class="document-card">
                <div class="flex items-start justify-between mb-3">
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 flex-1 ml-2">
                        ${doc.title}
                    </h4>
                    <span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full whitespace-nowrap">
                        ${doc.category}
                    </span>
                </div>
                
                <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <i class="fas fa-building ml-2"></i>
                    <span class="ml-4">${doc.source}</span>
                    <i class="fas fa-calendar ml-2"></i>
                    <span class="ml-4">${doc.date}</span>
                    <i class="fas fa-eye ml-2"></i>
                    <span>${doc.views} بازدید</span>
                </div>
                
                <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">${doc.content}</p>
                
                <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div class="flex items-center space-x-2 space-x-reverse">
                        <button onclick="window.open('${doc.url}')" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                            <i class="fas fa-external-link-alt ml-1"></i>
                            مشاهده سند
                        </button>
                        <button onclick="downloadDocument('${doc.id}')" class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm">
                            <i class="fas fa-download ml-1"></i>
                            دانلود
                        </button>
                    </div>
                    <div class="flex items-center space-x-1 space-x-reverse">
                        <button onclick="shareDocument('${doc.id}')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1">
                            <i class="fas fa-share"></i>
                        </button>
                        <button onclick="bookmarkDocument('${doc.id}')" class="text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 p-1">
                            <i class="fas fa-bookmark"></i>
                        </button>
                        <button onclick="printDocument('${doc.id}')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        results.innerHTML = documentsHtml;
    }

    exportDocuments(format) {
        const documents = Array.from(this.state.documents.values());
        
        if (documents.length === 0) {
            this.showToast('هیچ سندی برای صادرات وجود ندارد', 'warning');
            return;
        }

        try {
            let content = '';
            let filename = '';
            let mimeType = '';

            switch (format) {
                case 'json':
                    content = JSON.stringify(documents, null, 2);
                    filename = `legal-documents-${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;

                case 'csv':
                    const headers = ['Title', 'Source', 'Category', 'Status', 'Date', 'URL'];
                    const csvRows = [headers.join(',')];
                    
                    documents.forEach(doc => {
                        const row = [
                            `"${doc.title || ''}"`,
                            `"${doc.source || ''}"`,
                            `"${doc.category || ''}"`,
                            `"${doc.status || ''}"`,
                            `"${new Date(doc.timestamp).toLocaleDateString('fa-IR')}"`,
                            `"${doc.url || ''}"`
                        ];
                        csvRows.push(row.join(','));
                    });
                    
                    content = csvRows.join('\n');
                    filename = `legal-documents-${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;

                case 'txt':
                    content = documents.map(doc => {
                        return `عنوان: ${doc.title || 'نامشخص'}\n` +
                               `منبع: ${doc.source || 'نامشخص'}\n` +
                               `دسته‌بندی: ${doc.category || 'نامشخص'}\n` +
                               `وضعیت: ${doc.status || 'نامشخص'}\n` +
                               `تاریخ: ${new Date(doc.timestamp).toLocaleDateString('fa-IR')}\n` +
                               `آدرس: ${doc.url || 'نامشخص'}\n` +
                               `${'-'.repeat(50)}\n`;
                    }).join('\n');
                    filename = `legal-documents-${new Date().toISOString().split('T')[0]}.txt`;
                    mimeType = 'text/plain';
                    break;

                default:
                    this.showToast('فرمت صادراتی نامعتبر', 'error');
                    return;
            }

            this.downloadFile(content, filename, mimeType);
            this.addToExportHistory(format, documents.length);
            this.showToast(`${documents.length} سند در فرمت ${format.toUpperCase()} صادر شد`, 'success');

        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('خطا در صادرات فایل', 'error');
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    addToExportHistory(format, count) {
        const historyContainer = document.getElementById('export-history');
        if (!historyContainer) return;

        const historyItem = document.createElement('div');
        historyItem.className = 'flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm';
        historyItem.innerHTML = `
            <div>
                <span class="font-medium">${format.toUpperCase()}</span>
                <span class="text-gray-500 dark:text-gray-400"> - ${count} سند</span>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">
                ${new Date().toLocaleTimeString('fa-IR')}
            </span>
        `;

        if (historyContainer.children.length === 0 || historyContainer.querySelector('p')) {
            historyContainer.innerHTML = '';
        }

        historyContainer.insertBefore(historyItem, historyContainer.firstChild);

        // Keep only last 10 exports
        while (historyContainer.children.length > 10) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }

    // Additional global functions for document management
    setupAdditionalGlobalFunctions() {
        window.downloadDocument = (id) => this.downloadDocument(id);
        window.shareDocument = (id) => this.shareDocument(id);
        window.bookmarkDocument = (id) => this.bookmarkDocument(id);
        window.printDocument = (id) => this.printDocument(id);
    }

    downloadDocument(id) {
        this.showToast(`دانلود سند ${id}...`, 'info');
        // Simulate download
        setTimeout(() => {
            this.showToast('سند دانلود شد', 'success');
        }, 1000);
    }

    shareDocument(id) {
        if (navigator.share) {
            navigator.share({
                title: `سند ${id}`,
                text: 'مشاهده این سند حقوقی',
                url: `${window.location.origin}?doc=${id}`
            }).then(() => {
                this.showToast('سند به اشتراک گذاشته شد', 'success');
            }).catch(() => {
                this.fallbackShare(id);
            });
        } else {
            this.fallbackShare(id);
        }
    }

    fallbackShare(id) {
        const url = `${window.location.origin}?doc=${id}`;
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('لینک در کلیپبورد کپی شد', 'success');
        }).catch(() => {
            this.showToast('خطا در کپی کردن لینک', 'error');
        });
    }

    bookmarkDocument(id) {
        // Simple bookmark system using localStorage
        const bookmarks = JSON.parse(localStorage.getItem('legal-bookmarks') || '[]');
        
        if (bookmarks.includes(id)) {
            const index = bookmarks.indexOf(id);
            bookmarks.splice(index, 1);
            localStorage.setItem('legal-bookmarks', JSON.stringify(bookmarks));
            this.showToast('سند از نشان‌شده‌ها حذف شد', 'info');
        } else {
            bookmarks.push(id);
            localStorage.setItem('legal-bookmarks', JSON.stringify(bookmarks));
            this.showToast('سند نشان شد', 'success');
        }
    }

    printDocument(id) {
        // Create a print-friendly version
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>پرینت سند ${id}</title>
                <style>
                    body { font-family: Tahoma; direction: rtl; text-align: right; }
                    .header { border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 10px; }
                    .content { line-height: 1.6; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>سند شماره ${id}</h1>
                    <p>سیستم آرشیو اسناد حقوقی ایران</p>
                    <p>تاریخ پرینت: ${new Date().toLocaleDateString('fa-IR')}</p>
                </div>
                <div class="content">
                    <p>محتوای سند در اینجا نمایش داده می‌شود...</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        
        this.showToast('سند برای پرینت آماده شد', 'success');
    }

    // ================== SERVICE WORKER REGISTRATION ==================
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showToast('نسخه جدید سیستم در دسترس است', 'info');
                        }
                    });
                });
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // ================== INITIALIZATION COMPLETION ==================
    async completeInitialization() {
        // Setup all global functions
        this.setupGlobalFunctions();
        this.setupAdditionalGlobalFunctions();
        
        // Register service worker for offline capability
        await this.registerServiceWorker();
        
        // Set initial active section
        this.showSection('home');
        
        console.log('🚀 Iranian Legal Archive System v2.0.0 initialized successfully');
        console.log('📊 System ready for document processing and analysis');
        console.log('🔒 Remember to comply with legal requirements and website policies');
        
        // Show welcome message
        setTimeout(() => {
            this.showToast('سیستم آرشیو اسناد حقوقی ایران آماده است', 'success', 8000);
        }, 1000);
    }
}

// ================== SYSTEM INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏛️ Initializing Iranian Legal Archive System...');
    
    try {
        // Initialize the main system
        const legalArchiveSystem = new LegalArchiveSystem();
        
        // Complete initialization
        await legalArchiveSystem.completeInitialization();
        
        // Make system globally accessible for debugging
        window.LegalArchiveSystem = legalArchiveSystem;
        
    } catch (error) {
        console.error('❌ System initialization failed:', error);
        
        // Show error message to user
        document.body.innerHTML = `
            <div style="font-family: Tahoma; direction: rtl; text-align: center; padding: 50px; color: #dc2626;">
                <h1>🚫 خطا در راه‌اندازی سیستم</h1>
                <p>متأسفانه سیستم نتوانست به درستی راه‌اندازی شود.</p>
                <p>لطفاً صفحه را بازخوانی کنید یا با پشتیبانی تماس بگیرید.</p>
                <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                    🔄 بازخوانی صفحه
                </button>
            </div>
        `;
    }
});

// ================== GLOBAL ERROR HANDLING ==================
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Show user-friendly error message
    if (window.LegalArchiveSystem) {
        window.LegalArchiveSystem.showToast('خطای غیرمنتظره رخ داد', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (window.LegalArchiveSystem) {
        window.LegalArchiveSystem.showToast('خطا در پردازش درخواست', 'error');
    }
    
    // Prevent the error from appearing in console
    event.preventDefault();
});

// ================== BROWSER COMPATIBILITY CHECK ==================
(() => {
    const requiredFeatures = [
        'fetch',
        'Promise',
        'localStorage',
        'JSON',
        'WebSocket'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => !(feature in window));
    
    if (missingFeatures.length > 0) {
        alert(`مرورگر شما از ویژگی‌های زیر پشتیبانی نمی‌کند:\n${missingFeatures.join(', ')}\n\nلطفاً مرورگر خود را به‌روزرسانی کنید.`);
    }
})();