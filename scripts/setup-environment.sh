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