#!/bin/bash

# REAL API TESTING SCRIPT
# Test actual API endpoints with real Persian legal text

echo "🔗 REAL API ENDPOINTS TESTING"
echo "============================="
echo "Testing backend API functionality with actual data"
echo "============================="

timestamp=$(date +"%Y%m%d_%H%M%S")
results_file="API_TEST_RESULTS_${timestamp}.json"

# Start JSON results
echo "{" > $results_file
echo "  \"test_timestamp\": \"$(date -Iseconds)\"," >> $results_file
echo "  \"tests\": [" >> $results_file

# Test Persian legal text
test_text="قانون اساسی جمهوری اسلامی ایران - ماده یک: نظام سیاسی ایران، جمهوری اسلامی است که بر اساس رای مردم ایران تأیید شده است"

# Define potential API endpoints to test
declare -a base_urls=(
    "http://localhost:8000"
    "http://localhost:5000" 
    "http://localhost:3000"
    "https://aminchedo.github.io/Aihoghoghi"
)

declare -a endpoints=(
    "/"
    "/api/health"
    "/api/status"
    "/health"
    "/status"
)

first_test=true
success_count=0
total_tests=0

# Function to add test result
add_test_result() {
    local base_url="$1"
    local endpoint="$2"
    local method="$3"
    local http_code="$4"
    local response_time="$5"
    local success="$6"
    local error="$7"
    local response_content="$8"
    
    if [ "$first_test" = false ]; then
        echo "    ," >> $results_file
    fi
    first_test=false
    
    echo "    {" >> $results_file
    echo "      \"base_url\": \"$base_url\"," >> $results_file
    echo "      \"endpoint\": \"$endpoint\"," >> $results_file
    echo "      \"method\": \"$method\"," >> $results_file
    echo "      \"full_url\": \"$base_url$endpoint\"," >> $results_file
    echo "      \"http_code\": $http_code," >> $results_file
    echo "      \"response_time\": $response_time," >> $results_file
    echo "      \"success\": $success," >> $results_file
    echo "      \"error\": \"$error\"," >> $results_file
    echo "      \"response_preview\": \"${response_content:0:200}\"" >> $results_file
    echo "    }" >> $results_file
    
    total_tests=$((total_tests + 1))
    if [ "$success" = "true" ]; then
        success_count=$((success_count + 1))
    fi
}

# Test each base URL with each endpoint
for base_url in "${base_urls[@]}"; do
    echo ""
    echo "🌐 Testing base URL: $base_url"
    echo "----------------------------------------"
    
    for endpoint in "${endpoints[@]}"; do
        echo "  🔍 Testing: $base_url$endpoint"
        
        # Test GET request
        response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            --connect-timeout 5 \
            --max-time 10 \
            "$base_url$endpoint" 2>/dev/null)
        
        http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
        content=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*$//')
        
        http_code=${http_code:-0}
        response_time=${response_time:-0}
        
        if [ "$http_code" -eq 200 ]; then
            echo "    ✅ GET $endpoint: HTTP $http_code (${response_time}s)"
            add_test_result "$base_url" "$endpoint" "GET" "$http_code" "$response_time" "true" "" "$content"
        elif [ "$http_code" -eq 0 ]; then
            echo "    ❌ GET $endpoint: Connection failed/timeout"
            add_test_result "$base_url" "$endpoint" "GET" "$http_code" "$response_time" "false" "Connection failed" ""
        else
            echo "    ❌ GET $endpoint: HTTP $http_code"
            add_test_result "$base_url" "$endpoint" "GET" "$http_code" "$response_time" "false" "HTTP $http_code" "$content"
        fi
    done
done

# Test POST endpoints with Persian data
echo ""
echo "📝 Testing POST endpoints with Persian legal text:"
echo "Text: $test_text"
echo "----------------------------------------"

post_endpoints=("/api/analyze" "/analyze" "/api/process" "/process")

for base_url in "${base_urls[@]}"; do
    for endpoint in "${post_endpoints[@]}"; do
        echo "  🔍 POST Testing: $base_url$endpoint"
        
        # Create JSON payload
        json_payload="{\"text\":\"$test_text\",\"language\":\"fa\"}"
        
        response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
            -X POST \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -d "$json_payload" \
            --connect-timeout 5 \
            --max-time 15 \
            "$base_url$endpoint" 2>/dev/null)
        
        http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
        content=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*$//')
        
        http_code=${http_code:-0}
        response_time=${response_time:-0}
        
        if [ "$http_code" -eq 200 ]; then
            echo "    ✅ POST $endpoint: HTTP $http_code (${response_time}s)"
            add_test_result "$base_url" "$endpoint" "POST" "$http_code" "$response_time" "true" "" "$content"
        elif [ "$http_code" -eq 0 ]; then
            echo "    ❌ POST $endpoint: Connection failed/timeout"
            add_test_result "$base_url" "$endpoint" "POST" "$http_code" "$response_time" "false" "Connection failed" ""
        else
            echo "    ❌ POST $endpoint: HTTP $http_code"
            add_test_result "$base_url" "$endpoint" "POST" "$http_code" "$response_time" "false" "HTTP $http_code" "$content"
        fi
    done
done

# Test if any local servers are running
echo ""
echo "🔍 Checking for running local servers:"
echo "----------------------------------------"

# Check common ports
ports=(3000 5000 8000 8080)
for port in "${ports[@]}"; do
    if netstat -tln 2>/dev/null | grep -q ":$port "; then
        echo "  ✅ Port $port: Service running"
    else
        echo "  ❌ Port $port: No service detected"
    fi
done

# Check for Python/Node processes
echo ""
echo "🔍 Checking for relevant processes:"
python_processes=$(ps aux | grep -E "(python|uvicorn|fastapi|flask)" | grep -v grep | wc -l)
node_processes=$(ps aux | grep -E "(node|npm|yarn)" | grep -v grep | wc -l)

echo "  🐍 Python/API processes: $python_processes"
echo "  📦 Node.js processes: $node_processes"

# Close JSON structure
echo "  ]," >> $results_file
echo "  \"summary\": {" >> $results_file
echo "    \"total_tests\": $total_tests," >> $results_file
echo "    \"successful_tests\": $success_count," >> $results_file
echo "    \"failed_tests\": $((total_tests - success_count))," >> $results_file
echo "    \"success_rate_percent\": $((total_tests > 0 ? success_count * 100 / total_tests : 0))" >> $results_file
echo "  }" >> $results_file
echo "}" >> $results_file

# Print final results
echo ""
echo "============================="
echo "🎯 API TESTING RESULTS:"
echo "============================="
echo "📅 Test Date: $(date -Iseconds)"
echo "🔗 Total tests: $total_tests"
echo "✅ Successful: $success_count"
echo "❌ Failed: $((total_tests - success_count))"
echo "📊 Success rate: $((total_tests > 0 ? success_count * 100 / total_tests : 0))%"
echo "💾 Results saved to: $results_file"

if [ $success_count -eq 0 ]; then
    echo ""
    echo "⚠️  NO WORKING API ENDPOINTS FOUND"
    echo "   This suggests no backend API server is currently running"
    echo "   or accessible at the tested endpoints."
fi

echo ""
echo "✅ API TESTING COMPLETED"
echo "📄 Full detailed results available in: $results_file"