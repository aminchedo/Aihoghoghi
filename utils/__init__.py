"""
Utils package for Iranian Legal Archive System
Contains modular components for networking, content extraction, AI processing, etc.
"""

from .dns_manager import IntelligentDNSManager
from .proxy_manager import ModernProxyManager
from .content_extractor import ModernContentExtractor
from .ai_classifier import HuggingFaceOptimizedClassifier
from .cache_system import UltraIntelligentCacheSystem
from .scoring_system import UltraAdvancedScoringSystem
from .legal_sources import AUTHORITATIVE_LEGAL_SOURCES
from .orchestrator import UltraModernLegalArchive

__all__ = [
    'IntelligentDNSManager',
    'ModernProxyManager', 
    'ModernContentExtractor',
    'HuggingFaceOptimizedClassifier',
    'UltraIntelligentCacheSystem',
    'UltraAdvancedScoringSystem',
    'AUTHORITATIVE_LEGAL_SOURCES',
    'UltraModernLegalArchive'
]