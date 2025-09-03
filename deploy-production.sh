#!/bin/bash

# ========================================
# PRODUCTION DEPLOYMENT SCRIPT
# Iranian Legal Archive System
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Configuration
PROJECT_NAME="iranian-legal-archive"
PROJECT_DIR="/opt/$PROJECT_NAME"
SERVICE_USER="legal-archive"
DOMAIN="${1:-your-domain.com}"
EMAIL="${2:-admin@$DOMAIN}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root"
fi

# Check if domain is provided
if [[ "$DOMAIN" == "your-domain.com" ]]; then
    error "Please provide a valid domain: ./deploy-production.sh yourdomain.com admin@yourdomain.com"
fi

log "Starting production deployment for $PROJECT_NAME on $DOMAIN"

# ========================================
# SYSTEM UPDATE & DEPENDENCIES
# ========================================
log "Updating system packages..."
apt update && apt upgrade -y

log "Installing system dependencies..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    ufw \
    fail2ban \
    htop \
    iotop \
    nethogs \
    logrotate \
    cron \
    rsync \
    backup-manager

# ========================================
# CREATE SERVICE USER
# ========================================
log "Creating service user..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $PROJECT_DIR $SERVICE_USER
    mkdir -p $PROJECT_DIR
    chown $SERVICE_USER:$SERVICE_USER $PROJECT_DIR
else
    log "Service user $SERVICE_USER already exists"
fi

# ========================================
# INSTALL DOCKER & DOCKER COMPOSE
# ========================================
log "Installing Docker and Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    usermod -aG docker $SERVICE_USER
    systemctl enable docker
    systemctl start docker
else
    log "Docker already installed"
fi

# ========================================
# INSTALL NODE.JS
# ========================================
log "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    npm install -g npm@latest
else
    log "Node.js already installed"
fi

# ========================================
# INSTALL POSTGRESQL
# ========================================
log "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt update
    apt install -y postgresql postgresql-contrib postgresql-client
    systemctl enable postgresql
    systemctl start postgresql
else
    log "PostgreSQL already installed"
fi

# ========================================
# INSTALL REDIS
# ========================================
log "Installing Redis..."
if ! command -v redis-server &> /dev/null; then
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
else
    log "Redis already installed"
fi

# ========================================
# INSTALL ELASTICSEARCH
# ========================================
log "Installing Elasticsearch..."
if ! systemctl is-active --quiet elasticsearch; then
    wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -
    echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | tee /etc/apt/sources.list.d/elastic-7.x.list
    apt update
    apt install -y elasticsearch
    systemctl enable elasticsearch
    systemctl start elasticsearch
else
    log "Elasticsearch already installed"
fi

# ========================================
# INSTALL PROMETHEUS & GRAFANA
# ========================================
log "Installing Prometheus and Grafana..."
mkdir -p /opt/monitoring
cd /opt/monitoring

# Prometheus
if [[ ! -f prometheus.yml ]]; then
    wget https://github.com/prometheus/prometheus/releases/download/v2.37.0/prometheus-2.37.0.linux-amd64.tar.gz
    tar xzf prometheus-*.tar.gz
    mv prometheus-* prometheus
    rm prometheus-*.tar.gz
    
    cat > prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'iranian-legal-archive'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
EOF

    # Create systemd service for Prometheus
    cat > /etc/systemd/system/prometheus.service << EOF
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
ExecStart=/opt/monitoring/prometheus/prometheus --config.file=/opt/monitoring/prometheus/prometheus.yml --storage.tsdb.path=/opt/monitoring/prometheus/data
Restart=always

[Install]
WantedBy=default.target
EOF

    useradd --no-create-home --shell /bin/false prometheus
    chown -R prometheus:prometheus /opt/monitoring/prometheus
    systemctl daemon-reload
    systemctl enable prometheus
    systemctl start prometheus
fi

# Grafana
if ! command -v grafana-server &> /dev/null; then
    wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
    echo "deb https://packages.grafana.com/oss/deb stable main" | tee /etc/apt/sources.list.d/grafana.list
    apt update
    apt install -y grafana
    systemctl enable grafana-server
    systemctl start grafana-server
fi

# ========================================
# CLONE PROJECT
# ========================================
log "Cloning project repository..."
cd $PROJECT_DIR
if [[ ! -d ".git" ]]; then
    git clone https://github.com/aminchedo/Aihoghoghi.git .
    chown -R $SERVICE_USER:$SERVICE_USER .
else
    log "Project already cloned, pulling latest changes..."
    git pull origin main
fi

# ========================================
# INSTALL PROJECT DEPENDENCIES
# ========================================
log "Installing project dependencies..."
cd $PROJECT_DIR/src/backend
npm install --production

# ========================================
# SETUP ENVIRONMENT
# ========================================
log "Setting up environment configuration..."
cp $PROJECT_DIR/production.env.example $PROJECT_DIR/.env

# Update domain in .env
sed -i "s/your-domain.com/$DOMAIN/g" $PROJECT_DIR/.env
sed -i "s/admin@your-domain.com/$EMAIL/g" $PROJECT_DIR/.env

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
ELASTICSEARCH_PASSWORD=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 32)

# Update passwords in .env
sed -i "s/YOUR_SECURE_DB_PASSWORD/$DB_PASSWORD/g" $PROJECT_DIR/.env
sed -i "s/YOUR_SECURE_REDIS_PASSWORD/$REDIS_PASSWORD/g" $PROJECT_DIR/.env
sed -i "s/YOUR_ELASTICSEARCH_PASSWORD/$ELASTICSEARCH_PASSWORD/g" $PROJECT_DIR/.env
sed -i "s/YOUR_GRAFANA_PASSWORD/$GRAFANA_PASSWORD/g" $PROJECT_DIR/.env

chown $SERVICE_USER:$SERVICE_USER $PROJECT_DIR/.env
chmod 600 $PROJECT_DIR/.env

# ========================================
# SETUP DATABASE
# ========================================
log "Setting up database..."
sudo -u postgres psql << EOF
CREATE DATABASE iranian_legal_archive;
CREATE USER legal_archive_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE iranian_legal_archive TO legal_archive_user;
\c iranian_legal_archive
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
EOF

# Run database schema
log "Running database schema..."
cd $PROJECT_DIR/src/backend
sudo -u $SERVICE_USER npm run db:setup

# ========================================
# SETUP AI MODELS
# ========================================
log "Setting up AI models..."
mkdir -p /opt/ai-models
mkdir -p /opt/huggingface-cache
chown -R $SERVICE_USER:$SERVICE_USER /opt/ai-models
chown -R $SERVICE_USER:$SERVICE_USER /opt/huggingface-cache

# Download Persian BERT model
log "Downloading Persian BERT model..."
cd /opt/ai-models
sudo -u $SERVICE_USER python3 -c "
from transformers import AutoTokenizer, AutoModel
model_name = 'HooshvareLab/bert-base-parsbert-uncased'
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)
print('Persian BERT model downloaded successfully')
"

# ========================================
# SETUP SSL CERTIFICATES
# ========================================
log "Setting up SSL certificates..."
apt install -y certbot python3-certbot-nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /metrics {
        proxy_pass http://localhost:9090;
        proxy_set_header Host \$host;
    }
    
    location /grafana/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Get SSL certificate
certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive

# ========================================
# CREATE SYSTEMD SERVICE
# ========================================
log "Creating systemd service..."
cat > /etc/systemd/system/$PROJECT_NAME.service << EOF
[Unit]
Description=Iranian Legal Archive System
After=network.target postgresql.service redis-server.service elasticsearch.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR/src/backend
Environment=NODE_ENV=production
Environment=PATH=$PROJECT_DIR/src/backend/node_modules/.bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/node productionServer.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$PROJECT_NAME

[Install]
WantedBy=multi-user.target
EOF

# ========================================
# SETUP LOGGING
# ========================================
log "Setting up logging..."
mkdir -p /var/log/$PROJECT_NAME
chown $SERVICE_USER:$SERVICE_USER /var/log/$PROJECT_NAME

# Logrotate configuration
cat > /etc/logrotate.d/$PROJECT_NAME << EOF
/var/log/$PROJECT_NAME/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload $PROJECT_NAME
    endscript
}
EOF

# ========================================
# SETUP FIREWALL
# ========================================
log "Setting up firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 9090/tcp
ufw allow 3001/tcp
ufw --force enable

# ========================================
# SETUP FAIL2BAN
# ========================================
log "Setting up Fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# ========================================
# SETUP BACKUP CRON
# ========================================
log "Setting up backup cron job..."
mkdir -p /opt/backups
chown $SERVICE_USER:$SERVICE_USER /opt/backups

cat > /opt/backup-script.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/iranian_legal_archive_$DATE.sql"

# Database backup
sudo -u postgres pg_dump iranian_legal_archive > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x /opt/backup-script.sh
chown $SERVICE_USER:$SERVICE_USER /opt/backup-script.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-script.sh") | crontab -

# ========================================
# START SERVICES
# ========================================
log "Starting services..."
systemctl daemon-reload
systemctl enable $PROJECT_NAME
systemctl start $PROJECT_NAME

# Restart Nginx
systemctl restart nginx

# ========================================
# VERIFICATION
# ========================================
log "Verifying deployment..."
sleep 10

# Check if service is running
if systemctl is-active --quiet $PROJECT_NAME; then
    log "✅ $PROJECT_NAME service is running"
else
    error "❌ $PROJECT_NAME service failed to start"
fi

# Check if Nginx is running
if systemctl is-active --quiet nginx; then
    log "✅ Nginx is running"
else
    error "❌ Nginx failed to start"
fi

# Check if database is accessible
if sudo -u postgres psql -d iranian_legal_archive -c "SELECT 1;" > /dev/null 2>&1; then
    log "✅ Database is accessible"
else
    error "❌ Database is not accessible"
fi

# ========================================
# FINAL SETUP
# ========================================
log "Setting up monitoring dashboards..."

# Wait for Grafana to be ready
sleep 30

# Create Grafana dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard": {
      "title": "Iranian Legal Archive System",
      "panels": [
        {
          "title": "API Requests",
          "type": "graph",
          "targets": [
            {
              "expr": "rate(http_requests_total[5m])",
              "legendFormat": "{{method}} {{route}}"
            }
          ]
        },
        {
          "title": "Response Time",
          "type": "graph",
          "targets": [
            {
              "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
              "legendFormat": "95th percentile"
            }
          ]
        }
      ]
    }
  }' \
  "http://admin:$GRAFANA_PASSWORD@localhost:3001/api/dashboards/db"

# ========================================
# COMPLETION
# ========================================
log "🎉 Production deployment completed successfully!"
log ""
log "📋 DEPLOYMENT SUMMARY:"
log "   Domain: https://$DOMAIN"
log "   API Endpoint: https://$DOMAIN/api"
log "   Monitoring: https://$DOMAIN/grafana/"
log "   Prometheus: http://$DOMAIN/metrics"
log ""
log "🔐 CREDENTIALS:"
log "   Database Password: $DB_PASSWORD"
log "   Redis Password: $REDIS_PASSWORD"
log "   Elasticsearch Password: $ELASTICSEARCH_PASSWORD"
log "   Grafana Password: $GRAFANA_PASSWORD"
log ""
log "📁 IMPORTANT PATHS:"
log "   Project Directory: $PROJECT_DIR"
log "   Logs: /var/log/$PROJECT_NAME"
log "   Backups: /opt/backups"
log "   AI Models: /opt/ai-models"
log ""
log "🚀 NEXT STEPS:"
log "   1. Update DNS records to point to this server"
log "   2. Test the API endpoints"
log "   3. Configure monitoring alerts"
log "   4. Set up regular backups"
log "   5. Monitor system performance"
log ""
log "✅ System is ready for production use!"

# Save credentials to file
cat > $PROJECT_DIR/deployment-credentials.txt << EOF
Iranian Legal Archive System - Production Deployment Credentials
================================================================

Deployment Date: $(date)
Domain: $DOMAIN
Email: $EMAIL

CREDENTIALS:
Database Password: $DB_PASSWORD
Redis Password: $REDIS_PASSWORD
Elasticsearch Password: $ELASTICSEARCH_PASSWORD
Grafana Password: $GRAFANA_PASSWORD

IMPORTANT PATHS:
Project Directory: $PROJECT_DIR
Logs: /var/log/$PROJECT_NAME
Backups: /opt/backups
AI Models: /opt/ai-models

ENDPOINTS:
API: https://$DOMAIN/api
Monitoring: https://$DOMAIN/grafana/
Metrics: https://$DOMAIN/metrics

NEXT STEPS:
1. Update DNS records to point to this server
2. Test the API endpoints
3. Configure monitoring alerts
4. Set up regular backups
5. Monitor system performance

⚠️  IMPORTANT: Keep this file secure and backup the credentials!
EOF

chown $SERVICE_USER:$SERVICE_USER $PROJECT_DIR/deployment-credentials.txt
chmod 600 $PROJECT_DIR/deployment-credentials.txt

log "📄 Credentials saved to: $PROJECT_DIR/deployment-credentials.txt"
log "🔒 File permissions set to secure access"