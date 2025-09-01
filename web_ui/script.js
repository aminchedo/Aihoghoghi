/**
 * Iranian Legal Archive System - Advanced JavaScript
 * Handles all UI interactions, API calls, real-time updates, and data visualization
 */

// Global state management
const AppState = {
    isProcessing: false,
    currentSection: 'home',
    theme: localStorage.getItem('theme') || 'light',
    searchTerm: '',
    documents: [],
    systemStats: {},
    charts: {},
    websocket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
};

// API Base URL
const API_BASE = window.location.origin + '/api';

// Utility Functions
class Utils {
    static async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            this.showToast(`خطا در ارتباط با سرور: ${error.message}`, 'error');
            throw error;
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

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iranian Legal Archive System - Web UI Initialized');
    
    // Initialize all managers
    ThemeManager.init();
    NavigationManager.init();
    SystemMonitor.init();
    DocumentProcessor.init();
    WebSocketManager.init();
    
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
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}