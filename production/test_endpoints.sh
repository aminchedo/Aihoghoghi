#!/bin/bash

# Production Endpoint Testing Script
# Tests all functionality after deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
    source "$ENV_FILE"
    DOMAIN="${DOMAIN_NAME:-localhost}"
else
    DOMAIN="localhost"
fi

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

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local method="${4:-GET}"
    local data="${5:-}"
    
    log "Testing $name: $method $url"
    
    if [[ -n "$data" ]]; then
        response=$(curl -s -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url" || echo "000")
    else
        response=$(curl -s -w "%{http_code}" -X "$method" "$url" || echo "000")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [[ "$http_code" == "$expected_status" ]]; then
        success "$name: HTTP $http_code ✓"
        return 0
    else
        error "$name: Expected HTTP $expected_status, got $http_code ✗"
        if [[ "$http_code" != "000" ]]; then
            echo "Response body: $body"
        fi
        return 1
    fi
}

# Test health endpoint
test_health() {
    log "=== Testing Health Endpoints ==="
    
    test_endpoint "Health Check" "http://$DOMAIN/health" "200"
    test_endpoint "Health Check HTTPS" "https://$DOMAIN/health" "200"
    
    echo ""
}

# Test main application
test_main_app() {
    log "=== Testing Main Application ==="
    
    test_endpoint "Main Page" "http://$DOMAIN/" "200"
    test_endpoint "Main Page HTTPS" "https://$DOMAIN/" "200"
    test_endpoint "Static Files" "http://$DOMAIN/static/styles.css" "200"
    
    echo ""
}

# Test API endpoints
test_api() {
    log "=== Testing API Endpoints ==="
    
    # Test basic API endpoints
    test_endpoint "API Root" "http://$DOMAIN/api/" "200"
    test_endpoint "API Root HTTPS" "https://$DOMAIN/api/" "200"
    
    # Test legal document endpoints
    test_endpoint "Legal Documents List" "http://$DOMAIN/api/legal-documents" "200"
    test_endpoint "Legal Documents Search" "http://$DOMAIN/api/legal-documents/search?q=قانون" "200"
    
    # Test AI analysis endpoints
    test_endpoint "AI Analysis Status" "http://$DOMAIN/api/ai/status" "200"
    
    # Test with POST data
    test_data='{"urls":["https://example.com"],"enable_proxy":false,"batch_size":1}'
    test_endpoint "URL Processing" "http://$DOMAIN/api/process-urls" "200" "POST" "$test_data"
    
    echo ""
}

# Test WebSocket
test_websocket() {
    log "=== Testing WebSocket ==="
    
    # Test WebSocket connection (basic test)
    if command -v websocat >/dev/null 2>&1; then
        log "Testing WebSocket connection..."
        timeout 5 websocat "ws://$DOMAIN/ws/" || warning "WebSocket test failed (websocat not available or connection failed)"
    else
        warning "WebSocket test skipped (websocat not installed)"
    fi
    
    echo ""
}

# Test monitoring endpoints
test_monitoring() {
    log "=== Testing Monitoring Endpoints ==="
    
    # Test Prometheus
    test_endpoint "Prometheus" "http://$DOMAIN:9090" "200"
    test_endpoint "Prometheus Metrics" "http://$DOMAIN:9090/metrics" "200"
    
    # Test Grafana
    test_endpoint "Grafana" "http://$DOMAIN:3000" "200"
    
    echo ""
}

# Test SSL and security
test_security() {
    log "=== Testing Security and SSL ==="
    
    # Test SSL redirect
    test_endpoint "HTTP to HTTPS Redirect" "http://$DOMAIN/" "301"
    
    # Test security headers
    log "Testing security headers..."
    headers=$(curl -s -I "https://$DOMAIN/" | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)")
    if [[ -n "$headers" ]]; then
        success "Security headers present ✓"
        echo "$headers"
    else
        warning "Some security headers missing"
    fi
    
    # Test rate limiting (should get 429 after multiple requests)
    log "Testing rate limiting..."
    for i in {1..15}; do
        response=$(curl -s -w "%{http_code}" "https://$DOMAIN/api/" | tail -c 4)
        if [[ "$response" == "429" ]]; then
            success "Rate limiting working ✓"
            break
        fi
        sleep 0.1
    done
    
    echo ""
}

# Test database connectivity
test_database() {
    log "=== Testing Database Connectivity ==="
    
    # Test if we can connect to the database through the application
    test_endpoint "Database Health" "http://$DOMAIN/api/health/database" "200"
    
    echo ""
}

# Test AI model functionality
test_ai_models() {
    log "=== Testing AI Model Functionality ==="
    
    # Test model status
    test_endpoint "AI Model Status" "http://$DOMAIN/api/ai/models/status" "200"
    
    # Test text analysis
    test_data='{"text":"این یک متن حقوقی نمونه است","analysis_type":"classification"}'
    test_endpoint "Text Analysis" "http://$DOMAIN/api/ai/analyze" "200" "POST" "$test_data"
    
    echo ""
}

# Test performance
test_performance() {
    log "=== Testing Performance ==="
    
    # Test response time
    log "Testing response time..."
    start_time=$(date +%s%N)
    curl -s "https://$DOMAIN/health" >/dev/null
    end_time=$(date +%s%N)
    
    response_time=$(( (end_time - start_time) / 1000000 ))
    if [[ $response_time -lt 1000 ]]; then
        success "Response time: ${response_time}ms ✓"
    else
        warning "Response time: ${response_time}ms (slow)"
    fi
    
    # Test concurrent requests
    log "Testing concurrent requests..."
    for i in {1..10}; do
        curl -s "https://$DOMAIN/health" >/dev/null &
    done
    wait
    
    success "Concurrent requests completed ✓"
    
    echo ""
}

# Test backup and recovery
test_backup() {
    log "=== Testing Backup Functionality ==="
    
    # Test backup endpoint if available
    test_endpoint "Backup Status" "http://$DOMAIN/api/admin/backup/status" "200" || warning "Backup endpoint not available"
    
    echo ""
}

# Main test execution
main() {
    log "Starting comprehensive endpoint testing for $DOMAIN"
    echo ""
    
    # Check if domain is accessible
    if ! curl -s "http://$DOMAIN" >/dev/null 2>&1; then
        error "Domain $DOMAIN is not accessible. Please check your DNS configuration."
        exit 1
    fi
    
    # Run all tests
    test_health
    test_main_app
    test_api
    test_websocket
    test_monitoring
    test_security
    test_database
    test_ai_models
    test_performance
    test_backup
    
    # Summary
    echo ""
    success "=== ENDPOINT TESTING COMPLETED ==="
    log "All critical endpoints have been tested."
    log "Check the output above for any failures or warnings."
    echo ""
    log "Next steps:"
    echo "  1. Review any failed tests above"
    echo "  2. Check application logs: docker-compose logs -f persian-bert-app"
    echo "  3. Verify monitoring dashboards are working"
    echo "  4. Test with real data and workflows"
    echo "  5. Set up monitoring alerts for production"
}

# Run main function
main "$@"