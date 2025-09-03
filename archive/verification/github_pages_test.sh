#!/bin/bash

# REAL GITHUB PAGES VERIFICATION TEST
# Test actual deployment status of https://aminchedo.github.io/Aihoghoghi/

echo "🌐 REAL GITHUB PAGES DEPLOYMENT VERIFICATION"
echo "============================================="
echo "Testing: https://aminchedo.github.io/Aihoghoghi/"
echo "============================================="

timestamp=$(date +"%Y%m%d_%H%M%S")
results_file="GITHUB_PAGES_TEST_${timestamp}.json"

# Start JSON results
echo "{" > $results_file
echo "  \"test_timestamp\": \"$(date -Iseconds)\"," >> $results_file
echo "  \"base_url\": \"https://aminchedo.github.io/Aihoghoghi/\"," >> $results_file
echo "  \"tests\": [" >> $results_file

base_url="https://aminchedo.github.io/Aihoghoghi"
first_test=true

# Function to add test result to JSON
add_test_result() {
    local test_name="$1"
    local url="$2"
    local http_code="$3"
    local response_time="$4"
    local content_length="$5"
    local success="$6"
    local error="$7"
    
    if [ "$first_test" = false ]; then
        echo "    ," >> $results_file
    fi
    first_test=false
    
    echo "    {" >> $results_file
    echo "      \"test_name\": \"$test_name\"," >> $results_file
    echo "      \"url\": \"$url\"," >> $results_file
    echo "      \"http_code\": $http_code," >> $results_file
    echo "      \"response_time\": $response_time," >> $results_file
    echo "      \"content_length\": $content_length," >> $results_file
    echo "      \"success\": $success," >> $results_file
    echo "      \"error\": \"$error\"" >> $results_file
    echo "    }" >> $results_file
}

# Test 1: Main page
echo ""
echo "1️⃣ Testing main page:"
main_response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total};SIZE:%{size_download}" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
    --connect-timeout 10 --max-time 15 \
    "$base_url/" 2>/dev/null)

main_code=$(echo "$main_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
main_time=$(echo "$main_response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
main_size=$(echo "$main_response" | grep -o "SIZE:[0-9]*" | cut -d: -f2)
main_code=${main_code:-0}
main_time=${main_time:-0}
main_size=${main_size:-0}

if [ "$main_code" -eq 200 ]; then
    echo "✅ Main page: HTTP $main_code (${main_time}s, ${main_size} bytes)"
    add_test_result "main_page" "$base_url/" "$main_code" "$main_time" "$main_size" "true" ""
else
    echo "❌ Main page: HTTP $main_code"
    add_test_result "main_page" "$base_url/" "$main_code" "$main_time" "$main_size" "false" "HTTP $main_code"
fi

# Test 2: 404.html page
echo ""
echo "2️⃣ Testing 404.html:"
notfound_response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total};SIZE:%{size_download}" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
    --connect-timeout 10 --max-time 15 \
    "$base_url/404.html" 2>/dev/null)

notfound_code=$(echo "$notfound_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
notfound_time=$(echo "$notfound_response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
notfound_size=$(echo "$notfound_response" | grep -o "SIZE:[0-9]*" | cut -d: -f2)
notfound_code=${notfound_code:-0}
notfound_time=${notfound_time:-0}
notfound_size=${notfound_size:-0}

if [ "$notfound_code" -eq 200 ]; then
    echo "✅ 404.html: HTTP $notfound_code (${notfound_time}s, ${notfound_size} bytes)"
    add_test_result "404_page" "$base_url/404.html" "$notfound_code" "$notfound_time" "$notfound_size" "true" ""
else
    echo "❌ 404.html: HTTP $notfound_code"
    add_test_result "404_page" "$base_url/404.html" "$notfound_code" "$notfound_time" "$notfound_size" "false" "HTTP $notfound_code"
fi

# Test 3: Assets directory
echo ""
echo "3️⃣ Testing assets directory:"
assets_response=$(curl -s -I -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
    --connect-timeout 10 --max-time 15 \
    "$base_url/assets/" 2>/dev/null)

assets_code=$(echo "$assets_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
assets_time=$(echo "$assets_response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
assets_code=${assets_code:-0}
assets_time=${assets_time:-0}

if [ "$assets_code" -eq 200 ] || [ "$assets_code" -eq 403 ]; then
    echo "✅ Assets directory: HTTP $assets_code (${assets_time}s)"
    add_test_result "assets_directory" "$base_url/assets/" "$assets_code" "$assets_time" "0" "true" ""
else
    echo "❌ Assets directory: HTTP $assets_code"
    add_test_result "assets_directory" "$base_url/assets/" "$assets_code" "$assets_time" "0" "false" "HTTP $assets_code"
fi

# Test 4: SPA routing (test common routes)
echo ""
echo "4️⃣ Testing SPA routes:"
routes=("dashboard" "process" "search" "proxy" "settings")

for route in "${routes[@]}"; do
    route_response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total};SIZE:%{size_download}" \
        -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        --connect-timeout 10 --max-time 15 \
        "$base_url/$route" 2>/dev/null)
    
    route_code=$(echo "$route_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    route_time=$(echo "$route_response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    route_size=$(echo "$route_response" | grep -o "SIZE:[0-9]*" | cut -d: -f2)
    route_code=${route_code:-0}
    route_time=${route_time:-0}
    route_size=${route_size:-0}
    
    if [ "$route_code" -eq 200 ]; then
        echo "   ✅ /$route: HTTP $route_code (${route_time}s, ${route_size} bytes)"
        add_test_result "spa_route_$route" "$base_url/$route" "$route_code" "$route_time" "$route_size" "true" ""
    else
        echo "   ❌ /$route: HTTP $route_code"
        add_test_result "spa_route_$route" "$base_url/$route" "$route_code" "$route_time" "$route_size" "false" "HTTP $route_code"
    fi
done

# Test 5: Get actual page content and check for Persian/React content
echo ""
echo "5️⃣ Analyzing main page content:"
if [ "$main_code" -eq 200 ]; then
    content=$(curl -s -L \
        -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        --connect-timeout 10 --max-time 15 \
        "$base_url/" 2>/dev/null)
    
    # Check for React/SPA indicators
    react_found=$(echo "$content" | grep -i "react\|vite\|app" | wc -l)
    persian_chars=$(echo "$content" | grep -o '[ا-ی]' | wc -l)
    title=$(echo "$content" | grep -o '<title[^>]*>[^<]*</title>' | sed 's/<title[^>]*>//;s/<\/title>//' | head -1)
    title=${title:-"No title found"}
    
    echo "   📄 Title: $title"
    echo "   📝 Content length: ${#content} characters"
    echo "   🔤 Persian characters: $persian_chars"
    echo "   ⚛️ React/JS indicators: $react_found"
    
    if [ ${#content} -gt 1000 ] && [ $react_found -gt 0 ]; then
        echo "   ✅ Appears to be a valid SPA deployment"
    else
        echo "   ⚠️ May not be a complete SPA deployment"
    fi
else
    echo "   ❌ Cannot analyze content - main page failed to load"
fi

# Close JSON structure
echo "  ]" >> $results_file
echo "}" >> $results_file

# Calculate summary
total_tests=8  # Approximate number of tests
successful_tests=$(grep '"success": true' $results_file | wc -l)
failed_tests=$(grep '"success": false' $results_file | wc -l)

echo ""
echo "============================================="
echo "🎯 GITHUB PAGES DEPLOYMENT TEST RESULTS:"
echo "============================================="
echo "📅 Test Date: $(date -Iseconds)"
echo "🌐 Base URL: $base_url"
echo "✅ Successful tests: $successful_tests"
echo "❌ Failed tests: $failed_tests"
echo "📊 Success rate: $((successful_tests * 100 / (successful_tests + failed_tests)))%" 
echo "💾 Results saved to: $results_file"
echo ""

# Test accessibility from different perspectives
echo "6️⃣ Testing accessibility and performance:"
echo "   🌍 DNS lookup and connection test:"
curl -s -w "DNS lookup: %{time_namelookup}s\nConnect: %{time_connect}s\nSSL handshake: %{time_appconnect}s\nTotal time: %{time_total}s\nSpeed: %{speed_download} bytes/s\n" \
    -o /dev/null "$base_url/" 2>/dev/null

echo ""
echo "✅ GITHUB PAGES VERIFICATION COMPLETED"
echo "📄 Full detailed results available in: $results_file"