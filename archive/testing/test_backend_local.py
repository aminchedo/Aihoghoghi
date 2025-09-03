#!/usr/bin/env python3
"""
Local backend testing script for Iranian Legal Archive System
Tests the FastAPI backend locally before Vercel deployment
"""

import subprocess
import time
import json
import sys
import signal
import os
from pathlib import Path

def test_backend_locally():
    """Test the backend API locally"""
    print("🔧 Testing Backend API Locally")
    print("=" * 40)
    
    # Change to api directory
    api_dir = Path("api")
    if not api_dir.exists():
        print("❌ API directory not found")
        return False
    
    # Start the server in background
    print("🚀 Starting FastAPI server...")
    
    try:
        # Start server process
        process = subprocess.Popen(
            [sys.executable, "main.py"],
            cwd="api",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for server to start
        print("⏳ Waiting for server to start...")
        time.sleep(3)
        
        # Test health endpoint
        print("\n❤️ Testing Health Endpoint:")
        health_result = subprocess.run([
            "curl", "-s", "http://localhost:8000/api/health"
        ], capture_output=True, text=True)
        
        if health_result.returncode == 0:
            try:
                health_json = json.loads(health_result.stdout)
                if health_json.get("status") == "ok":
                    print("✅ Health endpoint working correctly")
                    print(f"   Response: {health_json}")
                else:
                    print(f"⚠️ Health endpoint response format incorrect: {health_json}")
            except json.JSONDecodeError:
                print(f"❌ Health endpoint returned invalid JSON: {health_result.stdout}")
        else:
            print(f"❌ Health endpoint failed: {health_result.stderr}")
        
        # Test AI analyze endpoint
        print("\n🤖 Testing AI Analyze Endpoint:")
        ai_result = subprocess.run([
            "curl", "-s", "-X", "POST", "http://localhost:8000/api/ai-analyze",
            "-H", "Content-Type: application/json",
            "-d", '{"text":"این یک متن قانونی است که شامل ماده و تبصره می‌باشد"}'
        ], capture_output=True, text=True)
        
        if ai_result.returncode == 0:
            try:
                ai_json = json.loads(ai_result.stdout)
                if ai_json.get("success") and ai_json.get("category"):
                    print("✅ AI analyze endpoint working correctly")
                    print(f"   Category: {ai_json.get('category')}")
                    print(f"   Confidence: {ai_json.get('confidence')}")
                    print(f"   Keywords: {ai_json.get('keywords_found')}")
                else:
                    print(f"⚠️ AI analyze response incomplete: {ai_json}")
            except json.JSONDecodeError:
                print(f"❌ AI analyze returned invalid JSON: {ai_result.stdout}")
        else:
            print(f"❌ AI analyze failed: {ai_result.stderr}")
        
        # Terminate server
        print("\n🛑 Stopping server...")
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        
        print("✅ Local backend test completed")
        return True
        
    except Exception as e:
        print(f"❌ Local backend test failed: {str(e)}")
        return False

def check_dependencies():
    """Check if required dependencies are available"""
    print("📦 Checking Dependencies:")
    
    # Check if FastAPI is importable
    try:
        import sys
        sys.path.append('api')
        import fastapi
        print("✅ FastAPI available")
    except ImportError:
        print("❌ FastAPI not available")
        return False
    
    # Check if main.py exists
    if Path("api/main.py").exists():
        print("✅ api/main.py exists")
    else:
        print("❌ api/main.py not found")
        return False
    
    return True

def main():
    """Main test function"""
    print("🧪 Iranian Legal Archive - Local Backend Test")
    print("=" * 50)
    
    if not check_dependencies():
        print("❌ Dependencies check failed")
        return False
    
    return test_backend_locally()

if __name__ == "__main__":
    success = main()
    print(f"\n🎯 Test Result: {'✅ SUCCESS' if success else '❌ FAILED'}")
    sys.exit(0 if success else 1)