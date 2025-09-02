#!/usr/bin/env python3
"""
Database Operations Module for Iranian Legal Archive System
SQLite database management with real data persistence
"""

import sqlite3
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import os

logger = logging.getLogger(__name__)

class LegalArchiveDatabase:
    def __init__(self, db_path: str = "/workspace/real_legal_archive.db"):
        """Initialize database connection and setup"""
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database schema"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Main documents table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS scraped_documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT NOT NULL,
                    title TEXT,
                    content TEXT,
                    category TEXT,
                    source_site TEXT,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT FALSE,
                    content_hash TEXT,
                    metadata TEXT
                )
            ''')
            
            # AI analysis results table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ai_analysis (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    document_id INTEGER,
                    analysis_result TEXT,
                    confidence REAL,
                    primary_category TEXT,
                    categories TEXT,
                    entities TEXT,
                    keywords TEXT,
                    summary TEXT,
                    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (document_id) REFERENCES scraped_documents (id)
                )
            ''')
            
            # System statistics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    operation_type TEXT,
                    success_count INTEGER,
                    error_count INTEGER,
                    avg_response_time REAL,
                    total_documents INTEGER,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Performance metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_name TEXT,
                    metric_value REAL,
                    unit TEXT,
                    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # User activity log
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS activity_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action TEXT,
                    details TEXT,
                    status TEXT,
                    execution_time REAL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create indexes for better performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_documents_category ON scraped_documents(category)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_documents_processed ON scraped_documents(processed)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_analysis_document ON ai_analysis(document_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp)')
            
            conn.commit()
            conn.close()
            
            logger.info("✅ Database schema initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Database initialization error: {e}")
            raise
    
    def store_scraped_document(self, url: str, title: str, content: str, 
                             source_site: str = None, metadata: Dict = None) -> int:
        """Store a scraped document and return its ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Generate content hash for deduplication
            content_hash = str(hash(content))
            
            # Check if document already exists
            cursor.execute("SELECT id FROM scraped_documents WHERE content_hash = ?", (content_hash,))
            existing = cursor.fetchone()
            
            if existing:
                logger.info(f"📄 Document already exists (ID: {existing[0]})")
                conn.close()
                return existing[0]
            
            # Insert new document
            cursor.execute('''
                INSERT INTO scraped_documents (url, title, content, source_site, content_hash, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                url,
                title,
                content,
                source_site,
                content_hash,
                json.dumps(metadata, ensure_ascii=False) if metadata else None
            ))
            
            doc_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"💾 Stored document ID: {doc_id}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error storing document: {e}")
            raise
    
    def store_ai_analysis(self, document_id: int, analysis_result: Dict[str, Any]) -> int:
        """Store AI analysis results"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO ai_analysis (
                    document_id, analysis_result, confidence, primary_category,
                    categories, entities, keywords, summary
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                document_id,
                json.dumps(analysis_result, ensure_ascii=False),
                analysis_result.get('confidence', 0.0),
                analysis_result.get('primary_category'),
                json.dumps(analysis_result.get('categories', []), ensure_ascii=False),
                json.dumps(analysis_result.get('entities', {}), ensure_ascii=False),
                json.dumps(analysis_result.get('keywords_found', {}), ensure_ascii=False),
                analysis_result.get('summary')
            ))
            
            analysis_id = cursor.lastrowid
            
            # Update document as processed
            cursor.execute("UPDATE scraped_documents SET processed = TRUE WHERE id = ?", (document_id,))
            
            conn.commit()
            conn.close()
            
            logger.info(f"🧠 Stored AI analysis ID: {analysis_id}")
            return analysis_id
            
        except Exception as e:
            logger.error(f"Error storing AI analysis: {e}")
            raise
    
    def get_unprocessed_documents(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get unprocessed documents for AI analysis"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, url, title, content, scraped_at
                FROM scraped_documents 
                WHERE processed = FALSE 
                ORDER BY scraped_at DESC
                LIMIT ?
            """, (limit,))
            
            documents = []
            for row in cursor.fetchall():
                documents.append({
                    'id': row[0],
                    'url': row[1],
                    'title': row[2],
                    'content': row[3],
                    'scraped_at': row[4]
                })
            
            conn.close()
            return documents
            
        except Exception as e:
            logger.error(f"Error getting unprocessed documents: {e}")
            return []
    
    def get_system_statistics(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Document statistics
            cursor.execute("SELECT COUNT(*) FROM scraped_documents")
            total_docs = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM scraped_documents WHERE processed = TRUE")
            processed_docs = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM ai_analysis")
            analyzed_docs = cursor.fetchone()[0]
            
            # Category distribution
            cursor.execute("""
                SELECT category, COUNT(*) 
                FROM scraped_documents 
                WHERE category IS NOT NULL 
                GROUP BY category
            """)
            category_dist = dict(cursor.fetchall())
            
            # Recent activities
            cursor.execute("""
                SELECT action, status, timestamp, execution_time
                FROM activity_log 
                ORDER BY timestamp DESC 
                LIMIT 10
            """)
            recent_activities = [
                {
                    'action': row[0],
                    'status': row[1],
                    'timestamp': row[2],
                    'execution_time': row[3]
                }
                for row in cursor.fetchall()
            ]
            
            # Performance metrics
            cursor.execute("""
                SELECT AVG(confidence) as avg_confidence
                FROM ai_analysis
                WHERE confidence > 0
            """)
            avg_confidence = cursor.fetchone()[0] or 0.0
            
            conn.close()
            
            success_rate = int((processed_docs / max(total_docs, 1)) * 100)
            
            return {
                'total_documents': total_docs,
                'processed_documents': processed_docs,
                'analyzed_documents': analyzed_docs,
                'success_rate': f"{success_rate}%",
                'category_distribution': category_dist,
                'recent_activities': recent_activities,
                'performance_metrics': {
                    'average_confidence': round(avg_confidence, 3),
                    'processing_rate': f"{processed_docs}/{total_docs}",
                    'analysis_accuracy': f"{int(avg_confidence * 100)}%"
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def log_activity(self, action: str, details: str = None, status: str = "completed", 
                    execution_time: float = 0.0):
        """Log system activity"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO activity_log (action, details, status, execution_time)
                VALUES (?, ?, ?, ?)
            ''', (action, details, status, execution_time))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error logging activity: {e}")
    
    def update_performance_metric(self, metric_name: str, metric_value: float, unit: str = ""):
        """Update performance metrics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO performance_metrics (metric_name, metric_value, unit)
                VALUES (?, ?, ?)
            ''', (metric_name, metric_value, unit))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error updating performance metric: {e}")
    
    def cleanup_old_data(self, days: int = 30):
        """Clean up old data to maintain performance"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Clean old activity logs
            cursor.execute("""
                DELETE FROM activity_log 
                WHERE timestamp < datetime('now', '-{} days')
            """.format(days))
            
            # Clean old performance metrics
            cursor.execute("""
                DELETE FROM performance_metrics 
                WHERE recorded_at < datetime('now', '-{} days')
            """.format(days))
            
            deleted_rows = cursor.rowcount
            conn.commit()
            conn.close()
            
            logger.info(f"🧹 Cleaned up {deleted_rows} old records")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

# Global database instance
db = LegalArchiveDatabase()

if __name__ == "__main__":
    # Test database operations
    db = LegalArchiveDatabase()
    
    # Test storing a document
    doc_id = db.store_scraped_document(
        url="test://example.com",
        title="Test Document",
        content="This is a test legal document in Persian. دادگاه عالی کشور.",
        source_site="test_site"
    )
    
    print(f"Stored document with ID: {doc_id}")
    
    # Test getting statistics
    stats = db.get_system_statistics()
    print(json.dumps(stats, indent=2, ensure_ascii=False))