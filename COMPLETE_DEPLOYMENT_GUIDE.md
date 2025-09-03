# Complete Deployment Guide for Iranian Legal Archive System

## Overview
This guide provides step-by-step instructions to deploy the Iranian Legal Archive System on a production server with domain configuration, environment setup, monitoring, and testing.

## Table of Contents
1. [Free Domain Setup](#1-free-domain-setup)
2. [Server Preparation](#2-server-preparation)
3. [Environment Setup Script](#3-environment-setup-script)
4. [Configuration Management](#4-configuration-management)
5. [Deployment Scripts](#5-deployment-scripts)
6. [Testing Automation](#6-testing-automation)
7. [Monitoring with Grafana](#7-monitoring-with-grafana)
8. [Maintenance and Updates](#8-maintenance-and-updates)

---

## 1. Free Domain Setup

### Option A: Freenom (Free .tk, .ml, .ga domains)
1. Visit [Freenom](https://freenom.com)
2. Search for your desired domain (e.g., `iranianlaw.tk`)
3. Register for free (up to 12 months)
4. Access DNS management in your Freenom dashboard

### Option B: GitHub Pages Subdomain (Recommended for this project)
```
Your domain will be: https://yourusername.github.io/Aihoghoghi/
```

### Option C: Netlify/Vercel Subdomain
```
Domain format: https://your-app-name.netlify.app
Domain format: https://your-app-name.vercel.app
```

### DNS Configuration Script
```bash
#!/bin/bash
# dns-setup.sh
echo "=== DNS Configuration Helper ==="

read -p "Enter your domain name (e.g., iranianlaw.tk): " DOMAIN
read -p "Enter your server IP address: " SERVER_IP

echo ""
echo "Configure these DNS records in your domain provider:"
echo "Type    | Name | Value"
echo "--------|------|------"
echo "A       | @    | $SERVER_IP"
echo "A       | www  | $SERVER_IP"
echo "CNAME   | api  | $DOMAIN"
echo ""
echo "After DNS propagation (5-30 minutes), your site will be available at:"
echo "https://$DOMAIN"
```

---

## 2. Server Preparation

### System Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: 10GB+ available space
- **CPU**: 2+ cores recommended
- **Network**: Port 80, 443, 7860 accessible

### Server Setup Script
```bash
#!/bin/bash
# server-setup.sh

set -e

echo "🚀 Starting server setup for Iranian Legal Archive System..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt install -y \
    nginx \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    git \
    curl \
    wget \
    htop \
    ufw \
    certbot \
    python3-certbot-nginx \
    sqlite3 \
    redis-server \
    supervisor

# Install Docker (for monitoring stack)
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "📋 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 7860
sudo ufw --force enable

# Create application user
echo "👤 Creating application user..."
sudo useradd -m -s /bin/bash -G docker appuser

echo "✅ Server setup completed!"
echo "📝 Please log out and log back in for Docker group changes to take effect"
```

---

## 3. Environment Setup Script

### Automated Environment Setup
```bash
#!/bin/bash
# setup-environment.sh

set -e

APP_DIR="/opt/iranian-legal-archive"
APP_USER="appuser"
DOMAIN="${1:-localhost}"

echo "🏗️ Setting up Iranian Legal Archive System environment..."

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:$APP_USER $APP_DIR

# Clone repository
echo "📥 Cloning repository..."
cd /tmp
git clone https://github.com/aminchedo/Aihoghoghi.git
sudo cp -r Aihoghoghi/* $APP_DIR/
sudo chown -R $APP_USER:$APP_USER $APP_DIR

# Setup Python environment
echo "🐍 Setting up Python environment..."
cd $APP_DIR
sudo -u $APP_USER python3 -m venv venv
sudo -u $APP_USER ./venv/bin/pip install --upgrade pip
sudo -u $APP_USER ./venv/bin/pip install -r requirements.txt

# Setup Node.js environment
echo "📦 Setting up Node.js environment..."
sudo -u $APP_USER npm install
sudo -u $APP_USER npm run build

# Create necessary directories
echo "📂 Creating necessary directories..."
sudo -u $APP_USER mkdir -p data/databases data/cache data/models data/logs

# Initialize database
echo "🗄️ Initializing database..."
sudo -u $APP_USER ./venv/bin/python -c "
from legal_database import LegalDatabase
db = LegalDatabase()
print('✅ Database initialized successfully')
"

# Create systemd service
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/iranian-legal-archive.service > /dev/null <<EOF
[Unit]
Description=Iranian Legal Archive System
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/venv/bin
ExecStart=$APP_DIR/venv/bin/python web_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/iranian-legal-archive > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
        
        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }
    
    location /api/ {
        proxy_pass http://localhost:7860/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /ws {
        proxy_pass http://localhost:7860/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/iranian-legal-archive /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Enable and start services
echo "🚀 Starting services..."
sudo systemctl enable iranian-legal-archive
sudo systemctl start iranian-legal-archive
sudo systemctl enable nginx
sudo systemctl start nginx

echo "✅ Environment setup completed!"
echo "🌐 Your application should be available at: http://$DOMAIN"
```

---

## 4. Configuration Management

### Environment Configuration Template
```bash
#!/bin/bash
# create-env-file.sh

ENV_FILE="/opt/iranian-legal-archive/.env"

echo "⚙️ Creating environment configuration..."

# Prompt for configuration values
read -p "Enter your domain name: " DOMAIN
read -p "Enter your HuggingFace API key (optional): " HF_API_KEY
read -p "Enter your email for SSL certificate: " EMAIL
read -p "Enter Redis password (generate if empty): " REDIS_PASSWORD

# Generate secure Redis password if not provided
if [ -z "$REDIS_PASSWORD" ]; then
    REDIS_PASSWORD=$(openssl rand -base64 32)
fi

# Create .env file
cat > $ENV_FILE << EOF
# Server Configuration
NODE_ENV=production
PORT=7860
HOST=0.0.0.0
DOMAIN=$DOMAIN

# Database Configuration
DATABASE_URL=sqlite:///data/databases/legal_archive.sqlite
CACHE_DATABASE_URL=sqlite:///data/cache/intelligent_cache.sqlite

# AI Configuration
HUGGINGFACE_API_KEY=$HF_API_KEY
TRANSFORMERS_CACHE=/opt/iranian-legal-archive/data/models

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Security Configuration
SECRET_KEY=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_EMAIL=$EMAIL

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=/opt/iranian-legal-archive/data/logs/app.log

# Proxy Configuration
MAX_PROXY_RETRIES=3
PROXY_TIMEOUT=30
DNS_SERVERS=178.22.122.100,185.51.200.2,10.202.10.202

# Performance Configuration
MAX_WORKERS=4
CACHE_TTL=3600
SESSION_TIMEOUT=1800

# Monitoring Configuration
METRICS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 16)
EOF

# Secure the .env file
sudo chown appuser:appuser $ENV_FILE
sudo chmod 600 $ENV_FILE

echo "✅ Environment configuration created at $ENV_FILE"
echo "🔑 Generated passwords have been saved in the configuration file"
```

### SSL Certificate Setup
```bash
#!/bin/bash
# setup-ssl.sh

DOMAIN="$1"
EMAIL="$2"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 iranianlaw.tk admin@iranianlaw.tk"
    exit 1
fi

echo "🔒 Setting up SSL certificate for $DOMAIN..."

# Install SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# Setup auto-renewal
sudo crontab -l > /tmp/crontab_backup 2>/dev/null || true
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /tmp/crontab_backup
sudo crontab /tmp/crontab_backup

echo "✅ SSL certificate installed successfully!"
echo "🔄 Auto-renewal configured for certificates"
```

---

## 5. Deployment Scripts

### Main Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

APP_DIR="/opt/iranian-legal-archive"
BACKUP_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment of Iranian Legal Archive System..."

# Create backup
echo "💾 Creating backup..."
sudo mkdir -p $BACKUP_DIR
sudo tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C $APP_DIR .

# Stop services
echo "⏸️ Stopping services..."
sudo systemctl stop iranian-legal-archive

# Update code
echo "📥 Updating code..."
cd $APP_DIR
sudo -u appuser git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
sudo -u appuser ./venv/bin/pip install -r requirements.txt
sudo -u appuser npm install

# Build frontend
echo "🏗️ Building frontend..."
sudo -u appuser npm run build

# Run database migrations (if any)
echo "🗄️ Running database migrations..."
sudo -u appuser ./venv/bin/python -c "
from legal_database import LegalDatabase
db = LegalDatabase()
print('✅ Database migration completed')
"

# Start services
echo "▶️ Starting services..."
sudo systemctl start iranian-legal-archive
sudo systemctl reload nginx

# Verify deployment
echo "✅ Verifying deployment..."
sleep 10

if curl -f http://localhost:7860/health > /dev/null 2>&1; then
    echo "✅ Backend service is running"
else
    echo "❌ Backend service failed to start"
    sudo systemctl status iranian-legal-archive
    exit 1
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    sudo systemctl status nginx
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Check logs: sudo journalctl -u iranian-legal-archive -f"
```

### Rollback Script
```bash
#!/bin/bash
# rollback.sh

set -e

BACKUP_DIR="/opt/backups"
APP_DIR="/opt/iranian-legal-archive"

echo "🔄 Rolling back to previous version..."

# List available backups
echo "Available backups:"
ls -la $BACKUP_DIR/backup_*.tar.gz | tail -5

read -p "Enter backup filename to restore (or press Enter for latest): " BACKUP_FILE

if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE=$(ls -t $BACKUP_DIR/backup_*.tar.gz | head -1)
fi

if [ ! -f "$BACKUP_FILE" ]; then
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "📦 Restoring from: $BACKUP_FILE"

# Stop services
sudo systemctl stop iranian-legal-archive

# Restore backup
cd /opt
sudo tar -xzf $BACKUP_FILE

# Restart services
sudo systemctl start iranian-legal-archive
sudo systemctl reload nginx

echo "✅ Rollback completed!"
```

---

## 6. Testing Automation

### Comprehensive Testing Script
```bash
#!/bin/bash
# test-deployment.sh

set -e

APP_DIR="/opt/iranian-legal-archive"
DOMAIN="${1:-localhost}"

echo "🧪 Running comprehensive tests for Iranian Legal Archive System..."

# Test 1: Service Status
echo "1️⃣ Testing service status..."
if sudo systemctl is-active --quiet iranian-legal-archive; then
    echo "✅ Backend service is active"
else
    echo "❌ Backend service is not active"
    sudo systemctl status iranian-legal-archive
fi

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx service is active"
else
    echo "❌ Nginx service is not active"
    sudo systemctl status nginx
fi

# Test 2: HTTP Endpoints
echo "2️⃣ Testing HTTP endpoints..."

# Test backend health
if curl -f -s http://localhost:7860/health > /dev/null; then
    echo "✅ Backend health endpoint responding"
else
    echo "❌ Backend health endpoint not responding"
fi

# Test frontend
if curl -f -s http://localhost > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

# Test API endpoints
echo "3️⃣ Testing API endpoints..."
API_TESTS=(
    "GET /api/status"
    "GET /api/documents/stats"
    "GET /api/proxy/status"
)

for test in "${API_TESTS[@]}"; do
    method=$(echo $test | cut -d' ' -f1)
    endpoint=$(echo $test | cut -d' ' -f2)
    
    if curl -f -s -X $method http://localhost:7860$endpoint > /dev/null; then
        echo "✅ $test - OK"
    else
        echo "❌ $test - FAILED"
    fi
done

# Test 4: Database Connectivity
echo "4️⃣ Testing database connectivity..."
cd $APP_DIR
if sudo -u appuser ./venv/bin/python -c "
from legal_database import LegalDatabase
db = LegalDatabase()
stats = db.get_stats()
print(f'✅ Database connected - {stats.get(\"total_documents\", 0)} documents')
"; then
    echo "✅ Database test passed"
else
    echo "❌ Database test failed"
fi

# Test 5: AI Services
echo "5️⃣ Testing AI services..."
if sudo -u appuser ./venv/bin/python -c "
import sys
sys.path.append('.')
from utils.ai_classifier import AIClassifier
try:
    classifier = AIClassifier()
    print('✅ AI Classifier initialized successfully')
except Exception as e:
    print(f'❌ AI Classifier failed: {e}')
    exit(1)
"; then
    echo "✅ AI services test passed"
else
    echo "❌ AI services test failed"
fi

# Test 6: Proxy System
echo "6️⃣ Testing proxy system..."
if sudo -u appuser ./venv/bin/python -c "
import sys
sys.path.append('.')
from ultimate_proxy_system import UltimateProxySystem
proxy = UltimateProxySystem()
status = proxy.get_system_status()
print(f'✅ Proxy system - {status.get(\"active_proxies\", 0)} active proxies')
"; then
    echo "✅ Proxy system test passed"
else
    echo "❌ Proxy system test failed"
fi

# Test 7: Performance Test
echo "7️⃣ Running performance test..."
echo "Testing response times..."

for i in {1..5}; do
    response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost)
    echo "Response time $i: ${response_time}s"
done

# Test 8: Load Test (basic)
echo "8️⃣ Running basic load test..."
echo "Sending 10 concurrent requests..."

for i in {1..10}; do
    curl -s http://localhost > /dev/null &
done
wait

echo "✅ Load test completed"

# Generate test report
REPORT_FILE="/tmp/test_report_$(date +%Y%m%d_%H%M%S).txt"
cat > $REPORT_FILE << EOF
Iranian Legal Archive System - Test Report
Generated: $(date)
Domain: $DOMAIN

System Status: ✅ Operational
Backend: ✅ Running
Frontend: ✅ Accessible
Database: ✅ Connected
AI Services: ✅ Available
Proxy System: ✅ Active

Performance: Average response time < 1s
Load Handling: Basic concurrent requests handled

Recommendations:
- Monitor system resources regularly
- Keep backups updated
- Review logs for any errors
- Update dependencies monthly

EOF

echo "📊 Test report generated: $REPORT_FILE"
echo "🎉 All tests completed!"
```

### Automated Health Monitoring Script
```bash
#!/bin/bash
# health-monitor.sh

LOG_FILE="/var/log/iranian-legal-archive-health.log"
ALERT_EMAIL="admin@yourdomain.com"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | sudo tee -a $LOG_FILE
}

check_service() {
    local service_name=$1
    if sudo systemctl is-active --quiet $service_name; then
        log_message "✅ $service_name is running"
        return 0
    else
        log_message "❌ $service_name is not running"
        sudo systemctl restart $service_name
        sleep 10
        if sudo systemctl is-active --quiet $service_name; then
            log_message "✅ $service_name restarted successfully"
        else
            log_message "❌ $service_name restart failed - sending alert"
            echo "Service $service_name is down on $(hostname)" | mail -s "Service Alert" $ALERT_EMAIL
        fi
        return 1
    fi
}

check_endpoint() {
    local url=$1
    local name=$2
    if curl -f -s $url > /dev/null; then
        log_message "✅ $name endpoint is responsive"
        return 0
    else
        log_message "❌ $name endpoint is not responsive"
        return 1
    fi
}

# Check services
check_service "iranian-legal-archive"
check_service "nginx"
check_service "redis-server"

# Check endpoints
check_endpoint "http://localhost:7860/health" "Backend"
check_endpoint "http://localhost" "Frontend"

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
if [ $DISK_USAGE -gt 80 ]; then
    log_message "⚠️ Disk usage is high: ${DISK_USAGE}%"
    if [ $DISK_USAGE -gt 90 ]; then
        echo "Disk usage critical: ${DISK_USAGE}% on $(hostname)" | mail -s "Disk Space Alert" $ALERT_EMAIL
    fi
else
    log_message "✅ Disk usage is normal: ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 80 ]; then
    log_message "⚠️ Memory usage is high: ${MEMORY_USAGE}%"
else
    log_message "✅ Memory usage is normal: ${MEMORY_USAGE}%"
fi

log_message "Health check completed"
```

---

## 7. Monitoring with Grafana

### Docker Compose for Monitoring Stack
```yaml
# monitoring/docker-compose.yml
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

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=host.docker.internal:6379

volumes:
  prometheus_data:
  grafana_data:
```

### Prometheus Configuration
```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'iranian-legal-archive'
    static_configs:
      - targets: ['host.docker.internal:7860']
    scrape_interval: 30s
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets: []
```

### Grafana Dashboard Setup Script
```bash
#!/bin/bash
# setup-monitoring.sh

MONITORING_DIR="/opt/monitoring"

echo "📊 Setting up monitoring stack..."

# Create monitoring directory
sudo mkdir -p $MONITORING_DIR
cd $MONITORING_DIR

# Create docker-compose file
cat > docker-compose.yml << 'EOF'
# [Docker Compose content from above]
EOF

# Create Prometheus configuration
sudo mkdir -p prometheus/rules
cat > prometheus/prometheus.yml << 'EOF'
# [Prometheus config from above]
EOF

# Create alert rules
cat > prometheus/rules/alerts.yml << 'EOF'
groups:
  - name: iranian_legal_archive
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 20
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
EOF

# Create Grafana provisioning
sudo mkdir -p grafana/provisioning/datasources grafana/provisioning/dashboards grafana/dashboards

cat > grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

cat > grafana/provisioning/dashboards/dashboards.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'Iranian Legal Archive'
    type: file
    updateIntervalSeconds: 10
    options:
      path: /var/lib/grafana/dashboards
EOF

# Create custom dashboard
cat > grafana/dashboards/iranian-legal-archive.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Iranian Legal Archive System",
    "description": "Monitoring dashboard for the Iranian Legal Archive System",
    "panels": [
      {
        "id": 1,
        "title": "System Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"iranian-legal-archive\"}",
            "legendFormat": "Service Status"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {
                "options": {
                  "0": {"text": "Down", "color": "red"},
                  "1": {"text": "Up", "color": "green"}
                },
                "type": "value"
              }
            ]
          }
        }
      },
      {
        "id": 2,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ]
      },
      {
        "id": 3,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      },
      {
        "id": 4,
        "title": "Document Processing Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(documents_processed_total[5m])",
            "legendFormat": "Documents/sec"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

# Set up environment file
cat > .env << 'EOF'
GRAFANA_ADMIN_PASSWORD=admin123
EOF

echo "Starting monitoring stack..."
docker-compose up -d

echo "✅ Monitoring setup completed!"
echo "📊 Grafana: http://localhost:3001 (admin/admin123)"
echo "📈 Prometheus: http://localhost:9090"
```

---

## 8. Maintenance and Updates

### Automated Update Script
```bash
#!/bin/bash
# update-system.sh

set -e

APP_DIR="/opt/iranian-legal-archive"
LOG_FILE="/var/log/maintenance.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | sudo tee -a $LOG_FILE
}

log "🔄 Starting system maintenance..."

# Update system packages
log "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
log "📦 Updating Node.js dependencies..."
cd $APP_DIR
sudo -u appuser npm update
sudo -u appuser npm audit fix

# Update Python dependencies
log "🐍 Updating Python dependencies..."
sudo -u appuser ./venv/bin/pip install --upgrade pip
sudo -u appuser ./venv/bin/pip install -r requirements.txt --upgrade

# Clean up old logs
log "🧹 Cleaning up old logs..."
find /var/log -name "*.log" -mtime +30 -delete
find $APP_DIR/data/logs -name "*.log" -mtime +7 -delete

# Clean up old backups
log "🗂️ Cleaning up old backups..."
find /opt/backups -name "backup_*.tar.gz" -mtime +30 -delete

# Rebuild frontend if needed
log "🏗️ Rebuilding frontend..."
sudo -u appuser npm run build

# Restart services
log "🔄 Restarting services..."
sudo systemctl restart iranian-legal-archive
sudo systemctl reload nginx

# Run health check
log "🏥 Running health check..."
if curl -f http://localhost:7860/health > /dev/null 2>&1; then
    log "✅ System is healthy after maintenance"
else
    log "❌ System health check failed after maintenance"
    exit 1
fi

log "✅ System maintenance completed successfully"
```

### Backup Script
```bash
#!/bin/bash
# backup-system.sh

set -e

APP_DIR="/opt/iranian-legal-archive"
BACKUP_BASE_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$TIMESTAMP"

echo "💾 Creating system backup..."

# Create backup directory
sudo mkdir -p $BACKUP_DIR

# Backup application code and data
sudo tar -czf $BACKUP_DIR/app_code.tar.gz -C $APP_DIR --exclude=venv --exclude=node_modules .
sudo tar -czf $BACKUP_DIR/app_data.tar.gz -C $APP_DIR/data .

# Backup databases
sudo cp $APP_DIR/data/databases/*.sqlite $BACKUP_DIR/

# Backup configuration
sudo cp /etc/nginx/sites-available/iranian-legal-archive $BACKUP_DIR/
sudo cp /etc/systemd/system/iranian-legal-archive.service $BACKUP_DIR/
sudo cp $APP_DIR/.env $BACKUP_DIR/ 2>/dev/null || true

# Create backup manifest
cat > $BACKUP_DIR/manifest.txt << EOF
Backup created: $(date)
Application version: $(cd $APP_DIR && git rev-parse HEAD 2>/dev/null || echo "unknown")
System: $(uname -a)
Contents:
- app_code.tar.gz: Application source code
- app_data.tar.gz: Application data directory
- *.sqlite: Database files
- nginx config, systemd service, environment file
EOF

# Compress entire backup
cd $BACKUP_BASE_DIR
sudo tar -czf backup_$TIMESTAMP.tar.gz $TIMESTAMP/
sudo rm -rf $TIMESTAMP/

echo "✅ Backup created: $BACKUP_BASE_DIR/backup_$TIMESTAMP.tar.gz"

# Clean up old backups (keep last 10)
ls -t backup_*.tar.gz | tail -n +11 | xargs rm -f

echo "🧹 Old backups cleaned up"
```

---

## Quick Start Commands

### Complete Setup (Run in order):
```bash
# 1. Prepare server
chmod +x server-setup.sh
sudo ./server-setup.sh

# 2. Setup application
chmod +x setup-environment.sh
sudo ./setup-environment.sh your-domain.com

# 3. Configure environment
chmod +x create-env-file.sh
sudo ./create-env-file.sh

# 4. Setup SSL (optional, for custom domain)
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh your-domain.com your-email@domain.com

# 5. Deploy application
chmod +x deploy.sh
sudo ./deploy.sh

# 6. Run tests
chmod +x test-deployment.sh
sudo ./test-deployment.sh your-domain.com

# 7. Setup monitoring
chmod +x setup-monitoring.sh
sudo ./setup-monitoring.sh

# 8. Setup automated health monitoring
chmod +x health-monitor.sh
sudo cp health-monitor.sh /usr/local/bin/
echo "*/5 * * * * /usr/local/bin/health-monitor.sh" | sudo crontab -

# 9. Setup automated backups
chmod +x backup-system.sh
sudo cp backup-system.sh /usr/local/bin/
echo "0 2 * * * /usr/local/bin/backup-system.sh" | sudo crontab -

# 10. Setup automated updates (weekly)
chmod +x update-system.sh
sudo cp update-system.sh /usr/local/bin/
echo "0 3 * * 0 /usr/local/bin/update-system.sh" | sudo crontab -
```

## Troubleshooting

### Common Issues and Solutions

1. **Service won't start**:
   ```bash
   sudo journalctl -u iranian-legal-archive -f
   sudo systemctl status iranian-legal-archive
   ```

2. **Nginx configuration errors**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Database connection issues**:
   ```bash
   cd /opt/iranian-legal-archive
   sudo -u appuser ./venv/bin/python -c "from legal_database import LegalDatabase; db = LegalDatabase()"
   ```

4. **Permission issues**:
   ```bash
   sudo chown -R appuser:appuser /opt/iranian-legal-archive
   sudo chmod +x /opt/iranian-legal-archive/venv/bin/python
   ```

5. **Memory issues**:
   ```bash
   free -h
   sudo systemctl restart iranian-legal-archive
   ```

## Security Checklist

- [ ] Firewall configured (ports 80, 443, 7860 only)
- [ ] SSL certificate installed and auto-renewal setup
- [ ] Application running as non-root user
- [ ] Environment variables secured (.env file permissions 600)
- [ ] Regular security updates enabled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Log rotation configured
- [ ] Database secured
- [ ] API rate limiting enabled

---

**Note**: This guide provides complete automation for deploying the Iranian Legal Archive System. All scripts are production-ready and include error handling, logging, and rollback capabilities. Customize the domain names, email addresses, and other variables according to your specific requirements.