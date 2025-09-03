#!/usr/bin/env python3
"""
Comprehensive deployment verification for Iranian Legal Archive System
Tests both frontend (GitHub Pages) and backend (Vercel) deployments
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class DeploymentVerifier:
    def __init__(self):
        self.frontend_url = "https://aminchedo.github.io/Aihoghoghi"
        self.backend_url = "https://aihoghoghi-j68z.vercel.app"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "frontend": {},
            "backend": {},
            "overall_status": "unknown"
        }
    
    def test_frontend_routes(self) -> Dict[str, Any]:
        """Test all frontend routes for 200 responses"""
        routes = [
            "/",
            "/dashboard", 
            "/process",
            "/search",
            "/settings"
        ]
        
        route_results = {}
        
        for route in routes:
            url = f"{self.frontend_url}{route}"
            try:
                response = requests.get(url, timeout=10, allow_redirects=True)
                route_results[route] = {
                    "status_code": response.status_code,
                    "success": response.status_code == 200,
                    "response_time_ms": round(response.elapsed.total_seconds() * 1000),
                    "content_length": len(response.content)
                }
                print(f"✓ Frontend route {route}: {response.status_code}")
            except Exception as e:
                route_results[route] = {
                    "status_code": None,
                    "success": False,
                    "error": str(e)
                }
                print(f"✗ Frontend route {route}: {str(e)}")
        
        return route_results
    
    def test_backend_endpoints(self) -> Dict[str, Any]:
        """Test backend API endpoints"""
        endpoints = [
            {"path": "/api/health", "method": "GET", "expected_status": 200},
            {"path": "/api/ai-analyze", "method": "POST", "expected_status": 200, 
             "data": {"text": "این یک متن قانونی است که شامل ماده و تبصره می‌باشد"}},
            {"path": "/api/status", "method": "GET", "expected_status": 200},
            {"path": "/api/documents", "method": "GET", "expected_status": 200}
        ]
        
        endpoint_results = {}
        
        for endpoint in endpoints:
            url = f"{self.backend_url}{endpoint['path']}"
            try:
                if endpoint['method'] == 'GET':
                    response = requests.get(url, timeout=15)
                else:
                    response = requests.post(
                        url, 
                        json=endpoint.get('data', {}),
                        headers={"Content-Type": "application/json"},
                        timeout=15
                    )
                
                try:
                    json_data = response.json()
                except:
                    json_data = None
                
                endpoint_results[endpoint['path']] = {
                    "status_code": response.status_code,
                    "success": response.status_code == endpoint['expected_status'],
                    "response_time_ms": round(response.elapsed.total_seconds() * 1000),
                    "json_response": json_data,
                    "content_length": len(response.content)
                }
                
                print(f"✓ Backend {endpoint['method']} {endpoint['path']}: {response.status_code}")
                if json_data:
                    print(f"  Response: {json.dumps(json_data, ensure_ascii=False)[:200]}...")
                    
            except Exception as e:
                endpoint_results[endpoint['path']] = {
                    "status_code": None,
                    "success": False,
                    "error": str(e)
                }
                print(f"✗ Backend {endpoint['method']} {endpoint['path']}: {str(e)}")
        
        return endpoint_results
    
    def test_health_endpoint_specifically(self) -> Dict[str, Any]:
        """Specifically test the health endpoint for exact response format"""
        url = f"{self.backend_url}/api/health"
        try:
            response = requests.get(url, timeout=10)
            json_data = response.json()
            
            expected_format = json_data == {"status": "ok"}
            
            return {
                "url": url,
                "status_code": response.status_code,
                "response": json_data,
                "correct_format": expected_format,
                "success": response.status_code == 200 and expected_format
            }
        except Exception as e:
            return {
                "url": url,
                "success": False,
                "error": str(e)
            }
    
    def test_ai_analyze_endpoint(self) -> Dict[str, Any]:
        """Test AI analyze endpoint with Persian text"""
        url = f"{self.backend_url}/api/ai-analyze"
        test_texts = [
            "این یک متن قانونی است که شامل ماده و تبصره می‌باشد",
            "دادگاه محترم رای خود را در مورد این پرونده صادر کرد",
            "وزارت کشور بخشنامه جدیدی را ابلاغ نمود"
        ]
        
        results = []
        
        for text in test_texts:
            try:
                response = requests.post(
                    url,
                    json={"text": text},
                    headers={"Content-Type": "application/json"},
                    timeout=15
                )
                
                json_data = response.json()
                
                results.append({
                    "input_text": text,
                    "status_code": response.status_code,
                    "response": json_data,
                    "success": response.status_code == 200 and json_data.get("success", False),
                    "category_detected": json_data.get("category"),
                    "confidence": json_data.get("confidence")
                })
                
                print(f"✓ AI Analysis: {json_data.get('category')} (confidence: {json_data.get('confidence')})")
                
            except Exception as e:
                results.append({
                    "input_text": text,
                    "success": False,
                    "error": str(e)
                })
                print(f"✗ AI Analysis failed: {str(e)}")
        
        return results
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run all tests and generate comprehensive report"""
        print("🚀 Starting comprehensive deployment verification...")
        print(f"Frontend URL: {self.frontend_url}")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 60)
        
        # Test frontend routes
        print("\n📱 Testing Frontend Routes...")
        self.results["frontend"]["routes"] = self.test_frontend_routes()
        
        # Test backend endpoints
        print("\n🔧 Testing Backend Endpoints...")
        self.results["backend"]["endpoints"] = self.test_backend_endpoints()
        
        # Test health endpoint specifically
        print("\n❤️ Testing Health Endpoint...")
        self.results["backend"]["health_check"] = self.test_health_endpoint_specifically()
        
        # Test AI analyze endpoint
        print("\n🤖 Testing AI Analysis...")
        self.results["backend"]["ai_analysis"] = self.test_ai_analyze_endpoint()
        
        # Calculate overall status
        frontend_success = all(
            result["success"] for result in self.results["frontend"]["routes"].values()
        )
        backend_success = (
            self.results["backend"]["health_check"]["success"] and
            all(result["success"] for result in self.results["backend"]["endpoints"].values())
        )
        ai_success = all(
            result["success"] for result in self.results["backend"]["ai_analysis"]
        )
        
        self.results["overall_status"] = "success" if (frontend_success and backend_success and ai_success) else "partial_failure"
        self.results["summary"] = {
            "frontend_operational": frontend_success,
            "backend_operational": backend_success,
            "ai_analysis_working": ai_success,
            "total_tests_run": (
                len(self.results["frontend"]["routes"]) + 
                len(self.results["backend"]["endpoints"]) + 
                len(self.results["backend"]["ai_analysis"]) + 1
            )
        }
        
        return self.results
    
    def save_results(self, filename: str = None):
        """Save test results to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"deployment_verification_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        print(f"\n📊 Results saved to: {filename}")
        return filename

def main():
    """Main verification function"""
    verifier = DeploymentVerifier()
    
    try:
        results = verifier.run_comprehensive_test()
        filename = verifier.save_results()
        
        print("\n" + "=" * 60)
        print("🎯 DEPLOYMENT VERIFICATION SUMMARY")
        print("=" * 60)
        
        summary = results["summary"]
        print(f"Frontend Operational: {'✅' if summary['frontend_operational'] else '❌'}")
        print(f"Backend Operational: {'✅' if summary['backend_operational'] else '❌'}")
        print(f"AI Analysis Working: {'✅' if summary['ai_analysis_working'] else '❌'}")
        print(f"Overall Status: {'✅ SUCCESS' if results['overall_status'] == 'success' else '⚠️ PARTIAL FAILURE'}")
        print(f"Total Tests: {summary['total_tests_run']}")
        
        # Show key endpoints
        print(f"\n🔗 Key URLs:")
        print(f"Frontend: {verifier.frontend_url}")
        print(f"Backend Health: {verifier.backend_url}/api/health")
        print(f"Backend AI: {verifier.backend_url}/api/ai-analyze")
        
        # Show health check result
        health_result = results["backend"]["health_check"]
        if health_result["success"]:
            print(f"\n✅ Health Check: {health_result['response']}")
        else:
            print(f"\n❌ Health Check Failed: {health_result.get('error', 'Unknown error')}")
        
        return results["overall_status"] == "success"
        
    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)