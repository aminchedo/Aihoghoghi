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