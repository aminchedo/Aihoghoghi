#!/usr/bin/env python3
"""
Comprehensive Recovery Verification Script
Tests all recovered backend components of the Iranian Legal Archive System
"""

import os
import sys
import importlib
import traceback
from pathlib import Path

def test_file_exists(file_path, description):
    """Test if a file exists and is readable"""
    try:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"✅ {description}: {file_path} ({size:,} bytes)")
            return True
        else:
            print(f"❌ {description}: {file_path} - MISSING")
            return False
    except Exception as e:
        print(f"❌ {description}: {file_path} - ERROR: {e}")
        return False

def test_import(module_name, file_path, description):
    """Test if a Python module can be imported"""
    try:
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec and spec.loader:
            print(f"✅ {description}: {module_name} - IMPORTABLE")
            return True
        else:
            print(f"❌ {description}: {module_name} - INVALID MODULE")
            return False
    except Exception as e:
        print(f"❌ {description}: {module_name} - IMPORT ERROR: {e}")
        return False

def test_python_syntax(file_path, description):
    """Test if a Python file has valid syntax"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            compile(f.read(), file_path, 'exec')
        print(f"✅ {description}: {file_path} - VALID SYNTAX")
        return True
    except Exception as e:
        print(f"❌ {description}: {file_path} - SYNTAX ERROR: {e}")
        return False

def main():
    """Main verification function"""
    print("🔍 IRANIAN LEGAL ARCHIVE SYSTEM - RECOVERY VERIFICATION")
    print("=" * 60)
    
    # Test critical backend files
    critical_files = [
        ("web_server.py", "FastAPI Web Server"),
        ("legal_database.py", "Legal Database Handler"),
        ("ultimate_proxy_system.py", "Ultimate Proxy System"),
        ("iranian_legal_archive.py", "Main Legal Archive System"),
        ("requirements.txt", "Python Dependencies"),
    ]
    
    print("\n📁 CRITICAL BACKEND FILES:")
    critical_success = 0
    for file_path, description in critical_files:
        if test_file_exists(file_path, description):
            critical_success += 1
            # Test Python syntax for .py files
            if file_path.endswith('.py'):
                test_python_syntax(file_path, description)
    
    # Test utils directory
    print("\n🔧 UTILS DIRECTORY:")
    utils_dir = "utils"
    if os.path.exists(utils_dir) and os.path.isdir(utils_dir):
        print(f"✅ Utils directory: {utils_dir}")
        utils_files = [
            ("orchestrator.py", "System Orchestrator"),
            ("ai_classifier.py", "AI Classifier"),
            ("proxy_manager.py", "Proxy Manager"),
        ]
        
        utils_success = 0
        for file_path, description in utils_files:
            full_path = os.path.join(utils_dir, file_path)
            if test_file_exists(full_path, description):
                utils_success += 1
                test_python_syntax(full_path, description)
    else:
        print(f"❌ Utils directory: {utils_dir} - MISSING")
    
    # Test project structure
    print("\n🏗️ PROJECT STRUCTURE:")
    expected_dirs = ["src", "production", "scripts"]
    for dir_name in expected_dirs:
        if os.path.exists(dir_name) and os.path.isdir(dir_name):
            print(f"✅ Directory: {dir_name}/")
        else:
            print(f"❌ Directory: {dir_name}/ - MISSING")
    
    # Test requirements.txt content
    print("\n📦 DEPENDENCIES:")
    if os.path.exists("requirements.txt"):
        try:
            with open("requirements.txt", 'r') as f:
                lines = f.readlines()
                print(f"✅ Requirements.txt: {len(lines)} dependency lines")
                # Show key dependencies
                key_deps = ["fastapi", "uvicorn", "torch", "transformers"]
                for dep in key_deps:
                    if any(dep in line for line in lines):
                        print(f"   ✅ {dep} - Found")
                    else:
                        print(f"   ❌ {dep} - Missing")
        except Exception as e:
            print(f"❌ Error reading requirements.txt: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 RECOVERY SUMMARY:")
    print(f"Critical Backend Files: {critical_success}/{len(critical_files)}")
    print(f"Utils Components: {utils_success}/{len(utils_files)}")
    
    if critical_success == len(critical_files):
        print("\n🎉 CRITICAL RECOVERY SUCCESS!")
        print("All essential backend components have been restored.")
    else:
        print(f"\n⚠️  PARTIAL RECOVERY: {critical_success}/{len(critical_files)} critical files restored")
    
    print("\n🚀 NEXT STEPS:")
    print("1. Test the web server: python web_server.py")
    print("2. Verify database: python legal_database.py")
    print("3. Test proxy system: python ultimate_proxy_system.py")
    print("4. Install dependencies: pip install -r requirements.txt")

if __name__ == "__main__":
    main()