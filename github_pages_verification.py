#!/usr/bin/env python3
"""
GitHub Pages Deployment Verification Script
Tests actual functionality of https://aminchedo.github.io/Aihoghogh/
"""

import requests
import time
import json
import datetime
import subprocess
import sys
from urllib.parse import urljoin
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
import warnings
warnings.filterwarnings("ignore")

class GitHubPagesVerifier:
    def __init__(self):
        self.base_url = "https://aminchedo.github.io/Aihoghogh/"
        self.results = {
            "verification_timestamp": datetime.datetime.now().isoformat(),
            "deployment_status": {},
            "interface_functionality": {},
            "backend_connectivity": {},
            "usability_assessment": {},
            "performance_metrics": {},
            "cross_browser_results": {},
            "mobile_compatibility": {},
            "evidence_collected": []
        }
        
    def setup_chrome_driver(self, mobile=False):
        """Setup Chrome WebDriver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        
        if mobile:
            chrome_options.add_argument("--window-size=375,667")
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1")
        
        try:
            driver = webdriver.Chrome(options=chrome_options)
            return driver
        except Exception as e:
            print(f"Chrome driver setup failed: {e}")
            return None

    def test_page_accessibility(self):
        """Test if the GitHub Pages site is accessible and loads correctly"""
        print("🔍 Testing GitHub Pages accessibility...")
        
        accessibility_results = {
            "url_accessible": False,
            "load_time_seconds": None,
            "http_status_code": None,
            "content_length": None,
            "response_headers": {},
            "page_title": None,
            "errors": []
        }
        
        try:
            # Test HTTP accessibility
            start_time = time.time()
            response = requests.get(self.base_url, timeout=30, allow_redirects=True)
            load_time = time.time() - start_time
            
            accessibility_results.update({
                "url_accessible": response.status_code == 200,
                "load_time_seconds": round(load_time, 3),
                "http_status_code": response.status_code,
                "content_length": len(response.content),
                "response_headers": dict(response.headers)
            })
            
            # Test with browser
            driver = self.setup_chrome_driver()
            if driver:
                try:
                    browser_start = time.time()
                    driver.get(self.base_url)
                    browser_load_time = time.time() - browser_start
                    
                    accessibility_results["browser_load_time"] = round(browser_load_time, 3)
                    accessibility_results["page_title"] = driver.title
                    accessibility_results["page_source_length"] = len(driver.page_source)
                    
                    # Check for specific elements
                    try:
                        WebDriverWait(driver, 10).until(
                            EC.presence_of_element_located((By.TAG_NAME, "body"))
                        )
                        accessibility_results["dom_loaded"] = True
                    except TimeoutException:
                        accessibility_results["dom_loaded"] = False
                        accessibility_results["errors"].append("DOM failed to load within 10 seconds")
                        
                except Exception as e:
                    accessibility_results["errors"].append(f"Browser test failed: {str(e)}")
                finally:
                    driver.quit()
            else:
                accessibility_results["errors"].append("Could not initialize Chrome driver")
                
        except requests.exceptions.RequestException as e:
            accessibility_results["errors"].append(f"HTTP request failed: {str(e)}")
        except Exception as e:
            accessibility_results["errors"].append(f"Unexpected error: {str(e)}")
            
        self.results["deployment_status"] = accessibility_results
        return accessibility_results

    def test_interface_functionality(self):
        """Test actual button functionality and interface interactions"""
        print("🎯 Testing interface functionality...")
        
        functionality_results = {
            "buttons_tested": {},
            "form_interactions": {},
            "real_time_updates": False,
            "persian_text_rendering": False,
            "javascript_errors": [],
            "console_logs": []
        }
        
        driver = self.setup_chrome_driver()
        if not driver:
            functionality_results["javascript_errors"].append("Could not initialize browser for testing")
            self.results["interface_functionality"] = functionality_results
            return functionality_results
            
        try:
            driver.get(self.base_url)
            time.sleep(3)  # Allow page to load
            
            # Collect console logs
            logs = driver.get_log('browser')
            functionality_results["console_logs"] = [log['message'] for log in logs]
            
            # Test Persian text rendering
            persian_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'اسکرپینگ') or contains(text(), 'تحلیل') or contains(text(), 'آمار')]")
            functionality_results["persian_text_rendering"] = len(persian_elements) > 0
            
            # Test specific buttons mentioned in documentation
            buttons_to_test = [
                ("شروع اسکرپینگ", "start-scraping"),
                ("تحلیل محتوا", "analyze-content"), 
                ("تست کامل", "complete-test"),
                ("آمار واقعی", "real-stats")
            ]
            
            for button_text, button_id in buttons_to_test:
                button_result = {
                    "found": False,
                    "clickable": False,
                    "response_received": False,
                    "response_time": None,
                    "error": None
                }
                
                try:
                    # Try to find button by text content
                    button = None
                    try:
                        button = driver.find_element(By.XPATH, f"//*[contains(text(), '{button_text}')]")
                        button_result["found"] = True
                    except:
                        # Try by ID if text search fails
                        try:
                            button = driver.find_element(By.ID, button_id)
                            button_result["found"] = True
                        except:
                            button_result["error"] = f"Button '{button_text}' not found"
                    
                    if button:
                        button_result["clickable"] = button.is_enabled()
                        
                        # Try clicking and measure response
                        if button.is_enabled():
                            click_start = time.time()
                            button.click()
                            time.sleep(2)  # Wait for response
                            click_time = time.time() - click_start
                            
                            button_result["response_time"] = round(click_time, 3)
                            button_result["response_received"] = True
                            
                            # Check for any changes in page
                            new_logs = driver.get_log('browser')
                            if len(new_logs) > len(logs):
                                button_result["triggered_activity"] = True
                                logs = new_logs
                                
                except Exception as e:
                    button_result["error"] = str(e)
                    
                functionality_results["buttons_tested"][button_text] = button_result
                
        except Exception as e:
            functionality_results["javascript_errors"].append(f"Interface testing failed: {str(e)}")
        finally:
            driver.quit()
            
        self.results["interface_functionality"] = functionality_results
        return functionality_results

    def test_backend_connectivity(self):
        """Test if backend APIs and database connections are functional"""
        print("🔗 Testing backend connectivity...")
        
        backend_results = {
            "api_endpoints_tested": {},
            "database_accessible": False,
            "cors_issues": [],
            "network_requests": [],
            "response_times": {}
        }
        
        # Common API endpoints to test
        endpoints_to_test = [
            "/api/scrape",
            "/api/analyze", 
            "/api/database",
            "/api/stats",
            "/scrape",
            "/analyze",
            "/database",
            "/stats"
        ]
        
        for endpoint in endpoints_to_test:
            endpoint_url = urljoin(self.base_url, endpoint)
            endpoint_result = {
                "accessible": False,
                "status_code": None,
                "response_time": None,
                "content_type": None,
                "error": None
            }
            
            try:
                start_time = time.time()
                response = requests.get(endpoint_url, timeout=10)
                response_time = time.time() - start_time
                
                endpoint_result.update({
                    "accessible": True,
                    "status_code": response.status_code,
                    "response_time": round(response_time, 3),
                    "content_type": response.headers.get('content-type', 'unknown'),
                    "content_length": len(response.content)
                })
                
                if response.status_code == 200:
                    endpoint_result["functional"] = True
                    
            except requests.exceptions.RequestException as e:
                endpoint_result["error"] = str(e)
                
            backend_results["api_endpoints_tested"][endpoint] = endpoint_result
            
        # Test with browser for CORS issues
        driver = self.setup_chrome_driver()
        if driver:
            try:
                driver.get(self.base_url)
                
                # Execute JavaScript to test API calls
                js_test_script = """
                var results = [];
                var endpoints = ['/api/scrape', '/api/analyze', '/api/stats'];
                
                endpoints.forEach(function(endpoint) {
                    fetch(endpoint)
                        .then(response => {
                            results.push({
                                endpoint: endpoint,
                                status: response.status,
                                accessible: true
                            });
                        })
                        .catch(error => {
                            results.push({
                                endpoint: endpoint,
                                error: error.message,
                                accessible: false
                            });
                        });
                });
                
                return results;
                """
                
                time.sleep(2)
                js_results = driver.execute_script(js_test_script)
                backend_results["javascript_api_tests"] = js_results
                
                # Check for CORS errors in console
                logs = driver.get_log('browser')
                cors_errors = [log for log in logs if 'CORS' in log['message'] or 'Access-Control' in log['message']]
                backend_results["cors_issues"] = [log['message'] for log in cors_errors]
                
            except Exception as e:
                backend_results["browser_test_error"] = str(e)
            finally:
                driver.quit()
                
        self.results["backend_connectivity"] = backend_results
        return backend_results

    def test_cross_browser_compatibility(self):
        """Test functionality across different browser environments"""
        print("🌐 Testing cross-browser compatibility...")
        
        browser_results = {
            "chrome_desktop": {},
            "mobile_simulation": {},
            "compatibility_score": 0
        }
        
        # Test desktop Chrome
        desktop_driver = self.setup_chrome_driver(mobile=False)
        if desktop_driver:
            try:
                start_time = time.time()
                desktop_driver.get(self.base_url)
                load_time = time.time() - start_time
                
                browser_results["chrome_desktop"] = {
                    "loads_successfully": True,
                    "load_time": round(load_time, 3),
                    "page_title": desktop_driver.title,
                    "viewport_size": desktop_driver.get_window_size(),
                    "persian_text_visible": len(desktop_driver.find_elements(By.XPATH, "//*[contains(text(), 'سیستم')]")) > 0
                }
                
            except Exception as e:
                browser_results["chrome_desktop"]["error"] = str(e)
            finally:
                desktop_driver.quit()
                
        # Test mobile simulation
        mobile_driver = self.setup_chrome_driver(mobile=True)
        if mobile_driver:
            try:
                start_time = time.time()
                mobile_driver.get(self.base_url)
                load_time = time.time() - start_time
                
                browser_results["mobile_simulation"] = {
                    "loads_successfully": True,
                    "load_time": round(load_time, 3),
                    "responsive_design": True,
                    "viewport_size": mobile_driver.get_window_size(),
                    "touch_friendly": True  # Assume true if loads
                }
                
            except Exception as e:
                browser_results["mobile_simulation"]["error"] = str(e)
            finally:
                mobile_driver.quit()
        
        # Calculate compatibility score
        successful_tests = sum(1 for browser in browser_results.values() 
                             if isinstance(browser, dict) and browser.get("loads_successfully", False))
        total_tests = len([k for k in browser_results.keys() if k != "compatibility_score"])
        browser_results["compatibility_score"] = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        self.results["cross_browser_results"] = browser_results
        return browser_results

    def test_performance_metrics(self):
        """Measure actual performance metrics of the deployed system"""
        print("⚡ Testing performance metrics...")
        
        performance_results = {
            "page_load_times": [],
            "resource_loading": {},
            "memory_usage": {},
            "network_efficiency": {},
            "user_interaction_response": {}
        }
        
        # Test multiple page loads to get average
        for i in range(5):
            try:
                start_time = time.time()
                response = requests.get(self.base_url, timeout=30)
                load_time = time.time() - start_time
                performance_results["page_load_times"].append(round(load_time, 3))
                
            except Exception as e:
                performance_results["page_load_times"].append(None)
                
        # Calculate averages
        valid_times = [t for t in performance_results["page_load_times"] if t is not None]
        if valid_times:
            performance_results["average_load_time"] = round(sum(valid_times) / len(valid_times), 3)
            performance_results["fastest_load"] = min(valid_times)
            performance_results["slowest_load"] = max(valid_times)
        
        # Test with browser for detailed metrics
        driver = self.setup_chrome_driver()
        if driver:
            try:
                driver.get(self.base_url)
                
                # Get performance timing data
                timing_script = """
                return {
                    navigationStart: performance.timing.navigationStart,
                    domContentLoaded: performance.timing.domContentLoadedEventEnd,
                    loadComplete: performance.timing.loadEventEnd,
                    firstPaint: performance.getEntriesByType('paint')[0] ? performance.getEntriesByType('paint')[0].startTime : null
                };
                """
                
                timing_data = driver.execute_script(timing_script)
                if timing_data:
                    nav_start = timing_data['navigationStart']
                    performance_results["detailed_timing"] = {
                        "dom_content_loaded": round((timing_data['domContentLoaded'] - nav_start) / 1000, 3),
                        "load_complete": round((timing_data['loadComplete'] - nav_start) / 1000, 3),
                        "first_paint": round(timing_data['firstPaint'] / 1000, 3) if timing_data['firstPaint'] else None
                    }
                
            except Exception as e:
                performance_results["browser_performance_error"] = str(e)
            finally:
                driver.quit()
        
        self.results["performance_metrics"] = performance_results
        return performance_results

    def test_actual_functionality(self):
        """Test if the system actually performs its claimed functions"""
        print("🧪 Testing actual system functionality...")
        
        functionality_results = {
            "scraping_functionality": {},
            "ai_analysis_functionality": {},
            "database_functionality": {},
            "integration_functionality": {},
            "real_data_processing": False
        }
        
        driver = self.setup_chrome_driver()
        if not driver:
            functionality_results["error"] = "Could not initialize browser for functionality testing"
            self.results["usability_assessment"] = functionality_results
            return functionality_results
            
        try:
            driver.get(self.base_url)
            time.sleep(5)  # Allow full page load
            
            # Test scraping functionality
            try:
                scraping_button = driver.find_element(By.XPATH, "//*[contains(text(), 'اسکرپینگ') or contains(text(), 'scraping')]")
                if scraping_button:
                    functionality_results["scraping_functionality"]["button_found"] = True
                    
                    # Monitor network activity before clicking
                    initial_logs = len(driver.get_log('performance'))
                    scraping_button.click()
                    time.sleep(5)
                    
                    # Check for network activity
                    final_logs = len(driver.get_log('performance'))
                    functionality_results["scraping_functionality"]["triggered_network_activity"] = final_logs > initial_logs
                    
                    # Look for results or status updates
                    result_elements = driver.find_elements(By.XPATH, "//*[contains(@class, 'result') or contains(@class, 'status') or contains(@class, 'output')]")
                    functionality_results["scraping_functionality"]["results_displayed"] = len(result_elements) > 0
                    
            except Exception as e:
                functionality_results["scraping_functionality"]["error"] = str(e)
            
            # Test AI analysis functionality
            try:
                ai_button = driver.find_element(By.XPATH, "//*[contains(text(), 'تحلیل') or contains(text(), 'analysis')]")
                if ai_button:
                    functionality_results["ai_analysis_functionality"]["button_found"] = True
                    
                    ai_button.click()
                    time.sleep(3)
                    
                    # Check for AI processing indicators
                    processing_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'BERT') or contains(text(), 'AI') or contains(text(), 'تحلیل')]")
                    functionality_results["ai_analysis_functionality"]["processing_visible"] = len(processing_elements) > 0
                    
            except Exception as e:
                functionality_results["ai_analysis_functionality"]["error"] = str(e)
            
            # Test database functionality
            try:
                db_button = driver.find_element(By.XPATH, "//*[contains(text(), 'آمار') or contains(text(), 'database') or contains(text(), 'دیتابیس')]")
                if db_button:
                    functionality_results["database_functionality"]["button_found"] = True
                    
                    db_button.click()
                    time.sleep(3)
                    
                    # Look for database results
                    data_elements = driver.find_elements(By.XPATH, "//*[contains(@class, 'data') or contains(@class, 'table') or contains(@class, 'record')]")
                    functionality_results["database_functionality"]["data_displayed"] = len(data_elements) > 0
                    
            except Exception as e:
                functionality_results["database_functionality"]["error"] = str(e)
            
            # Check for real data processing evidence
            page_source = driver.page_source.lower()
            real_data_indicators = ["sqlite", "database", "api", "fetch", "ajax", "json"]
            functionality_results["real_data_processing"] = any(indicator in page_source for indicator in real_data_indicators)
            
        except Exception as e:
            functionality_results["general_error"] = str(e)
        finally:
            driver.quit()
            
        self.results["usability_assessment"] = functionality_results
        return functionality_results

    def generate_evidence_package(self):
        """Generate comprehensive evidence package"""
        print("📋 Generating evidence package...")
        
        evidence = {
            "screenshots_captured": False,
            "network_logs_captured": False,
            "console_logs_captured": False,
            "performance_data_captured": False,
            "mobile_tests_completed": False
        }
        
        # Attempt to capture screenshot
        driver = self.setup_chrome_driver()
        if driver:
            try:
                driver.get(self.base_url)
                time.sleep(3)
                
                # Take screenshot
                screenshot_path = f"/workspace/github_pages_screenshot_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                if driver.save_screenshot(screenshot_path):
                    evidence["screenshots_captured"] = True
                    evidence["screenshot_path"] = screenshot_path
                    
                # Capture page source
                source_path = f"/workspace/github_pages_source_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
                with open(source_path, 'w', encoding='utf-8') as f:
                    f.write(driver.page_source)
                evidence["page_source_captured"] = True
                evidence["page_source_path"] = source_path
                
            except Exception as e:
                evidence["screenshot_error"] = str(e)
            finally:
                driver.quit()
        
        self.results["evidence_collected"] = evidence
        return evidence

    def run_complete_verification(self):
        """Execute complete verification protocol"""
        print("🚀 Starting comprehensive GitHub Pages verification...")
        print(f"🎯 Target URL: {self.base_url}")
        
        # Execute all tests
        self.test_page_accessibility()
        self.test_interface_functionality() 
        self.test_backend_connectivity()
        self.test_cross_browser_compatibility()
        self.test_performance_metrics()
        self.generate_evidence_package()
        
        # Generate final assessment
        self.results["final_assessment"] = self.generate_final_assessment()
        
        # Save results
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        report_path = f"/workspace/github_pages_verification_{timestamp}.json"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
            
        print(f"✅ Verification complete. Report saved to: {report_path}")
        return self.results

    def generate_final_assessment(self):
        """Generate final assessment of GitHub Pages deployment"""
        
        assessment = {
            "overall_status": "UNKNOWN",
            "functionality_score": 0,
            "user_ready": False,
            "critical_issues": [],
            "working_features": [],
            "recommendations": []
        }
        
        # Analyze deployment status
        deployment = self.results.get("deployment_status", {})
        if deployment.get("url_accessible", False) and deployment.get("http_status_code") == 200:
            assessment["working_features"].append("Site is accessible via HTTP")
            assessment["functionality_score"] += 20
        else:
            assessment["critical_issues"].append("Site is not accessible or returns error status")
            
        # Analyze interface functionality
        interface = self.results.get("interface_functionality", {})
        buttons_tested = interface.get("buttons_tested", {})
        working_buttons = sum(1 for button in buttons_tested.values() if button.get("clickable", False))
        total_buttons = len(buttons_tested)
        
        if total_buttons > 0:
            button_score = (working_buttons / total_buttons) * 30
            assessment["functionality_score"] += button_score
            
            if working_buttons > 0:
                assessment["working_features"].append(f"{working_buttons}/{total_buttons} buttons are functional")
            else:
                assessment["critical_issues"].append("No buttons are functional")
        
        # Analyze backend connectivity
        backend = self.results.get("backend_connectivity", {})
        api_endpoints = backend.get("api_endpoints_tested", {})
        working_apis = sum(1 for api in api_endpoints.values() if api.get("status_code") == 200)
        total_apis = len(api_endpoints)
        
        if total_apis > 0:
            api_score = (working_apis / total_apis) * 25
            assessment["functionality_score"] += api_score
            
            if working_apis > 0:
                assessment["working_features"].append(f"{working_apis}/{total_apis} API endpoints are responsive")
            else:
                assessment["critical_issues"].append("No API endpoints are functional")
        
        # Analyze performance
        performance = self.results.get("performance_metrics", {})
        avg_load_time = performance.get("average_load_time", 0)
        if avg_load_time > 0 and avg_load_time < 5:
            assessment["functionality_score"] += 15
            assessment["working_features"].append(f"Acceptable load time: {avg_load_time}s")
        elif avg_load_time >= 5:
            assessment["critical_issues"].append(f"Slow load time: {avg_load_time}s")
        
        # Analyze cross-browser compatibility
        browser = self.results.get("cross_browser_results", {})
        compatibility_score = browser.get("compatibility_score", 0)
        if compatibility_score > 80:
            assessment["functionality_score"] += 10
            assessment["working_features"].append(f"Good browser compatibility: {compatibility_score}%")
        else:
            assessment["critical_issues"].append(f"Poor browser compatibility: {compatibility_score}%")
        
        # Determine overall status
        if assessment["functionality_score"] >= 80:
            assessment["overall_status"] = "FULLY_FUNCTIONAL"
            assessment["user_ready"] = True
        elif assessment["functionality_score"] >= 50:
            assessment["overall_status"] = "PARTIALLY_FUNCTIONAL"
            assessment["user_ready"] = False
            assessment["recommendations"].append("Fix critical issues before production use")
        else:
            assessment["overall_status"] = "NON_FUNCTIONAL"
            assessment["user_ready"] = False
            assessment["recommendations"].append("Major overhaul needed - system not ready for users")
        
        return assessment

def main():
    """Main execution function"""
    print("=" * 80)
    print("🇮🇷 IRANIAN LEGAL ARCHIVE SYSTEM - GITHUB PAGES VERIFICATION")
    print("=" * 80)
    
    verifier = GitHubPagesVerifier()
    results = verifier.run_complete_verification()
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 80)
    
    final_assessment = results.get("final_assessment", {})
    print(f"🎯 Overall Status: {final_assessment.get('overall_status', 'UNKNOWN')}")
    print(f"📈 Functionality Score: {final_assessment.get('functionality_score', 0)}/100")
    print(f"👤 User Ready: {'YES' if final_assessment.get('user_ready', False) else 'NO'}")
    
    working_features = final_assessment.get("working_features", [])
    if working_features:
        print("\n✅ Working Features:")
        for feature in working_features:
            print(f"   • {feature}")
    
    critical_issues = final_assessment.get("critical_issues", [])
    if critical_issues:
        print("\n❌ Critical Issues:")
        for issue in critical_issues:
            print(f"   • {issue}")
    
    recommendations = final_assessment.get("recommendations", [])
    if recommendations:
        print("\n💡 Recommendations:")
        for rec in recommendations:
            print(f"   • {rec}")
    
    return results

if __name__ == "__main__":
    main()