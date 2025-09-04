#!/bin/bash

# ========================================
# FREE DOMAIN SETUP SCRIPT
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
echo "  FREE DOMAIN SETUP FOR IRANIAN LEGAL"
echo "           ARCHIVE SYSTEM"
echo "=========================================="
echo -e "${NC}"

# ========================================
# DOMAIN OPTIONS
# ========================================
echo -e "${YELLOW}Available Free Domain Options:${NC}"
echo "1. Freenom (.tk, .ml, .ga, .cf, .gq)"
echo "2. GitHub Pages (username.github.io/Aihoghoghi)"
echo "3. Netlify (.netlify.app)"
echo "4. Vercel (.vercel.app)"
echo "5. Railway (.railway.app)"
echo ""

read -p "Choose your preferred option (1-5): " DOMAIN_OPTION

case $DOMAIN_OPTION in
    1)
        echo -e "${GREEN}Setting up Freenom domain...${NC}"
        echo ""
        echo "Steps to get your free domain:"
        echo "1. Visit: https://freenom.com"
        echo "2. Search for your desired domain (e.g., iranianlaw.tk)"
        echo "3. Register for free (up to 12 months)"
        echo "4. Access DNS management in your Freenom dashboard"
        echo ""
        read -p "Enter your Freenom domain (e.g., iranianlaw.tk): " FREENOM_DOMAIN
        DOMAIN_NAME=$FREENOM_DOMAIN
        DOMAIN_PROVIDER="freenom"
        ;;
    2)
        echo -e "${GREEN}Setting up GitHub Pages subdomain...${NC}"
        read -p "Enter your GitHub username: " GITHUB_USERNAME
        DOMAIN_NAME="${GITHUB_USERNAME}.github.io/Aihoghoghi"
        DOMAIN_PROVIDER="github"
        ;;
    3)
        echo -e "${GREEN}Setting up Netlify subdomain...${NC}"
        read -p "Enter your desired app name: " NETLIFY_APP_NAME
        DOMAIN_NAME="${NETLIFY_APP_NAME}.netlify.app"
        DOMAIN_PROVIDER="netlify"
        ;;
    4)
        echo -e "${GREEN}Setting up Vercel subdomain...${NC}"
        read -p "Enter your desired app name: " VERCEL_APP_NAME
        DOMAIN_NAME="${VERCEL_APP_NAME}.vercel.app"
        DOMAIN_PROVIDER="vercel"
        ;;
    5)
        echo -e "${GREEN}Setting up Railway subdomain...${NC}"
        read -p "Enter your desired app name: " RAILWAY_APP_NAME
        DOMAIN_NAME="${RAILWAY_APP_NAME}.railway.app"
        DOMAIN_PROVIDER="railway"
        ;;
    *)
        error "Invalid option selected"
        ;;
esac

echo ""
log "Selected domain: $DOMAIN_NAME"
log "Domain provider: $DOMAIN_PROVIDER"

# ========================================
# DNS CONFIGURATION
# ========================================
echo ""
echo -e "${YELLOW}DNS Configuration Instructions:${NC}"

case $DOMAIN_PROVIDER in
    "freenom")
        echo ""
        echo "Configure these DNS records in your Freenom dashboard:"
        echo "Type    | Name | Value"
        echo "--------|------|------"
        echo "A       | @    | [YOUR_RAILWAY_IP]"
        echo "A       | www  | [YOUR_RAILWAY_IP]"
        echo "CNAME   | api  | $DOMAIN_NAME"
        echo ""
        echo "Note: You'll get the Railway IP after deployment"
        ;;
    "github")
        echo ""
        echo "GitHub Pages will automatically handle DNS for:"
        echo "https://$DOMAIN_NAME"
        echo ""
        echo "For custom domain, add CNAME record in repository settings"
        ;;
    "netlify"|"vercel"|"railway")
        echo ""
        echo "DNS will be automatically configured by $DOMAIN_PROVIDER"
        echo "Your site will be available at: https://$DOMAIN_NAME"
        ;;
esac

# ========================================
# ENVIRONMENT FILE CREATION
# ========================================
echo ""
log "Creating environment configuration..."

ENV_FILE=".env.production"
cat > $ENV_FILE << EOF
# ========================================
# PRODUCTION ENVIRONMENT VARIABLES
# Iranian Legal Archive System
# ========================================

# Domain Configuration
DOMAIN_NAME=$DOMAIN_NAME
DOMAIN_PROVIDER=$DOMAIN_PROVIDER

# Railway Configuration
RAILWAY_TOKEN=your_railway_token_here
RAILWAY_PROJECT_NAME=iranian-legal-archive

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/iranian_legal_db
REDIS_URL=redis://localhost:6379

# AI Model Configuration
HUGGINGFACE_TOKEN=your_huggingface_token_here
AI_MODEL_PATH=./models/persian-bert-legal

# Security Configuration
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem
EOF

log "Environment file created: $ENV_FILE"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Edit $ENV_FILE with your actual values"
echo "2. Get your Railway token from: https://railway.app/account/tokens"
echo "3. Get your HuggingFace token from: https://huggingface.co/settings/tokens"
echo "4. Run the deployment script: ./deploy-railway.sh"
echo ""

# ========================================
# RAILWAY DEPLOYMENT SCRIPT
# ========================================
log "Creating Railway deployment script..."

cat > deploy-railway.sh << 'EOF'
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
EOF

chmod +x deploy-railway.sh
log "Railway deployment script created: deploy-railway.sh"

# ========================================
# TESTING SCRIPT
# ========================================
log "Creating endpoint testing script..."

cat > test-endpoints.sh << 'EOF'
#!/bin/bash

# ========================================
# ENDPOINT TESTING SCRIPT
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
echo "  ENDPOINT TESTING FOR IRANIAN LEGAL"
echo "           ARCHIVE SYSTEM"
echo "=========================================="
echo -e "${NC}"

# Load environment variables
if [ -f ".env.production" ]; then
    source .env.production
else
    read -p "Enter your deployment URL: " DEPLOYMENT_URL
fi

if [ -z "$DEPLOYMENT_URL" ]; then
    error "No deployment URL provided"
fi

# Test endpoints
log "Testing endpoints at: $DEPLOYMENT_URL"

# Health check
log "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/v1/system/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    log "✅ Health endpoint working"
else
    warn "❌ Health endpoint failed"
    echo "Response: $HEALTH_RESPONSE"
fi

# AI model status
log "Testing AI model endpoint..."
AI_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/v1/ai/status")
if [ $? -eq 0 ]; then
    log "✅ AI model endpoint working"
else
    warn "❌ AI model endpoint failed"
fi

# Database status
log "Testing database endpoint..."
DB_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/v1/database/status")
if [ $? -eq 0 ]; then
    log "✅ Database endpoint working"
else
    warn "❌ Database endpoint failed"
fi

# Persian text processing test
log "Testing Persian text processing..."
PERSIAN_TEST=$(curl -s -X POST "$DEPLOYMENT_URL/api/v1/ai/analyze" \
    -H "Content-Type: application/json" \
    -d '{"text": "قانون اساسی جمهوری اسلامی ایران", "language": "fa"}')

if [ $? -eq 0 ]; then
    log "✅ Persian text processing working"
else
    warn "❌ Persian text processing failed"
fi

echo ""
echo -e "${GREEN}✅ Endpoint testing complete!${NC}"
echo "Check the results above for any issues."
EOF

chmod +x test-endpoints.sh
log "Endpoint testing script created: test-endpoints.sh"

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Files Created:${NC}"
echo "✅ .env.production - Environment configuration"
echo "✅ deploy-railway.sh - Railway deployment script"
echo "✅ test-endpoints.sh - Endpoint testing script"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Edit .env.production with your actual values"
echo "2. Run: ./deploy-railway.sh"
echo "3. Test your deployment: ./test-endpoints.sh"
echo ""
echo -e "${GREEN}Your Iranian Legal Archive System will be live soon!${NC}"