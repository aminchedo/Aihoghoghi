/**
 * Enhanced Iranian Legal Archive System - Main JavaScript
 * Handles UI interactions, API calls, and real-time updates
 */

class IranianLegalArchiveUI {
    constructor() {
        this.apiBase = '/api';
        this.isProcessing = false;
        this.statusUpdateInterval = null;
        this.charts = {};
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.startStatusUpdates();
        this.setupTheme();
        this.updateClock();
        
        // Update clock every second
        setInterval(() => this.updateClock(), 1000);
        
        console.log('Iranian Legal Archive System initialized');
    }

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Refresh dashboard
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Process URLs form
        const processForm = document.getElementById('process-urls-form');
        if (processForm) {
            processForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processUrls();
            });
        }

        // Clear cache button
        const clearCacheBtn = document.getElementById('clear-cache-btn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => this.clearCache());
        }

        // Test proxies button
        const testProxiesBtn = document.getElementById('test-proxies-btn');
        if (testProxiesBtn) {
            testProxiesBtn.addEventListener('click', () => this.testAllProxies());
        }

        // Update proxies button
        const updateProxiesBtn = document.getElementById('update-proxies-btn');
        if (updateProxiesBtn) {
            updateProxiesBtn.addEventListener('click', () => this.updateProxies());
        }
    }

    /**
     * Load initial data when page loads
     */
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadSystemStatus(),
                this.loadStatistics(),
                this.loadNetworkStatus(),
                this.loadRecentDocuments()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('خطا در بارگذاری داده‌های اولیه', 'error');
        }
    }

    /**
     * Load system status
     */
    async loadSystemStatus() {
        try {
            const response = await fetch(`${this.apiBase}/status`);
            const data = await response.json();
            
            this.updateStatusCards(data);
            this.updateProcessingStatus(data);
            
        } catch (error) {
            console.error('Error loading system status:', error);
        }
    }

    /**
     * Load detailed statistics
     */
    async loadStatistics() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            const data = await response.json();
            
            this.updateStatistics(data);
            
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    /**
     * Load network status
     */
    async loadNetworkStatus() {
        try {
            const response = await fetch(`${this.apiBase}/network`);
            const data = await response.json();
            
            this.updateNetworkStatus(data);
            
        } catch (error) {
            console.error('Error loading network status:', error);
        }
    }

    /**
     * Load recent documents
     */
    async loadRecentDocuments(limit = 10) {
        try {
            const response = await fetch(`${this.apiBase}/documents?limit=${limit}`);
            const data = await response.json();
            
            this.updateDocumentsList(data.documents);
            
        } catch (error) {
            console.error('Error loading recent documents:', error);
        }
    }

    /**
     * Update status cards on dashboard
     */
    updateStatusCards(data) {
        // Update main metrics
        this.updateElement('total-operations', data.total_operations || 0);
        this.updateElement('successful-operations', data.successful_operations || 0);
        this.updateElement('active-proxies', data.active_proxies || 0);
        this.updateElement('cache-size', data.cache_size || 0);

        // Update progress bars
        this.updateProgressBar('total-operations-progress', (data.total_operations / 1000) * 100);
        this.updateProgressBar('success-rate-progress', data.success_rate || 0);
        this.updateProgressBar('proxy-health-progress', data.proxy_health || 0);
        this.updateProgressBar('cache-usage-progress', data.cache_usage || 0);

        // Update quick stats in sidebar
        this.updateElement('quick-proxy-count', data.active_proxies || 0);
        this.updateElement('quick-cache-count', data.cache_size || 0);
        this.updateElement('quick-success-count', data.successful_operations || 0);

        // Update success rate display
        this.updateElement('success-rate', `${data.success_rate || 0}%`);
        
        // Update proxy health status
        const proxyHealth = data.proxy_health || 0;
        let healthStatus = 'سالم';
        if (proxyHealth < 50) healthStatus = 'ضعیف';
        else if (proxyHealth < 80) healthStatus = 'متوسط';
        
        this.updateElement('proxy-health', healthStatus);
    }

    /**
     * Update processing status
     */
    updateProcessingStatus(data) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (statusIndicator && statusText) {
            if (data.is_processing) {
                statusIndicator.className = 'w-3 h-3 bg-yellow-500 rounded-full animate-pulse';
                statusText.textContent = 'در حال پردازش';
            } else {
                statusIndicator.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse';
                statusText.textContent = 'آماده';
            }
        }

        // Update processing progress if visible
        const progressSection = document.getElementById('processing-progress');
        if (progressSection) {
            if (data.is_processing) {
                progressSection.classList.remove('hidden');
                this.updateProgressBar('processing-progress-bar', data.progress || 0);
                this.updateElement('processing-status-text', data.message || 'در حال پردازش...');
            } else if (!this.isProcessing) {
                progressSection.classList.add('hidden');
            }
        }
    }

    /**
     * Update statistics displays
     */
    updateStatistics(data) {
        // Update category statistics
        const categoryStats = data.category_stats || {};
        this.updateStatsChart('category-chart', categoryStats, 'دسته‌بندی اسناد');

        // Update source statistics  
        const sourceStats = data.source_stats || {};
        this.updateStatsChart('source-chart', sourceStats, 'منابع اسناد');

        // Update average quality
        this.updateElement('avg-quality', `${data.avg_quality || 0}%`);
    }

    /**
     * Update network status display
     */
    updateNetworkStatus(data) {
        const proxyManager = data.proxy_manager || {};
        
        this.updateElement('total-proxies', proxyManager.total_proxies || 0);
        this.updateElement('active-proxies-count', proxyManager.active_proxies || 0);
        this.updateElement('failed-proxies', proxyManager.failed_proxies || 0);
        this.updateElement('avg-response-time', `${proxyManager.avg_response_time || 0}ms`);

        // Update proxies list
        if (data.proxies) {
            this.updateProxiesList(data.proxies);
        }
    }

    /**
     * Update documents list
     */
    updateDocumentsList(documents) {
        const container = document.getElementById('recent-documents-list');
        if (!container) return;

        if (!documents || documents.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">هیچ سندی یافت نشد</p>';
            return;
        }

        const documentsHtml = documents.map(doc => `
            <div class="card document-card">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-lg">${this.escapeHtml(doc.title)}</h4>
                    <span class="status-indicator ${this.getQualityClass(doc.quality_score)}">
                        ${Math.round(doc.quality_score * 100)}%
                    </span>
                </div>
                <p class="text-secondary text-sm mb-2">${this.escapeHtml(doc.classification)}</p>
                <div class="flex justify-between items-center text-xs text-secondary">
                    <span>${this.escapeHtml(doc.source)}</span>
                    <span>${doc.word_count} کلمه</span>
                    <span>${this.formatDate(doc.timestamp)}</span>
                </div>
                <div class="mt-2">
                    <a href="${doc.url}" target="_blank" class="text-primary hover:underline text-sm">
                        مشاهده سند اصلی
                    </a>
                </div>
            </div>
        `).join('');

        container.innerHTML = documentsHtml;
    }

    /**
     * Update proxies list
     */
    updateProxiesList(proxies) {
        const container = document.getElementById('proxies-list');
        if (!container) return;

        const proxiesHtml = proxies.map(proxy => `
            <div class="card">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-medium">${proxy.host}:${proxy.port}</div>
                        <div class="text-sm text-secondary">${proxy.protocol.toUpperCase()}</div>
                    </div>
                    <div class="text-right">
                        <span class="status-indicator ${this.getProxyStatusClass(proxy.status)}">
                            ${this.getProxyStatusText(proxy.status)}
                        </span>
                        ${proxy.response_time ? `<div class="text-xs text-secondary mt-1">${proxy.response_time}ms</div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = proxiesHtml;
    }

    /**
     * Process URLs from form
     */
    async processUrls() {
        const urlsInput = document.getElementById('urls-input');
        if (!urlsInput) return;

        const urlsText = urlsInput.value.trim();
        if (!urlsText) {
            this.showToast('لطفا URL‌ها را وارد کنید', 'warning');
            return;
        }

        const urls = urlsText.split('\n').filter(url => url.trim());
        if (urls.length === 0) {
            this.showToast('هیچ URL معتبری یافت نشد', 'warning');
            return;
        }

        try {
            this.isProcessing = true;
            this.showProcessingStatus();

            const response = await fetch(`${this.apiBase}/process-urls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ urls })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(data.message, 'success');
                this.startProcessingMonitor();
            } else {
                this.showToast(data.message, 'error');
                this.isProcessing = false;
                this.hideProcessingStatus();
            }

        } catch (error) {
            console.error('Error processing URLs:', error);
            this.showToast('خطا در پردازش URL‌ها', 'error');
            this.isProcessing = false;
            this.hideProcessingStatus();
        }
    }

    /**
     * Clear cache
     */
    async clearCache() {
        if (!confirm('آیا از پاکسازی کش اطمینان دارید؟')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/cache`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(data.message, 'success');
                this.loadSystemStatus();
            } else {
                this.showToast('خطا در پاکسازی کش', 'error');
            }

        } catch (error) {
            console.error('Error clearing cache:', error);
            this.showToast('خطا در پاکسازی کش', 'error');
        }
    }

    /**
     * Test all proxies
     */
    async testAllProxies() {
        try {
            const response = await fetch(`${this.apiBase}/network/test-all`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(data.message, 'success');
            } else {
                this.showToast('خطا در تست پروکسی‌ها', 'error');
            }

        } catch (error) {
            console.error('Error testing proxies:', error);
            this.showToast('خطا در تست پروکسی‌ها', 'error');
        }
    }

    /**
     * Update proxies
     */
    async updateProxies() {
        try {
            const response = await fetch(`${this.apiBase}/network/update-proxies`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(data.message, 'success');
            } else {
                this.showToast('خطا در بروزرسانی پروکسی‌ها', 'error');
            }

        } catch (error) {
            console.error('Error updating proxies:', error);
            this.showToast('خطا در بروزرسانی پروکسی‌ها', 'error');
        }
    }

    /**
     * Show processing status
     */
    showProcessingStatus() {
        const progressSection = document.getElementById('processing-progress');
        if (progressSection) {
            progressSection.classList.remove('hidden');
        }
    }

    /**
     * Hide processing status
     */
    hideProcessingStatus() {
        const progressSection = document.getElementById('processing-progress');
        if (progressSection) {
            progressSection.classList.add('hidden');
        }
    }

    /**
     * Start monitoring processing progress
     */
    startProcessingMonitor() {
        const monitorInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiBase}/status`);
                const data = await response.json();

                this.updateProcessingStatus(data);

                if (!data.is_processing) {
                    clearInterval(monitorInterval);
                    this.isProcessing = false;
                    this.loadSystemStatus();
                    this.loadRecentDocuments();
                }

            } catch (error) {
                console.error('Error monitoring progress:', error);
                clearInterval(monitorInterval);
                this.isProcessing = false;
            }
        }, 2000); // Check every 2 seconds
    }

    /**
     * Start periodic status updates
     */
    startStatusUpdates() {
        // Update status every 30 seconds
        this.statusUpdateInterval = setInterval(() => {
            if (!this.isProcessing) {
                this.loadSystemStatus();
            }
        }, 30000);
    }

    /**
     * Refresh dashboard
     */
    async refreshDashboard() {
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.classList.add('animate-spin');
        }

        try {
            await this.loadInitialData();
            this.updateElement('last-refresh', this.getCurrentTime());
            this.showToast('داشبورد بروزرسانی شد', 'success');
        } catch (error) {
            this.showToast('خطا در بروزرسانی داشبورد', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove('animate-spin');
            }
        }
    }

    /**
     * Show section (navigation)
     */
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    /**
     * Setup theme
     */
    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);

        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    /**
     * Update clock
     */
    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fa-IR');
        const dateString = now.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        this.updateElement('current-time', timeString);
        this.updateElement('current-date', dateString);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type} animate-slide-up`;
        toast.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i class="fas ${this.getToastIcon(type)}"></i>
                    <span>${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-secondary hover:text-primary">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    /**
     * Create toast container if it doesn't exist
     */
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    /**
     * Get toast icon based on type
     */
    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Update element content safely
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Update progress bar
     */
    updateProgressBar(id, percentage) {
        const progressBar = document.getElementById(id);
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    /**
     * Update statistics chart
     */
    updateStatsChart(chartId, data, title) {
        const canvas = document.getElementById(chartId);
        if (!canvas) return;

        // Destroy existing chart if it exists
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
        }

        // Create new chart
        const ctx = canvas.getContext('2d');
        this.charts[chartId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }

    /**
     * Get quality class based on score
     */
    getQualityClass(score) {
        if (score >= 0.8) return 'status-success';
        if (score >= 0.6) return 'status-info';
        if (score >= 0.4) return 'status-warning';
        return 'status-error';
    }

    /**
     * Get proxy status class
     */
    getProxyStatusClass(status) {
        const classes = {
            active: 'status-success',
            failed: 'status-error',
            untested: 'status-warning'
        };
        return classes[status] || 'status-info';
    }

    /**
     * Get proxy status text
     */
    getProxyStatusText(status) {
        const texts = {
            active: 'فعال',
            failed: 'خراب',
            untested: 'تست نشده'
        };
        return texts[status] || 'نامشخص';
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fa-IR');
        } catch {
            return dateString;
        }
    }

    /**
     * Get current time string
     */
    getCurrentTime() {
        return new Date().toLocaleTimeString('fa-IR');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.legalArchiveUI = new IranianLegalArchiveUI();
});

// Global functions for inline event handlers
function processUrls() {
    if (window.legalArchiveUI) {
        window.legalArchiveUI.processUrls();
    }
}

function clearCache() {
    if (window.legalArchiveUI) {
        window.legalArchiveUI.clearCache();
    }
}

function refreshProxies() {
    if (window.legalArchiveUI) {
        window.legalArchiveUI.testAllProxies();
    }
}

function showSection(section) {
    if (window.legalArchiveUI) {
        window.legalArchiveUI.showSection(section);
    }
}