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