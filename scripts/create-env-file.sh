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