"""
Ultra Modern Legal Archive Orchestrator
Main class that coordinates all system components for Iranian legal document processing
"""

import time
import logging
import sqlite3
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logging.warning("requests not available")

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False
    logging.warning("beautifulsoup4 not available")

from .dns_manager import IntelligentDNSManager
from .proxy_manager import ModernProxyManager, EnhancedHTTPAdapter
from .content_extractor import ModernContentExtractor
from .ai_classifier import HuggingFaceOptimizedClassifier
from .cache_system import UltraIntelligentCacheSystem
from .scoring_system import UltraAdvancedScoringSystem
from .legal_sources import AUTHORITATIVE_LEGAL_SOURCES, get_source_by_url

logger = logging.getLogger(__name__)

# Data paths
DATA_DIR = Path("data")
DB_PATH = DATA_DIR / "databases" / "legal_archive.sqlite"
CACHE_DB_PATH = DATA_DIR / "cache" / "intelligent_cache.sqlite"

# Ensure directories exist
for path in [DATA_DIR / "databases", DATA_DIR / "cache", DATA_DIR / "models"]:
    path.mkdir(parents=True, exist_ok=True)


class UltraModernLegalArchive:
    """ارکستراتور اصلی سیستم آرشیو اسناد حقوقی"""
    
    def __init__(self):
        self.db_path = str(DB_PATH)
        self.cache_db_path = str(CACHE_DB_PATH)
        
        # Initialize all system components
        self.dns_manager = IntelligentDNSManager()
        self.proxy_manager = ModernProxyManager()
        self.content_extractor = ModernContentExtractor()
        self.cache_system = UltraIntelligentCacheSystem(self.cache_db_path)
        self.scoring_system = UltraAdvancedScoringSystem()
        self.ai_classifier = HuggingFaceOptimizedClassifier(self.cache_system)
        
        # Session and metrics
        self.session = None
        self.session_stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'cache_hits': 0,
            'dns_switches': 0,
            'proxy_switches': 0,
            'total_processing_time': 0.0,
            'session_start': time.time()
        }
        
        # Modern user agents for scraping
        self.modern_user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        
        self._init_database()
        self._create_optimized_session()
        
        logger.info("🏛️ Ultra Modern Legal Archive initialized")

    def _init_database(self):
        """ایجاد پایگاه داده اصلی"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Read and execute schema
                schema_path = DATA_DIR / "init_database.sql"
                if schema_path.exists():
                    with open(schema_path, 'r', encoding='utf-8') as f:
                        schema_sql = f.read()
                    conn.executescript(schema_sql)
                else:
                    # Fallback schema
                    conn.execute('''
                        CREATE TABLE IF NOT EXISTS documents (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            url TEXT UNIQUE NOT NULL,
                            title TEXT,
                            source TEXT,
                            content TEXT,
                            quality_score REAL,
                            classification TEXT,
                            legal_entities TEXT,
                            word_count INTEGER,
                            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            source_category TEXT,
                            reliability_score REAL DEFAULT 0.5,
                            processing_time REAL,
                            readability_score REAL,
                            complexity_score REAL,
                            content_hash TEXT,
                            extraction_method TEXT,
                            response_time REAL,
                            status_code INTEGER,
                            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            embeddings BLOB,
                            metadata TEXT
                        )
                    ''')
                    
                    # Create indexes
                    indexes = [
                        'CREATE INDEX IF NOT EXISTS idx_source ON documents(source)',
                        'CREATE INDEX IF NOT EXISTS idx_quality ON documents(quality_score DESC)',
                        'CREATE INDEX IF NOT EXISTS idx_category ON documents(source_category)',
                        'CREATE INDEX IF NOT EXISTS idx_hash ON documents(content_hash)',
                        'CREATE INDEX IF NOT EXISTS idx_updated ON documents(last_updated DESC)',
                        'CREATE INDEX IF NOT EXISTS idx_word_count ON documents(word_count DESC)'
                    ]
                    
                    for index in indexes:
                        conn.execute(index)
                
                conn.commit()
                logger.info("✅ Database schema initialized")
                
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
            raise

    def _create_optimized_session(self):
        """ایجاد session بهینه‌شده"""
        try:
            if not REQUESTS_AVAILABLE:
                logger.error("requests library not available")
                return None
                
            self.session = requests.Session()
            
            # Setup DNS
            dns_configured = self.dns_manager.setup_custom_dns_resolution(self.session)
            if dns_configured:
                self.session_stats['dns_switches'] += 1
            
            # Setup retry strategy
            from urllib3.util.retry import Retry
            retry_strategy = Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[429, 500, 502, 503, 504, 520, 521, 522, 524],
                allowed_methods=["HEAD", "GET", "OPTIONS"]
            )
            
            # Enhanced adapter
            adapter = EnhancedHTTPAdapter(max_retries=retry_strategy)
            self.session.mount("http://", adapter)
            self.session.mount("https://", adapter)
            
            # Default headers
            self.session.headers.update({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8,en-US;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            })
            
            # SSL settings
            self.session.verify = False
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            
            logger.info("✅ Optimized session created")
            return self.session
            
        except Exception as e:
            logger.error(f"Session creation error: {e}")
            if REQUESTS_AVAILABLE:
                return requests.Session()
            return None

    def process_single_document(self, url: str, use_proxy: bool = True, 
                              max_retries: int = 3) -> Dict[str, Any]:
        """پردازش یک سند حقوقی"""
        start_time = time.time()
        self.session_stats['total_requests'] += 1
        
        # Generate content hash for deduplication
        url_hash = hashlib.md5(url.encode()).hexdigest()
        
        try:
            # Check cache first
            cached_result = self.cache_system.get(url)
            if cached_result:
                self.session_stats['cache_hits'] += 1
                logger.info(f"📋 Cache hit for {url}")
                return {**cached_result, "from_cache": True}
            
            # Validate URL
            if not self._is_valid_url(url):
                return self._create_error_result(url, "Invalid URL format")
            
            # Get source information
            source_info = get_source_by_url(url)
            
            # Setup proxy if requested and available
            if use_proxy and self.proxy_manager.active_proxies:
                proxy_configured = self.proxy_manager.setup_session_with_proxy(self.session)
                if proxy_configured:
                    self.session_stats['proxy_switches'] += 1
            
            # Make request with retries
            response = None
            for attempt in range(max_retries):
                try:
                    # Rotate user agent
                    import random
                    self.session.headers['User-Agent'] = random.choice(self.modern_user_agents)
                    
                    response = self.session.get(url, timeout=15)
                    response.raise_for_status()
                    break
                    
                except Exception as e:
                    logger.warning(f"Request attempt {attempt + 1} failed for {url}: {e}")
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(1 * (attempt + 1))  # Exponential backoff
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract content and metadata
            extraction_result = self.content_extractor.extract_content_intelligent(soup, url)
            
            if not extraction_result["content"]:
                return self._create_error_result(url, "No content extracted")
            
            # Extract additional metadata
            metadata = self.content_extractor.extract_metadata(soup, url)
            
            # Classify document
            classification_result = self.ai_classifier.classify_document_enhanced(
                extraction_result["content"], source_info
            )
            
            # Calculate quality scores
            score_result = self.scoring_system.calculate_comprehensive_score(
                extraction_result["content"],
                extraction_result["title"],
                source_info,
                metadata,
                {"processing_time": time.time() - start_time, "response_time": response.elapsed.total_seconds()}
            )
            
            # Extract legal entities
            legal_entities = self.ai_classifier.extract_legal_entities(extraction_result["content"])
            
            # Calculate readability and complexity
            readability_score = self.content_extractor.calculate_readability_score(extraction_result["content"])
            complexity_score = self.content_extractor.calculate_complexity_score(extraction_result["content"])
            
            # Generate embeddings if available
            embeddings = self.ai_classifier.generate_embeddings(extraction_result["content"])
            
            # Prepare final result
            processing_time = time.time() - start_time
            result = {
                "url": url,
                "title": extraction_result["title"],
                "content": extraction_result["content"],
                "content_hash": url_hash,
                "source": extraction_result.get("source", "نامشخص"),
                "source_category": source_info.get("category", "نامشخص") if source_info else "نامشخص",
                "extraction_method": extraction_result["method"],
                "classification": classification_result.get("classification", "نامشخص"),
                "classification_confidence": classification_result.get("confidence", 0.0),
                "classification_method": classification_result.get("method", "unknown"),
                "quality_score": score_result["final_score"],
                "quality_grade": score_result["quality_grade"],
                "readability_score": readability_score,
                "complexity_score": complexity_score,
                "legal_entities": legal_entities,
                "word_count": len(extraction_result["content"].split()),
                "processing_time": processing_time,
                "response_time": response.elapsed.total_seconds(),
                "status_code": response.status_code,
                "reliability_score": source_info.get("reliability_score", 0.5) if source_info else 0.5,
                "metadata": metadata,
                "embeddings": embeddings,
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "from_cache": False
            }
            
            # Store in database
            self._store_document(result)
            
            # Cache the result
            self.cache_system.set(
                url, result,
                ttl_seconds=3600,
                source_reliability=result["reliability_score"]
            )
            
            self.session_stats['successful_requests'] += 1
            self.session_stats['total_processing_time'] += processing_time
            
            logger.info(f"✅ Successfully processed {url} (score: {result['quality_score']:.1f})")
            return result
            
        except Exception as e:
            self.session_stats['failed_requests'] += 1
            error_result = self._create_error_result(url, str(e))
            logger.error(f"❌ Failed to process {url}: {e}")
            return error_result

    def process_multiple_documents(self, urls: List[str], use_proxy: bool = True, 
                                 batch_size: int = 5, max_retries: int = 3,
                                 progress_callback=None) -> List[Dict[str, Any]]:
        """پردازش چندین سند حقوقی"""
        results = []
        total_urls = len(urls)
        
        logger.info(f"🚀 Starting batch processing of {total_urls} URLs")
        
        # Initialize proxies if needed
        if use_proxy and not self.proxy_manager.active_proxies:
            logger.info("🔄 Testing proxies before processing...")
            if progress_callback:
                progress_callback(0.05, "Testing proxies...")
            self.proxy_manager.bulk_test_proxies(max_workers=5)
        
        # Process URLs in batches
        for batch_start in range(0, total_urls, batch_size):
            batch_end = min(batch_start + batch_size, total_urls)
            batch_urls = urls[batch_start:batch_end]
            batch_num = (batch_start // batch_size) + 1
            total_batches = (total_urls + batch_size - 1) // batch_size
            
            logger.info(f"📦 Processing batch {batch_num}/{total_batches}")
            
            if progress_callback:
                progress = (batch_start / total_urls) * 0.9 + 0.1  # Reserve 10% for initialization
                progress_callback(progress, f"Processing batch {batch_num}/{total_batches}")
            
            # Process each URL in the batch
            for url in batch_urls:
                try:
                    result = self.process_single_document(url, use_proxy, max_retries)
                    results.append(result)
                    
                    if progress_callback:
                        current_progress = (len(results) / total_urls) * 0.9 + 0.1
                        progress_callback(current_progress, f"Processed {len(results)}/{total_urls} documents")
                    
                except Exception as e:
                    error_result = self._create_error_result(url, str(e))
                    results.append(error_result)
                    logger.error(f"❌ Batch processing error for {url}: {e}")
                
                # Small delay between requests to avoid overwhelming servers
                time.sleep(0.5)
            
            # Delay between batches
            if batch_end < total_urls:
                time.sleep(2)
        
        if progress_callback:
            progress_callback(1.0, f"Completed processing {total_urls} documents")
        
        # Generate summary
        successful = len([r for r in results if r.get('status') == 'success'])
        failed = len(results) - successful
        
        logger.info(f"✅ Batch processing completed: {successful} successful, {failed} failed")
        
        return results

    def _store_document(self, result: Dict[str, Any]):
        """ذخیره سند در پایگاه داده"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Prepare data for insertion
                legal_entities_json = str(result.get('legal_entities', {}))
                metadata_json = str(result.get('metadata', {}))
                embeddings_blob = None
                
                if result.get('embeddings'):
                    import pickle
                    embeddings_blob = pickle.dumps(result['embeddings'])
                
                conn.execute('''
                    INSERT OR REPLACE INTO documents (
                        url, title, source, content, quality_score, classification,
                        legal_entities, word_count, source_category, reliability_score,
                        processing_time, readability_score, complexity_score,
                        content_hash, extraction_method, response_time, status_code,
                        embeddings, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    result['url'], result['title'], result['source'], result['content'],
                    result['quality_score'], result['classification'], legal_entities_json,
                    result['word_count'], result['source_category'], result['reliability_score'],
                    result['processing_time'], result['readability_score'], result['complexity_score'],
                    result['content_hash'], result['extraction_method'], result['response_time'],
                    result['status_code'], embeddings_blob, metadata_json
                ))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Database storage error: {e}")

    def search_documents(self, query: str, category: str = None, 
                        source: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        """جستجو در اسناد ذخیره شده"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                
                # Build query
                where_conditions = ["(title LIKE ? OR content LIKE ? OR classification LIKE ?)"]
                params = [f"%{query}%", f"%{query}%", f"%{query}%"]
                
                if category:
                    where_conditions.append("classification = ?")
                    params.append(category)
                
                if source:
                    where_conditions.append("source = ?")
                    params.append(source)
                
                sql = f'''
                    SELECT url, title, source, classification, quality_score, 
                           word_count, scraped_at, content
                    FROM documents 
                    WHERE {" AND ".join(where_conditions)}
                    ORDER BY quality_score DESC, scraped_at DESC
                    LIMIT ?
                '''
                params.append(limit)
                
                cursor = conn.execute(sql, params)
                rows = cursor.fetchall()
                
                results = []
                for row in rows:
                    result = dict(row)
                    # Truncate content for search results
                    if result['content']:
                        result['content'] = result['content'][:300] + "..." if len(result['content']) > 300 else result['content']
                    results.append(result)
                
                return results
                
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []

    def get_document_statistics(self) -> Dict[str, Any]:
        """دریافت آمار کلی اسناد"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                stats = {}
                
                # Total documents
                cursor = conn.execute('SELECT COUNT(*) FROM documents')
                stats['total_documents'] = cursor.fetchone()[0]
                
                # Documents by category
                cursor = conn.execute('''
                    SELECT classification, COUNT(*) 
                    FROM documents 
                    GROUP BY classification
                ''')
                stats['by_category'] = dict(cursor.fetchall())
                
                # Documents by source
                cursor = conn.execute('''
                    SELECT source, COUNT(*) 
                    FROM documents 
                    GROUP BY source
                ''')
                stats['by_source'] = dict(cursor.fetchall())
                
                # Quality distribution
                cursor = conn.execute('''
                    SELECT 
                        CASE 
                            WHEN quality_score >= 80 THEN 'عالی'
                            WHEN quality_score >= 60 THEN 'خوب'
                            WHEN quality_score >= 40 THEN 'متوسط'
                            ELSE 'ضعیف'
                        END as quality_grade,
                        COUNT(*)
                    FROM documents 
                    GROUP BY quality_grade
                ''')
                stats['quality_distribution'] = dict(cursor.fetchall())
                
                # Average scores
                cursor = conn.execute('''
                    SELECT 
                        AVG(quality_score) as avg_quality,
                        AVG(readability_score) as avg_readability,
                        AVG(complexity_score) as avg_complexity,
                        AVG(processing_time) as avg_processing_time
                    FROM documents
                ''')
                averages = cursor.fetchone()
                stats['averages'] = {
                    'quality': round(averages[0] or 0, 2),
                    'readability': round(averages[1] or 0, 2),
                    'complexity': round(averages[2] or 0, 2),
                    'processing_time': round(averages[3] or 0, 2)
                }
                
                return stats
                
        except Exception as e:
            logger.error(f"Statistics error: {e}")
            return {}

    def get_system_health(self) -> Dict[str, Any]:
        """بررسی سلامت کلی سیستم"""
        try:
            health = {
                'overall_status': 'healthy',
                'components': {},
                'recommendations': [],
                'timestamp': datetime.now().isoformat()
            }
            
            # DNS health
            dns_status = self.dns_manager.get_status()
            health['components']['dns'] = {
                'status': 'healthy' if dns_status['doh_available'] else 'warning',
                'details': dns_status
            }
            
            # Proxy health
            proxy_stats = self.proxy_manager.get_proxy_dashboard_data()
            proxy_health = 'healthy' if proxy_stats.get('success_rate', 0) > 30 else 'warning'
            health['components']['proxy'] = {
                'status': proxy_health,
                'details': proxy_stats
            }
            
            # Cache health
            cache_health = self.cache_system.get_cache_health()
            health['components']['cache'] = cache_health
            
            # AI health
            ai_status = self.ai_classifier.get_model_status()
            health['components']['ai'] = {
                'status': 'healthy' if ai_status['is_ready'] else 'warning',
                'details': ai_status
            }
            
            # Determine overall status
            component_statuses = [comp['status'] for comp in health['components'].values()]
            if 'error' in component_statuses:
                health['overall_status'] = 'error'
            elif 'warning' in component_statuses:
                health['overall_status'] = 'warning'
            
            return health
            
        except Exception as e:
            logger.error(f"Health check error: {e}")
            return {'overall_status': 'error', 'error': str(e)}

    def _is_valid_url(self, url: str) -> bool:
        """بررسی معتبر بودن URL"""
        try:
            from urllib.parse import urlparse
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False

    def _create_error_result(self, url: str, error_message: str) -> Dict[str, Any]:
        """ایجاد نتیجه خطا"""
        return {
            "url": url,
            "status": "error",
            "error": error_message,
            "title": "",
            "content": "",
            "quality_score": 0.0,
            "classification": "خطا",
            "processing_time": 0.0,
            "timestamp": datetime.now().isoformat(),
            "from_cache": False
        }

    def get_session_statistics(self) -> Dict[str, Any]:
        """دریافت آمار session جاری"""
        uptime = time.time() - self.session_stats['session_start']
        
        return {
            **self.session_stats,
            'uptime_seconds': uptime,
            'success_rate': (self.session_stats['successful_requests'] / 
                           max(self.session_stats['total_requests'], 1)) * 100,
            'cache_hit_rate': (self.session_stats['cache_hits'] / 
                             max(self.session_stats['total_requests'], 1)) * 100,
            'average_processing_time': (self.session_stats['total_processing_time'] / 
                                      max(self.session_stats['successful_requests'], 1))
        }

    def cleanup_and_optimize(self):
        """تمیزکاری و بهینه‌سازی سیستم"""
        try:
            # Optimize cache
            self.cache_system.optimize_cache()
            
            # Optimize main database
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('VACUUM')
                conn.execute('ANALYZE')
            
            logger.info("✅ System cleanup and optimization completed")
            
        except Exception as e:
            logger.error(f"Cleanup error: {e}")

    def export_data(self, format: str, output_path: str, filters: Dict = None):
        """صادرات داده‌ها"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Build query based on filters
                where_conditions = []
                params = []
                
                if filters:
                    if filters.get('category'):
                        where_conditions.append('classification = ?')
                        params.append(filters['category'])
                    
                    if filters.get('min_quality'):
                        where_conditions.append('quality_score >= ?')
                        params.append(filters['min_quality'])
                    
                    if filters.get('source'):
                        where_conditions.append('source = ?')
                        params.append(filters['source'])
                
                where_clause = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""
                
                sql = f'''
                    SELECT url, title, source, classification, quality_score, 
                           word_count, scraped_at, content
                    FROM documents 
                    {where_clause}
                    ORDER BY quality_score DESC
                '''
                
                if format.lower() == 'json':
                    import json
                    cursor = conn.execute(sql, params)
                    rows = cursor.fetchall()
                    
                    data = []
                    for row in rows:
                        data.append({
                            'url': row[0],
                            'title': row[1],
                            'source': row[2],
                            'classification': row[3],
                            'quality_score': row[4],
                            'word_count': row[5],
                            'scraped_at': row[6],
                            'content': row[7]
                        })
                    
                    with open(output_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                
                elif format.lower() == 'csv':
                    import pandas as pd
                    df = pd.read_sql_query(sql, conn, params=params)
                    df.to_csv(output_path, index=False, encoding='utf-8')
                
                logger.info(f"✅ Data exported to {output_path}")
                
        except Exception as e:
            logger.error(f"Export error: {e}")
            raise