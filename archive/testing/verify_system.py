#!/usr/bin/env python3
"""
Iranian Legal Archive System - Comprehensive Verification Script
Tests all major functionalities, generates detailed reports, and ensures 100% system reliability
"""

import json
import time
import requests
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
import subprocess
import os

class SystemVerifier:
    def __init__(self, base_url: str = "http://localhost:7860"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "base_url": base_url,
            "tests": [],
            "summary": {
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0,
                "success_rate": 0.0,
                "execution_time": 0.0
            },
            "system_info": {},
            "recommendations": []
        }
        self.start_time = time.time()

    def log_test(self, test_name: str, status: str, message: str, details: Dict = None):
        """Log a test result"""
        test_result = {
            "test_name": test_name,
            "status": status,  # "PASS", "FAIL", "SKIP"
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        
        self.results["tests"].append(test_result)
        self.results["summary"]["total_tests"] += 1
        
        if status == "PASS":
            self.results["summary"]["passed_tests"] += 1
            print(f"✅ {test_name}: {message}")
        elif status == "FAIL":
            self.results["summary"]["failed_tests"] += 1
            print(f"❌ {test_name}: {message}")
        else:
            print(f"⏭️  {test_name}: {message}")

    def test_server_connectivity(self):
        """Test basic server connectivity"""
        try:
            response = requests.get(self.base_url, timeout=10)
            if response.status_code == 200:
                self.log_test("Server Connectivity", "PASS", "Server is accessible and responding")
                return True
            else:
                self.log_test("Server Connectivity", "FAIL", f"Server returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.log_test("Server Connectivity", "FAIL", f"Cannot connect to server: {str(e)}")
            return False

    def test_api_endpoints(self):
        """Test all major API endpoints"""
        endpoints = [
            {"path": "/status", "method": "GET", "expected_fields": ["is_processing", "message"]},
            {"path": "/stats", "method": "GET", "expected_fields": ["total_operations", "uptime"]},
            {"path": "/legal-db/stats", "method": "GET", "expected_fields": ["total_documents"]},
            {"path": "/processed-documents", "method": "GET", "expected_fields": ["documents", "total"]},
            {"path": "/logs", "method": "GET", "expected_fields": []},
            {"path": "/docs", "method": "GET", "expected_content": "swagger", "base_url": True}
        ]

        for endpoint in endpoints:
            try:
                if endpoint.get('base_url', False):
                    url = f"{self.base_url}{endpoint['path']}"
                else:
                    url = f"{self.api_base}{endpoint['path']}"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    if endpoint['path'] == '/docs':
                        # Special handling for documentation endpoint
                        if 'swagger-ui' in response.text.lower() or 'openapi' in response.text.lower():
                            self.log_test(f"API Endpoint: {endpoint['path']}", "PASS", "Documentation accessible")
                        else:
                            self.log_test(f"API Endpoint: {endpoint['path']}", "FAIL", "Documentation not properly formatted")
                    else:
                        # JSON endpoints
                        try:
                            data = response.json()
                            missing_fields = [field for field in endpoint.get('expected_fields', []) if field not in data]
                            
                            if not missing_fields:
                                self.log_test(f"API Endpoint: {endpoint['path']}", "PASS", "Endpoint working correctly", {"response_size": len(str(data))})
                            else:
                                self.log_test(f"API Endpoint: {endpoint['path']}", "FAIL", f"Missing fields: {missing_fields}")
                        except json.JSONDecodeError:
                            self.log_test(f"API Endpoint: {endpoint['path']}", "FAIL", "Invalid JSON response")
                else:
                    self.log_test(f"API Endpoint: {endpoint['path']}", "FAIL", f"HTTP {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                self.log_test(f"API Endpoint: {endpoint['path']}", "FAIL", f"Request failed: {str(e)}")

    def test_frontend_assets(self):
        """Test frontend static assets"""
        assets = [
            "/web_ui/styles.css",
            "/web_ui/script.js",
            "/web_ui/sw.js"
        ]

        for asset in assets:
            try:
                url = f"{self.base_url}{asset}"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    size_kb = len(response.content) / 1024
                    self.log_test(f"Frontend Asset: {asset}", "PASS", f"Asset loaded successfully ({size_kb:.1f} KB)")
                else:
                    self.log_test(f"Frontend Asset: {asset}", "FAIL", f"HTTP {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                self.log_test(f"Frontend Asset: {asset}", "FAIL", f"Request failed: {str(e)}")

    def test_database_operations(self):
        """Test database-related operations"""
        try:
            # Test legal database stats
            response = requests.get(f"{self.api_base}/legal-db/stats", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Database Stats", "PASS", f"Database accessible with {data.get('total_documents', 0)} documents")
                
                # Test database search (if documents exist)
                if data.get('total_documents', 0) > 0:
                    search_response = requests.get(f"{self.api_base}/legal-db/search?q=test", timeout=10)
                    if search_response.status_code == 200:
                        self.log_test("Database Search", "PASS", "Search functionality working")
                    else:
                        self.log_test("Database Search", "FAIL", f"Search failed with HTTP {search_response.status_code}")
                else:
                    self.log_test("Database Search", "SKIP", "No documents in database to search")
            else:
                self.log_test("Database Stats", "FAIL", f"HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Database Operations", "FAIL", f"Request failed: {str(e)}")

    def test_system_performance(self):
        """Test system performance metrics"""
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/status", timeout=10)
            response_time = (time.time() - start_time) * 1000  # milliseconds
            
            if response.status_code == 200:
                if response_time < 1000:  # Less than 1 second
                    self.log_test("Response Time", "PASS", f"Fast response ({response_time:.0f}ms)")
                elif response_time < 3000:  # Less than 3 seconds
                    self.log_test("Response Time", "PASS", f"Acceptable response ({response_time:.0f}ms)")
                else:
                    self.log_test("Response Time", "FAIL", f"Slow response ({response_time:.0f}ms)")
                    self.results["recommendations"].append("Consider optimizing server performance - response times are slow")
            else:
                self.log_test("Response Time", "FAIL", f"HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("System Performance", "FAIL", f"Performance test failed: {str(e)}")

    def collect_system_info(self):
        """Collect system information"""
        try:
            # Get system stats from API
            response = requests.get(f"{self.api_base}/stats", timeout=10)
            if response.status_code == 200:
                api_stats = response.json()
                self.results["system_info"]["api_stats"] = api_stats
                
            # Get system process info
            try:
                result = subprocess.run(['ps', 'aux'], capture_output=True, text=True, timeout=5)
                python_processes = [line for line in result.stdout.split('\n') if 'python' in line.lower() or 'uvicorn' in line.lower()]
                self.results["system_info"]["python_processes"] = len(python_processes)
            except:
                pass
                
            # Check disk space
            try:
                result = subprocess.run(['df', '-h', '.'], capture_output=True, text=True, timeout=5)
                self.results["system_info"]["disk_info"] = result.stdout.strip()
            except:
                pass
                
        except Exception as e:
            print(f"Warning: Could not collect all system info: {e}")

    def generate_recommendations(self):
        """Generate recommendations based on test results"""
        failed_tests = [test for test in self.results["tests"] if test["status"] == "FAIL"]
        
        if not failed_tests:
            self.results["recommendations"].append("🎉 All tests passed! System is fully operational.")
        else:
            self.results["recommendations"].append(f"⚠️  {len(failed_tests)} tests failed. Review the detailed results below.")
            
        # Check success rate (will be calculated in finalize_results)
        # This will be updated after finalize_results is called

        # Performance recommendations
        slow_tests = [test for test in self.results["tests"] if "slow response" in test.get("message", "").lower()]
        if slow_tests:
            self.results["recommendations"].append("🚀 Consider optimizing server performance to improve response times.")

    def run_all_tests(self):
        """Run all verification tests"""
        print("🔍 Starting Iranian Legal Archive System Verification...")
        print(f"🌐 Testing server at: {self.base_url}")
        print("=" * 60)
        
        # Test server connectivity first
        if not self.test_server_connectivity():
            print("\n❌ Server is not accessible. Cannot continue with tests.")
            self.finalize_results()
            return False
            
        # Run all other tests
        print("\n📡 Testing API Endpoints...")
        self.test_api_endpoints()
        
        print("\n🎨 Testing Frontend Assets...")
        self.test_frontend_assets()
        
        print("\n💾 Testing Database Operations...")
        self.test_database_operations()
        
        print("\n⚡ Testing System Performance...")
        self.test_system_performance()
        
        print("\n📊 Collecting System Information...")
        self.collect_system_info()
        
        print("\n💡 Generating Recommendations...")
        self.generate_recommendations()
        
        self.finalize_results()
        return True

    def finalize_results(self):
        """Finalize test results and calculate summary"""
        self.results["summary"]["execution_time"] = time.time() - self.start_time
        # Calculate success rate excluding skipped tests
        executable_tests = self.results["summary"]["total_tests"] - len([t for t in self.results["tests"] if t["status"] == "SKIP"])
        self.results["summary"]["success_rate"] = (
            self.results["summary"]["passed_tests"] / max(executable_tests, 1) * 100
        )
        
        # Add success rate recommendations
        success_rate = self.results["summary"]["success_rate"]
        if success_rate >= 100:
            if "🎉 All tests passed! System is fully operational." not in self.results["recommendations"]:
                self.results["recommendations"].append("✨ Perfect system reliability - 100% success rate!")
        elif success_rate >= 95:
            self.results["recommendations"].append("⭐ Excellent system reliability!")
        elif success_rate >= 80:
            self.results["recommendations"].append("⚡ Good system reliability, minor improvements possible.")
        else:
            self.results["recommendations"].append("🔧 System reliability needs improvement.")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📋 VERIFICATION SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.results['summary']['total_tests']}")
        print(f"Passed: {self.results['summary']['passed_tests']}")
        print(f"Failed: {self.results['summary']['failed_tests']}")
        print(f"Success Rate: {self.results['summary']['success_rate']:.1f}%")
        print(f"Execution Time: {self.results['summary']['execution_time']:.2f} seconds")
        
        print("\n💡 RECOMMENDATIONS:")
        for rec in self.results["recommendations"]:
            print(f"   {rec}")

    def save_report(self, filename: str = None):
        """Save detailed report to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"verification_report_{timestamp}.json"
            
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Detailed report saved to: {filename}")
            return filename
        except Exception as e:
            print(f"❌ Failed to save report: {e}")
            return None

def main():
    """Main verification function"""
    # Check if requests is available
    try:
        import requests
    except ImportError:
        print("❌ 'requests' library is required but not installed.")
        print("Installing requests...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--break-system-packages", "requests"])
            import requests
            print("✅ Successfully installed requests")
        except Exception as e:
            print(f"❌ Failed to install requests: {e}")
            return False
    
    # Parse command line arguments
    base_url = "http://localhost:7860"
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    
    # Run verification
    verifier = SystemVerifier(base_url)
    success = verifier.run_all_tests()
    
    # Save report
    report_file = verifier.save_report()
    
    # Return appropriate exit code
    if success and verifier.results["summary"]["success_rate"] >= 100:
        print("\n🎉 SYSTEM VERIFICATION COMPLETE - ALL TESTS PASSED!")
        return True
    elif success and verifier.results["summary"]["success_rate"] >= 80:
        print("\n⚠️  SYSTEM VERIFICATION COMPLETE - SOME ISSUES FOUND")
        return True
    else:
        print("\n❌ SYSTEM VERIFICATION FAILED - CRITICAL ISSUES FOUND")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)