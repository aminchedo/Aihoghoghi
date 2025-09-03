#!/bin/bash

# REAL WEB SCRAPING TEST - NO HYPE, ONLY FACTS
# Execute actual web tests on Iranian government websites

echo "🔍 REAL VERIFICATION - IRANIAN WEBSITE ACCESSIBILITY TEST"
echo "============================================================"
echo "NO ASSUMPTIONS. NO SIMULATIONS. ONLY ACTUAL DATA."
echo "============================================================"

# Create results file with timestamp
timestamp=$(date +"%Y%m%d_%H%M%S")
results_file="REAL_WEB_TEST_RESULTS_${timestamp}.json"

# Start JSON results
echo "{" > $results_file
echo "  \"test_timestamp\": \"$(date -Iseconds)\"," >> $results_file
echo "  \"sites_tested\": []," >> $results_file
echo "  \"success_count\": 0," >> $results_file
echo "  \"failed_count\": 0," >> $results_file
echo "  \"actual_data\": [" >> $results_file

# REAL IRANIAN SITES TO TEST
sites=(
    "https://www.president.ir"
    "https://www.moi.ir"
    "https://www.mporg.ir"
    "https://www.irancode.ir"
    "https://www.ut.ac.ir"
    "https://www.sharif.ir"
    "https://www.iribnews.ir"
    "https://www.irna.ir"
    "https://www.tehran.ir"
)

success_count=0
failed_count=0
first_entry=true

for site in "${sites[@]}"; do
    echo ""
    echo "🔍 Testing: $site"
    
    # Add comma separator for JSON (except first entry)
    if [ "$first_entry" = false ]; then
        echo "    ," >> $results_file
    fi
    first_entry=false
    
    echo "    {" >> $results_file
    echo "      \"url\": \"$site\"," >> $results_file
    echo "      \"timestamp\": \"$(date -Iseconds)\"," >> $results_file
    
    # Test HTTP response with curl
    start_time=$(date +%s.%N)
    
    # Get HTTP status and headers
    http_response=$(curl -s -I -L -w "HTTPSTATUS:%{http_code};TIME:%{time_total};SIZE:%{size_download};FINAL_URL:%{url_effective}" \
        -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
        -H "Accept-Language: fa-IR,fa;q=0.9,en;q=0.8" \
        --connect-timeout 10 \
        --max-time 15 \
        "$site" 2>/dev/null)
    
    # Extract values from curl output
    http_code=$(echo "$http_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response_time=$(echo "$http_response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    size_download=$(echo "$http_response" | grep -o "SIZE:[0-9]*" | cut -d: -f2)
    final_url=$(echo "$http_response" | grep -o "FINAL_URL:.*" | cut -d: -f2-)
    
    # Default values if extraction failed
    http_code=${http_code:-0}
    response_time=${response_time:-0}
    size_download=${size_download:-0}
    
    echo "      \"status_code\": $http_code," >> $results_file
    echo "      \"response_time_seconds\": $response_time," >> $results_file
    echo "      \"size_bytes\": $size_download," >> $results_file
    
    if [ "$http_code" -eq 200 ]; then
        echo "      \"success\": true," >> $results_file
        success_count=$((success_count + 1))
        
        # Get actual content to check for Persian text
        content=$(curl -s -L \
            -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
            -H "Accept: text/html,application/xhtml+xml" \
            -H "Accept-Language: fa-IR,fa;q=0.9,en;q=0.8" \
            --connect-timeout 10 \
            --max-time 15 \
            "$site" 2>/dev/null | head -c 10000)  # First 10KB only
        
        # Extract title (basic regex)
        title=$(echo "$content" | grep -o '<title[^>]*>[^<]*</title>' | sed 's/<title[^>]*>//;s/<\/title>//' | head -1)
        title=${title:-"No title found"}
        
        # Count Persian characters (approximate)
        persian_count=$(echo "$content" | grep -o '[ا-ی]' | wc -l)
        persian_detected="false"
        if [ "$persian_count" -gt 50 ]; then
            persian_detected="true"
        fi
        
        content_length=${#content}
        
        echo "      \"actual_title\": \"${title//\"/\\\"}\","  >> $results_file
        echo "      \"content_length\": $content_length," >> $results_file
        echo "      \"persian_char_count\": $persian_count," >> $results_file
        echo "      \"persian_content_detected\": $persian_detected," >> $results_file
        echo "      \"error\": null" >> $results_file
        
        echo "✅ SUCCESS: $site"
        echo "   Status: $http_code"
        echo "   Title: $title"
        echo "   Content: $content_length chars"
        echo "   Persian chars: $persian_count"
        echo "   Response time: ${response_time}s"
        
    else
        echo "      \"success\": false," >> $results_file
        echo "      \"actual_title\": \"\"," >> $results_file
        echo "      \"content_length\": 0," >> $results_file
        echo "      \"persian_char_count\": 0," >> $results_file
        echo "      \"persian_content_detected\": false," >> $results_file
        
        if [ "$http_code" -eq 0 ]; then
            echo "      \"error\": \"Connection timeout or failed\"" >> $results_file
            echo "❌ TIMEOUT/ERROR: $site"
        else
            echo "      \"error\": \"HTTP $http_code\"" >> $results_file
            echo "❌ FAILED: $site - Status $http_code"
        fi
        
        failed_count=$((failed_count + 1))
    fi
    
    echo "    }" >> $results_file
    
    # Small delay between requests
    sleep 1
done

# Complete JSON structure
echo "  ]," >> $results_file

# Calculate success rate
total_sites=${#sites[@]}
success_rate=0
if [ $total_sites -gt 0 ]; then
    success_rate=$((success_count * 100 / total_sites))
fi

echo "  \"success_count\": $success_count," >> $results_file
echo "  \"failed_count\": $failed_count," >> $results_file
echo "  \"success_rate_percent\": $success_rate" >> $results_file
echo "}" >> $results_file

# Print final results
echo ""
echo "============================================================"
echo "🎯 REAL WEB ACCESSIBILITY TEST RESULTS:"
echo "============================================================"
echo "📅 Test Date: $(date -Iseconds)"
echo "🌐 Sites tested: $total_sites"
echo "✅ Successful: $success_count"
echo "❌ Failed: $failed_count"
echo "📊 Success rate: $success_rate%"
echo "💾 Results saved to: $results_file"
echo ""
echo "📋 SUMMARY BY SITE:"
echo "------------------------------------------------------------"

# Print site-by-site summary
for site in "${sites[@]}"; do
    # This is a simplified summary - full details in JSON
    echo "🌐 $site"
done

echo ""
echo "✅ REAL TEST COMPLETED - NO SIMULATIONS, ONLY FACTS"
echo "📄 Full detailed results available in: $results_file"