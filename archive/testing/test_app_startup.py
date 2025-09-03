#!/usr/bin/env python3
"""
FastAPI Application Startup Test
Verifies that the FastAPI application can be imported and initialized without errors
"""

import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def test_app_startup():
    """Test that the FastAPI app can be imported and started"""
    try:
        logger.info("🔍 Testing FastAPI application startup...")
        
        # Test core imports
        from fastapi import FastAPI
        logger.info("✅ FastAPI import successful")
        
        from uvicorn import run
        logger.info("✅ Uvicorn import successful")
        
        # Test application import
        from api.main import app
        logger.info("✅ Main application import successful")
        
        # Verify app is FastAPI instance
        if isinstance(app, FastAPI):
            logger.info("✅ Application is valid FastAPI instance")
        else:
            logger.error("❌ Application is not a FastAPI instance")
            return False
        
        # Test that app has routes
        if hasattr(app, 'routes') and len(app.routes) > 0:
            logger.info(f"✅ Application has {len(app.routes)} routes configured")
        else:
            logger.warning("⚠️  No routes found in application")
        
        logger.info("🎉 FastAPI application startup test PASSED!")
        return True
        
    except ImportError as e:
        logger.error(f"❌ Import error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Application startup error: {e}")
        return False

if __name__ == "__main__":
    success = test_app_startup()
    sys.exit(0 if success else 1)