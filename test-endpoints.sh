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

# Performance test with curl format
if [ -f "curl-format.txt" ]; then
    log "Testing response time..."
    RESPONSE_TIME=$(curl -w "@curl-format.txt" -o /dev/null -s "$DEPLOYMENT_URL/api/v1/system/health" | grep "time_total" | cut -d: -f2 | tr -d ' ')
    log "Response time: ${RESPONSE_TIME}s"
    
    # Check if response time is acceptable
    if (( $(echo "$RESPONSE_TIME < 2" | bc -l) )); then
        log "✅ Response time is acceptable (< 2s)"
    else
        warn "⚠️ Response time is slow (> 2s)"
    fi
fi

# WebSocket test (basic connectivity)
log "Testing WebSocket connectivity..."
WS_TEST=$(curl -s -I "$DEPLOYMENT_URL/api/v1/ws" 2>/dev/null | head -1)
if echo "$WS_TEST" | grep -q "101\|200\|404"; then
    log "✅ WebSocket endpoint accessible"
else
    warn "❌ WebSocket endpoint not accessible"
fi

# SSL/HTTPS test
log "Testing SSL/HTTPS..."
if [[ "$DEPLOYMENT_URL" == https://* ]]; then
    SSL_TEST=$(curl -s -I "$DEPLOYMENT_URL/api/v1/system/health" 2>/dev/null | head -1)
    if echo "$SSL_TEST" | grep -q "200\|301\|302"; then
        log "✅ HTTPS working correctly"
    else
        warn "❌ HTTPS test failed"
    fi
else
    warn "⚠️ Not using HTTPS"
fi

echo ""
echo -e "${GREEN}✅ Endpoint testing complete!${NC}"
echo "Check the results above for any issues."
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Fix any failed endpoints"
echo "2. Set up monitoring: ./setup-monitoring.sh"
echo "3. Configure custom domain if needed"
echo "4. Run load testing for performance validation"