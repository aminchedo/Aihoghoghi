#!/usr/bin/env python3
"""
Startup script for Iranian Legal Archive System
Handles initialization and launches the FastAPI application
"""

import os
import sys
import logging
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_dependencies():
    """Check if required dependencies are available"""
    try:
        import fastapi
        import uvicorn
        logger.info("✅ Core web framework dependencies available")
        return True
    except ImportError as e:
        logger.error(f"❌ Missing core dependencies: {e}")
        logger.info("💡 Please install dependencies: pip install -r requirements.txt")
        return False

def setup_directories():
    """Ensure all required directories exist"""
    directories = [
        "data/databases",
        "data/cache", 
        "data/models",
        "templates",
        "static",
        "utils"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        logger.info(f"✅ Directory ensured: {directory}")

def initialize_database():
    """Initialize the database schema"""
    try:
        import sqlite3
        
        db_path = Path("data/databases/legal_archive.sqlite")
        schema_path = Path("data/init_database.sql")
        
        if schema_path.exists():
            with sqlite3.connect(str(db_path)) as conn:
                with open(schema_path, 'r', encoding='utf-8') as f:
                    schema_sql = f.read()
                conn.executescript(schema_sql)
                logger.info("✅ Database schema initialized")
        else:
            logger.warning("⚠️ Database schema file not found, will use fallback")
            
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")

def main():
    """Main startup function"""
    logger.info("🏛️ Starting Iranian Legal Archive System v2.0")
    
    # Check dependencies
    if not check_dependencies():
        logger.error("❌ Cannot start due to missing dependencies")
        return False
    
    # Setup directories
    setup_directories()
    
    # Initialize database
    initialize_database()
    
    # Import and test the system
    try:
        logger.info("🧪 Testing system components...")
        from utils import UltraModernLegalArchive
        
        # Quick system test
        archive = UltraModernLegalArchive()
        health = archive.get_system_health()
        logger.info(f"✅ System health: {health['overall_status']}")
        
    except Exception as e:
        logger.error(f"❌ System test failed: {e}")
        logger.info("💡 Some features may be limited due to missing optional dependencies")
    
    # Launch the application
    try:
        logger.info("🚀 Launching FastAPI application...")
        
        # Check if we're in a development environment
        if "--dev" in sys.argv:
            logger.info("🔧 Development mode enabled")
            os.system("uvicorn app:app --host 0.0.0.0 --port 8000 --reload")
        else:
            logger.info("🌐 Production mode")
            os.system("uvicorn app:app --host 0.0.0.0 --port 8000")
            
    except KeyboardInterrupt:
        logger.info("👋 Application stopped by user")
    except Exception as e:
        logger.error(f"❌ Application launch failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)