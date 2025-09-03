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