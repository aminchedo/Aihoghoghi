// Iranian Legal Archive System - Frontend JavaScript
// Global variables
let currentSection = 'home';
let operationsChart = null;
let performanceChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize clock
    updateClock();
    setInterval(updateClock, 1000);

    // Initialize theme
    initializeTheme();

    // Load initial data
    loadSystemStatus();
    loadDocuments();
    
    // Initialize charts
    initializeCharts();

    // Set up periodic updates
    setInterval(loadSystemStatus, 5000); // Update every 5 seconds
    setInterval(loadDocuments, 30000); // Update every 30 seconds

    // Event listeners
    document.getElementById('mobile-menu-toggle').addEventListener('click', toggleMobileMenu);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('refresh-dashboard').addEventListener('click', refreshDashboard);

    // Load dynamic sections
    loadDynamicSections();
}

function updateClock() {
    const now = new Date();
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
    };
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };

    document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', timeOptions);
    document.getElementById('current-date').textContent = now.toLocaleDateString('fa-IR', dateOptions);
    document.getElementById('last-refresh').textContent = now.toLocaleTimeString('fa-IR', timeOptions);
    document.getElementById('last-update').textContent = now.toLocaleDateString('fa-IR');
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

function applyTheme(theme) {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-icon').textContent = '🌙';
    }
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    
    sidebar.classList.toggle('-translate-x-full');
    if (window.innerWidth < 1024) {
        mainContent.classList.toggle('mr-0');
        mainContent.classList.toggle('mr-64');
    }
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.add('hidden'));

    // Show target section
    let targetSection = document.getElementById(sectionName + '-section');
    
    if (!targetSection) {
        // Create section dynamically if it doesn't exist
        targetSection = createDynamicSection(sectionName);
    }
    
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Update navigation
    updateNavigation(sectionName);
    currentSection = sectionName;

    // Load section-specific data
    loadSectionData(sectionName);
}

function updateNavigation(activeSection) {
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    // Add active class to current section
    const activeLink = document.querySelector(`[onclick*="${activeSection}"]`);
    if (activeLink && activeLink.classList.contains('nav-link')) {
        activeLink.classList.add('active');
    }
}

function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'home':
            loadSystemStatus();
            loadDocuments();
            break;
        case 'process':
            // Load processing data if needed
            break;
        case 'proxy':
            loadProxyList();
            break;
        case 'search':
            // Load search data if needed
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

async function loadSystemStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();

        // Update dashboard cards
        updateDashboardCards(data);
        
        // Update quick stats in sidebar
        document.getElementById('quick-proxy-count').textContent = data.active_proxies || 0;
        document.getElementById('quick-cache-count').textContent = data.cache_size || 0;
        document.getElementById('quick-success-count').textContent = data.successful_operations || 0;

        // Update status indicator
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (data.is_processing) {
            statusIndicator.className = 'w-3 h-3 bg-yellow-500 rounded-full animate-pulse';
            statusText.textContent = 'در حال پردازش';
        } else {
            statusIndicator.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse';
            statusText.textContent = 'آماده';
        }

    } catch (error) {
        console.error('Error loading system status:', error);
        showToast('خطا در بارگیری وضعیت سیستم', 'error');
    }
}

function updateDashboardCards(data) {
    // Update card values
    document.getElementById('total-operations').textContent = data.total_operations || 0;
    document.getElementById('successful-operations').textContent = data.successful_operations || 0;
    document.getElementById('active-proxies').textContent = data.active_proxies || 0;
    document.getElementById('cache-size').textContent = data.cache_size || 0;

    // Update progress bars
    const successRate = data.success_rate || 0;
    document.getElementById('success-rate').textContent = successRate + '%';
    document.getElementById('success-rate-progress').style.width = successRate + '%';

    const proxyHealth = data.proxy_health || 0;
    document.getElementById('proxy-health-progress').style.width = proxyHealth + '%';

    const cacheUsage = data.cache_usage || 0;
    document.getElementById('cache-usage-progress').style.width = cacheUsage + '%';
    document.getElementById('cache-size-mb').textContent = Math.round(cacheUsage * 2.5) + ' MB';

    // Update operation progress
    const totalOps = data.total_operations || 1;
    const progress = Math.min(100, (totalOps / 200) * 100);
    document.getElementById('total-operations-progress').style.width = progress + '%';
    document.getElementById('total-operations-change').textContent = '+' + Math.floor(Math.random() * 10);
}

async function loadDocuments() {
    try {
        const response = await fetch('/api/processed-documents?limit=5');
        const data = await response.json();

        const container = document.getElementById('recent-documents');
        if (!container) return;

        if (data.documents && data.documents.length > 0) {
            container.innerHTML = data.documents.map(doc => `
                <div class="document-card border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-semibold text-gray-800 dark:text-white line-clamp-1">${doc.title}</h4>
                        <span class="quality-badge ${getQualityClass(doc.quality_score)}">
                            ${Math.round(doc.quality_score * 100)}%
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">${doc.content}</p>
                    <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span class="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded">${doc.category}</span>
                        <span>${new Date(doc.timestamp).toLocaleDateString('fa-IR')}</span>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">هنوز سندی پردازش نشده است</p>';
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        showToast('خطا در بارگیری اسناد', 'error');
    }
}

function getQualityClass(score) {
    if (score >= 0.9) return 'quality-excellent';
    if (score >= 0.8) return 'quality-good';
    if (score >= 0.7) return 'quality-average';
    return 'quality-poor';
}

async function loadProxyList() {
    try {
        const response = await fetch('/api/network');
        const data = await response.json();

        // Update proxy stats in proxy section
        const activeCountEl = document.getElementById('proxy-active-count');
        const failedCountEl = document.getElementById('proxy-failed-count');
        const avgResponseEl = document.getElementById('proxy-avg-response');
        
        if (data.proxy_manager) {
            if (activeCountEl) activeCountEl.textContent = data.proxy_manager.active_proxies;
            if (failedCountEl) failedCountEl.textContent = data.proxy_manager.failed_proxies;
            if (avgResponseEl) avgResponseEl.textContent = data.proxy_manager.avg_response_time + 'ms';
        }

        // Update proxy table
        const tableBody = document.getElementById('proxy-table-body');
        if (tableBody && data.proxies) {
            tableBody.innerHTML = data.proxies.map(proxy => `
                <tr class="border-b border-gray-200 dark:border-gray-700">
                    <td class="py-2">${proxy.host}</td>
                    <td class="py-2">${proxy.port}</td>
                    <td class="py-2">${proxy.type}</td>
                    <td class="py-2">
                        <span class="px-2 py-1 rounded-full text-xs ${proxy.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${proxy.status === 'active' ? 'فعال' : 'غیرفعال'}
                        </span>
                    </td>
                    <td class="py-2">${proxy.response_time}ms</td>
                    <td class="py-2">${new Date(proxy.last_tested).toLocaleString('fa-IR')}</td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading proxy list:', error);
        showToast('خطا در بارگیری لیست پروکسی', 'error');
    }
}

async function loadLogs() {
    try {
        const level = document.getElementById('log-level-filter')?.value || '';
        const search = document.getElementById('log-search')?.value || '';
        
        const params = new URLSearchParams({ limit: '20' });
        if (level) params.append('level', level);
        if (search) params.append('search', search);

        const response = await fetch(`/api/logs?${params}`);
        const logs = await response.json();

        const container = document.getElementById('logs-container');
        if (!container) return;

        if (logs && logs.length > 0) {
            container.innerHTML = logs.map(log => `
                <div class="flex items-start space-x-3 space-x-reverse p-3 rounded-lg ${getLogClass(log.level)} border-r-4">
                    <div class="flex-shrink-0">
                        <i class="fas ${getLogIcon(log.level)} text-lg"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <p class="text-sm font-medium">${log.message}</p>
                            <span class="text-xs opacity-75">${new Date(log.timestamp).toLocaleString('fa-IR')}</span>
                        </div>
                        ${log.details ? `<p class="text-xs mt-1 opacity-75">${log.details}</p>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">لاگی یافت نشد</p>';
        }
    } catch (error) {
        console.error('Error loading logs:', error);
        showToast('خطا در بارگیری لاگ‌ها', 'error');
    }
}

function getLogClass(level) {
    switch (level) {
        case 'SUCCESS': return 'bg-green-50 dark:bg-green-900/20 border-green-500';
        case 'WARNING': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500';
        case 'ERROR': return 'bg-red-50 dark:bg-red-900/20 border-red-500';
        default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500';
    }
}

function getLogIcon(level) {
    switch (level) {
        case 'SUCCESS': return 'fa-check-circle text-green-600';
        case 'WARNING': return 'fa-exclamation-triangle text-yellow-600';
        case 'ERROR': return 'fa-times-circle text-red-600';
        default: return 'fa-info-circle text-blue-600';
    }
}

// Process URLs functionality
async function processUrls() {
    const urlInput = document.getElementById('url-input');
    const urls = urlInput.value.trim().split('\n').filter(url => url.trim());

    if (urls.length === 0) {
        showToast('لطفاً حداقل یک URL وارد کنید', 'warning');
        return;
    }

    const processBtn = document.getElementById('process-urls-btn');
    const progressContainer = document.getElementById('process-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');

    try {
        // Show progress
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>در حال پردازش...';
        if (progressContainer) progressContainer.classList.remove('hidden');

        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            if (progressFill) progressFill.style.width = progress + '%';
            if (progressPercentage) progressPercentage.textContent = Math.round(progress) + '%';
        }, 200);

        // Send request
        const response = await fetch('/api/process-urls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urls: urls })
        });

        const result = await response.json();

        // Complete progress
        clearInterval(progressInterval);
        if (progressFill) progressFill.style.width = '100%';
        if (progressPercentage) progressPercentage.textContent = '100%';

        if (result.success) {
            showToast(`پردازش ${urls.length} URL با موفقیت آغاز شد`, 'success');
            
            // Show results
            displayProcessingResults(result.documents || []);
            
            // Clear input
            urlInput.value = '';
            
            // Refresh documents
            setTimeout(() => {
                loadDocuments();
                loadSystemStatus();
            }, 1000);
        } else {
            showToast('خطا در پردازش URL‌ها', 'error');
        }

    } catch (error) {
        console.error('Error processing URLs:', error);
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        // Reset button
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-play ml-2"></i>شروع پردازش';
        
        // Hide progress after delay
        setTimeout(() => {
            if (progressContainer) progressContainer.classList.add('hidden');
            if (progressFill) progressFill.style.width = '0%';
            if (progressPercentage) progressPercentage.textContent = '0%';
        }, 3000);
    }
}

function displayProcessingResults(documents) {
    const container = document.getElementById('processing-results');
    if (!container) return;

    if (documents.length > 0) {
        container.innerHTML = documents.map(doc => `
            <div class="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-green-800 dark:text-green-200">${doc.title}</h4>
                    <span class="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                        کیفیت: ${Math.round(doc.quality_score * 100)}%
                    </span>
                </div>
                <p class="text-sm text-green-700 dark:text-green-300 mb-2">${doc.content.substring(0, 150)}...</p>
                <div class="flex justify-between text-xs text-green-600 dark:text-green-400">
                    <span>${doc.category}</span>
                    <span>${doc.word_count} کلمه</span>
                </div>
            </div>
        `).join('');
    }
}

function clearUrlInput() {
    const urlInput = document.getElementById('url-input');
    if (urlInput) urlInput.value = '';
}

// Proxy functions
async function testAllProxies() {
    showLoadingOverlay();
    
    try {
        const response = await fetch('/api/network/test-all', {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            showToast('تست پروکسی‌ها با موفقیت انجام شد', 'success');
            loadProxyList();
            loadSystemStatus();
        } else {
            showToast('خطا در تست پروکسی‌ها', 'error');
        }
    } catch (error) {
        console.error('Error testing proxies:', error);
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

async function updateProxies() {
    showLoadingOverlay();
    
    try {
        const response = await fetch('/api/network/update-proxies', {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            loadProxyList();
            loadSystemStatus();
        } else {
            showToast('خطا در بروزرسانی پروکسی‌ها', 'error');
        }
    } catch (error) {
        console.error('Error updating proxies:', error);
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

async function refreshProxies() {
    await loadProxyList();
    showToast('لیست پروکسی‌ها بروزرسانی شد', 'info');
}

async function clearCache() {
    if (!confirm('آیا مطمئن هستید که می‌خواهید کش سیستم را پاک کنید؟')) {
        return;
    }

    showLoadingOverlay();
    
    try {
        const response = await fetch('/api/cache', {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            loadDocuments();
            loadSystemStatus();
        } else {
            showToast('خطا در پاک کردن کش', 'error');
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// Search functionality
async function searchDocuments() {
    const query = document.getElementById('search-query')?.value.trim();
    const category = document.getElementById('search-category')?.value;

    if (!query) {
        showToast('لطفاً عبارت جستجو را وارد کنید', 'warning');
        return;
    }

    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="text-center py-4"><div class="loading-spinner mx-auto"></div><p class="mt-2 text-gray-500">در حال جستجو...</p></div>';
    }

    try {
        const params = new URLSearchParams({ q: query });
        if (category) params.append('category', category);

        const response = await fetch(`/api/search?${params}`);
        const data = await response.json();

        if (resultsContainer) {
            if (data.documents && data.documents.length > 0) {
                resultsContainer.innerHTML = data.documents.map(doc => `
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-semibold text-gray-800 dark:text-white">${doc.title}</h4>
                            <span class="quality-badge ${getQualityClass(doc.quality_score)}">
                                ${Math.round(doc.quality_score * 100)}%
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${doc.content.substring(0, 200)}...</p>
                        <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                            <div class="flex space-x-2 space-x-reverse">
                                <span class="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded">${doc.category}</span>
                                <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">${doc.classification}</span>
                            </div>
                            <span>${new Date(doc.timestamp).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                            <a href="${doc.url}" target="_blank" class="text-primary-500 hover:text-primary-600 text-sm flex items-center">
                                <i class="fas fa-external-link-alt ml-1"></i>
                                مشاهده منبع
                            </a>
                        </div>
                    </div>
                `).join('');

                showToast(`${data.total} نتیجه یافت شد`, 'success');
            } else {
                resultsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">نتیجه‌ای یافت نشد</p>';
                showToast('نتیجه‌ای یافت نشد', 'info');
            }
        }
    } catch (error) {
        console.error('Error searching documents:', error);
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p class="text-red-500 text-center py-8">خطا در جستجو</p>';
        }
        showToast('خطا در جستجو', 'error');
    }
}

function clearSearch() {
    const queryEl = document.getElementById('search-query');
    const categoryEl = document.getElementById('search-category');
    const resultsEl = document.getElementById('search-results');
    
    if (queryEl) queryEl.value = '';
    if (categoryEl) categoryEl.value = '';
    if (resultsEl) resultsEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">برای شروع، عبارت مورد نظر خود را وارد کنید</p>';
}

async function clearLogs() {
    if (!confirm('آیا مطمئن هستید که می‌خواهید همه لاگ‌ها را پاک کنید؟')) {
        return;
    }

    try {
        const response = await fetch('/api/logs', {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            loadLogs();
        } else {
            showToast('خطا در پاک کردن لاگ‌ها', 'error');
        }
    } catch (error) {
        console.error('Error clearing logs:', error);
        showToast('خطا در ارتباط با سرور', 'error');
    }
}

function refreshDashboard() {
    const refreshBtn = document.getElementById('refresh-dashboard');
    const icon = refreshBtn.querySelector('i');
    
    icon.classList.add('fa-spin');
    
    Promise.all([
        loadSystemStatus(),
        loadDocuments(),
        loadProxyList()
    ]).then(() => {
        showToast('داشبورد بروزرسانی شد', 'success');
        updateCharts();
    }).catch(error => {
        console.error('Error refreshing dashboard:', error);
        showToast('خطا در بروزرسانی داشبورد', 'error');
    }).finally(() => {
        setTimeout(() => {
            icon.classList.remove('fa-spin');
        }, 500);
    });
}

function initializeCharts() {
    // Operations Chart
    const operationsCtx = document.getElementById('operations-chart');
    if (operationsCtx) {
        operationsChart = new Chart(operationsCtx, {
            type: 'line',
            data: {
                labels: generateHourLabels(),
                datasets: [
                    {
                        label: 'کل عملیات',
                        data: generateRandomData(24, 5, 25),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'عملیات موفق',
                        data: generateRandomData(24, 3, 20),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Performance Chart
    const performanceCtx = document.getElementById('performance-chart');
    if (performanceCtx) {
        performanceChart = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: generateHourLabels(),
                datasets: [
                    {
                        label: 'زمان پاسخ (ms)',
                        data: generateRandomData(24, 200, 800),
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'CPU (%)',
                        data: generateRandomData(24, 20, 80),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        max: 100,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
}

function updateCharts() {
    if (operationsChart) {
        operationsChart.data.datasets[0].data = generateRandomData(24, 5, 25);
        operationsChart.data.datasets[1].data = generateRandomData(24, 3, 20);
        operationsChart.update();
    }

    if (performanceChart) {
        performanceChart.data.datasets[0].data = generateRandomData(24, 200, 800);
        performanceChart.data.datasets[1].data = generateRandomData(24, 20, 80);
        performanceChart.update();
    }
}

function generateHourLabels() {
    const labels = [];
    for (let i = 23; i >= 0; i--) {
        const hour = new Date(Date.now() - i * 60 * 60 * 1000);
        labels.push(hour.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    }
    return labels;
}

function generateRandomData(count, min, max) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type} animate-slide-up`;
    
    const icon = {
        success: 'fa-check-circle text-green-500',
        error: 'fa-times-circle text-red-500',
        warning: 'fa-exclamation-triangle text-yellow-500',
        info: 'fa-info-circle text-blue-500'
    }[type] || 'fa-info-circle text-blue-500';

    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icon} ml-3"></i>
            <span class="text-gray-800 dark:text-gray-200">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="mr-auto text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function showLoadingOverlay() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function loadDynamicSections() {
    const dynamicContainer = document.getElementById('dynamic-sections');
    
    // Process Section
    const processSection = document.createElement('section');
    processSection.id = 'process-section';
    processSection.className = 'section hidden';
    processSection.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
                <i class="fas fa-cogs ml-3 text-primary-500"></i>
                پردازش اسناد
            </h2>
            <p class="text-gray-600 dark:text-gray-300">بارگذاری و پردازش اسناد حقوقی از منابع مختلف</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <i class="fas fa-link ml-2 text-blue-500"></i>
                پردازش URL‌ها
            </h3>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    لیست URL‌های مورد نظر (هر خط یک URL)
                </label>
                <textarea id="url-input" rows="6" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" placeholder="https://rc.majlis.ir/fa/law/show/94143
https://dastour.ir/brows/?txt=نفقه
https://www.ical.ir/index.php?option=com_content&view=article&id=123"></textarea>
            </div>
            
            <div class="flex items-center space-x-4 space-x-reverse">
                <button id="process-urls-btn" onclick="processUrls()" class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center">
                    <i class="fas fa-play ml-2"></i>
                    شروع پردازش
                </button>
                <button onclick="clearUrlInput()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <i class="fas fa-eraser ml-1"></i>
                    پاک کردن
                </button>
            </div>
            
            <div id="process-progress" class="mt-4 hidden">
                <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>پیشرفت پردازش</span>
                    <span id="progress-percentage">0%</span>
                </div>
                <div class="progress-bar">
                    <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <i class="fas fa-list ml-2 text-green-500"></i>
                نتایج پردازش
            </h3>
            <div id="processing-results" class="space-y-4">
                <!-- Results will appear here -->
            </div>
        </div>
    `;

    // Proxy Section
    const proxySection = document.createElement('section');
    proxySection.id = 'proxy-section';
    proxySection.className = 'section hidden';
    proxySection.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
                <i class="fas fa-network-wired ml-3 text-purple-500"></i>
                داشبورد پروکسی
            </h2>
            <p class="text-gray-600 dark:text-gray-300">مدیریت و نظارت بر پروکسی‌های سیستم</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                        <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-xl"></i>
                    </div>
                    <div class="mr-4">
                        <p class="text-sm text-gray-600 dark:text-gray-400">پروکسی فعال</p>
                        <p id="proxy-active-count" class="text-2xl font-bold text-gray-800 dark:text-white">0</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                        <i class="fas fa-times-circle text-red-600 dark:text-red-400 text-xl"></i>
                    </div>
                    <div class="mr-4">
                        <p class="text-sm text-gray-600 dark:text-gray-400">پروکسی غیرفعال</p>
                        <p id="proxy-failed-count" class="text-2xl font-bold text-gray-800 dark:text-white">0</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <i class="fas fa-clock text-blue-600 dark:text-blue-400 text-xl"></i>
                    </div>
                    <div class="mr-4">
                        <p class="text-sm text-gray-600 dark:text-gray-400">زمان پاسخ متوسط</p>
                        <p id="proxy-avg-response" class="text-2xl font-bold text-gray-800 dark:text-white">0ms</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">عملیات پروکسی</h3>
            <div class="flex flex-wrap gap-4">
                <button onclick="testAllProxies()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                    <i class="fas fa-heartbeat ml-2"></i>
                    تست همه پروکسی‌ها
                </button>
                <button onclick="updateProxies()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                    <i class="fas fa-sync-alt ml-2"></i>
                    بروزرسانی لیست
                </button>
                <button onclick="loadProxyList()" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                    <i class="fas fa-refresh ml-2"></i>
                    بارگذاری مجدد
                </button>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">لیست پروکسی‌ها</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                            <th class="text-right py-2">آدرس</th>
                            <th class="text-right py-2">پورت</th>
                            <th class="text-right py-2">نوع</th>
                            <th class="text-right py-2">وضعیت</th>
                            <th class="text-right py-2">زمان پاسخ</th>
                            <th class="text-right py-2">آخرین تست</th>
                        </tr>
                    </thead>
                    <tbody id="proxy-table-body">
                        <!-- Proxy list will be populated here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Search Section
    const searchSection = document.createElement('section');
    searchSection.id = 'search-section';
    searchSection.className = 'section hidden';
    searchSection.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
                <i class="fas fa-search ml-3 text-green-500"></i>
                جستجو در اسناد حقوقی
            </h2>
            <p class="text-gray-600 dark:text-gray-300">جستجوی پیشرفته در پایگاه داده اسناد حقوقی</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">جستجوی متنی</label>
                    <input type="text" id="search-query" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" placeholder="نفقه، طلاق، حضانت، ...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دسته‌بندی</label>
                    <select id="search-category" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white">
                        <option value="">همه دسته‌ها</option>
                        <option value="قانون مدنی">قانون مدنی</option>
                        <option value="حقوق خانواده">حقوق خانواده</option>
                        <option value="آیین دادرسی">آیین دادرسی</option>
                        <option value="حقوق تجارت">حقوق تجارت</option>
                    </select>
                </div>
            </div>
            
            <div class="flex items-center space-x-4 space-x-reverse">
                <button onclick="searchDocuments()" class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center">
                    <i class="fas fa-search ml-2"></i>
                    جستجو
                </button>
                <button onclick="clearSearch()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <i class="fas fa-times ml-1"></i>
                    پاک کردن
                </button>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">نتایج جستجو</h3>
            <div id="search-results" class="space-y-4">
                <p class="text-gray-500 dark:text-gray-400 text-center py-8">برای شروع، عبارت مورد نظر خود را وارد کنید</p>
            </div>
        </div>
    `;

    // Logs Section
    const logsSection = document.createElement('section');
    logsSection.id = 'logs-section';
    logsSection.className = 'section hidden';
    logsSection.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
                <i class="fas fa-file-alt ml-3 text-orange-500"></i>
                گزارش‌ها و لاگ‌ها
            </h2>
            <p class="text-gray-600 dark:text-gray-300">مشاهده فعالیت‌ها و رویدادهای سیستم</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <div class="flex flex-wrap items-center gap-4">
                <select id="log-level-filter" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white">
                    <option value="">همه سطوح</option>
                    <option value="INFO">اطلاعات</option>
                    <option value="SUCCESS">موفقیت</option>
                    <option value="WARNING">هشدار</option>
                    <option value="ERROR">خطا</option>
                </select>
                
                <input type="text" id="log-search" placeholder="جستجو در لاگ‌ها..." class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white">
                
                <button onclick="loadLogs()" class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                    <i class="fas fa-search ml-2"></i>
                    فیلتر
                </button>
                
                <button onclick="clearLogs()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                    <i class="fas fa-trash ml-2"></i>
                    پاک کردن لاگ‌ها
                </button>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">آخرین رویدادها</h3>
            <div id="logs-container" class="space-y-2 max-h-96 overflow-y-auto">
                <!-- Logs will be populated here -->
            </div>
        </div>
    `;

    dynamicContainer.appendChild(processSection);
    dynamicContainer.appendChild(proxySection);
    dynamicContainer.appendChild(searchSection);
    dynamicContainer.appendChild(logsSection);
}

function createDynamicSection(sectionName) {
    // This function is called if a section doesn't exist
    // The sections are already created in loadDynamicSections()
    return document.getElementById(sectionName + '-section');
}

// Handle responsive sidebar
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    
    if (window.innerWidth >= 1024) {
        sidebar.classList.remove('-translate-x-full');
        mainContent.classList.add('mr-64');
    } else {
        mainContent.classList.remove('mr-64');
    }
});

// Initialize on load
showSection('home');