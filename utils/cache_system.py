"""
Ultra Intelligent Cache System for Iranian Legal Archive System
Provides in-memory LRU + SQLite persistent cache with TTL and priority-based management
"""

import time
import sqlite3
import pickle
import zlib
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)

# Enhanced paths
DATA_DIR = Path("/tmp/data")
CACHE_DB_PATH = DATA_DIR / "intelligent_cache.sqlite"
DATA_DIR.mkdir(parents=True, exist_ok=True)


class UltraIntelligentCacheSystem:
    """سیستم کش هوشمند پیشرفته"""
    
    def __init__(self, cache_db_path: str = str(CACHE_DB_PATH)):
        self.cache_db_path = cache_db_path
        self.memory_cache = {}
        self.access_count = {}
        self.hit_count = 0
        self.miss_count = 0
        self.total_requests = 0
        self.max_memory_items = 150  # Reduced for memory efficiency
        self.cleanup_interval = 1800  # 30 minutes
        self.last_cleanup = time.time()
        
        try:
            self._init_database()
        except Exception as e:
            logger.error(f"Cache initialization error: {e}")

    def _init_database(self):
        """ایجاد پایگاه داده کش"""
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS cache_entries (
                        key TEXT PRIMARY KEY,
                        value BLOB,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        access_count INTEGER DEFAULT 1,
                        ttl_seconds INTEGER DEFAULT 3600,
                        priority INTEGER DEFAULT 1,
                        size_bytes INTEGER DEFAULT 0,
                        category TEXT DEFAULT 'general',
                        source_reliability REAL DEFAULT 0.5,
                        compression_ratio REAL DEFAULT 1.0,
                        quality_score REAL DEFAULT 0.0
                    )
                ''')
                
                # Enhanced indexes
                indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_created_ttl ON cache_entries(created_at, ttl_seconds)',
                    'CREATE INDEX IF NOT EXISTS idx_priority_quality ON cache_entries(priority DESC, quality_score DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_category ON cache_entries(category)',
                    'CREATE INDEX IF NOT EXISTS idx_last_accessed ON cache_entries(last_accessed DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_access_count ON cache_entries(access_count DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_reliability ON cache_entries(source_reliability DESC)'
                ]
                
                for index in indexes:
                    conn.execute(index)
                
                conn.commit()
                logger.info("Enhanced cache database ready")
                
        except Exception as e:
            logger.error(f"Cache database creation error: {e}")
            raise

    def get(self, url: str, model_type: str = "general", extra_params: Dict = None) -> Optional[Dict]:
        """دریافت هوشمند از کش"""
        if not url:
            return None
            
        self.total_requests += 1
        key = self._generate_smart_key(url, model_type, extra_params)
        
        # Check memory cache first
        if key in self.memory_cache:
            self.access_count[key] = self.access_count.get(key, 0) + 1
            self.hit_count += 1
            return self.memory_cache[key]
        
        # Check database cache
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                cursor = conn.execute('''
                    SELECT value, created_at, ttl_seconds, source_reliability, quality_score
                    FROM cache_entries 
                    WHERE key = ?
                ''', (key,))
                
                row = cursor.fetchone()
                if row:
                    value_blob, created_at, ttl_seconds, reliability, quality = row
                    created_time = datetime.fromisoformat(created_at)
                    
                    # Dynamic TTL based on quality and reliability
                    ttl_multiplier = 1.0 + (reliability * 0.5) + (quality / 100 * 0.3)
                    effective_ttl = ttl_seconds * ttl_multiplier
                    
                    if datetime.now() - created_time < timedelta(seconds=effective_ttl):
                        # Update access info
                        conn.execute('''
                            UPDATE cache_entries 
                            SET access_count = access_count + 1, last_accessed = datetime('now')
                            WHERE key = ?
                        ''', (key,))
                        
                        # Decompress if needed
                        try:
                            value = pickle.loads(value_blob)
                        except:
                            # Try decompression
                            decompressed = zlib.decompress(value_blob)
                            value = pickle.loads(decompressed)
                        
                        self._add_to_memory_cache(key, value)
                        self.hit_count += 1
                        return value
                    else:
                        # Expired, remove
                        conn.execute('DELETE FROM cache_entries WHERE key = ?', (key,))
                        conn.commit()
                        
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}")
        
        self.miss_count += 1
        
        # Auto cleanup if needed
        if time.time() - self.last_cleanup > self.cleanup_interval:
            self._auto_cleanup()
        
        return None

    def set(self, url: str, value: Dict, model_type: str = "general", ttl_seconds: int = 3600,
            priority: int = 1, extra_params: Dict = None, source_reliability: float = 0.5):
        """ذخیره هوشمند در کش"""
        if not url or not value:
            return
            
        key = self._generate_smart_key(url, model_type, extra_params)
        
        # Calculate quality score
        quality_score = self._calculate_quality_score(value)
        
        # Determine category
        category = self._determine_category(url, value)
        
        try:
            # Serialize and compress
            serialized = pickle.dumps(value)
            original_size = len(serialized)
            
            # Compress if beneficial
            compressed = zlib.compress(serialized)
            compression_ratio = len(compressed) / original_size
            
            if compression_ratio < 0.8:  # Use compression if it saves >20%
                final_data = compressed
                use_compression = True
            else:
                final_data = serialized
                use_compression = False
            
            # Store in database
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                conn.execute('''
                    INSERT OR REPLACE INTO cache_entries 
                    (key, value, ttl_seconds, priority, size_bytes, category, 
                     source_reliability, compression_ratio, quality_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    key, final_data, ttl_seconds, priority, len(final_data),
                    category, source_reliability, compression_ratio, quality_score
                ))
                conn.commit()
            
            # Add to memory cache
            self._add_to_memory_cache(key, value)
            
        except Exception as e:
            logger.error(f"Cache storage error: {e}")

    def _generate_smart_key(self, url: str, model_type: str, extra_params: Dict = None) -> str:
        """تولید کلید هوشمند برای کش"""
        key_parts = [url, model_type]
        
        if extra_params:
            # Sort params for consistent keys
            sorted_params = sorted(extra_params.items())
            key_parts.append(str(sorted_params))
        
        key_string = '|'.join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()

    def _add_to_memory_cache(self, key: str, value: Dict):
        """افزودن به کش حافظه با مدیریت LRU"""
        if len(self.memory_cache) >= self.max_memory_items:
            # Remove least recently used
            lru_key = min(self.access_count.keys(), 
                         key=lambda k: self.access_count.get(k, 0))
            del self.memory_cache[lru_key]
            del self.access_count[lru_key]
        
        self.memory_cache[key] = value
        self.access_count[key] = self.access_count.get(key, 0) + 1

    def _calculate_quality_score(self, value: Dict) -> float:
        """محاسبه امتیاز کیفیت محتوا"""
        try:
            score = 0.0
            
            # Content length score
            content = value.get('content', '')
            if content:
                word_count = len(content.split())
                if 100 <= word_count <= 2000:
                    score += 30
                elif 50 <= word_count < 100:
                    score += 20
                elif word_count > 2000:
                    score += 10
            
            # Title presence
            if value.get('title'):
                score += 10
            
            # Classification confidence
            classification_info = value.get('classification_result', {})
            confidence = classification_info.get('confidence', 0)
            score += confidence * 20
            
            # Source reliability
            reliability = value.get('source_reliability', 0.5)
            score += reliability * 20
            
            # Processing success
            if value.get('status') == 'success':
                score += 10
            
            # Response time bonus (faster is better)
            response_time = value.get('response_time', 5.0)
            if response_time < 2.0:
                score += 10
            elif response_time < 5.0:
                score += 5
            
            return min(100.0, max(0.0, score))
            
        except Exception as e:
            logger.error(f"Error calculating quality score: {e}")
            return 50.0

    def _determine_category(self, url: str, value: Dict) -> str:
        """تعیین دسته‌بندی محتوا"""
        # Check classification result
        classification = value.get('classification_result', {})
        if classification.get('classification'):
            return classification['classification']
        
        # Check URL patterns
        if 'majlis.ir' in url:
            return 'قانون'
        elif 'judiciary.ir' in url or 'eadl.ir' in url:
            return 'دادنامه'
        elif 'dotic.ir' in url:
            return 'مقررات'
        elif 'rrk.ir' in url:
            return 'آگهی_قانونی'
        elif 'icbar.ir' in url:
            return 'رویه_قضایی'
        
        return 'عمومی'

    def _auto_cleanup(self):
        """تمیزکاری خودکار کش"""
        try:
            self.last_cleanup = time.time()
            
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                # Remove expired entries
                conn.execute('''
                    DELETE FROM cache_entries 
                    WHERE datetime(created_at, '+' || ttl_seconds || ' seconds') < datetime('now')
                ''')
                
                # Remove low-priority, old entries if cache is too large
                cursor = conn.execute('SELECT COUNT(*) FROM cache_entries')
                total_entries = cursor.fetchone()[0]
                
                if total_entries > 10000:  # Max cache size
                    conn.execute('''
                        DELETE FROM cache_entries 
                        WHERE key IN (
                            SELECT key FROM cache_entries 
                            ORDER BY priority ASC, quality_score ASC, last_accessed ASC 
                            LIMIT ?
                        )
                    ''', (total_entries - 8000,))
                
                conn.commit()
                
            # Clean memory cache
            if len(self.memory_cache) > self.max_memory_items:
                sorted_keys = sorted(self.access_count.keys(), 
                                   key=lambda k: self.access_count[k])
                for key in sorted_keys[:len(self.memory_cache) - self.max_memory_items]:
                    del self.memory_cache[key]
                    del self.access_count[key]
            
            logger.info("Cache cleanup completed")
            
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """دریافت آمار کش"""
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                # Total entries
                cursor = conn.execute('SELECT COUNT(*) FROM cache_entries')
                total_db_entries = cursor.fetchone()[0]
                
                # Total size
                cursor = conn.execute('SELECT SUM(size_bytes) FROM cache_entries')
                total_size = cursor.fetchone()[0] or 0
                
                # Category distribution
                cursor = conn.execute('''
                    SELECT category, COUNT(*) 
                    FROM cache_entries 
                    GROUP BY category
                ''')
                category_dist = dict(cursor.fetchall())
                
                # Average quality
                cursor = conn.execute('SELECT AVG(quality_score) FROM cache_entries')
                avg_quality = cursor.fetchone()[0] or 0
            
            hit_rate = (self.hit_count / max(self.total_requests, 1)) * 100
            
            return {
                'memory_cache_size': len(self.memory_cache),
                'database_cache_size': total_db_entries,
                'total_size_mb': total_size / (1024 * 1024),
                'hit_count': self.hit_count,
                'miss_count': self.miss_count,
                'hit_rate_percent': round(hit_rate, 2),
                'category_distribution': category_dist,
                'average_quality_score': round(avg_quality, 2),
                'last_cleanup': datetime.fromtimestamp(self.last_cleanup).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {'error': str(e)}

    def clear_cache(self, category: str = None, older_than_hours: int = None):
        """پاک‌سازی کش"""
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                if category and older_than_hours:
                    # Clear specific category older than specified hours
                    conn.execute('''
                        DELETE FROM cache_entries 
                        WHERE category = ? AND created_at < datetime('now', '-' || ? || ' hours')
                    ''', (category, older_than_hours))
                elif category:
                    # Clear specific category
                    conn.execute('DELETE FROM cache_entries WHERE category = ?', (category,))
                elif older_than_hours:
                    # Clear entries older than specified hours
                    conn.execute('''
                        DELETE FROM cache_entries 
                        WHERE created_at < datetime('now', '-' || ? || ' hours')
                    ''', (older_than_hours,))
                else:
                    # Clear all
                    conn.execute('DELETE FROM cache_entries')
                
                conn.commit()
            
            # Clear memory cache
            if not category and not older_than_hours:
                self.memory_cache.clear()
                self.access_count.clear()
                self.hit_count = 0
                self.miss_count = 0
                self.total_requests = 0
            
            logger.info(f"Cache cleared: category={category}, older_than_hours={older_than_hours}")
            
        except Exception as e:
            logger.error(f"Cache clear error: {e}")

    def optimize_cache(self):
        """بهینه‌سازی کش"""
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                # Vacuum database
                conn.execute('VACUUM')
                
                # Analyze for better query performance
                conn.execute('ANALYZE')
                
                # Update statistics
                conn.execute('UPDATE sqlite_stat1 SET stat = NULL')
                
            logger.info("Cache optimization completed")
            
        except Exception as e:
            logger.error(f"Cache optimization error: {e}")

    def export_cache_data(self, output_file: str, category: str = None):
        """صادرات داده‌های کش"""
        try:
            import json
            
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                if category:
                    cursor = conn.execute('''
                        SELECT key, created_at, category, quality_score, access_count
                        FROM cache_entries 
                        WHERE category = ?
                        ORDER BY quality_score DESC, access_count DESC
                    ''', (category,))
                else:
                    cursor = conn.execute('''
                        SELECT key, created_at, category, quality_score, access_count
                        FROM cache_entries 
                        ORDER BY quality_score DESC, access_count DESC
                    ''')
                
                data = []
                for row in cursor.fetchall():
                    data.append({
                        'key': row[0],
                        'created_at': row[1],
                        'category': row[2],
                        'quality_score': row[3],
                        'access_count': row[4]
                    })
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                logger.info(f"Cache data exported to {output_file}")
                
        except Exception as e:
            logger.error(f"Cache export error: {e}")

    def get_cache_health(self) -> Dict[str, Any]:
        """بررسی سلامت کش"""
        try:
            stats = self.get_stats()
            health = {
                'status': 'healthy',
                'issues': [],
                'recommendations': []
            }
            
            # Check hit rate
            hit_rate = stats.get('hit_rate_percent', 0)
            if hit_rate < 30:
                health['issues'].append('Low hit rate')
                health['recommendations'].append('Consider increasing TTL or cache size')
            
            # Check cache size
            size_mb = stats.get('total_size_mb', 0)
            if size_mb > 500:  # 500MB limit
                health['issues'].append('Cache size too large')
                health['recommendations'].append('Run cleanup or reduce TTL')
            
            # Check average quality
            avg_quality = stats.get('average_quality_score', 0)
            if avg_quality < 40:
                health['issues'].append('Low average content quality')
                health['recommendations'].append('Review content sources and extraction methods')
            
            if health['issues']:
                health['status'] = 'warning'
            
            return health
            
        except Exception as e:
            logger.error(f"Cache health check error: {e}")
            return {'status': 'error', 'error': str(e)}