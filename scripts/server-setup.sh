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