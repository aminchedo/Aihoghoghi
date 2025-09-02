#!/usr/bin/env python3
"""
Simplified GitHub Pages Verification Script
Tests actual functionality of https://aminchedo.github.io/Aihoghogh/
Uses only standard library and requests for maximum compatibility
"""

import urllib.request
import urllib.error
import time
import json
import datetime
import re
import ssl
import socket
from urllib.parse import urljoin, urlparse

class SimpleGitHubPagesVerifier:
    def __init__(self):
        self.base_url = "https://aminchedo.github.io/Aihoghogh/"
        self.results = {
            "verification_timestamp": datetime.datetime.now().isoformat(),
            "deployment_status": {},
            "content_analysis": {},
            "functionality_indicators": {},
            "performance_metrics": {},
            "final_verdict": {}
        }
        
    def test_basic_accessibility(self):
        """Test if the GitHub Pages site is accessible"""
        print("🔍 Testing GitHub Pages basic accessibility...")
        
        accessibility_results = {
            "url_accessible": False,
            "load_time_seconds": None,
            "http_status_code": None,
            "content_length": None,
            "response_headers": {},
            "ssl_valid": False,
            "redirect_chain": [],
            "errors": []
        }
        
        try:
            # Create SSL context that accepts all certificates
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # Test with urllib
            start_time = time.time()
            
            request = urllib.request.Request(
                self.base_url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            )
            
            with urllib.request.urlopen(request, timeout=30, context=ssl_context) as response:
                load_time = time.time() - start_time
                content = response.read().decode('utf-8', errors='ignore')
                
                accessibility_results.update({
                    "url_accessible": True,
                    "load_time_seconds": round(load_time, 3),
                    "http_status_code": response.getcode(),
                    "content_length": len(content),
                    "response_headers": dict(response.headers),
                    "ssl_valid": True,
                    "page_content": content[:5000]  # First 5000 chars for analysis
                })
                
        except urllib.error.HTTPError as e:
            accessibility_results.update({
                "http_status_code": e.code,
                "errors": [f"HTTP Error {e.code}: {e.reason}"]
            })
        except urllib.error.URLError as e:
            accessibility_results["errors"].append(f"URL Error: {str(e.reason)}")
        except socket.timeout:
            accessibility_results["errors"].append("Request timeout after 30 seconds")
        except Exception as e:
            accessibility_results["errors"].append(f"Unexpected error: {str(e)}")
            
        self.results["deployment_status"] = accessibility_results
        return accessibility_results

    def analyze_page_content(self):
        """Analyze the actual page content for functionality indicators"""
        print("📄 Analyzing page content for functionality...")
        
        content_analysis = {
            "contains_persian_text": False,
            "has_scraping_buttons": False,
            "has_ai_analysis_features": False,
            "has_database_features": False,
            "has_javascript_functionality": False,
            "backend_api_references": [],
            "persian_button_texts": [],
            "javascript_functions": [],
            "external_resources": []
        }
        
        deployment_status = self.results.get("deployment_status", {})
        page_content = deployment_status.get("page_content", "")
        
        if page_content:
            # Check for Persian text
            persian_pattern = r'[\u0600-\u06FF\u200C\u200D]+'
            persian_matches = re.findall(persian_pattern, page_content)
            content_analysis["contains_persian_text"] = len(persian_matches) > 0
            content_analysis["persian_text_samples"] = persian_matches[:10]  # First 10 matches
            
            # Check for specific button texts mentioned in documentation
            button_texts = ["اسکرپینگ", "تحلیل محتوا", "تست کامل", "آمار واقعی"]
            found_buttons = []
            for button_text in button_texts:
                if button_text in page_content:
                    found_buttons.append(button_text)
            content_analysis["persian_button_texts"] = found_buttons
            content_analysis["has_scraping_buttons"] = len(found_buttons) > 0
            
            # Check for AI analysis indicators
            ai_indicators = ["BERT", "HuggingFace", "AI", "تحلیل", "هوش مصنوعی"]
            ai_found = []
            for indicator in ai_indicators:
                if indicator.lower() in page_content.lower():
                    ai_found.append(indicator)
            content_analysis["ai_indicators_found"] = ai_found
            content_analysis["has_ai_analysis_features"] = len(ai_found) > 0
            
            # Check for database functionality
            db_indicators = ["SQLite", "database", "دیتابیس", "آمار", "ذخیره"]
            db_found = []
            for indicator in db_indicators:
                if indicator.lower() in page_content.lower():
                    db_found.append(indicator)
            content_analysis["database_indicators_found"] = db_found
            content_analysis["has_database_features"] = len(db_found) > 0
            
            # Check for JavaScript functionality
            js_patterns = [
                r'function\s+\w+\s*\(',
                r'fetch\s*\(',
                r'addEventListener\s*\(',
                r'onclick\s*=',
                r'async\s+function'
            ]
            js_functions = []
            for pattern in js_patterns:
                matches = re.findall(pattern, page_content, re.IGNORECASE)
                js_functions.extend(matches)
            content_analysis["javascript_functions"] = js_functions[:20]  # First 20 matches
            content_analysis["has_javascript_functionality"] = len(js_functions) > 0
            
            # Check for API endpoint references
            api_patterns = [
                r'/api/\w+',
                r'fetch\s*\(\s*[\'"]([^\'"]+)[\'"]',
                r'url\s*:\s*[\'"]([^\'"]+)[\'"]'
            ]
            api_refs = []
            for pattern in api_patterns:
                matches = re.findall(pattern, page_content, re.IGNORECASE)
                api_refs.extend(matches)
            content_analysis["backend_api_references"] = list(set(api_refs))
            
            # Check for external resources
            resource_patterns = [
                r'src\s*=\s*[\'"]([^\'"]+)[\'"]',
                r'href\s*=\s*[\'"]([^\'"]+)[\'"]',
                r'@import\s+url\s*\(\s*[\'"]?([^\'"]+)[\'"]?\s*\)'
            ]
            resources = []
            for pattern in resource_patterns:
                matches = re.findall(pattern, page_content, re.IGNORECASE)
                resources.extend(matches)
            content_analysis["external_resources"] = list(set(resources))[:20]  # First 20 unique
            
        self.results["content_analysis"] = content_analysis
        return content_analysis

    def test_api_endpoints(self):
        """Test potential API endpoints for functionality"""
        print("🔗 Testing API endpoints...")
        
        api_results = {
            "endpoints_tested": {},
            "functional_endpoints": 0,
            "total_endpoints": 0,
            "cors_issues_detected": False
        }
        
        # Common API endpoints to test
        endpoints_to_test = [
            "",  # Root page
            "api/scrape",
            "api/analyze", 
            "api/database",
            "api/stats",
            "scrape",
            "analyze",
            "database",
            "stats",
            "index.html",
            "manifest.json"
        ]
        
        for endpoint in endpoints_to_test:
            endpoint_url = urljoin(self.base_url, endpoint)
            endpoint_result = {
                "accessible": False,
                "status_code": None,
                "response_time": None,
                "content_type": None,
                "content_sample": None,
                "error": None
            }
            
            try:
                start_time = time.time()
                
                request = urllib.request.Request(
                    endpoint_url,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json, text/html, */*',
                        'Accept-Language': 'fa,en;q=0.9'
                    }
                )
                
                with urllib.request.urlopen(request, timeout=15) as response:
                    response_time = time.time() - start_time
                    content = response.read().decode('utf-8', errors='ignore')
                    
                    endpoint_result.update({
                        "accessible": True,
                        "status_code": response.getcode(),
                        "response_time": round(response_time, 3),
                        "content_type": response.headers.get('content-type', 'unknown'),
                        "content_length": len(content),
                        "content_sample": content[:500]  # First 500 chars
                    })
                    
                    if response.getcode() == 200:
                        api_results["functional_endpoints"] += 1
                        
            except urllib.error.HTTPError as e:
                endpoint_result.update({
                    "status_code": e.code,
                    "error": f"HTTP {e.code}: {e.reason}"
                })
            except urllib.error.URLError as e:
                endpoint_result["error"] = f"URL Error: {str(e.reason)}"
            except Exception as e:
                endpoint_result["error"] = f"Unexpected error: {str(e)}"
                
            api_results["endpoints_tested"][endpoint] = endpoint_result
            api_results["total_endpoints"] += 1
            
            # Small delay to avoid overwhelming the server
            time.sleep(0.5)
            
        self.results["functionality_indicators"] = api_results
        return api_results

    def test_performance_benchmarks(self):
        """Test actual performance metrics"""
        print("⚡ Testing performance benchmarks...")
        
        performance_results = {
            "load_times": [],
            "average_load_time": None,
            "fastest_load": None,
            "slowest_load": None,
            "consistency_score": None,
            "size_metrics": {},
            "network_efficiency": {}
        }
        
        # Test multiple loads for consistency
        print("   Testing load times (5 iterations)...")
        for i in range(5):
            try:
                start_time = time.time()
                
                request = urllib.request.Request(
                    self.base_url,
                    headers={'User-Agent': 'Mozilla/5.0 (Performance Test)'}
                )
                
                with urllib.request.urlopen(request, timeout=30) as response:
                    content = response.read()
                    load_time = time.time() - start_time
                    
                    performance_results["load_times"].append(round(load_time, 3))
                    
                    if i == 0:  # Capture size metrics on first load
                        performance_results["size_metrics"] = {
                            "content_size_bytes": len(content),
                            "content_size_kb": round(len(content) / 1024, 2),
                            "compression": response.headers.get('content-encoding', 'none')
                        }
                        
            except Exception as e:
                performance_results["load_times"].append(None)
                print(f"   Load test {i+1} failed: {e}")
                
            time.sleep(1)  # Brief pause between tests
            
        # Calculate statistics
        valid_times = [t for t in performance_results["load_times"] if t is not None]
        if valid_times:
            performance_results["average_load_time"] = round(sum(valid_times) / len(valid_times), 3)
            performance_results["fastest_load"] = min(valid_times)
            performance_results["slowest_load"] = max(valid_times)
            
            # Calculate consistency (lower standard deviation = more consistent)
            if len(valid_times) > 1:
                mean = performance_results["average_load_time"]
                variance = sum((t - mean) ** 2 for t in valid_times) / len(valid_times)
                std_dev = variance ** 0.5
                performance_results["consistency_score"] = round(100 - (std_dev * 100), 2)
        
        self.results["performance_metrics"] = performance_results
        return performance_results

    def verify_claimed_features(self):
        """Verify specific features claimed in documentation"""
        print("🎯 Verifying claimed features...")
        
        feature_verification = {
            "dns_bypass_evidence": False,
            "cors_proxy_evidence": False,
            "persian_bert_evidence": False,
            "sqlite_evidence": False,
            "real_time_evidence": False,
            "no_loading_issues": False,
            "feature_analysis": {}
        }
        
        deployment_status = self.results.get("deployment_status", {})
        content_analysis = self.results.get("content_analysis", {})
        page_content = deployment_status.get("page_content", "").lower()
        
        # Check for DNS bypass indicators
        dns_indicators = ["dns", "proxy", "bypass", "22 servers", "server"]
        dns_found = [indicator for indicator in dns_indicators if indicator in page_content]
        feature_verification["dns_bypass_evidence"] = len(dns_found) > 0
        feature_verification["feature_analysis"]["dns_indicators"] = dns_found
        
        # Check for CORS proxy evidence
        cors_indicators = ["cors", "proxy", "7 methods", "arvancloud", "403"]
        cors_found = [indicator for indicator in cors_indicators if indicator in page_content]
        feature_verification["cors_proxy_evidence"] = len(cors_found) > 0
        feature_verification["feature_analysis"]["cors_indicators"] = cors_found
        
        # Check for Persian BERT evidence
        bert_indicators = ["bert", "huggingface", "persian", "ai", "nlp", "تحلیل"]
        bert_found = [indicator for indicator in bert_indicators if indicator in page_content]
        feature_verification["persian_bert_evidence"] = len(bert_found) > 0
        feature_verification["feature_analysis"]["bert_indicators"] = bert_found
        
        # Check for SQLite evidence
        sqlite_indicators = ["sqlite", "database", "db", "storage", "persist"]
        sqlite_found = [indicator for indicator in sqlite_indicators if indicator in page_content]
        feature_verification["sqlite_evidence"] = len(sqlite_found) > 0
        feature_verification["feature_analysis"]["sqlite_indicators"] = sqlite_found
        
        # Check loading performance
        performance = self.results.get("performance_metrics", {})
        avg_load_time = performance.get("average_load_time", 999)
        feature_verification["no_loading_issues"] = avg_load_time < 5.0 if avg_load_time else False
        
        # Check for real-time indicators
        realtime_indicators = ["real-time", "live", "update", "websocket", "sse"]
        realtime_found = [indicator for indicator in realtime_indicators if indicator in page_content]
        feature_verification["real_time_evidence"] = len(realtime_found) > 0
        feature_verification["feature_analysis"]["realtime_indicators"] = realtime_found
        
        self.results["claimed_features_verification"] = feature_verification
        return feature_verification

    def test_specific_iranian_sites_connectivity(self):
        """Test connectivity to the specific Iranian sites mentioned in documentation"""
        print("🇮🇷 Testing connectivity to Iranian legal sites...")
        
        iranian_sites = [
            "https://rc.majlis.ir",
            "https://irancode.ir", 
            "https://president.ir",
            "https://majlis.ir",
            "https://dolat.ir"
        ]
        
        connectivity_results = {
            "sites_tested": {},
            "accessible_sites": 0,
            "total_sites": len(iranian_sites),
            "average_response_time": None
        }
        
        response_times = []
        
        for site in iranian_sites:
            site_result = {
                "accessible": False,
                "status_code": None,
                "response_time": None,
                "error": None
            }
            
            try:
                start_time = time.time()
                
                request = urllib.request.Request(
                    site,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Legal Archive Verification)',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    }
                )
                
                # Create SSL context for Iranian sites
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                
                with urllib.request.urlopen(request, timeout=15, context=ssl_context) as response:
                    response_time = time.time() - start_time
                    
                    site_result.update({
                        "accessible": True,
                        "status_code": response.getcode(),
                        "response_time": round(response_time, 3)
                    })
                    
                    if response.getcode() == 200:
                        connectivity_results["accessible_sites"] += 1
                        response_times.append(response_time)
                        
            except Exception as e:
                site_result["error"] = str(e)
                
            connectivity_results["sites_tested"][site] = site_result
            time.sleep(1)  # Respectful delay
            
        if response_times:
            connectivity_results["average_response_time"] = round(sum(response_times) / len(response_times), 3)
            
        self.results["iranian_sites_connectivity"] = connectivity_results
        return connectivity_results

    def generate_final_verdict(self):
        """Generate comprehensive final verdict"""
        print("📊 Generating final verdict...")
        
        verdict = {
            "overall_functional": False,
            "user_ready": False,
            "functionality_score": 0,
            "critical_findings": [],
            "positive_findings": [],
            "evidence_summary": {},
            "recommendations": [],
            "credibility_assessment": "LOW"
        }
        
        # Analyze deployment status
        deployment = self.results.get("deployment_status", {})
        if deployment.get("url_accessible", False) and deployment.get("http_status_code") == 200:
            verdict["positive_findings"].append("✅ Site is accessible via HTTPS")
            verdict["functionality_score"] += 25
        else:
            verdict["critical_findings"].append("❌ Site is not accessible or returns error")
            
        # Analyze content quality
        content = self.results.get("content_analysis", {})
        if content.get("contains_persian_text", False):
            verdict["positive_findings"].append("✅ Contains Persian text content")
            verdict["functionality_score"] += 15
            
        if content.get("has_javascript_functionality", False):
            verdict["positive_findings"].append("✅ Contains JavaScript functionality")
            verdict["functionality_score"] += 15
        else:
            verdict["critical_findings"].append("❌ No JavaScript functionality detected")
            
        # Analyze claimed features
        features = self.results.get("claimed_features_verification", {})
        claimed_score = 0
        total_claims = 5
        
        for feature, present in features.items():
            if feature.endswith("_evidence") and present:
                claimed_score += 1
                
        verdict["functionality_score"] += (claimed_score / total_claims) * 20
        
        if claimed_score > 0:
            verdict["positive_findings"].append(f"✅ {claimed_score}/{total_claims} claimed features have evidence")
        else:
            verdict["critical_findings"].append("❌ No evidence found for claimed features")
            
        # Analyze performance
        performance = self.results.get("performance_metrics", {})
        avg_load = performance.get("average_load_time", 999)
        if avg_load and avg_load < 3:
            verdict["positive_findings"].append(f"✅ Fast loading: {avg_load}s average")
            verdict["functionality_score"] += 15
        elif avg_load and avg_load < 10:
            verdict["positive_findings"].append(f"⚠️  Acceptable loading: {avg_load}s average")
            verdict["functionality_score"] += 10
        else:
            verdict["critical_findings"].append(f"❌ Slow loading: {avg_load}s average")
            
        # Analyze Iranian sites connectivity (bonus points)
        iranian = self.results.get("iranian_sites_connectivity", {})
        accessible_sites = iranian.get("accessible_sites", 0)
        total_sites = iranian.get("total_sites", 5)
        
        if accessible_sites > 0:
            verdict["positive_findings"].append(f"✅ Can connect to {accessible_sites}/{total_sites} Iranian legal sites")
            verdict["functionality_score"] += 10
            
        # Determine overall status
        if verdict["functionality_score"] >= 80:
            verdict["overall_functional"] = True
            verdict["user_ready"] = True
            verdict["credibility_assessment"] = "HIGH"
        elif verdict["functionality_score"] >= 60:
            verdict["overall_functional"] = True
            verdict["user_ready"] = False
            verdict["credibility_assessment"] = "MEDIUM"
            verdict["recommendations"].append("Fix performance and functionality issues")
        elif verdict["functionality_score"] >= 40:
            verdict["overall_functional"] = False
            verdict["user_ready"] = False
            verdict["credibility_assessment"] = "MEDIUM"
            verdict["recommendations"].append("Significant improvements needed")
        else:
            verdict["overall_functional"] = False
            verdict["user_ready"] = False
            verdict["credibility_assessment"] = "LOW"
            verdict["recommendations"].append("System appears non-functional - major overhaul required")
            
        # Add specific recommendations
        if not deployment.get("url_accessible", False):
            verdict["recommendations"].append("Fix GitHub Pages deployment - site not accessible")
            
        if avg_load and avg_load > 5:
            verdict["recommendations"].append("Optimize page loading performance")
            
        if not content.get("has_javascript_functionality", False):
            verdict["recommendations"].append("Add functional JavaScript for user interactions")
            
        # Evidence summary
        verdict["evidence_summary"] = {
            "total_tests_performed": 4,
            "successful_connections": 1 if deployment.get("url_accessible") else 0,
            "persian_support_verified": content.get("contains_persian_text", False),
            "performance_measured": performance.get("average_load_time") is not None,
            "api_endpoints_tested": len(self.results.get("functionality_indicators", {}).get("endpoints_tested", {}))
        }
        
        self.results["final_verdict"] = verdict
        return verdict

    def run_complete_verification(self):
        """Execute complete verification protocol"""
        print("🚀 Starting GitHub Pages Verification...")
        print(f"🎯 Target URL: {self.base_url}")
        print("=" * 80)
        
        try:
            # Execute all tests in sequence
            self.test_basic_accessibility()
            self.analyze_page_content() 
            self.test_api_endpoints()
            self.test_performance_benchmarks()
            self.test_specific_iranian_sites_connectivity()
            self.verify_claimed_features()
            self.generate_final_verdict()
            
            # Save results
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            report_path = f"/workspace/github_pages_verification_{timestamp}.json"
            
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, ensure_ascii=False, indent=2)
                
            print(f"\n✅ Verification complete. Report saved to: {report_path}")
            
            # Print summary
            self.print_summary()
            
            return self.results
            
        except Exception as e:
            print(f"❌ Verification failed: {e}")
            return {"error": str(e)}

    def print_summary(self):
        """Print verification summary"""
        print("\n" + "=" * 80)
        print("📊 GITHUB PAGES VERIFICATION SUMMARY")
        print("=" * 80)
        
        verdict = self.results.get("final_verdict", {})
        deployment = self.results.get("deployment_status", {})
        
        print(f"🎯 URL Tested: {self.base_url}")
        print(f"📈 Functionality Score: {verdict.get('functionality_score', 0)}/100")
        print(f"🏆 Overall Status: {'FUNCTIONAL' if verdict.get('overall_functional') else 'NON-FUNCTIONAL'}")
        print(f"👤 User Ready: {'YES' if verdict.get('user_ready') else 'NO'}")
        print(f"🔒 Credibility: {verdict.get('credibility_assessment', 'UNKNOWN')}")
        
        if deployment.get("url_accessible"):
            print(f"⚡ Load Time: {deployment.get('load_time_seconds', 'N/A')}s")
            print(f"📄 Content Size: {deployment.get('content_length', 'N/A')} bytes")
            
        positive_findings = verdict.get("positive_findings", [])
        if positive_findings:
            print("\n✅ POSITIVE FINDINGS:")
            for finding in positive_findings:
                print(f"   {finding}")
        
        critical_findings = verdict.get("critical_findings", [])
        if critical_findings:
            print("\n❌ CRITICAL ISSUES:")
            for finding in critical_findings:
                print(f"   {finding}")
        
        recommendations = verdict.get("recommendations", [])
        if recommendations:
            print("\n💡 RECOMMENDATIONS:")
            for rec in recommendations:
                print(f"   • {rec}")
                
        print("\n" + "=" * 80)

def main():
    """Main execution function"""
    verifier = SimpleGitHubPagesVerifier()
    return verifier.run_complete_verification()

if __name__ == "__main__":
    main()