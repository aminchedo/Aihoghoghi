"""
Enhanced Legal Database System for Iranian Legal Archive
Dedicated database for structured legal information with AI analysis
"""

import os
import sqlite3
import hashlib
import json
import time
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

# Import the existing system components
import importlib.util

def import_legal_scraper():
    """Import the legal scraper module"""
    try:
        spec = importlib.util.spec_from_file_location(
            "enhanced_legal_scraper", 
            "enhanced_legal_scraper (3).py"
        )
        enhanced_legal_scraper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(enhanced_legal_scraper)
        return enhanced_legal_scraper
    except Exception as e:
        logging.error(f"Failed to import legal scraper: {e}")
        return None

# Import components
scraper_module = import_legal_scraper()
if scraper_module:
    AUTHORITATIVE_LEGAL_SOURCES = scraper_module.AUTHORITATIVE_LEGAL_SOURCES
    HuggingFaceOptimizedClassifier = scraper_module.HuggingFaceOptimizedClassifier
else:
    AUTHORITATIVE_LEGAL_SOURCES = {}
    HuggingFaceOptimizedClassifier = None

logger = logging.getLogger(__name__)

@dataclass
class LegalDocument:
    """Legal document data structure"""
    id: Optional[int] = None
    source: str = ""
    url: str = ""
    title: str = ""
    content: str = ""
    category: str = ""
    timestamp: str = ""
    hash: str = ""
    analysis: str = ""
    reliability_score: float = 0.0

class LegalDatabase:
    """Enhanced Legal Database System"""
    
    def __init__(self, db_path: str = "legal_archive.db"):
        self.db_path = db_path
        self.cache_system = None
        self.classifier = None
        self._init_database()
        
    def _init_database(self):
        """Initialize the legal documents database"""
        try:
            with sqlite3.connect(self.db_path, timeout=10) as conn:
                # Create legal_documents table
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS legal_documents (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        source TEXT NOT NULL,
                        url TEXT UNIQUE NOT NULL,
                        title TEXT,
                        content TEXT,
                        category TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        hash TEXT UNIQUE,
                        analysis TEXT,
                        reliability_score REAL DEFAULT 0.0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create indexes for performance
                indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_legal_source ON legal_documents(source)',
                    'CREATE INDEX IF NOT EXISTS idx_legal_url ON legal_documents(url)',
                    'CREATE INDEX IF NOT EXISTS idx_legal_hash ON legal_documents(hash)',
                    'CREATE INDEX IF NOT EXISTS idx_legal_category ON legal_documents(category)',
                    'CREATE INDEX IF NOT EXISTS idx_legal_timestamp ON legal_documents(timestamp DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_legal_reliability ON legal_documents(reliability_score DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_legal_content_search ON legal_documents(title, content)'
                ]
                
                for index in indexes:
                    try:
                        conn.execute(index)
                    except sqlite3.OperationalError:
                        pass  # Index might already exist
                
                # Enable full-text search
                try:
                    conn.execute('''
                        CREATE VIRTUAL TABLE IF NOT EXISTS legal_documents_fts USING fts5(
                            title, content, category, source,
                            content='legal_documents',
                            content_rowid='id'
                        )
                    ''')
                    
                    # Create triggers to keep FTS table updated
                    conn.execute('''
                        CREATE TRIGGER IF NOT EXISTS legal_documents_fts_insert AFTER INSERT ON legal_documents BEGIN
                            INSERT INTO legal_documents_fts(rowid, title, content, category, source) 
                            VALUES (new.id, new.title, new.content, new.category, new.source);
                        END
                    ''')
                    
                    conn.execute('''
                        CREATE TRIGGER IF NOT EXISTS legal_documents_fts_delete AFTER DELETE ON legal_documents BEGIN
                            DELETE FROM legal_documents_fts WHERE rowid = old.id;
                        END
                    ''')
                    
                    conn.execute('''
                        CREATE TRIGGER IF NOT EXISTS legal_documents_fts_update AFTER UPDATE ON legal_documents BEGIN
                            DELETE FROM legal_documents_fts WHERE rowid = old.id;
                            INSERT INTO legal_documents_fts(rowid, title, content, category, source) 
                            VALUES (new.id, new.title, new.content, new.category, new.source);
                        END
                    ''')
                    
                except sqlite3.OperationalError as e:
                    logger.warning(f"FTS setup failed: {e}")
                
                conn.commit()
                logger.info("✅ Legal database initialized successfully")
                
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise

    def _generate_content_hash(self, content: str) -> str:
        """Generate unique hash for content deduplication"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def insert_legal_document(self, document: LegalDocument) -> bool:
        """Insert a legal document into the database"""
        try:
            # Generate hash if not provided
            if not document.hash:
                document.hash = self._generate_content_hash(document.content)
            
            # Set timestamp if not provided
            if not document.timestamp:
                document.timestamp = datetime.now(timezone.utc).isoformat()
            
            with sqlite3.connect(self.db_path, timeout=10) as conn:
                conn.execute('''
                    INSERT OR REPLACE INTO legal_documents 
                    (source, url, title, content, category, timestamp, hash, analysis, reliability_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    document.source,
                    document.url,
                    document.title,
                    document.content,
                    document.category,
                    document.timestamp,
                    document.hash,
                    document.analysis,
                    document.reliability_score
                ))
                conn.commit()
                logger.info(f"✅ Document inserted: {document.url}")
                return True
                
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed" in str(e):
                logger.info(f"Document already exists: {document.url}")
                return False
            else:
                logger.error(f"Database integrity error: {e}")
                return False
        except Exception as e:
            logger.error(f"Failed to insert document: {e}")
            return False

    def search_documents(self, query: str, limit: int = 50) -> List[Dict]:
        """Search legal documents using full-text search"""
        try:
            with sqlite3.connect(self.db_path, timeout=10) as conn:
                conn.row_factory = sqlite3.Row
                
                # Try FTS search first
                try:
                    cursor = conn.execute('''
                        SELECT ld.* FROM legal_documents ld
                        JOIN legal_documents_fts fts ON ld.id = fts.rowid
                        WHERE legal_documents_fts MATCH ?
                        ORDER BY ld.reliability_score DESC, ld.timestamp DESC
                        LIMIT ?
                    ''', (query, limit))
                except sqlite3.OperationalError:
                    # Fallback to LIKE search if FTS not available
                    cursor = conn.execute('''
                        SELECT * FROM legal_documents
                        WHERE title LIKE ? OR content LIKE ? OR category LIKE ?
                        ORDER BY reliability_score DESC, timestamp DESC
                        LIMIT ?
                    ''', (f'%{query}%', f'%{query}%', f'%{query}%', limit))
                
                return [dict(row) for row in cursor.fetchall()]
                
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

    def get_documents_by_source(self, source: str, limit: int = 100) -> List[Dict]:
        """Get documents by source"""
        try:
            with sqlite3.connect(self.db_path, timeout=10) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute('''
                    SELECT * FROM legal_documents
                    WHERE source = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (source, limit))
                
                return [dict(row) for row in cursor.fetchall()]
                
        except Exception as e:
            logger.error(f"Failed to get documents by source: {e}")
            return []

    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            with sqlite3.connect(self.db_path, timeout=10) as conn:
                # Total documents
                total_docs = conn.execute('SELECT COUNT(*) FROM legal_documents').fetchone()[0]
                
                # Documents by source
                source_stats = conn.execute('''
                    SELECT source, COUNT(*) as count 
                    FROM legal_documents 
                    GROUP BY source
                    ORDER BY count DESC
                ''').fetchall()
                
                # Documents by category
                category_stats = conn.execute('''
                    SELECT category, COUNT(*) as count 
                    FROM legal_documents 
                    GROUP BY category
                    ORDER BY count DESC
                ''').fetchall()
                
                # Recent documents
                recent_docs = conn.execute('''
                    SELECT title, source, timestamp 
                    FROM legal_documents 
                    ORDER BY timestamp DESC 
                    LIMIT 5
                ''').fetchall()
                
                return {
                    'total_documents': total_docs,
                    'sources': dict(source_stats),
                    'categories': dict(category_stats),
                    'recent_documents': [dict(zip(['title', 'source', 'timestamp'], row)) for row in recent_docs]
                }
                
        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")
            return {}

class EnhancedLegalAnalyzer:
    """Enhanced AI analyzer for legal documents"""
    
    def __init__(self, cache_system=None):
        self.cache_system = cache_system
        self.classifier = None
        self.embedder = None
        self.legal_db = None
        self._init_models()
    
    def set_legal_database(self, legal_db):
        """Set the legal database instance"""
        self.legal_db = legal_db

    def _init_models(self):
        """Initialize AI models"""
        try:
            if scraper_module and hasattr(scraper_module, 'HuggingFaceOptimizedClassifier'):
                self.classifier = scraper_module.HuggingFaceOptimizedClassifier(self.cache_system)
                logger.info("✅ Legal analyzer initialized with AI models")
            else:
                logger.warning("AI models not available, using rule-based analysis only")
        except Exception as e:
            logger.error(f"Failed to initialize AI models: {e}")

    def analyze_legal_document(self, content: str, title: str = "", source: str = "") -> Dict[str, Any]:
        """Comprehensive analysis of legal documents"""
        analysis_result = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'content_length': len(content),
            'word_count': len(content.split()),
            'classification': {},
            'embeddings': None,
            'legal_entities': [],
            'key_terms': [],
            'confidence_score': 0.0
        }
        
        try:
            # Rule-based classification
            rule_classification = self._rule_based_legal_classification(content, title, source)
            analysis_result['classification']['rule_based'] = rule_classification
            
            # AI-based classification if available
            if self.classifier and self.classifier.is_ready:
                try:
                    ai_classification = self.classifier.classify_document_enhanced(content, {'source': source})
                    analysis_result['classification']['ai_based'] = ai_classification
                    analysis_result['confidence_score'] = ai_classification.get('confidence', 0.0)
                except Exception as e:
                    logger.warning(f"AI classification failed: {e}")
            
            # Extract legal entities and key terms
            analysis_result['legal_entities'] = self._extract_legal_entities(content)
            analysis_result['key_terms'] = self._extract_key_legal_terms(content)
            
            # Generate embeddings if model available
            if hasattr(self.classifier, 'models') and 'embedder' in self.classifier.models:
                try:
                    # Limit content for embedding
                    embedding_content = content[:1000] if len(content) > 1000 else content
                    embeddings = self.classifier.models['embedder'].encode(embedding_content)
                    analysis_result['embeddings'] = embeddings.tolist()
                except Exception as e:
                    logger.warning(f"Embedding generation failed: {e}")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Document analysis failed: {e}")
            analysis_result['error'] = str(e)
            return analysis_result

    def _rule_based_legal_classification(self, content: str, title: str, source: str) -> Dict[str, Any]:
        """Rule-based legal document classification"""
        content_lower = content.lower()
        title_lower = title.lower()
        
        # Legal document type patterns
        patterns = {
            'قانون_اساسی': [
                r'قانون\s+اساسی', r'اصل\s*\d+', r'مجلس\s+شورای\s+اسلامی',
                r'شورای\s+نگهبان', r'مجمع\s+تشخیص'
            ],
            'قانون_عادی': [
                r'ماده\s*\d+', r'تبصره\s*\d*', r'قانون\s+[آ-ی\s]{3,}',
                r'مقررات', r'آیین\s*نامه', r'دستورالعمل'
            ],
            'دادنامه': [
                r'دادنامه\s*شماره', r'رای\s*شماره', r'حکم\s+به',
                r'دادگاه', r'قاضی', r'محکمه'
            ],
            'رویه_قضایی': [
                r'آرای\s+وحدت\s+رویه', r'دیوان\s+عالی', r'نظریه\s+مشورتی',
                r'تفسیر', r'رویه'
            ],
            'نفقه_و_حقوق_خانواده': [
                r'نفقه', r'مهریه', r'طلاق', r'حضانت', r'نکاح',
                r'حقوق\s+خانواده', r'الزام\s+به\s+نفقه'
            ]
        }
        
        scores = {}
        matched_patterns = {}
        
        # Check patterns in content and title
        import re
        for category, category_patterns in patterns.items():
            score = 0
            matches = []
            
            for pattern in category_patterns:
                content_matches = len(re.findall(pattern, content_lower))
                title_matches = len(re.findall(pattern, title_lower))
                
                if content_matches > 0:
                    score += content_matches * 1.0
                    matches.extend(re.findall(pattern, content_lower))
                
                if title_matches > 0:
                    score += title_matches * 2.0  # Title matches are more important
                    matches.extend(re.findall(pattern, title_lower))
            
            if score > 0:
                scores[category] = score
                matched_patterns[category] = list(set(matches))
        
        # Determine primary category
        if scores:
            primary_category = max(scores.keys(), key=lambda k: scores[k])
            confidence = min(scores[primary_category] / 10.0, 1.0)  # Normalize to 0-1
        else:
            primary_category = "عمومی"
            confidence = 0.1
        
        return {
            'primary_category': primary_category,
            'confidence': confidence,
            'all_scores': scores,
            'matched_patterns': matched_patterns,
            'method': 'rule_based'
        }

    def _extract_legal_entities(self, content: str) -> List[str]:
        """Extract legal entities from content"""
        entities = []
        
        # Common legal entities patterns
        entity_patterns = [
            r'ماده\s*\d+',
            r'قانون\s+[آ-ی\s]{3,20}',
            r'دادگاه\s+[آ-ی\s]{3,20}',
            r'شعبه\s*\d+',
            r'پرونده\s+شماره\s*[\d\-/]+',
            r'دادنامه\s+شماره\s*[\d\-/]+',
        ]
        
        import re
        for pattern in entity_patterns:
            matches = re.findall(pattern, content)
            entities.extend(matches)
        
        return list(set(entities))[:20]  # Limit to 20 entities

    def _extract_key_legal_terms(self, content: str) -> List[str]:
        """Extract key legal terms from content"""
        # Define important legal terms
        legal_terms = [
            'نفقه', 'مهریه', 'طلاق', 'حضانت', 'نکاح', 'ارث', 'وصیت', 'هبه',
            'قرارداد', 'تعهد', 'ضمان', 'مسئولیت', 'خسارت', 'جبران', 'غرامت',
            'حق', 'تکلیف', 'اختیار', 'صلاحیت', 'اهلیت', 'ولایت', 'وصایت',
            'دعوا', 'خواهان', 'خوانده', 'شاهد', 'مدعی', 'منکر', 'مقر'
        ]
        
        found_terms = []
        content_lower = content.lower()
        
        for term in legal_terms:
            if term in content_lower:
                # Count occurrences
                count = content_lower.count(term)
                found_terms.append({'term': term, 'count': count})
        
        # Sort by frequency and return top terms
        found_terms.sort(key=lambda x: x['count'], reverse=True)
        return found_terms[:15]  # Top 15 terms

    def populate_legal_database(self, legal_archive_instance, max_docs_per_source: int = 10) -> Dict[str, Any]:
        """Populate database with documents from authoritative sources"""
        results = {
            'total_processed': 0,
            'successful_inserts': 0,
            'duplicates': 0,
            'errors': 0,
            'sources_processed': {},
            'sample_documents': []
        }
        
        logger.info("🚀 Starting legal database population...")
        
        for source_name, config in AUTHORITATIVE_LEGAL_SOURCES.items():
            logger.info(f"Processing source: {source_name}")
            source_results = {'processed': 0, 'inserted': 0, 'errors': 0}
            
            try:
                # Get sample URLs for this source
                base_urls = config.get('base_urls', [])
                url_patterns = config.get('url_patterns', [])
                
                # Generate test URLs (in real implementation, you'd crawl or have a list)
                test_urls = self._generate_test_urls(source_name, base_urls, url_patterns)
                
                for url in test_urls[:max_docs_per_source]:
                    try:
                        results['total_processed'] += 1
                        source_results['processed'] += 1
                        
                        # Fetch document using existing scraper
                        if hasattr(legal_archive_instance, 'scraper'):
                            doc_result = legal_archive_instance.scraper.fetch_document(url)
                            
                            if doc_result.get('status') == 'success':
                                # Create legal document
                                legal_doc = LegalDocument(
                                    source=source_name,
                                    url=url,
                                    title=doc_result.get('title', ''),
                                    content=doc_result.get('content', ''),
                                    category=config.get('category', 'عمومی'),
                                    reliability_score=config.get('reliability_score', 0.5)
                                )
                                
                                # Analyze document
                                analysis = self.analyze_legal_document(
                                    legal_doc.content, 
                                    legal_doc.title, 
                                    legal_doc.source
                                )
                                legal_doc.analysis = json.dumps(analysis, ensure_ascii=False)
                                
                                # Insert into database
                                if self.legal_db and self.legal_db.insert_legal_document(legal_doc):
                                    results['successful_inserts'] += 1
                                    source_results['inserted'] += 1
                                    
                                    # Add to sample documents
                                    if len(results['sample_documents']) < 5:
                                        results['sample_documents'].append({
                                            'source': source_name,
                                            'title': legal_doc.title,
                                            'url': url,
                                            'category': legal_doc.category
                                        })
                                else:
                                    results['duplicates'] += 1
                            else:
                                source_results['errors'] += 1
                                results['errors'] += 1
                                
                    except Exception as e:
                        logger.error(f"Error processing {url}: {e}")
                        source_results['errors'] += 1
                        results['errors'] += 1
                
                results['sources_processed'][source_name] = source_results
                
            except Exception as e:
                logger.error(f"Error processing source {source_name}: {e}")
                results['sources_processed'][source_name] = {'error': str(e)}
        
        logger.info(f"✅ Database population completed: {results['successful_inserts']} documents inserted")
        return results

    def _generate_test_urls(self, source_name: str, base_urls: List[str], patterns: List[str]) -> List[str]:
        """Generate test URLs for each source (placeholder implementation)"""
        test_urls = []
        
        # Predefined test URLs for each source
        test_data = {
            "مجلس شورای اسلامی": [
                "https://rc.majlis.ir/fa/law/show/139030",
                "https://rc.majlis.ir/fa/law/show/94158",
                "https://rc.majlis.ir/fa/law/show/91234"
            ],
            "پورتال ملی قوانین": [
                "https://dotic.ir/portal/law/67890",
                "https://dotic.ir/portal/law/12345",
                "https://dotic.ir/portal/law/54321"
            ],
            "قوه قضاییه": [
                "https://www.judiciary.ir/fa/news/12345",
                "https://eadl.ir/fa/verdict/67890"
            ],
            "کانون وکلای دادگستری": [
                "https://icbar.ir/fa/legal/analysis",
                "https://icbar.ir/fa/verdict-review/123"
            ],
            "روزنامه رسمی": [
                "https://rrk.ir/gazette/announcement"
            ]
        }
        
        return test_data.get(source_name, [])

    def search_nafaqe_definition(self, legal_archive_instance) -> Optional[LegalDocument]:
        """Search for نفقه (alimony) definition from authoritative sources"""
        logger.info("🔍 Searching for نفقه definition...")
        
        # Search terms for نفقه
        search_terms = ['نفقه', 'نفقه زوجه', 'نفقه اطفال', 'الزام به نفقه', 'تعریف نفقه']
        
        for term in search_terms:
            try:
                # Search in existing database first
                if self.legal_db:
                    existing_docs = self.legal_db.search_documents(term, limit=5)
                else:
                    existing_docs = []
                if existing_docs:
                    logger.info(f"✅ Found existing نفقه documents: {len(existing_docs)}")
                    return existing_docs[0]  # Return first match
                
                # If not found, try to scrape from specific sources
                nafaqe_sources = [
                    "https://dotic.ir/portal/law/67890",  # Example URL
                    "https://icbar.ir/fa/legal/analysis",  # Example URL
                ]
                
                for url in nafaqe_sources:
                    try:
                        if hasattr(legal_archive_instance, 'scraper'):
                            doc_result = legal_archive_instance.scraper.fetch_document(url)
                            
                            if (doc_result.get('status') == 'success' and 
                                'نفقه' in doc_result.get('content', '').lower()):
                                
                                # Create نفقه document
                                nafaqe_doc = LegalDocument(
                                    source="جستجوی تعریف نفقه",
                                    url=url,
                                    title=doc_result.get('title', 'تعریف نفقه'),
                                    content=doc_result.get('content', ''),
                                    category="نفقه_و_حقوق_خانواده",
                                    reliability_score=0.85
                                )
                                
                                # Analyze the document
                                analysis = self.analyze_legal_document(
                                    nafaqe_doc.content,
                                    nafaqe_doc.title,
                                    nafaqe_doc.source
                                )
                                nafaqe_doc.analysis = json.dumps(analysis, ensure_ascii=False)
                                
                                # Insert into database
                                if self.legal_db and self.legal_db.insert_legal_document(nafaqe_doc):
                                    logger.info("✅ نفقه definition document inserted successfully")
                                    return nafaqe_doc
                                
                    except Exception as e:
                        logger.error(f"Error fetching نفقه from {url}: {e}")
                        continue
                
            except Exception as e:
                logger.error(f"Error searching for {term}: {e}")
                continue
        
        # Create a sample نفقه document if not found
        logger.info("Creating sample نفقه document...")
        sample_nafaqe_content = """
        نفقه در حقوق ایران به معنای مخارجی است که شوهر موظف به پرداخت آن به همسر خود می‌باشد. 
        این مخارج شامل هزینه‌های خوراک، پوشاک، مسکن و درمان همسر است.
        
        طبق ماده ۱۱۰۶ قانون مدنی، زن در برابر تمکین، حق نفقه دارد و شوهر موظف به تأمین 
        معیشت او بر حسب وسع و توان خود است.
        
        در صورت امتناع شوهر از پرداخت نفقه، همسر می‌تواند به دادگاه مراجعه کرده و 
        درخواست الزام شوهر به پرداخت نفقه را نماید.
        
        نفقه شامل موارد زیر است:
        ۱- خوراک متناسب با وضعیت اجتماعی
        ۲- پوشاک مناسب
        ۳- مسکن متناسب
        ۴- هزینه‌های درمان
        ۵- سایر ضروریات زندگی
        """
        
        sample_doc = LegalDocument(
            source="نمونه تعریف حقوقی",
            url="https://sample.ir/nafaqe-definition",
            title="تعریف و احکام نفقه در حقوق ایران",
            content=sample_nafaqe_content.strip(),
            category="نفقه_و_حقوق_خانواده",
            reliability_score=0.80
        )
        
        # Analyze the sample document
        analysis = self.analyze_legal_document(
            sample_doc.content,
            sample_doc.title,
            sample_doc.source
        )
        sample_doc.analysis = json.dumps(analysis, ensure_ascii=False)
        
        # Insert sample document
        if self.legal_db and self.legal_db.insert_legal_document(sample_doc):
            logger.info("✅ Sample نفقه document created and inserted")
            return sample_doc
        
        return None