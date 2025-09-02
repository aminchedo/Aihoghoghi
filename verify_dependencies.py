#!/usr/bin/env python3
"""
Dependency Verification Script
Verifies that all required dependencies can be imported successfully
"""

import sys
import importlib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def verify_import(module_name, optional=False):
    """Verify that a module can be imported"""
    try:
        importlib.import_module(module_name)
        logger.info(f"✅ {module_name} - OK")
        return True
    except ImportError as e:
        if optional:
            logger.warning(f"⚠️  {module_name} - OPTIONAL (not available): {e}")
            return True
        else:
            logger.error(f"❌ {module_name} - FAILED: {e}")
            return False

def main():
    """Main verification function"""
    logger.info("🔍 Verifying Python dependencies...")
    logger.info(f"Python version: {sys.version}")
    
    # Core dependencies
    core_deps = [
        'fastapi',
        'uvicorn',
        'requests',
        'aiohttp',
        'beautifulsoup4',
        'pandas',
        'numpy',
        'setuptools',
        'packaging',
        'wheel',
        'typing_extensions',
        'pydantic'
    ]
    
    # ML dependencies (optional for basic functionality)
    ml_deps = [
        'torch',
        'transformers',
        'sentence_transformers'
    ]
    
    # Verify core dependencies
    logger.info("\n📦 Checking core dependencies...")
    core_success = all(verify_import(dep) for dep in core_deps)
    
    # Verify ML dependencies
    logger.info("\n🤖 Checking ML dependencies...")
    ml_success = all(verify_import(dep, optional=True) for dep in ml_deps)
    
    # Test specific functionality
    logger.info("\n🧪 Testing specific functionality...")
    
    try:
        import numpy as np
        arr = np.array([1, 2, 3])
        logger.info(f"✅ NumPy array creation: {arr}")
    except Exception as e:
        logger.error(f"❌ NumPy functionality test failed: {e}")
        core_success = False
    
    try:
        import pandas as pd
        df = pd.DataFrame({'test': [1, 2, 3]})
        logger.info(f"✅ Pandas DataFrame creation: {len(df)} rows")
    except Exception as e:
        logger.error(f"❌ Pandas functionality test failed: {e}")
        core_success = False
    
    # Test ML functionality if available
    try:
        import torch
        tensor = torch.tensor([1.0, 2.0, 3.0])
        logger.info(f"✅ PyTorch tensor creation: {tensor}")
    except Exception as e:
        logger.warning(f"⚠️  PyTorch functionality test failed: {e}")
    
    # Final result
    logger.info("\n" + "="*50)
    if core_success:
        logger.info("🎉 All core dependencies verified successfully!")
        if ml_success:
            logger.info("🎉 All ML dependencies verified successfully!")
        else:
            logger.warning("⚠️  Some ML dependencies missing (but app can run without them)")
        return 0
    else:
        logger.error("💥 Core dependency verification failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())