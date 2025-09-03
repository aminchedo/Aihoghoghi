#!/usr/bin/env python3
"""
Deployment script for Iranian Legal Archive System
Handles dependency checking, installation, and application launch
"""

import os
import sys
import subprocess
import importlib
import logging
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'transformers',
        'sentence_transformers',
        'torch',
        'requests',
        'beautifulsoup4',
        'hazm',
        'numpy'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            importlib.import_module(package)
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} - missing")
    
    return missing_packages

def install_dependencies():
    """Install missing dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
        ])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def setup_directories():
    """Create necessary directories"""
    directories = [
        'web_ui',
        '/tmp/hf_cache',
        '/tmp/torch_cache'
    ]
    
    for directory in directories:
        try:
            os.makedirs(directory, exist_ok=True)
            print(f"✅ Directory created: {directory}")
        except Exception as e:
            print(f"⚠️ Could not create directory {directory}: {e}")

def check_system_resources():
    """Check system resources"""
    try:
        import psutil
        
        # Check RAM
        memory = psutil.virtual_memory()
        memory_gb = memory.total / (1024**3)
        
        if memory_gb < 4:
            print(f"⚠️ Low memory detected: {memory_gb:.1f}GB (4GB+ recommended)")
        else:
            print(f"✅ Memory: {memory_gb:.1f}GB")
        
        # Check disk space
        disk = psutil.disk_usage('/')
        disk_free_gb = disk.free / (1024**3)
        
        if disk_free_gb < 2:
            print(f"⚠️ Low disk space: {disk_free_gb:.1f}GB free (2GB+ recommended)")
        else:
            print(f"✅ Disk space: {disk_free_gb:.1f}GB free")
            
    except ImportError:
        print("⚠️ Could not check system resources (psutil not available)")

def launch_application(mode='web'):
    """Launch the application"""
    if mode == 'web':
        print("🚀 Launching web server...")
        try:
            import uvicorn
            uvicorn.run(
                "web_server:app",
                host="0.0.0.0",
                port=7860,
                reload=False,
                log_level="info"
            )
        except Exception as e:
            print(f"❌ Failed to launch web server: {e}")
            return False
    else:
        print("🚀 Launching Gradio interface...")
        try:
            subprocess.run([sys.executable, "enhanced_legal_scraper (3).py"])
        except Exception as e:
            print(f"❌ Failed to launch Gradio interface: {e}")
            return False
    
    return True

def main():
    """Main deployment function"""
    print("🏛️ Iranian Legal Archive System - Deployment Script")
    print("=" * 60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup directories
    setup_directories()
    
    # Check dependencies
    missing_packages = check_dependencies()
    
    if missing_packages:
        print(f"\n📦 Missing packages: {', '.join(missing_packages)}")
        
        # Ask user if they want to install
        response = input("Do you want to install missing dependencies? (y/n): ").lower()
        if response in ['y', 'yes']:
            if not install_dependencies():
                print("❌ Deployment failed due to dependency installation errors")
                sys.exit(1)
        else:
            print("❌ Cannot proceed without required dependencies")
            sys.exit(1)
    
    # Check system resources
    print("\n🔍 Checking system resources...")
    check_system_resources()
    
    # Choose launch mode
    print("\n🚀 Choose launch mode:")
    print("1. Modern Web UI (FastAPI + WebSocket)")
    print("2. Original Gradio Interface")
    
    try:
        choice = input("Enter choice (1 or 2, default: 1): ").strip()
        if choice == '2':
            mode = 'gradio'
        else:
            mode = 'web'
    except KeyboardInterrupt:
        print("\n👋 Deployment cancelled")
        sys.exit(0)
    
    print(f"\n🎯 Launching in {mode} mode...")
    
    if not launch_application(mode):
        print("❌ Deployment failed")
        sys.exit(1)

if __name__ == "__main__":
    main()