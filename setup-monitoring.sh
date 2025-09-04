#!/bin/bash

# ========================================
# MONITORING SETUP SCRIPT
# Iranian Legal Archive System
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

echo -e "${BLUE}"
echo "=========================================="
echo "  MONITORING SETUP FOR IRANIAN LEGAL"
echo "           ARCHIVE SYSTEM"
echo "=========================================="
echo -e "${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    error ".env.production file not found. Please run free-domain-setup.sh first."
fi

# Load environment variables
source .env.production

# ========================================
# PROMETHEUS CONFIGURATION
# ========================================
log "Setting up Prometheus monitoring..."

mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/provisioning/datasources

# Create Prometheus configuration
cat > monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'iranian-legal-archive'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/api/v1/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:5432']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:6379']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 15s
EOF

# Create alerting rules
mkdir -p monitoring/prometheus/rules
cat > monitoring/prometheus/rules/alerts.yml << EOF
groups:
  - name: iranian-legal-archive
    rules:
      - alert: HighResponseTime
        expr: http_request_duration_seconds > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "Response time is {{ \$value }}s for {{ \$labels.instance }}"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value }} errors per second"

      - alert: DatabaseConnectionDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection down"
          description: "PostgreSQL database is not responding"

      - alert: RedisConnectionDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection down"
          description: "Redis cache is not responding"

      - alert: AIModelNotLoaded
        expr: ai_model_status == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "AI model not loaded"
          description: "Persian BERT model is not available"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ \$value | humanizePercentage }}"

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ \$value }}%"
EOF

# ========================================
# GRAFANA CONFIGURATION
# ========================================
log "Setting up Grafana dashboards..."

# Create Grafana datasource configuration
cat > monitoring/grafana/provisioning/datasources/datasource.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: PostgreSQL
    type: postgres
    access: proxy
    url: postgres:5432
    database: iranian_legal_db
    user: postgres
    secureJsonData:
      password: \${POSTGRES_PASSWORD}
    jsonData:
      sslmode: disable
      maxOpenConns: 100
      maxIdleConns: 100
      connMaxLifetime: 14400
EOF

# Create Grafana dashboard configuration
cat > monitoring/grafana/provisioning/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Create main dashboard
cat > monitoring/grafana/dashboards/iranian-legal-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Iranian Legal Archive System - Production Dashboard",
    "tags": ["iranian", "legal", "archive", "production"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Health Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"iranian-legal-archive\"}",
            "legendFormat": "{{instance}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "green", "value": 1}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Response Time (seconds)",
            "unit": "s"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests per second",
            "unit": "reqps"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Errors per second",
            "unit": "reqps"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16}
      },
      {
        "id": 5,
        "title": "AI Model Status",
        "type": "stat",
        "targets": [
          {
            "expr": "ai_model_status",
            "legendFormat": "AI Model"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "green", "value": 1}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16}
      },
      {
        "id": 6,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "{{datname}}"
          }
        ],
        "yAxes": [
          {
            "label": "Active Connections"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 24}
      },
      {
        "id": 7,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
            "legendFormat": "Memory Usage %"
          }
        ],
        "yAxes": [
          {
            "label": "Memory Usage (%)",
            "unit": "percent"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 24}
      },
      {
        "id": 8,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ],
        "yAxes": [
          {
            "label": "CPU Usage (%)",
            "unit": "percent"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 32}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "10s"
  }
}
EOF

# ========================================
# ALERTING CONFIGURATION
# ========================================
log "Setting up alerting system..."

# Create Alertmanager configuration
mkdir -p monitoring/alertmanager
cat > monitoring/alertmanager/alertmanager.yml << EOF
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: '${SMTP_USER}'
  smtp_auth_username: '${SMTP_USER}'
  smtp_auth_password: '${SMTP_PASS}'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'email-notifications'

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: '${SMTP_USER}'
        send_resolved: true
EOF

# ========================================
# DOCKER COMPOSE FOR MONITORING
# ========================================
log "Creating monitoring Docker Compose file..."

cat > monitoring/docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager:/etc/alertmanager
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
      - grafana_data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    command:
      - '--path.rootfs=/host'
    network_mode: host
    pid: host
    restart: unless-stopped
    volumes:
      - '/:/host:ro,rslave'

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    ports:
      - "9187:9187"
    environment:
      DATA_SOURCE_NAME: "postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/iranian_legal_db?sslmode=disable"
    restart: unless-stopped
    networks:
      - monitoring

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      REDIS_ADDR: "redis://redis:6379"
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  prometheus_data:
  alertmanager_data:
  grafana_data:

networks:
  monitoring:
    external: true
EOF

# ========================================
# HEALTH CHECK SCRIPT
# ========================================
log "Creating health check script..."

cat > monitoring/health-check.sh << 'EOF'
#!/bin/bash

# ========================================
# HEALTH CHECK SCRIPT
# Iranian Legal Archive System
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Load environment variables
if [ -f "../.env.production" ]; then
    source ../.env.production
fi

# Check if deployment URL is set
if [ -z "$RAILWAY_DEPLOYMENT_URL" ]; then
    read -p "Enter your deployment URL: " RAILWAY_DEPLOYMENT_URL
fi

# Health checks
log "Starting health checks for: $RAILWAY_DEPLOYMENT_URL"

# Check main application
log "Checking main application..."
if curl -s "$RAILWAY_DEPLOYMENT_URL/api/v1/system/health" | grep -q "healthy"; then
    log "✅ Main application is healthy"
else
    error "❌ Main application health check failed"
fi

# Check Prometheus
log "Checking Prometheus..."
if curl -s "http://localhost:9090/-/healthy" > /dev/null; then
    log "✅ Prometheus is healthy"
else
    warn "❌ Prometheus health check failed"
fi

# Check Grafana
log "Checking Grafana..."
if curl -s "http://localhost:3000/api/health" | grep -q "ok"; then
    log "✅ Grafana is healthy"
else
    warn "❌ Grafana health check failed"
fi

# Check database
log "Checking database..."
if curl -s "$RAILWAY_DEPLOYMENT_URL/api/v1/database/status" > /dev/null; then
    log "✅ Database is healthy"
else
    warn "❌ Database health check failed"
fi

# Check AI model
log "Checking AI model..."
if curl -s "$RAILWAY_DEPLOYMENT_URL/api/v1/ai/status" > /dev/null; then
    log "✅ AI model is healthy"
else
    warn "❌ AI model health check failed"
fi

log "Health checks complete!"
EOF

chmod +x monitoring/health-check.sh

# ========================================
# MONITORING STARTUP SCRIPT
# ========================================
log "Creating monitoring startup script..."

cat > monitoring/start-monitoring.sh << 'EOF'
#!/bin/bash

# ========================================
# MONITORING STARTUP SCRIPT
# Iranian Legal Archive System
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

echo -e "${BLUE}"
echo "=========================================="
echo "  STARTING MONITORING SERVICES"
echo "           IRANIAN LEGAL"
echo "=========================================="
echo -e "${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker first."
fi

# Create monitoring network if it doesn't exist
if ! docker network ls | grep -q "monitoring"; then
    log "Creating monitoring network..."
    docker network create monitoring
fi

# Start monitoring services
log "Starting monitoring services..."
cd "$(dirname "$0")"
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 10

# Check service status
log "Checking service status..."
docker-compose -f docker-compose.monitoring.yml ps

# Display access information
echo ""
echo -e "${GREEN}✅ Monitoring services started successfully!${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3000 (admin/admin123)"
echo "Alertmanager: http://localhost:9093"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open Grafana and add Prometheus as a data source"
echo "2. Import the dashboard from: ./grafana/dashboards/iranian-legal-dashboard.json"
echo "3. Configure alerting rules in Prometheus"
echo "4. Run health checks: ./health-check.sh"
EOF

chmod +x monitoring/start-monitoring.sh

# ========================================
# COMPLETION
# ========================================
echo ""
echo -e "${GREEN}🎉 Monitoring setup complete!${NC}"
echo ""
echo -e "${BLUE}Files Created:${NC}"
echo "✅ monitoring/prometheus/ - Prometheus configuration and rules"
echo "✅ monitoring/grafana/ - Grafana dashboards and provisioning"
echo "✅ monitoring/alertmanager/ - Alerting configuration"
echo "✅ monitoring/docker-compose.monitoring.yml - Monitoring services"
echo "✅ monitoring/health-check.sh - Health check script"
echo "✅ monitoring/start-monitoring.sh - Monitoring startup script"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Start monitoring: cd monitoring && ./start-monitoring.sh"
echo "2. Access Grafana at: http://localhost:3000 (admin/admin123)"
echo "3. Import dashboard and configure alerts"
echo "4. Run health checks: ./health-check.sh"
echo ""
echo -e "${GREEN}Your monitoring system is ready!${NC}"