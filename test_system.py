#!/usr/bin/env python3
"""
Test script for Iranian Legal Archive System
Verifies that all components can be imported and initialized
"""

import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_imports():
    """Test all module imports"""
    try:
        logger.info("🧪 Testing module imports...")
        
        # Test individual components
        from utils.legal_sources import AUTHORITATIVE_LEGAL_SOURCES
        logger.info(f"✅ Legal sources loaded: {len(AUTHORITATIVE_LEGAL_SOURCES)} sources")
        
        from utils.dns_manager import IntelligentDNSManager
        dns_manager = IntelligentDNSManager()
        logger.info("✅ DNS Manager initialized")
        
        from utils.proxy_manager import ModernProxyManager
        proxy_manager = ModernProxyManager()
        logger.info(f"✅ Proxy Manager initialized with {len(proxy_manager.all_proxies)} proxies")
        
        from utils.content_extractor import ModernContentExtractor
        content_extractor = ModernContentExtractor()
        logger.info("✅ Content Extractor initialized")
        
        from utils.cache_system import UltraIntelligentCacheSystem
        cache_system = UltraIntelligentCacheSystem()
        logger.info("✅ Cache System initialized")
        
        from utils.scoring_system import UltraAdvancedScoringSystem
        scoring_system = UltraAdvancedScoringSystem()
        logger.info("✅ Scoring System initialized")
        
        from utils.ai_classifier import HuggingFaceOptimizedClassifier
        ai_classifier = HuggingFaceOptimizedClassifier()
        logger.info("✅ AI Classifier initialized")
        
        # Test main orchestrator
        from utils.orchestrator import UltraModernLegalArchive
        legal_archive = UltraModernLegalArchive()
        logger.info("✅ Main Orchestrator initialized")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Import test failed: {e}")
        return False

def test_basic_functionality():
    """Test basic system functionality"""
    try:
        logger.info("🔧 Testing basic functionality...")
        
        from utils import UltraModernLegalArchive
        legal_archive = UltraModernLegalArchive()
        
        # Test system health
        health = legal_archive.get_system_health()
        logger.info(f"✅ System health check: {health['overall_status']}")
        
        # Test statistics
        stats = legal_archive.get_document_statistics()
        logger.info(f"✅ Document statistics: {stats.get('total_documents', 0)} documents")
        
        # Test session statistics
        session_stats = legal_archive.get_session_statistics()
        logger.info(f"✅ Session statistics: {session_stats['uptime_seconds']:.1f}s uptime")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Functionality test failed: {e}")
        return False

def test_web_interface():
    """Test web interface components"""
    try:
        logger.info("🌐 Testing web interface...")
        
        # Check if template files exist
        template_path = Path("templates/index.html")
        if template_path.exists():
            logger.info("✅ Main template found")
        else:
            logger.warning("⚠️ Main template not found")
        
        # Check static files
        static_files = ["static/styles.css", "static/app.js", "static/sw.js"]
        for file_path in static_files:
            if Path(file_path).exists():
                logger.info(f"✅ Static file found: {file_path}")
            else:
                logger.warning(f"⚠️ Static file not found: {file_path}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Web interface test failed: {e}")
        return False

def main():
    """Run all tests"""
    logger.info("🚀 Starting Iranian Legal Archive System Tests")
    
    tests = [
        ("Module Imports", test_imports),
        ("Basic Functionality", test_basic_functionality),
        ("Web Interface", test_web_interface)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        logger.info(f"\n📋 Running test: {test_name}")
        if test_func():
            passed += 1
            logger.info(f"✅ {test_name} passed")
        else:
            logger.error(f"❌ {test_name} failed")
    
    logger.info(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! System is ready.")
        return True
    else:
        logger.error("💥 Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)