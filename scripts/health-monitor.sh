#!/bin/bash
# health-monitor.sh

LOG_FILE="/var/log/iranian-legal-archive-health.log"
ALERT_EMAIL="admin@yourdomain.com"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | sudo tee -a $LOG_FILE
}

check_service() {
    local service_name=$1
    if sudo systemctl is-active --quiet $service_name; then
        log_message "✅ $service_name is running"
        return 0
    else
        log_message "❌ $service_name is not running"
        sudo systemctl restart $service_name
        sleep 10
        if sudo systemctl is-active --quiet $service_name; then
            log_message "✅ $service_name restarted successfully"
        else
            log_message "❌ $service_name restart failed - sending alert"
            echo "Service $service_name is down on $(hostname)" | mail -s "Service Alert" $ALERT_EMAIL
        fi
        return 1
    fi
}

check_endpoint() {
    local url=$1
    local name=$2
    if curl -f -s $url > /dev/null; then
        log_message "✅ $name endpoint is responsive"
        return 0
    else
        log_message "❌ $name endpoint is not responsive"
        return 1
    fi
}

# Check services
check_service "iranian-legal-archive"
check_service "nginx"
check_service "redis-server"

# Check endpoints
check_endpoint "http://localhost:7860/health" "Backend"
check_endpoint "http://localhost" "Frontend"

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
if [ $DISK_USAGE -gt 80 ]; then
    log_message "⚠️ Disk usage is high: ${DISK_USAGE}%"
    if [ $DISK_USAGE -gt 90 ]; then
        echo "Disk usage critical: ${DISK_USAGE}% on $(hostname)" | mail -s "Disk Space Alert" $ALERT_EMAIL
    fi
else
    log_message "✅ Disk usage is normal: ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 80 ]; then
    log_message "⚠️ Memory usage is high: ${MEMORY_USAGE}%"
else
    log_message "✅ Memory usage is normal: ${MEMORY_USAGE}%"
fi

log_message "Health check completed"