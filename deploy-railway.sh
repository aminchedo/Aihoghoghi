#!/bin/bash

# ========================================
# RAILWAY DEPLOYMENT SCRIPT
# Iranian Legal Archive System
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}"
echo "=========================================="
echo "  RAILWAY DEPLOYMENT FOR IRANIAN LEGAL"
echo "           ARCHIVE SYSTEM"
echo "=========================================="
echo -e "${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    error ".env.production file not found. Please run free-domain-setup.sh first."
fi

# Load environment variables
source .env.production

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    log "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
log "Logging into Railway..."
railway login

# Create new project
log "Creating Railway project..."
railway init --name "$RAILWAY_PROJECT_NAME"

# Deploy the application
log "Deploying to Railway..."
railway up

# Get deployment URL
log "Getting deployment URL..."
DEPLOYMENT_URL=$(railway status --json | jq -r '.deployment.url')

if [ "$DEPLOYMENT_URL" != "null" ] && [ "$DEPLOYMENT_URL" != "" ]; then
    log "Deployment successful!"
    log "Your app is available at: $DEPLOYMENT_URL"
    
    # Update environment file with actual URL
    sed -i "s|RAILWAY_DEPLOYMENT_URL=.*|RAILWAY_DEPLOYMENT_URL=$DEPLOYMENT_URL|" .env.production
    
    echo ""
    echo -e "${GREEN}✅ Deployment Complete!${NC}"
    echo "Frontend: $DEPLOYMENT_URL"
    echo "API: $DEPLOYMENT_URL/api"
    echo ""
    echo "Next steps:"
    echo "1. Test your endpoints: ./test-endpoints.sh"
    echo "2. Set up monitoring: ./setup-monitoring.sh"
    echo "3. Configure custom domain in Railway dashboard"
else
    error "Failed to get deployment URL"
fi