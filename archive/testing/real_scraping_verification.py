#!/usr/bin/env python3
"""
REAL WEB SCRAPING TEST - NO HYPE, ONLY FACTS
Execute actual web scraping on Iranian government websites
"""
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import time
import urllib3
import ssl

# Disable SSL warnings for testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def real_scraping_test():
    """Real web scraping test with actual Iranian sites"""
    
    results = {
        "test_timestamp": datetime.now().isoformat(),
        "sites_tested": [],
        "success_count": 0,
        "failed_count": 0,
        "total_content_length": 0,
        "actual_data": []
    }
    
    # REAL IRANIAN SITES TO TEST
    test_sites = [
        "https://www.president.ir",
        "https://www.moi.ir", 
        "https://www.mporg.ir",
        "https://www.irancode.ir",
        "https://www.ut.ac.ir",
        "https://www.sharif.ir",
        "https://www.iribnews.ir",
        "https://www.irna.ir",
        "https://www.tehran.ir"
    ]
    
    for site in test_sites:
        print(f"\n🔍 Testing: {site}")
        
        site_result = {
            "url": site,
            "timestamp": datetime.now().isoformat(),
            "success": False,
            "status_code": None,
            "content_length": 0,
            "encoding": None,
            "actual_title": "",
            "persian_content_detected": False,
            "persian_char_count": 0,
            "response_time_seconds": 0,
            "error": None
        }
        
        try:
            start_time = time.time()
            
            # Real HTTP request with Iranian-compatible headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8,ar;q=0.7',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            # Make the actual request
            response = requests.get(
                site, 
                headers=headers, 
                timeout=15,
                verify=False,  # Some Iranian sites have SSL issues
                allow_redirects=True
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            site_result.update({
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "content_length": len(response.text),
                "encoding": response.encoding,
                "response_time_seconds": round(response_time, 2),
                "final_url": response.url  # In case of redirects
            })
            
            if response.status_code == 200:
                # Parse actual content
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract actual title
                title_tag = soup.find('title')
                if title_tag:
                    site_result["actual_title"] = title_tag.text.strip()[:200]  # Limit length
                
                # Detect Persian content (real check)
                persian_chars = ['ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ه', 'ی']
                text_content = response.text
                persian_count = sum(1 for char in persian_chars if char in text_content)
                site_result["persian_content_detected"] = persian_count > 50
                site_result["persian_char_count"] = persian_count
                
                # Extract some actual text content
                text_elements = soup.find_all(['p', 'div', 'span', 'h1', 'h2', 'h3'])
                sample_text = []
                for elem in text_elements[:5]:  # First 5 text elements
                    text = elem.get_text().strip()
                    if text and len(text) > 10:
                        sample_text.append(text[:100])  # First 100 chars
                
                site_result["sample_content"] = sample_text
                
                results["success_count"] += 1
                results["total_content_length"] += len(response.text)
                
                print(f"✅ SUCCESS: {site}")
                print(f"   Status: {response.status_code}")
                print(f"   Title: {site_result['actual_title']}")
                print(f"   Content: {len(response.text):,} chars")
                print(f"   Persian chars: {site_result['persian_char_count']:,}")
                print(f"   Response time: {response_time:.2f}s")
                
            else:
                results["failed_count"] += 1
                print(f"❌ FAILED: {site} - Status {response.status_code}")
                
        except requests.exceptions.Timeout:
            site_result["error"] = "Request timeout (15s)"
            results["failed_count"] += 1
            print(f"⏱️ TIMEOUT: {site}")
            
        except requests.exceptions.ConnectionError as e:
            site_result["error"] = f"Connection error: {str(e)[:100]}"
            results["failed_count"] += 1
            print(f"🔌 CONNECTION ERROR: {site}")
            
        except Exception as e:
            site_result["error"] = str(e)[:200]
            results["failed_count"] += 1
            print(f"❌ ERROR: {site} - {e}")
        
        results["actual_data"].append(site_result)
        results["sites_tested"].append(site)
        
        # Small delay between requests
        time.sleep(1)
    
    # Calculate real success rate
    total_sites = len(test_sites)
    success_rate = (results["success_count"] / total_sites) * 100 if total_sites > 0 else 0
    results["success_rate_percent"] = round(success_rate, 1)
    
    return results

if __name__ == "__main__":
    print("🔍 REAL VERIFICATION - IRANIAN WEBSITE SCRAPING TEST")
    print("=" * 60)
    print("NO ASSUMPTIONS. NO SIMULATIONS. ONLY ACTUAL DATA.")
    print("=" * 60)
    
    # Execute the real test
    real_results = real_scraping_test()
    
    # Save actual results with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f'REAL_SCRAPING_RESULTS_{timestamp}.json'
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(real_results, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*60)
    print("🎯 REAL SCRAPING TEST RESULTS:")
    print("="*60)
    print(f"📅 Test Date: {real_results['test_timestamp']}")
    print(f"🌐 Sites tested: {len(real_results['sites_tested'])}")
    print(f"✅ Successful: {real_results['success_count']}")
    print(f"❌ Failed: {real_results['failed_count']}")
    print(f"📊 Success rate: {real_results['success_rate_percent']}%")
    print(f"📝 Total content: {real_results['total_content_length']:,} characters")
    print(f"💾 Results saved to: {results_file}")
    
    # Print detailed results
    print(f"\n📋 DETAILED RESULTS:")
    print("-" * 60)
    for result in real_results['actual_data']:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['url']}")
        if result['success']:
            print(f"    Status: {result['status_code']}")
            print(f"    Content: {result['content_length']:,} chars")
            print(f"    Persian: {result['persian_char_count']:,} chars")
            print(f"    Time: {result['response_time_seconds']}s")
        else:
            print(f"    Error: {result.get('error', 'Unknown error')}")
        print()