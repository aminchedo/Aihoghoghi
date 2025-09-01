#!/usr/bin/env python3
"""
سیستم تست و تأیید عملکرد - آرشیو اسناد حقوقی ایران
System Verification and Testing Script
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Any

class SystemVerifier:
    def __init__(self, api_base: str = "http://127.0.0.1:7860/api"):
        self.api_base = api_base
        self.test_results = []
        self.start_time = datetime.now()
        
    def log(self, message: str, level: str = "INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_endpoint(self, endpoint: str, method: str = "GET", data: Dict = None, expected_status: int = 200) -> Dict[str, Any]:
        """Test a single API endpoint"""
        url = f"{self.api_base}{endpoint}"
        test_name = f"{method} {endpoint}"
        
        try:
            self.log(f"Testing {test_name}...")
            
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            result = {
                "test": test_name,
                "url": url,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_time": response.elapsed.total_seconds(),
                "response_data": None
            }
            
            try:
                result["response_data"] = response.json()
            except:
                result["response_data"] = response.text[:200] if response.text else None
            
            status_icon = "✅" if success else "❌"
            self.log(f"{status_icon} {test_name}: {response.status_code} ({response.elapsed.total_seconds():.3f}s)")
            
            self.test_results.append(result)
            return result
            
        except Exception as e:
            self.log(f"❌ {test_name}: Error - {str(e)}", "ERROR")
            result = {
                "test": test_name,
                "url": url,
                "method": method,
                "success": False,
                "error": str(e)
            }
            self.test_results.append(result)
            return result
    
    def run_api_tests(self):
        """Run comprehensive API tests"""
        self.log("🚀 Starting API Tests...")
        
        # Core endpoints
        self.test_endpoint("/status")
        self.test_endpoint("/stats")
        self.test_endpoint("/network")
        
        # Legal database endpoints
        self.test_endpoint("/legal-db/stats")
        self.test_endpoint("/legal-db/documents")
        
        # Search endpoint (correct method is GET with query parameter)
        self.test_endpoint("/search?q=تست جستجو")
        
        # Process endpoint (correct method is POST)
        self.test_endpoint("/process", "POST", {"urls": ["https://example.com"], "batch_size": 1, "use_proxy": False})
        
        # Export endpoint
        self.test_endpoint("/export/json")
        
        self.log("✅ API Tests completed")
    
    def run_ui_tests(self):
        """Test UI components and files"""
        self.log("🎨 Starting UI Tests...")
        
        ui_files = [
            "web_ui/index.html",
            "web_ui/script.js",
            "web_ui/styles.css",
            "test_ui.html"
        ]
        
        for file_path in ui_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                file_size = len(content.encode('utf-8'))
                self.log(f"✅ {file_path}: {file_size:,} bytes")
                
                self.test_results.append({
                    "test": f"UI File: {file_path}",
                    "success": True,
                    "file_size": file_size
                })
                
            except Exception as e:
                self.log(f"❌ {file_path}: Error - {str(e)}", "ERROR")
                self.test_results.append({
                    "test": f"UI File: {file_path}",
                    "success": False,
                    "error": str(e)
                })
        
        self.log("✅ UI Tests completed")
    
    def run_integration_tests(self):
        """Run integration tests"""
        self.log("🔗 Starting Integration Tests...")
        
        # Test document processing flow
        test_urls = [
            "https://rc.majlis.ir/fa/law/show/139030",
            "https://dotic.ir/portal/law/67890"
        ]
        
        # Test URL processing (mock data)
        self.test_endpoint("/process-urls", "POST", {
            "urls": test_urls,
            "batch_size": 2,
            "use_proxy": True
        })
        
        # Test proxy update
        self.test_endpoint("/update-proxies", "POST", {"include_fresh": True})
        
        self.log("✅ Integration Tests completed")
    
    def generate_report(self):
        """Generate comprehensive test report"""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result.get("success", False))
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            "test_summary": {
                "start_time": self.start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_seconds": duration,
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "failed_tests": failed_tests,
                "success_rate": success_rate
            },
            "test_results": self.test_results,
            "system_info": {
                "api_base_url": self.api_base,
                "test_timestamp": datetime.now().isoformat()
            }
        }
        
        # Save report to file
        report_filename = f"verification_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # Print summary
        print("\n" + "="*60)
        print("📋 VERIFICATION REPORT SUMMARY")
        print("="*60)
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Successful: {successful_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print(f"💾 Report saved to: {report_filename}")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result.get("success", False):
                    print(f"   - {result['test']}: {result.get('error', 'Unknown error')}")
        
        print("="*60)
        
        return report
    
    def run_all_tests(self):
        """Run all verification tests"""
        self.log("🧪 Starting System Verification...")
        
        try:
            self.run_api_tests()
            self.run_ui_tests()
            self.run_integration_tests()
            
            report = self.generate_report()
            return report
            
        except KeyboardInterrupt:
            self.log("⚠️ Tests interrupted by user", "WARNING")
            return self.generate_report()
        except Exception as e:
            self.log(f"💥 Unexpected error: {str(e)}", "ERROR")
            return self.generate_report()

def main():
    """Main function"""
    print("🏛️ Iranian Legal Archive System - Verification Tool")
    print("=" * 60)
    
    # Check if server is running
    verifier = SystemVerifier()
    
    try:
        response = requests.get(f"{verifier.api_base}/status", timeout=5)
        verifier.log("✅ Server is running and accessible")
    except:
        verifier.log("❌ Server is not running or not accessible", "ERROR")
        verifier.log("Please start the server with: python web_server.py", "INFO")
        sys.exit(1)
    
    # Run all tests
    report = verifier.run_all_tests()
    
    # Exit with appropriate code
    success_rate = report["test_summary"]["success_rate"]
    exit_code = 0 if success_rate >= 80 else 1
    
    if exit_code == 0:
        verifier.log("🎉 System verification completed successfully!", "SUCCESS")
    else:
        verifier.log(f"⚠️ System verification completed with issues (Success rate: {success_rate:.1f}%)", "WARNING")
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()