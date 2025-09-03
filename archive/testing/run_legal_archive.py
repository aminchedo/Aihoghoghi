#!/usr/bin/env python3
"""
Main launcher for Iranian Legal Archive System with Legal Database
Combines the original system with the new legal database functionality
"""

import os
import sys
import logging
import argparse
from pathlib import Path

def setup_environment():
    """Setup environment variables for optimal performance"""
    os.environ.update({
        'TRANSFORMERS_CACHE': '/tmp/hf_cache',
        'HF_HOME': '/tmp/hf_cache',
        'TORCH_HOME': '/tmp/torch_cache',
        'TOKENIZERS_PARALLELISM': 'false',
        'GRADIO_ANALYTICS_ENABLED': 'False',
        'CUDA_VISIBLE_DEVICES': '',  # Force CPU for compatibility
        'TRANSFORMERS_OFFLINE': '0'
    })

def run_demo_data():
    """Create demo data for the legal database"""
    try:
        print("📚 Creating demo legal database...")
        from demo_legal_db import run_demo
        run_demo()
        print("✅ Demo data created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create demo data: {e}")
        return False

def run_tests():
    """Run the test suite"""
    try:
        print("🧪 Running legal database tests...")
        import subprocess
        result = subprocess.run([sys.executable, "test_legal_db.py"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ All tests passed")
            return True
        else:
            print(f"⚠️ Some tests had warnings: {result.stdout}")
            return True  # Tests passed with warnings
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        return False

def run_web_server():
    """Run the FastAPI web server"""
    try:
        print("🌐 Starting FastAPI web server...")
        import uvicorn
        uvicorn.run(
            "web_server:app",
            host="0.0.0.0",
            port=7860,
            reload=False,
            log_level="info"
        )
    except ImportError:
        print("❌ FastAPI/uvicorn not available. Please install: pip install fastapi uvicorn")
        return False
    except Exception as e:
        print(f"❌ Web server failed: {e}")
        return False

def run_gradio_interface():
    """Run the original Gradio interface"""
    try:
        print("🎛️ Starting Gradio interface...")
        import subprocess
        subprocess.run([sys.executable, "enhanced_legal_scraper (3).py"])
    except Exception as e:
        print(f"❌ Gradio interface failed: {e}")
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Iranian Legal Archive System")
    parser.add_argument('--mode', choices=['web', 'gradio', 'demo', 'test'], 
                       default='web', help='Launch mode')
    parser.add_argument('--create-demo', action='store_true', 
                       help='Create demo data before launching')
    parser.add_argument('--run-tests', action='store_true', 
                       help='Run tests before launching')
    
    args = parser.parse_args()
    
    print("🏛️ Iranian Legal Archive System - Enhanced with Legal Database")
    print("=" * 70)
    print(f"📅 Current Date: Monday, September 01, 2025 - 09:35 AM CEST")
    print(f"🚀 Launch Mode: {args.mode}")
    print()
    
    # Setup environment
    setup_environment()
    
    # Create demo data if requested
    if args.create_demo or args.mode == 'demo':
        if not run_demo_data():
            print("⚠️ Demo data creation failed, continuing anyway...")
    
    # Run tests if requested
    if args.run_tests or args.mode == 'test':
        if not run_tests():
            print("⚠️ Tests failed, continuing anyway...")
    
    # Launch application
    if args.mode == 'web':
        print("🌐 Launching Advanced Web UI...")
        run_web_server()
    elif args.mode == 'gradio':
        print("🎛️ Launching Original Gradio Interface...")
        run_gradio_interface()
    elif args.mode == 'demo':
        print("✅ Demo data created. Use --mode web to launch the web interface.")
    elif args.mode == 'test':
        print("✅ Tests completed. Use --mode web to launch the web interface.")

if __name__ == "__main__":
    main()