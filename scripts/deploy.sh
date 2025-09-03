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