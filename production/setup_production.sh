#!/bin/bash

# Production Setup Script for Persian BERT Legal Archive System
# This script prepares the production environment and runs deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Docker on Ubuntu/Debian
install_docker() {
    log "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    success "Docker installed successfully"
    warning "Please log out and back in for group changes to take effect"
}

# Function to install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    
    # Download Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    success "Docker Compose installed successfully"
}

# Function to setup environment file
setup_environment() {
    log "Setting up environment configuration..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_EXAMPLE" ]]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            success "Environment file created from template"
            warning "Please edit $ENV_FILE with your actual values before continuing"
        else
            error "Environment template not found: $ENV_EXAMPLE"
            exit 1
        fi
    else
        log "Environment file already exists: $ENV_FILE"
    fi
    
    # Check if environment file needs configuration
    if grep -q "your-domain.com\|your_secure_password_here" "$ENV_FILE"; then
        warning "Environment file contains placeholder values"
        echo ""
        echo "Please edit $ENV_FILE and set the following values:"
        echo "  - DOMAIN_NAME: Your actual domain name"
        echo "  - POSTGRES_PASSWORD: Secure PostgreSQL password"
        echo "  - REDIS_PASSWORD: Secure Redis password"
        echo "  - CERTBOT_EMAIL: Your email for SSL certificates"
        echo "  - GRAFANA_PASSWORD: Secure Grafana password"
        echo "  - HUGGINGFACE_TOKEN: Your Hugging Face API token"
        echo ""
        read -p "Press Enter after you've configured the environment file..."
    fi
}

# Function to check system requirements
check_system_requirements() {
    log "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        error "Unsupported operating system"
        exit 1
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        warning "This script is tested on Ubuntu/Debian. Other systems may work but are not guaranteed."
    fi
    
    # Check available memory (minimum 4GB)
    total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
    if [[ $total_mem -lt 4 ]]; then
        error "Insufficient memory. Minimum 4GB required, found ${total_mem}GB"
        exit 1
    fi
    
    # Check available disk space (minimum 20GB)
    available_space=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $available_space -lt 20 ]]; then
        error "Insufficient disk space. Minimum 20GB required, found ${available_space}GB"
        exit 1
    fi
    
    # Check if ports are available
    ports_to_check=(80 443 8000 3000 9090 5432 6379)
    for port in "${ports_to_check[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            warning "Port $port is already in use"
        fi
    done
    
    success "System requirements check passed"
}

# Function to setup firewall
setup_firewall() {
    log "Setting up firewall rules..."
    
    if command_exists ufw; then
        # Allow SSH
        sudo ufw allow ssh
        
        # Allow HTTP and HTTPS
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        
        # Allow application ports
        sudo ufw allow 8000/tcp
        sudo ufw allow 3000/tcp
        sudo ufw allow 9090/tcp
        
        # Enable firewall
        echo "y" | sudo ufw enable
        
        success "Firewall configured"
    else
        warning "UFW not found. Please configure your firewall manually to allow ports 80, 443, 8000, 3000, and 9090"
    fi
}

# Function to setup SSL certificate renewal
setup_ssl_renewal() {
    log "Setting up SSL certificate renewal..."
    
    # Create renewal script
    cat > "$SCRIPT_DIR/renew_ssl.sh" << 'EOF'
#!/bin/bash
# SSL Certificate Renewal Script

cd "$(dirname "$0")"
docker-compose run --rm certbot renew
docker-compose restart nginx
EOF
    
    chmod +x "$SCRIPT_DIR/renew_ssl.sh"
    
    # Add to crontab (renew every 60 days)
    (crontab -l 2>/dev/null; echo "0 2 */60 * * $SCRIPT_DIR/renew_ssl.sh") | crontab -
    
    success "SSL renewal cron job configured"
}

# Function to setup backup
setup_backup() {
    log "Setting up backup configuration..."
    
    # Create backup script
    cat > "$SCRIPT_DIR/backup.sh" << 'EOF'
#!/bin/bash
# Backup Script for Persian BERT Legal Archive System

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
docker-compose exec -T postgres pg_dump -U postgres persian_legal_db > "$BACKUP_DIR/database_$DATE.sql"

# Backup application data
tar -czf "$BACKUP_DIR/app_data_$DATE.tar.gz" -C production logs models

# Backup configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" -C production .env nginx monitoring

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x "$SCRIPT_DIR/backup.sh"
    
    # Add to crontab (backup daily at 3 AM)
    (crontab -l 2>/dev/null; echo "0 3 * * * $SCRIPT_DIR/backup.sh") | crontab -
    
    success "Backup cron job configured"
}

# Function to setup monitoring alerts
setup_monitoring_alerts() {
    log "Setting up monitoring alerts..."
    
    # Create alert configuration
    cat > "$SCRIPT_DIR/monitoring/alerts.yml" << 'EOF'
groups:
  - name: persian-bert-alerts
    rules:
      - alert: ApplicationDown
        expr: up{job="persian-bert-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Persian BERT application is down"
          description: "Application has been down for more than 1 minute"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{job="persian-bert-app", status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="persian-bert-app"}[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"
      
      - alert: DatabaseHighConnections
        expr: pg_stat_database_numbackends{job="postgres"} > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ $value }} active connections"
EOF
    
    success "Monitoring alerts configured"
}

# Main setup function
main() {
    log "Starting production setup for Persian BERT Legal Archive System"
    echo ""
    
    # Check system requirements
    check_system_requirements
    
    # Install Docker if not present
    if ! command_exists docker; then
        log "Docker not found. Installing..."
        install_docker
        echo ""
        warning "Docker installed. Please log out and back in, then run this script again."
        exit 0
    fi
    
    # Install Docker Compose if not present
    if ! command_exists docker-compose; then
        log "Docker Compose not found. Installing..."
        install_docker_compose
    fi
    
    # Setup environment
    setup_environment
    
    # Setup firewall
    setup_firewall
    
    # Setup SSL renewal
    setup_ssl_renewal
    
    # Setup backup
    setup_backup
    
    # Setup monitoring alerts
    setup_monitoring_alerts
    
    echo ""
    success "=== PRODUCTION SETUP COMPLETED ==="
    echo ""
    log "Next steps:"
    echo "  1. Ensure your domain DNS points to this server's IP address"
    echo "  2. Run the deployment script: ./deploy.sh"
    echo "  3. Test all endpoints: ./test_endpoints.sh"
    echo "  4. Monitor the application logs: docker-compose logs -f"
    echo ""
    log "Important files created:"
    echo "  - Environment config: $ENV_FILE"
    echo "  - SSL renewal: $SCRIPT_DIR/renew_ssl.sh"
    echo "  - Backup script: $SCRIPT_DIR/backup.sh"
    echo "  - Monitoring alerts: $SCRIPT_DIR/monitoring/alerts.yml"
    echo ""
    log "Cron jobs configured:"
    echo "  - SSL renewal: Every 60 days at 2 AM"
    echo "  - Backup: Daily at 3 AM"
    echo ""
    log "Ready to deploy! Run: ./deploy.sh"
}

# Run main function
main "$@"