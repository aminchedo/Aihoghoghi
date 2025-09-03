#!/usr/bin/env python3
"""
Test script to verify deployment fixes
"""
import subprocess
import sys
import json
from datetime import datetime

def run_command(cmd):
    """Run shell command and return result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def test_build():
    """Test if frontend builds successfully"""
    print("🏗️  Testing frontend build...")
    success, stdout, stderr = run_command("npm run build")
    
    if success:
        print("✅ Frontend build: SUCCESS")
        return True
    else:
        print(f"❌ Frontend build: FAILED - {stderr}")
        return False

def test_dist_files():
    """Test if required files exist in dist"""
    print("📁 Testing dist files...")
    
    required_files = [
        "dist/index.html",
        "dist/404.html",
        "dist/assets",
        "dist/manifest.json"
    ]
    
    all_exist = True
    for file_path in required_files:
        success, _, _ = run_command(f"test -e {file_path}")
        if success:
            print(f"✅ {file_path}: EXISTS")
        else:
            print(f"❌ {file_path}: MISSING")
            all_exist = False
    
    return all_exist

def test_spa_routing():
    """Test SPA routing configuration"""
    print("🔄 Testing SPA routing configuration...")
    
    # Check if 404.html contains routing script
    success, content, _ = run_command("grep -q 'window.location.href' dist/404.html")
    if success:
        print("✅ 404.html: Contains SPA routing script")
        return True
    else:
        print("❌ 404.html: Missing SPA routing script")
        return False

def test_api_structure():
    """Test API structure and files"""
    print("🔗 Testing API structure...")
    
    api_files = [
        "api/main.py",
        "api/requirements.txt",
        "api/vercel.json"
    ]
    
    all_exist = True
    for file_path in api_files:
        success, _, _ = run_command(f"test -f {file_path}")
        if success:
            print(f"✅ {file_path}: EXISTS")
        else:
            print(f"❌ {file_path}: MISSING")
            all_exist = False
    
    return all_exist

def test_requirements():
    """Test requirements.txt has required packages"""
    print("📦 Testing requirements...")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "torch",
        "transformers",
        "numpy"
    ]
    
    success, content, _ = run_command("cat api/requirements.txt")
    if not success:
        print("❌ Cannot read api/requirements.txt")
        return False
    
    all_found = True
    for package in required_packages:
        if package in content:
            print(f"✅ {package}: FOUND in requirements")
        else:
            print(f"❌ {package}: MISSING from requirements")
            all_found = False
    
    return all_found

def test_vite_config():
    """Test Vite configuration"""
    print("⚙️  Testing Vite configuration...")
    
    success, content, _ = run_command("grep -q \"base: '/Aihoghoghi/'\" vite.config.js")
    if success:
        print("✅ Vite config: Correct base path")
        return True
    else:
        print("❌ Vite config: Incorrect or missing base path")
        return False

def generate_report(results):
    """Generate test report"""
    timestamp = datetime.now().isoformat()
    
    report = {
        "test_timestamp": timestamp,
        "results": results,
        "overall_success": all(results.values()),
        "success_count": sum(1 for v in results.values() if v),
        "total_tests": len(results),
        "success_rate": (sum(1 for v in results.values() if v) / len(results)) * 100
    }
    
    # Save report
    with open("deployment_test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    return report

def main():
    print("🧪 DEPLOYMENT VERIFICATION TEST")
    print("=" * 40)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 40)
    
    # Run all tests
    tests = {
        "frontend_build": test_build(),
        "dist_files": test_dist_files(),
        "spa_routing": test_spa_routing(),
        "api_structure": test_api_structure(),
        "requirements": test_requirements(),
        "vite_config": test_vite_config()
    }
    
    # Generate report
    report = generate_report(tests)
    
    print("\n" + "=" * 40)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 40)
    print(f"✅ Passed: {report['success_count']}/{report['total_tests']}")
    print(f"📊 Success Rate: {report['success_rate']:.1f}%")
    print(f"📄 Report saved: deployment_test_report.json")
    
    if report['overall_success']:
        print("\n🎉 ALL TESTS PASSED - DEPLOYMENT READY!")
        return 0
    else:
        print("\n⚠️  SOME TESTS FAILED - CHECK ISSUES ABOVE")
        return 1

if __name__ == "__main__":
    sys.exit(main())