#!/usr/bin/env python3
"""
Test script for Enhanced Iranian Legal Archive System
This script provides comprehensive testing of the system's functionality.
"""

import asyncio
import json
import time
import requests
import sys
from typing import List, Dict, Any
from datetime import datetime

class EnhancedLegalArchiveSystemTester:
    """Test suite for the Enhanced Iranian Legal Archive System"""
    
    def __init__(self, base_url: str = "http://127.0.0.1:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str = "", data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_server_connection(self) -> bool:
        """Test if server is running and accessible"""
        try:
            response = requests.get(self.base_url, timeout=5)
            success = response.status_code == 200
            self.log_test(
                "Server Connection",
                success,
                f"Status code: {response.status_code}" if success else "Server not accessible"
            )
            return success
        except Exception as e:
            self.log_test("Server Connection", False, f"Connection error: {str(e)}")
            return False
    
    def test_api_status(self) -> bool:
        """Test API status endpoint"""
        try:
            response = requests.get(f"{self.api_base}/status", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = [
                    'is_processing', 'progress', 'message', 'total_operations',
                    'successful_operations', 'active_proxies', 'cache_size'
                ]
                
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    message = f"Missing fields: {', '.join(missing_fields)}"
                else:
                    message = f"All required fields present. Active proxies: {data.get('active_proxies', 0)}"
            else:
                message = f"HTTP {response.status_code}"
                data = None
                
            self.log_test("API Status", success, message, data if success else None)
            return success
            
        except Exception as e:
            self.log_test("API Status", False, f"Request error: {str(e)}")
            return False
    
    def test_api_stats(self) -> bool:
        """Test API statistics endpoint"""
        try:
            response = requests.get(f"{self.api_base}/stats", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_fields = [
                    'total_operations', 'successful_operations', 'active_proxies',
                    'category_stats', 'source_stats'
                ]
                
                missing_fields = [field for field in expected_fields if field not in data]
                if missing_fields:
                    success = False
                    message = f"Missing fields: {', '.join(missing_fields)}"
                else:
                    message = f"Statistics loaded. Operations: {data.get('total_operations', 0)}"
            else:
                message = f"HTTP {response.status_code}"
                data = None
                
            self.log_test("API Statistics", success, message, data if success else None)
            return success
            
        except Exception as e:
            self.log_test("API Statistics", False, f"Request error: {str(e)}")
            return False
    
    def test_api_network(self) -> bool:
        """Test API network status endpoint"""
        try:
            response = requests.get(f"{self.api_base}/network", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if 'proxy_manager' in data and 'proxies' in data:
                    proxy_manager = data['proxy_manager']
                    total_proxies = proxy_manager.get('total_proxies', 0)
                    active_proxies = proxy_manager.get('active_proxies', 0)
                    message = f"Network status loaded. Total proxies: {total_proxies}, Active: {active_proxies}"
                else:
                    success = False
                    message = "Invalid network status response format"
            else:
                message = f"HTTP {response.status_code}"
                data = None
                
            self.log_test("API Network", success, message, data if success else None)
            return success
            
        except Exception as e:
            self.log_test("API Network", False, f"Request error: {str(e)}")
            return False
    
    def test_api_documents(self) -> bool:
        """Test API documents endpoint"""
        try:
            response = requests.get(f"{self.api_base}/documents?limit=5", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if 'documents' in data:
                    documents = data['documents']
                    message = f"Documents endpoint working. Found {len(documents)} documents"
                else:
                    success = False
                    message = "Invalid documents response format"
            else:
                message = f"HTTP {response.status_code}"
                data = None
                
            self.log_test("API Documents", success, message, data if success else None)
            return success
            
        except Exception as e:
            self.log_test("API Documents", False, f"Request error: {str(e)}")
            return False
    
    def test_process_urls(self) -> bool:
        """Test URL processing functionality"""
        test_urls = [
            "https://httpbin.org/html",
            "https://httpbin.org/json",
        ]
        
        try:
            # Check if system is already processing
            status_response = requests.get(f"{self.api_base}/status", timeout=5)
            if status_response.status_code == 200:
                status_data = status_response.json()
                if status_data.get('is_processing', False):
                    self.log_test(
                        "Process URLs", 
                        False, 
                        "System is already processing. Cannot start new processing."
                    )
                    return False
            
            # Start processing
            response = requests.post(
                f"{self.api_base}/process-urls",
                json={"urls": test_urls},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success', False):
                    message = f"Processing started successfully: {data.get('message', '')}"
                    
                    # Wait a bit and check status
                    time.sleep(2)
                    status_response = requests.get(f"{self.api_base}/status", timeout=5)
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        if status_data.get('is_processing', False):
                            message += f" (Status: {status_data.get('message', 'Processing...')})"
                else:
                    success = False
                    message = f"Processing failed: {data.get('message', 'Unknown error')}"
            else:
                message = f"HTTP {response.status_code}"
                data = None
                
            self.log_test("Process URLs", success, message, data if success else None)
            return success
            
        except Exception as e:
            self.log_test("Process URLs", False, f"Request error: {str(e)}")
            return False
    
    def test_proxy_operations(self) -> bool:
        """Test proxy management operations"""
        try:
            # Test proxy testing
            response = requests.post(f"{self.api_base}/network/test-all", timeout=10)
            test_success = response.status_code == 200
            
            if test_success:
                test_data = response.json()
                test_message = test_data.get('message', 'Proxy testing started')
            else:
                test_message = f"Test all proxies failed: HTTP {response.status_code}"
            
            # Test proxy update
            response = requests.post(f"{self.api_base}/network/update-proxies", timeout=10)
            update_success = response.status_code == 200
            
            if update_success:
                update_data = response.json()
                update_message = update_data.get('message', 'Proxy update started')
            else:
                update_message = f"Update proxies failed: HTTP {response.status_code}"
            
            success = test_success and update_success
            message = f"Test: {test_message}, Update: {update_message}"
            
            self.log_test("Proxy Operations", success, message)
            return success
            
        except Exception as e:
            self.log_test("Proxy Operations", False, f"Request error: {str(e)}")
            return False
    
    def test_cache_operations(self) -> bool:
        """Test cache management operations"""
        try:
            response = requests.delete(f"{self.api_base}/cache", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                message = data.get('message', 'Cache cleared successfully')
            else:
                message = f"Cache clear failed: HTTP {response.status_code}"
                
            self.log_test("Cache Operations", success, message)
            return success
            
        except Exception as e:
            self.log_test("Cache Operations", False, f"Request error: {str(e)}")
            return False
    
    def test_logs_endpoint(self) -> bool:
        """Test logs endpoint"""
        try:
            response = requests.get(f"{self.api_base}/logs?limit=5", timeout=10)
            success = response.status_code == 200
            
            if success:
                logs = response.json()
                if isinstance(logs, list):
                    message = f"Logs endpoint working. Retrieved {len(logs)} log entries"
                else:
                    success = False
                    message = "Invalid logs response format"
            else:
                message = f"HTTP {response.status_code}"
                
            self.log_test("Logs Endpoint", success, message)
            return success
            
        except Exception as e:
            self.log_test("Logs Endpoint", False, f"Request error: {str(e)}")
            return False
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run comprehensive test suite"""
        print("🧪 Starting Enhanced Iranian Legal Archive System Tests")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Server Connection", self.test_server_connection),
            ("API Status", self.test_api_status),
            ("API Statistics", self.test_api_stats),
            ("API Network", self.test_api_network),
            ("API Documents", self.test_api_documents),
            ("Process URLs", self.test_process_urls),
            ("Proxy Operations", self.test_proxy_operations),
            ("Cache Operations", self.test_cache_operations),
            ("Logs Endpoint", self.test_logs_endpoint),
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed_tests += 1
                time.sleep(1)  # Brief pause between tests
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
        
        # Summary
        print("\n" + "=" * 60)
        print("🔍 Test Summary")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests / total_tests * 100):.1f}%")
        
        # Detailed results
        if passed_tests < total_tests:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": total_tests - passed_tests,
            "success_rate": passed_tests / total_tests * 100,
            "results": self.test_results
        }
    
    def save_test_report(self, filename: str = None):
        """Save test report to file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"test_report_{timestamp}.json"
        
        report = {
            "test_run": {
                "timestamp": datetime.now().isoformat(),
                "base_url": self.base_url,
                "total_tests": len(self.test_results),
                "passed_tests": sum(1 for r in self.test_results if r['success']),
                "failed_tests": sum(1 for r in self.test_results if not r['success'])
            },
            "results": self.test_results
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Test report saved to: {filename}")
        except Exception as e:
            print(f"\n❌ Failed to save test report: {str(e)}")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Enhanced Iranian Legal Archive System")
    parser.add_argument(
        '--url', 
        default='http://127.0.0.1:8000',
        help='Base URL of the system to test (default: http://127.0.0.1:8000)'
    )
    parser.add_argument(
        '--save-report', 
        action='store_true',
        help='Save detailed test report to JSON file'
    )
    parser.add_argument(
        '--report-file',
        help='Custom filename for test report'
    )
    
    args = parser.parse_args()
    
    # Create tester instance
    tester = EnhancedLegalArchiveSystemTester(args.url)
    
    # Run tests
    results = tester.run_comprehensive_test()
    
    # Save report if requested
    if args.save_report:
        tester.save_test_report(args.report_file)
    
    # Exit with appropriate code
    exit_code = 0 if results['failed_tests'] == 0 else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    main()