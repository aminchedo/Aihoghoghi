#!/usr/bin/env python3
"""
Startup script for Enhanced Iranian Legal Archive System
This script provides a simple way to run the legal archive system with proper configuration.
"""

import os
import sys
import argparse
import logging
from pathlib import Path

def setup_logging(log_level="INFO"):
    """Setup logging configuration"""
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler("iranian_legal_archive.log", encoding='utf-8')
        ]
    )

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'fastapi', 'uvicorn', 'requests', 'beautifulsoup4', 
        'sqlite3', 'pydantic', 'schedule'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'sqlite3':
                import sqlite3
            else:
                __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        print("Please install them using: pip install -r requirements.txt")
        return False
    
    print("✅ All required dependencies are installed")
    return True

def create_data_directory(data_dir):
    """Create data directory if it doesn't exist"""
    data_path = Path(data_dir)
    data_path.mkdir(parents=True, exist_ok=True)
    
    # Create subdirectories
    (data_path / "databases").mkdir(exist_ok=True)
    (data_path / "logs").mkdir(exist_ok=True)
    (data_path / "cache").mkdir(exist_ok=True)
    
    print(f"📁 Data directory created: {data_path.absolute()}")

def main():
    """Main function to run the Enhanced Iranian Legal Archive System"""
    parser = argparse.ArgumentParser(
        description="Enhanced Iranian Legal Archive System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_enhanced_legal_archive.py                    # Run with default settings
  python run_enhanced_legal_archive.py --port 8080       # Run on port 8080
  python run_enhanced_legal_archive.py --host 0.0.0.0    # Allow external connections
  python run_enhanced_legal_archive.py --dev             # Run in development mode
  python run_enhanced_legal_archive.py --data-dir ./data # Custom data directory
        """
    )
    
    parser.add_argument(
        '--host', 
        default='127.0.0.1',
        help='Host to bind the server (default: 127.0.0.1)'
    )
    
    parser.add_argument(
        '--port', 
        type=int, 
        default=8000,
        help='Port to bind the server (default: 8000)'
    )
    
    parser.add_argument(
        '--data-dir', 
        default='/tmp/data',
        help='Directory to store data files (default: /tmp/data)'
    )
    
    parser.add_argument(
        '--log-level', 
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
        default='INFO',
        help='Logging level (default: INFO)'
    )
    
    parser.add_argument(
        '--dev', 
        action='store_true',
        help='Run in development mode with auto-reload'
    )
    
    parser.add_argument(
        '--check-deps', 
        action='store_true',
        help='Check dependencies and exit'
    )
    
    parser.add_argument(
        '--version', 
        action='version',
        version='Enhanced Iranian Legal Archive System v2.0.0'
    )
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.log_level)
    logger = logging.getLogger(__name__)
    
    print("🏛️  Enhanced Iranian Legal Archive System v2.0.0")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    if args.check_deps:
        print("Dependencies check completed successfully!")
        sys.exit(0)
    
    # Create data directory
    create_data_directory(args.data_dir)
    
    try:
        # Import and initialize the system
        from enhanced_legal_archive_system import IranianLegalArchiveSystem
        import uvicorn
        
        logger.info("Initializing Enhanced Iranian Legal Archive System...")
        
        # Create system instance with custom data directory
        system = IranianLegalArchiveSystem(data_dir=args.data_dir)
        
        print(f"🚀 Starting server on http://{args.host}:{args.port}")
        print(f"📊 Dashboard: http://{args.host}:{args.port}")
        print(f"📖 API Documentation: http://{args.host}:{args.port}/docs")
        print(f"💾 Data Directory: {Path(args.data_dir).absolute()}")
        print("=" * 60)
        print("Press Ctrl+C to stop the server")
        
        # Run the server
        uvicorn.run(
            system.app,
            host=args.host,
            port=args.port,
            log_level=args.log_level.lower(),
            reload=args.dev,
            access_log=True
        )
        
    except ImportError as e:
        logger.error(f"Failed to import required modules: {e}")
        print("❌ Please make sure enhanced_legal_archive_system.py is in the same directory")
        sys.exit(1)
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
        print("\n👋 Server stopped gracefully")
        
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()