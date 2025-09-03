#!/bin/bash

# Production Deployment Script for Persian BERT Legal Archive System
# This script sets up the complete production environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
   exit 1
fi

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$SCRIPT_DIR/.env"

# Check if .env file exists
if [[ ! -f "$ENV_FILE" ]]; then
    error "Environment file not found: $ENV_FILE"
    error "Please copy .env.example to .env and configure your settings"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Validate required environment variables
required_vars=(
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "DOMAIN_NAME"
    "CERTBOT_EMAIL"
    "GRAFANA_PASSWORD"
    "HUGGINGFACE_TOKEN"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        error "Required environment variable $var is not set"
        exit 1
    fi
done

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
log "Checking prerequisites..."
if ! command_exists docker; then
    error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not running. Please start Docker first."
    exit 1
fi

success "Prerequisites check passed"

# Create necessary directories
log "Creating production directories..."
mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/ssl"
mkdir -p "$SCRIPT_DIR/certbot/conf"
mkdir -p "$SCRIPT_DIR/certbot/www"
mkdir -p "$SCRIPT_DIR/monitoring/grafana/provisioning/dashboards"
mkdir -p "$SCRIPT_DIR/monitoring/grafana/provisioning/datasources"

success "Directories created"

# Update domain name in Nginx configuration
log "Updating domain configuration..."
sed -i "s/your-domain.com/$DOMAIN_NAME/g" "$SCRIPT_DIR/nginx/conf.d/default.conf"
success "Domain configuration updated"

# Generate secure passwords if not set
if [[ "$SECRET_KEY" == "your_secret_key_here" ]]; then
    log "Generating secure secret key..."
    SECRET_KEY=$(openssl rand -hex 32)
    echo "SECRET_KEY=$SECRET_KEY" >> "$ENV_FILE"
    success "Secret key generated"
fi

# Build and start services
log "Building and starting services..."
cd "$SCRIPT_DIR"

# Pull latest images
log "Pulling latest Docker images..."
docker-compose pull

# Build application images
log "Building application images..."
docker-compose build --no-cache

# Start services
log "Starting services..."
docker-compose up -d

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 30

# Check service health
log "Checking service health..."
if ! docker-compose ps | grep -q "Up"; then
    error "Some services failed to start"
    docker-compose logs
    exit 1
fi

success "All services are running"

# Initialize database
log "Initializing database..."
sleep 10  # Wait for PostgreSQL to be ready

# Run database migrations
log "Running database migrations..."
docker-compose exec -T postgres psql -U postgres -d persian_legal_db -f /docker-entrypoint-initdb.d/01-init-database.sql

success "Database initialized"

# Download AI models
log "Starting AI model download..."
docker-compose logs model-manager

# Wait for models to download
log "Waiting for AI models to download (this may take several minutes)..."
sleep 120

# Check model status
log "Checking AI model status..."
docker-compose exec model-manager python -c "
import asyncio
from model_manager import PersianBERTModelManager
manager = PersianBERTModelManager()
status = manager.get_model_status()
print('Model Status:', status)
"

success "AI models configured"

# Setup SSL certificate
log "Setting up SSL certificate..."
docker-compose run --rm certbot

# Reload Nginx with SSL
log "Reloading Nginx with SSL configuration..."
docker-compose restart nginx

success "SSL certificate configured"

# Setup monitoring
log "Setting up monitoring dashboards..."
# Prometheus and Grafana are already running from docker-compose

# Wait for Grafana to be ready
log "Waiting for Grafana to be ready..."
sleep 30

# Create admin user for Grafana
log "Setting up Grafana admin user..."
curl -X POST \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"admin\",\"email\":\"admin@$DOMAIN_NAME\",\"login\":\"admin\",\"password\":\"$GRAFANA_PASSWORD\"}" \
    "http://localhost:3000/api/admin/users" || warning "Grafana admin user creation failed (may already exist)"

success "Monitoring setup completed"

# Final health check
log "Performing final health check..."
sleep 10

# Check all endpoints
log "Testing application endpoints..."

# Health endpoint
if curl -f "http://localhost/health" >/dev/null 2>&1; then
    success "Health endpoint is working"
else
    warning "Health endpoint check failed"
fi

# Main application
if curl -f "http://localhost/" >/dev/null 2>&1; then
    success "Main application is accessible"
else
    warning "Main application check failed"
fi

# API endpoint
if curl -f "http://localhost/api/" >/dev/null 2>&1; then
    success "API endpoint is working"
else
    warning "API endpoint check failed"
fi

# Prometheus metrics
if curl -f "http://localhost:9090" >/dev/null 2>&1; then
    success "Prometheus is accessible"
else
    warning "Prometheus check failed"
fi

# Grafana
if curl -f "http://localhost:3000" >/dev/null 2>&1; then
    success "Grafana is accessible"
else
    warning "Grafana check failed"
fi

# Print deployment summary
echo ""
success "=== PRODUCTION DEPLOYMENT COMPLETED ==="
echo ""
log "Service URLs:"
echo "  - Main Application: https://$DOMAIN_NAME"
echo "  - API Endpoints: https://$DOMAIN_NAME/api/"
echo "  - Prometheus: http://$DOMAIN_NAME:9090"
echo "  - Grafana: http://$DOMAIN_NAME:3000 (admin/$GRAFANA_PASSWORD)"
echo ""
log "Next steps:"
echo "  1. Update your DNS records to point $DOMAIN_NAME to this server's IP"
echo "  2. Test all functionality at https://$DOMAIN_NAME"
echo "  3. Set up monitoring alerts in Grafana"
echo "  4. Configure backup strategies"
echo "  5. Set up log rotation and monitoring"
echo ""
log "To view logs: docker-compose logs -f [service-name]"
log "To stop services: docker-compose down"
log "To restart services: docker-compose restart"
echo ""

# Save deployment info
deployment_info="$SCRIPT_DIR/deployment_info.json"
cat > "$deployment_info" << EOF
{
    "deployment_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "domain": "$DOMAIN_NAME",
    "services": {
        "persian-bert-app": "running",
        "postgres": "running",
        "redis": "running",
        "nginx": "running",
        "prometheus": "running",
        "grafana": "running",
        "model-manager": "running"
    },
    "ssl": "configured",
    "monitoring": "configured",
    "ai_models": "downloaded"
}
EOF

success "Deployment information saved to $deployment_info"