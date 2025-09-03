const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const { createLogger, format, transports } = winston;
const os = require('os');
const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');

class ProductionMonitoring extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      logLevel: config.logLevel || 'info',
      elasticsearchUrl: config.elasticsearchUrl || process.env.ELASTICSEARCH_URL,
      elasticsearchIndex: config.elasticsearchIndex || 'iranian-legal-archive-logs',
      metricsInterval: config.metricsInterval || 30000, // 30 seconds
      alertThresholds: config.alertThresholds || {
        cpuUsage: 80,
        memoryUsage: 85,
        responseTime: 2000,
        errorRate: 5,
        diskUsage: 90
      },
      ...config
    };
    
    this.metrics = {
      system: {},
      application: {},
      database: {},
      ai: {},
      api: {}
    };
    
    this.alerts = [];
    this.isRunning = false;
    this.metricsTimer = null;
    
    this.initializeLogger();
    this.initializeMetrics();
  }

  initializeLogger() {
    try {
      // Create custom format
      const logFormat = format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.json(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            service: 'iranian-legal-archive',
            environment: 'production',
            hostname: os.hostname(),
            ...meta
          });
        })
      );

      // Create logger instance
      this.logger = createLogger({
        level: this.config.logLevel,
        format: logFormat,
        defaultMeta: {
          service: 'iranian-legal-archive',
          environment: 'production'
        },
        transports: [
          // Console transport
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.simple()
            )
          }),
          
          // File transport for errors
          new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          }),
          
          // File transport for all logs
          new transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          })
        ]
      });

      // Add Elasticsearch transport if configured
      if (this.config.elasticsearchUrl) {
        this.logger.add(new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: this.config.elasticsearchUrl,
            index: this.config.elasticsearchIndex,
            'es-index-prefix': 'iranian-legal-archive'
          },
          indexPrefix: 'iranian-legal-archive-logs'
        }));
      }

      this.logger.info('Production monitoring logger initialized');
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  initializeMetrics() {
    // Initialize system metrics
    this.metrics.system = {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIO: { bytesIn: 0, bytesOut: 0 },
      uptime: 0,
      loadAverage: [0, 0, 0]
    };

    // Initialize application metrics
    this.metrics.application = {
      requestCount: 0,
      responseTime: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
      errorCount: 0,
      successCount: 0,
      activeConnections: 0,
      memoryUsage: 0
    };

    // Initialize database metrics
    this.metrics.database = {
      connectionCount: 0,
      queryCount: 0,
      slowQueries: 0,
      errorCount: 0,
      responseTime: { min: 0, max: 0, avg: 0 }
    };

    // Initialize AI metrics
    this.metrics.ai = {
      modelStatus: 'unknown',
      inferenceCount: 0,
      averageInferenceTime: 0,
      errorCount: 0,
      modelMemoryUsage: 0,
      batchProcessingCount: 0
    };

    // Initialize API metrics
    this.metrics.api = {
      totalRequests: 0,
      requestsByEndpoint: {},
      requestsByMethod: {},
      requestsByStatus: {},
      averageResponseTime: 0,
      peakResponseTime: 0
    };
  }

  start() {
    if (this.isRunning) {
      this.logger.warn('Monitoring is already running');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.info('Starting production monitoring...');
      
      // Start metrics collection
      this.startMetricsCollection();
      
      // Start health checks
      this.startHealthChecks();
      
      this.logger.info('Production monitoring started successfully');
      this.emit('monitoring:started');
    } catch (error) {
      this.logger.error('Failed to start monitoring:', error);
      this.emit('monitoring:error', error);
    }
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    try {
      this.isRunning = false;
      
      if (this.metricsTimer) {
        clearInterval(this.metricsTimer);
        this.metricsTimer = null;
      }
      
      this.logger.info('Production monitoring stopped');
      this.emit('monitoring:stopped');
    } catch (error) {
      this.logger.error('Failed to stop monitoring:', error);
    }
  }

  startMetricsCollection() {
    this.metricsTimer = setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.checkAlertThresholds();
      this.emit('metrics:collected', this.metrics);
    }, this.config.metricsInterval);
  }

  startHealthChecks() {
    // System health check every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);
  }

  async collectSystemMetrics() {
    try {
      // CPU usage
      const cpuUsage = await this.getCPUUsage();
      this.metrics.system.cpuUsage = cpuUsage;
      
      // Memory usage
      const memoryUsage = await this.getMemoryUsage();
      this.metrics.system.memoryUsage = memoryUsage;
      
      // Disk usage
      const diskUsage = await this.getDiskUsage();
      this.metrics.system.diskUsage = diskUsage;
      
      // Network I/O
      const networkIO = await this.getNetworkIO();
      this.metrics.system.networkIO = networkIO;
      
      // System uptime and load
      this.metrics.system.uptime = os.uptime();
      this.metrics.system.loadAverage = os.loadavg();
      
      this.logger.debug('System metrics collected', { metrics: this.metrics.system });
    } catch (error) {
      this.logger.error('Failed to collect system metrics:', error);
    }
  }

  async collectApplicationMetrics() {
    try {
      // Application memory usage
      const memUsage = process.memoryUsage();
      this.metrics.application.memoryUsage = {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      };
      
      // Calculate response time percentiles
      if (this.metrics.application.responseTime.count > 0) {
        const responseTimes = this.metrics.application.responseTime.values || [];
        if (responseTimes.length > 0) {
          responseTimes.sort((a, b) => a - b);
          this.metrics.application.responseTime.p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
          this.metrics.application.responseTime.p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
        }
      }
      
      this.logger.debug('Application metrics collected', { metrics: this.metrics.application });
    } catch (error) {
      this.logger.error('Failed to collect application metrics:', error);
    }
  }

  async getCPUUsage() {
    try {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      }
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - (100 * idle / total);
      
      return Math.round(usage * 100) / 100;
    } catch (error) {
      this.logger.error('Failed to get CPU usage:', error);
      return 0;
    }
  }

  async getMemoryUsage() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const usagePercent = (usedMem / totalMem) * 100;
      
      return {
        total: Math.round(totalMem / 1024 / 1024 / 1024), // GB
        used: Math.round(usedMem / 1024 / 1024 / 1024), // GB
        free: Math.round(freeMem / 1024 / 1024 / 1024), // GB
        percentage: Math.round(usagePercent * 100) / 100
      };
    } catch (error) {
      this.logger.error('Failed to get memory usage:', error);
      return { total: 0, used: 0, free: 0, percentage: 0 };
    }
  }

  async getDiskUsage() {
    try {
      // This is a simplified disk usage check
      // In production, you might want to use a library like 'diskusage'
      return {
        percentage: 0, // Placeholder
        free: 0, // Placeholder
        total: 0 // Placeholder
      };
    } catch (error) {
      this.logger.error('Failed to get disk usage:', error);
      return { percentage: 0, free: 0, total: 0 };
    }
  }

  async getNetworkIO() {
    try {
      // This is a simplified network I/O check
      // In production, you might want to use a library like 'systeminformation'
      return {
        bytesIn: 0, // Placeholder
        bytesOut: 0 // Placeholder
      };
    } catch (error) {
      this.logger.error('Failed to get network I/O:', error);
      return { bytesIn: 0, bytesOut: 0 };
    }
  }

  checkAlertThresholds() {
    const alerts = [];
    
    // Check CPU usage
    if (this.metrics.system.cpuUsage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        level: 'warning',
        type: 'high_cpu_usage',
        message: `High CPU usage: ${this.metrics.system.cpuUsage}%`,
        value: this.metrics.system.cpuUsage,
        threshold: this.config.alertThresholds.cpuUsage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check memory usage
    if (this.metrics.system.memoryUsage.percentage > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        level: 'warning',
        type: 'high_memory_usage',
        message: `High memory usage: ${this.metrics.system.memoryUsage.percentage}%`,
        value: this.metrics.system.memoryUsage.percentage,
        threshold: this.config.alertThresholds.memoryUsage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check response time
    if (this.metrics.application.responseTime.avg > this.config.alertThresholds.responseTime) {
      alerts.push({
        level: 'warning',
        type: 'high_response_time',
        message: `High average response time: ${this.metrics.application.responseTime.avg}ms`,
        value: this.metrics.application.responseTime.avg,
        threshold: this.config.alertThresholds.responseTime,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check error rate
    const totalRequests = this.metrics.application.requestCount;
    if (totalRequests > 0) {
      const errorRate = (this.metrics.application.errorCount / totalRequests) * 100;
      if (errorRate > this.config.alertThresholds.errorRate) {
        alerts.push({
          level: 'critical',
          type: 'high_error_rate',
          message: `High error rate: ${errorRate.toFixed(2)}%`,
          value: errorRate,
          threshold: this.config.alertThresholds.errorRate,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Emit alerts if any
    if (alerts.length > 0) {
      this.alerts.push(...alerts);
      this.emit('alerts:triggered', alerts);
      
      // Log alerts
      alerts.forEach(alert => {
        if (alert.level === 'critical') {
          this.logger.error(alert.message, alert);
        } else {
          this.logger.warn(alert.message, alert);
        }
      });
    }
  }

  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: {},
        summary: {}
      };
      
      // System health check
      const systemHealth = await this.checkSystemHealth();
      healthStatus.checks.system = systemHealth;
      
      // Application health check
      const appHealth = await this.checkApplicationHealth();
      healthStatus.checks.application = appHealth;
      
      // Database health check
      const dbHealth = await this.checkDatabaseHealth();
      healthStatus.checks.database = dbHealth;
      
      // AI service health check
      const aiHealth = await this.checkAIHealth();
      healthStatus.checks.ai = aiHealth;
      
      // Determine overall status
      const allChecks = Object.values(healthStatus.checks);
      const failedChecks = allChecks.filter(check => check.status === 'unhealthy');
      
      if (failedChecks.length > 0) {
        healthStatus.status = 'unhealthy';
        healthStatus.summary.failedChecks = failedChecks.length;
        healthStatus.summary.totalChecks = allChecks.length;
      }
      
      this.logger.info('Health check completed', healthStatus);
      this.emit('health:checked', healthStatus);
      
      return healthStatus;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      this.emit('health:error', error);
      return { status: 'error', error: error.message };
    }
  }

  async checkSystemHealth() {
    try {
      const cpuUsage = this.metrics.system.cpuUsage;
      const memoryUsage = this.metrics.system.memoryUsage.percentage;
      
      return {
        status: (cpuUsage < 90 && memoryUsage < 90) ? 'healthy' : 'unhealthy',
        cpu: { usage: cpuUsage, threshold: 90 },
        memory: { usage: memoryUsage, threshold: 90 },
        uptime: this.metrics.system.uptime
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  async checkApplicationHealth() {
    try {
      const errorRate = this.metrics.application.requestCount > 0 
        ? (this.metrics.application.errorCount / this.metrics.application.requestCount) * 100 
        : 0;
      
      return {
        status: errorRate < 10 ? 'healthy' : 'unhealthy',
        requestCount: this.metrics.application.requestCount,
        errorRate: errorRate,
        activeConnections: this.metrics.application.activeConnections
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  async checkDatabaseHealth() {
    try {
      // This would typically check actual database connectivity
      return {
        status: 'healthy', // Placeholder
        connectionCount: this.metrics.database.connectionCount,
        queryCount: this.metrics.database.queryCount,
        errorCount: this.metrics.database.errorCount
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  async checkAIHealth() {
    try {
      return {
        status: this.metrics.ai.modelStatus === 'loaded' ? 'healthy' : 'unhealthy',
        modelStatus: this.metrics.ai.modelStatus,
        inferenceCount: this.metrics.ai.inferenceCount,
        errorCount: this.metrics.ai.errorCount
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // API metrics tracking
  trackRequest(endpoint, method, statusCode, responseTime) {
    try {
      // Update request counts
      this.metrics.application.requestCount++;
      this.metrics.api.totalRequests++;
      
      // Update endpoint-specific metrics
      if (!this.metrics.api.requestsByEndpoint[endpoint]) {
        this.metrics.api.requestsByEndpoint[endpoint] = 0;
      }
      this.metrics.api.requestsByEndpoint[endpoint]++;
      
      // Update method-specific metrics
      if (!this.metrics.api.requestsByMethod[method]) {
        this.metrics.api.requestsByMethod[method] = 0;
      }
      this.metrics.api.requestsByMethod[method]++;
      
      // Update status-specific metrics
      if (!this.metrics.api.requestsByStatus[statusCode]) {
        this.metrics.api.requestsByStatus[statusCode] = 0;
      }
      this.metrics.api.requestsByStatus[statusCode]++;
      
      // Update response time metrics
      if (responseTime) {
        this.updateResponseTimeMetrics(responseTime);
      }
      
      // Update success/error counts
      if (statusCode >= 200 && statusCode < 400) {
        this.metrics.application.successCount++;
      } else {
        this.metrics.application.errorCount++;
      }
      
      this.logger.debug('Request tracked', { endpoint, method, statusCode, responseTime });
    } catch (error) {
      this.logger.error('Failed to track request:', error);
    }
  }

  updateResponseTimeMetrics(responseTime) {
    try {
      const current = this.metrics.application.responseTime;
      
      if (current.count === 0) {
        current.min = responseTime;
        current.max = responseTime;
        current.avg = responseTime;
        current.count = 1;
        current.values = [responseTime];
      } else {
        current.min = Math.min(current.min, responseTime);
        current.max = Math.max(current.max, responseTime);
        current.avg = ((current.avg * current.count) + responseTime) / (current.count + 1);
        current.count++;
        current.values = current.values || [];
        current.values.push(responseTime);
        
        // Keep only last 1000 values for memory management
        if (current.values.length > 1000) {
          current.values = current.values.slice(-1000);
        }
      }
      
      // Update API metrics
      this.metrics.api.averageResponseTime = current.avg;
      this.metrics.api.peakResponseTime = Math.max(this.metrics.api.peakResponseTime, responseTime);
    } catch (error) {
      this.logger.error('Failed to update response time metrics:', error);
    }
  }

  // Logging methods
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  // Get alerts
  getAlerts() {
    return this.alerts;
  }

  // Clear old alerts
  clearOldAlerts(hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    this.alerts = this.alerts.filter(alert => new Date(alert.timestamp) > cutoffTime);
  }
}

module.exports = ProductionMonitoring;