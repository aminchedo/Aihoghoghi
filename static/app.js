/**
 * Iranian Legal Archive System - Frontend JavaScript
 * Advanced web application for legal document processing
 */

class LegalArchiveApp {
    constructor() {
        this.ws = null;
        this.isProcessing = false;
        this.currentResults = [];
        this.charts = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupWebSocket();
        this.setupTabs();
        this.loadInitialData();
        this.setupThemeToggle();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Input method toggle
        document.getElementById('manual-input-btn').addEventListener('click', () => this.switchInputMethod('manual'));
        document.getElementById('file-input-btn').addEventListener('click', () => this.switchInputMethod('file'));

        // File upload
        document.getElementById('file-upload').addEventListener('change', (e) => this.handleFileUpload(e));

        // Processing controls
        document.getElementById('start-processing').addEventListener('click', () => this.startProcessing());
        document.getElementById('stop-processing').addEventListener('click', () => this.stopProcessing());
        document.getElementById('clear-results').addEventListener('click', () => this.clearResults());

        // Export buttons
        document.getElementById('export-json').addEventListener('click', () => this.exportData('json'));
        document.getElementById('export-csv').addEventListener('click', () => this.exportData('csv'));

        // Search
        document.getElementById('search-btn').addEventListener('click', () => this.performSearch());
        document.getElementById('search-query').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Proxy management
        document.getElementById('update-proxies').addEventListener('click', () => this.updateProxies());

        // Cache management
        document.getElementById('clear-old-cache').addEventListener('click', () => this.clearCache(false));
        document.getElementById('clear-all-cache').addEventListener('click', () => this.clearCache(true));

        // Drag and drop for file upload
        this.setupDragAndDrop();
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.updateConnectionStatus(true);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            } catch (e) {
                console.error('WebSocket message parsing error:', e);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus(false);
            // Attempt to reconnect after 3 seconds
            setTimeout(() => this.setupWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus(false);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'progress':
                this.updateProgress(data);
                break;
            case 'success':
                this.addResult(data.result);
                break;
            case 'error':
                this.handleProcessingError(data);
                break;
            case 'completed':
                this.handleProcessingCompleted(data);
                break;
            case 'info':
                this.showToast('info', data.message);
                break;
            case 'proxy_progress':
                this.updateProxyProgress(data);
                break;
            case 'proxy_completed':
                this.handleProxyUpdateCompleted(data);
                break;
        }
    }

    setupTabs() {
        // Initialize first tab as active
        this.switchTab('process');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    switchInputMethod(method) {
        // Update buttons
        document.querySelectorAll('.input-method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${method}-input-btn`).classList.add('active');

        // Update content
        document.querySelectorAll('.input-method').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${method}-input`).classList.add('active');
    }

    setupDragAndDrop() {
        const dropArea = document.getElementById('file-input');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('dragover');
            });
        });

        dropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('file-upload').files = files;
                this.handleFileUpload({ target: { files: files } });
            }
        });
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload-urls', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('file-details').textContent = 
                    `فایل ${file.name} بارگذاری شد - ${data.count} آدرس یافت شد`;
                document.getElementById('file-info').classList.remove('hidden');
                
                // Populate textarea with URLs
                document.getElementById('urls-textarea').value = data.urls.join('\n');
                
                this.showToast('success', `${data.count} آدرس از فایل استخراج شد`);
            } else {
                this.showToast('error', data.detail || 'خطا در بارگذاری فایل');
            }
        } catch (error) {
            this.showToast('error', 'خطا در ارتباط با سرور');
        }
    }

    async startProcessing() {
        if (this.isProcessing) return;

        const urls = this.getUrls();
        if (urls.length === 0) {
            this.showToast('warning', 'لطفاً آدرس‌هایی برای پردازش وارد کنید');
            return;
        }

        const useProxy = document.getElementById('use-proxy').value === 'true';
        const batchSize = parseInt(document.getElementById('batch-size').value);
        const maxRetries = parseInt(document.getElementById('max-retries').value);

        try {
            const response = await fetch('/api/process-urls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    urls: urls,
                    use_proxy: useProxy,
                    batch_size: batchSize,
                    max_retries: maxRetries
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.isProcessing = true;
                this.updateProcessingUI(true);
                this.clearResults();
                this.showToast('success', `پردازش ${urls.length} آدرس شروع شد`);
            } else {
                this.showToast('error', data.detail || 'خطا در شروع پردازش');
            }
        } catch (error) {
            this.showToast('error', 'خطا در ارتباط با سرور');
        }
    }

    stopProcessing() {
        this.isProcessing = false;
        this.updateProcessingUI(false);
        this.showToast('info', 'پردازش متوقف شد');
    }

    clearResults() {
        this.currentResults = [];
        document.getElementById('results-container').innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <div class="text-4xl mb-2">📄</div>
                <p>نتایج پردازش اینجا نمایش داده می‌شود</p>
            </div>
        `;
        
        // Reset counters
        document.getElementById('success-count').textContent = '0';
        document.getElementById('error-count').textContent = '0';
        document.getElementById('progress-percentage').textContent = '0%';
        document.getElementById('progress-bar').style.width = '0%';
    }

    getUrls() {
        const textarea = document.getElementById('urls-textarea');
        return textarea.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));
    }

    updateProcessingUI(isProcessing) {
        document.getElementById('start-processing').classList.toggle('hidden', isProcessing);
        document.getElementById('stop-processing').classList.toggle('hidden', !isProcessing);
        
        // Disable form controls during processing
        const controls = ['urls-textarea', 'use-proxy', 'batch-size', 'max-retries'];
        controls.forEach(id => {
            document.getElementById(id).disabled = isProcessing;
        });
    }

    updateProgress(data) {
        const percentage = Math.round((data.batch / data.total_batches) * 100);
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        document.getElementById('progress-bar').style.width = `${percentage}%`;
        document.getElementById('current-url').textContent = data.message;
    }

    addResult(result) {
        this.currentResults.push(result);
        this.updateResultsDisplay();
        this.updateCounters();
    }

    updateResultsDisplay() {
        if (this.currentResults.length === 0) return;

        const container = document.getElementById('results-container');
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>آدرس</th>
                            <th>عنوان</th>
                            <th>وضعیت</th>
                            <th>دسته‌بندی</th>
                            <th>امتیاز کیفیت</th>
                            <th>زمان پردازش</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.currentResults.map(result => this.renderResultRow(result)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderResultRow(result) {
        const statusClass = result.status === 'success' ? 'status-success' : 'status-error';
        const qualityClass = this.getQualityClass(result.quality_score);
        
        return `
            <tr>
                <td>
                    <a href="${result.url}" target="_blank" class="text-primary-600 hover:text-primary-800 truncate block max-w-xs">
                        ${result.url}
                    </a>
                </td>
                <td class="max-w-xs truncate">${result.title || '-'}</td>
                <td><span class="${statusClass}">${result.status === 'success' ? 'موفق' : 'خطا'}</span></td>
                <td>${result.classification || '-'}</td>
                <td>
                    <span class="${qualityClass}">
                        ${result.quality_score ? Math.round(result.quality_score) : '-'}
                    </span>
                </td>
                <td>${result.processing_time ? Math.round(result.processing_time * 1000) + 'ms' : '-'}</td>
            </tr>
        `;
    }

    getQualityClass(score) {
        if (score >= 80) return 'quality-excellent';
        if (score >= 60) return 'quality-good';
        if (score >= 40) return 'quality-average';
        return 'quality-poor';
    }

    updateCounters() {
        const successCount = this.currentResults.filter(r => r.status === 'success').length;
        const errorCount = this.currentResults.filter(r => r.status !== 'success').length;
        
        document.getElementById('success-count').textContent = successCount;
        document.getElementById('error-count').textContent = errorCount;
    }

    handleProcessingError(data) {
        this.showToast('error', `خطا در پردازش ${data.url}: ${data.error}`);
    }

    handleProcessingCompleted(data) {
        this.isProcessing = false;
        this.updateProcessingUI(false);
        
        const message = `پردازش تکمیل شد - موفق: ${data.total_processed}, خطا: ${data.total_failed}`;
        this.showToast('success', message);
    }

    async exportData(format) {
        try {
            const response = await fetch(`/api/export/${format}`);
            
            if (response.ok) {
                if (format === 'json') {
                    const data = await response.json();
                    this.downloadJSON(data, 'legal_documents.json');
                } else if (format === 'csv') {
                    const blob = await response.blob();
                    this.downloadBlob(blob, 'legal_documents.csv');
                }
                
                this.showToast('success', `فایل ${format.toUpperCase()} دانلود شد`);
            } else {
                this.showToast('error', 'خطا در صادرات داده‌ها');
            }
        } catch (error) {
            this.showToast('error', 'خطا در ارتباط با سرور');
        }
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    async performSearch() {
        const query = document.getElementById('search-query').value.trim();
        const category = document.getElementById('search-category').value;
        
        if (!query) {
            this.showToast('warning', 'لطفاً عبارت جستجو را وارد کنید');
            return;
        }

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    category: category,
                    limit: 50
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.displaySearchResults(data);
            } else {
                this.showToast('error', 'خطا در جستجو');
            }
        } catch (error) {
            this.showToast('error', 'خطا در ارتباط با سرور');
        }
    }

    displaySearchResults(data) {
        const container = document.getElementById('search-results');
        
        if (data.results.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <div class="text-4xl mb-2">🔍</div>
                    <p>نتیجه‌ای یافت نشد</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="mb-4">
                <p class="text-sm text-gray-600">${data.total_matches} نتیجه برای "${data.query}" یافت شد</p>
            </div>
            <div class="space-y-4">
                ${data.results.map(result => this.renderSearchResult(result)).join('')}
            </div>
        `;
    }

    renderSearchResult(result) {
        const qualityClass = this.getQualityClass(result.quality_score);
        
        return `
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-lg">
                        <a href="${result.url}" target="_blank" class="text-primary-600 hover:text-primary-800">
                            ${result.title || 'بدون عنوان'}
                        </a>
                    </h3>
                    <span class="${qualityClass}">
                        ${result.quality_score ? Math.round(result.quality_score) : '-'}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-2">${result.content ? result.content.substring(0, 200) + '...' : ''}</p>
                <div class="flex justify-between items-center text-xs text-gray-500">
                    <span>دسته: ${result.classification || 'نامشخص'}</span>
                    <span>منبع: ${result.source || 'نامشخص'}</span>
                </div>
            </div>
        `;
    }

    async updateProxies() {
        try {
            const response = await fetch('/api/update-proxies', {
                method: 'POST'
            });

            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('proxy-update-progress').classList.remove('hidden');
                this.showToast('info', 'به‌روزرسانی پروکسی‌ها شروع شد');
            } else {
                this.showToast('error', 'خطا در شروع به‌روزرسانی پروکسی‌ها');
            }
        } catch (error) {
            this.showToast('error', 'خطا در ارتباط با سرور');
        }
    }

    updateProxyProgress(data) {
        const percentage = Math.round(data.progress * 100);
        document.getElementById('proxy-progress-percentage').textContent = `${percentage}%`;
        document.getElementById('proxy-progress-bar').style.width = `${percentage}%`;
        document.getElementById('proxy-progress-message').textContent = data.message;
    }

    handleProxyUpdateCompleted(data) {
        document.getElementById('proxy-update-progress').classList.add('hidden');
        this.showToast('success', `پروکسی‌ها به‌روزرسانی شدند - ${data.results.active_count} فعال`);
        this.loadTabData('proxy');
    }

    async clearCache(clearAll) {
        const hours = clearAll ? null : parseInt(document.getElementById('cache-hours').value);
        
        try {
            const response = await fetch('/api/cache', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    older_than_hours: hours
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showToast('success', 'کش پاک شد');
                this.loadTabData('dashboard');
            } else {
                this.showToast('error', 'خطا در پاک کردن کش');
            }
        } catch (error) {
            this.showToast('error', 'خطا در ارتباط با سرور');
        }
    }

    async loadInitialData() {
        await this.loadSystemStats();
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.loadSystemStats();
                break;
            case 'proxy':
                await this.loadProxyData();
                break;
        }
    }

    async loadSystemStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            if (response.ok) {
                this.updateSystemStats(data);
                this.updateQuickStats(data);
            }
        } catch (error) {
            console.error('Error loading system stats:', error);
        }
    }

    updateSystemStats(data) {
        // Update dashboard stats
        if (data.cache && data.cache.database_cache_size !== undefined) {
            document.getElementById('total-documents').textContent = data.cache.database_cache_size;
        }
        
        if (data.cache && data.cache.hit_rate_percent !== undefined) {
            document.getElementById('cache-hit-rate').textContent = data.cache.hit_rate_percent + '%';
        }

        // Update DNS status
        if (data.dns) {
            const dnsContainer = document.getElementById('dns-status');
            dnsContainer.innerHTML = `
                <div class="flex justify-between"><span>وضعیت:</span><span class="font-semibold">${data.dns.doh_available ? 'فعال' : 'غیرفعال'}</span></div>
                <div class="flex justify-between"><span>سرورهای ایرانی:</span><span class="font-semibold">${data.dns.iranian_doh_count}</span></div>
                <div class="flex justify-between"><span>سرورهای بین‌المللی:</span><span class="font-semibold">${data.dns.international_doh_count}</span></div>
            `;
        }

        // Update AI status
        if (data.ai) {
            const aiContainer = document.getElementById('ai-status');
            aiContainer.innerHTML = `
                <div class="flex justify-between"><span>وضعیت:</span><span class="font-semibold">${data.ai.is_ready ? 'آماده' : 'در حال بارگذاری'}</span></div>
                <div class="flex justify-between"><span>مدل‌های بارگذاری شده:</span><span class="font-semibold">${data.ai.models_loaded.length}</span></div>
                <div class="flex justify-between"><span>دسته‌ها:</span><span class="font-semibold">${data.ai.categories_count}</span></div>
            `;
        }

        // Update cache status
        if (data.cache) {
            const cacheContainer = document.getElementById('cache-status');
            cacheContainer.innerHTML = `
                <div class="flex justify-between"><span>حجم کش:</span><span class="font-semibold">${Math.round(data.cache.total_size_mb || 0)} MB</span></div>
                <div class="flex justify-between"><span>نرخ بازیابی:</span><span class="font-semibold">${data.cache.hit_rate_percent || 0}%</span></div>
                <div class="flex justify-between"><span>ورودی‌ها:</span><span class="font-semibold">${data.cache.database_cache_size || 0}</span></div>
            `;
        }
    }

    updateQuickStats(data) {
        // Update quick stats in process tab
        if (data.proxy && data.proxy.active_proxies !== undefined) {
            document.getElementById('active-proxies-count').textContent = data.proxy.active_proxies;
        }
        
        if (data.cache && data.cache.database_cache_size !== undefined) {
            document.getElementById('cache-entries-count').textContent = data.cache.database_cache_size;
        }
    }

    async loadProxyData() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            if (response.ok && data.proxy) {
                this.updateProxyStats(data.proxy);
                this.updateProxyChart(data.proxy);
            }
        } catch (error) {
            console.error('Error loading proxy data:', error);
        }
    }

    updateProxyStats(proxyData) {
        const container = document.getElementById('proxy-stats');
        container.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">${proxyData.active_proxies || 0}</div>
                    <div class="text-sm text-gray-600">فعال</div>
                </div>
                <div class="text-center p-4 bg-red-50 rounded-lg">
                    <div class="text-2xl font-bold text-red-600">${proxyData.failed_proxies || 0}</div>
                    <div class="text-sm text-gray-600">غیرفعال</div>
                </div>
            </div>
            <div class="mt-4 space-y-2 text-sm">
                <div class="flex justify-between">
                    <span>نرخ موفقیت:</span>
                    <span class="font-semibold">${Math.round(proxyData.success_rate || 0)}%</span>
                </div>
                <div class="flex justify-between">
                    <span>میانگین زمان پاسخ:</span>
                    <span class="font-semibold">${Math.round(proxyData.average_response_time || 0)}ms</span>
                </div>
                <div class="flex justify-between">
                    <span>آخرین به‌روزرسانی:</span>
                    <span class="font-semibold">${proxyData.last_update || 'هرگز'}</span>
                </div>
            </div>
        `;
    }

    updateProxyChart(proxyData) {
        const ctx = document.getElementById('proxy-chart').getContext('2d');
        
        if (this.charts.proxy) {
            this.charts.proxy.destroy();
        }

        this.charts.proxy = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['فعال', 'غیرفعال'],
                datasets: [{
                    data: [proxyData.active_proxies || 0, proxyData.failed_proxies || 0],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateConnectionStatus(isConnected) {
        const indicator = document.getElementById('status-indicator');
        const dot = indicator.querySelector('div');
        const text = indicator.querySelector('span');
        
        if (isConnected) {
            dot.className = 'w-3 h-3 bg-green-500 rounded-full ml-2';
            text.textContent = 'آماده';
        } else {
            dot.className = 'w-3 h-3 bg-red-500 rounded-full ml-2';
            text.textContent = 'قطع ارتباط';
        }
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        if (currentTheme === 'dark') {
            document.body.classList.add('dark');
            themeToggle.innerHTML = '<span class="text-lg">☀️</span>';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggle.innerHTML = `<span class="text-lg">${isDark ? '☀️' : '🌙'}</span>`;
        });
    }

    showToast(type, message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.className = `toast toast-${type} p-4 mb-2`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span class="text-lg ml-2">${icons[type]}</span>
                <span class="text-sm font-medium text-gray-900">${message}</span>
                <button class="mr-auto text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
                    <span class="text-lg">×</span>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);

        // Add entrance animation
        setTimeout(() => {
            toast.classList.add('toast-enter-active');
        }, 10);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.legalArchiveApp = new LegalArchiveApp();
});

// Service Worker registration for offline support
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