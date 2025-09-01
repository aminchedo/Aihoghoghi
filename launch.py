#!/usr/bin/env python3
"""
Simple launcher for Iranian Legal Archive System
Checks dependencies and provides fallback options
"""

import sys
import os
import logging

def check_and_install_basic_deps():
    """Check and attempt to install basic dependencies"""
    try:
        # Check if pip is available
        import subprocess
        
        basic_deps = [
            "fastapi",
            "uvicorn[standard]",
            "jinja2",
            "requests",
            "beautifulsoup4"
        ]
        
        print("🔧 Checking basic dependencies...")
        
        for dep in basic_deps:
            try:
                __import__(dep.split('[')[0])  # Remove extras like [standard]
                print(f"✅ {dep} available")
            except ImportError:
                print(f"⚠️ {dep} not available")
                try:
                    print(f"📦 Installing {dep}...")
                    subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
                    print(f"✅ {dep} installed")
                except Exception as e:
                    print(f"❌ Failed to install {dep}: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Dependency check failed: {e}")
        return False

def launch_application():
    """Launch the FastAPI application"""
    try:
        print("🚀 Launching Iranian Legal Archive System...")
        
        # Try to import the main app
        try:
            from app import app
            import uvicorn
            
            print("✅ FastAPI application loaded")
            print("🌐 Starting server at http://localhost:8000")
            
            uvicorn.run(
                "app:app",
                host="0.0.0.0",
                port=8000,
                reload=False,
                log_level="info"
            )
            
        except ImportError as e:
            print(f"❌ Failed to import application: {e}")
            print("💡 Some dependencies may be missing")
            
            # Try fallback mode
            print("🔄 Attempting fallback mode...")
            return launch_fallback_mode()
    
    except Exception as e:
        print(f"❌ Application launch failed: {e}")
        return False

def launch_fallback_mode():
    """Launch in fallback mode with minimal dependencies"""
    try:
        print("⚡ Starting in fallback mode...")
        
        # Create a simple HTTP server to serve static files
        import http.server
        import socketserver
        from pathlib import Path
        
        # Change to templates directory if it exists
        if Path("templates").exists():
            os.chdir("templates")
        
        PORT = 8000
        Handler = http.server.SimpleHTTPRequestHandler
        
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🌐 Fallback server running at http://localhost:{PORT}")
            print("📄 Serving static files only (limited functionality)")
            print("💡 Install full dependencies for complete features")
            httpd.serve_forever()
            
    except Exception as e:
        print(f"❌ Fallback mode failed: {e}")
        return False

def main():
    """Main launcher function"""
    print("🏛️ Iranian Legal Archive System v2.0 Launcher")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        return False
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Check basic dependencies
    if "--skip-deps" not in sys.argv:
        check_and_install_basic_deps()
    
    # Launch application
    return launch_application()

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)