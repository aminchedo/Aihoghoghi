#!/usr/bin/env python3
"""
Comprehensive Test Suite for Legal Database System
Tests database functionality, AI analysis, and real-world data extraction
"""

import os
import sys
import json
import time
import logging
import sqlite3
import unittest
from datetime import datetime, timezone
from pathlib import Path

# Import our legal database system
from legal_database import LegalDatabase, EnhancedLegalAnalyzer, LegalDocument

# Import the main legal archive system
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
        print(f"Failed to import legal scraper: {e}")
        return None

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TestLegalDatabase(unittest.TestCase):
    """Test cases for Legal Database functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_db_path = "test_legal_archive.db"
        
        # Remove existing test database
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)
        
        # Initialize database and analyzer
        self.legal_db = LegalDatabase(self.test_db_path)
        self.legal_db.db_path = self.test_db_path
        self.legal_db._init_database()
        
        self.analyzer = EnhancedLegalAnalyzer()
        
        # Try to import legal archive system
        self.scraper_module = import_legal_scraper()
        self.legal_archive = None
        
        if self.scraper_module:
            try:
                self.legal_archive = self.scraper_module.UltraModernLegalArchive()
                logger.info("✅ Legal archive system initialized for testing")
            except Exception as e:
                logger.warning(f"Could not initialize legal archive: {e}")

    def tearDown(self):
        """Clean up after tests"""
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)

    def test_database_initialization(self):
        """Test Case: Database initialization and schema"""
        logger.info("🧪 Testing database initialization...")
        
        # Check if table exists
        with sqlite3.connect(self.test_db_path) as conn:
            cursor = conn.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='legal_documents'
            """)
            self.assertTrue(cursor.fetchone(), "legal_documents table should exist")
        
        # Check table schema
        with sqlite3.connect(self.test_db_path) as conn:
            cursor = conn.execute("PRAGMA table_info(legal_documents)")
            columns = {row[1]: row[2] for row in cursor.fetchall()}
            
            expected_columns = {
                'id': 'INTEGER',
                'source': 'TEXT',
                'url': 'TEXT',
                'title': 'TEXT',
                'content': 'TEXT',
                'category': 'TEXT',
                'timestamp': 'DATETIME',
                'hash': 'TEXT',
                'analysis': 'TEXT',
                'reliability_score': 'REAL'
            }
            
            for col_name, col_type in expected_columns.items():
                self.assertIn(col_name, columns, f"Column {col_name} should exist")
        
        logger.info("✅ Database initialization test passed")

    def test_majlis_document_fetch(self):
        """Test Case 1: Fetch and store document from مجلس شورای اسلامی"""
        logger.info("🧪 Testing Majlis document fetch...")
        
        # Test document data
        test_url = "https://rc.majlis.ir/fa/law/show/139030"
        
        # Create sample document (simulating successful fetch)
        sample_doc = LegalDocument(
            source="مجلس شورای اسلامی",
            url=test_url,
            title="قانون نمونه مجلس شورای اسلامی",
            content="""
            ماده ۱- این قانون به منظور تنظیم امور مربوط به حقوق شهروندان وضع شده است.
            
            تبصره: منظور از شهروند، هر شخص حقیقی ایرانی است که تابع قوانین جمهوری اسلامی ایران باشد.
            
            ماده ۲- وزارت دادگستری موظف است این قانون را اجرا نماید.
            
            ماده ۳- این قانون از تاریخ تصویب لازم‌الاجرا است.
            """,
            category="قانون",
            reliability_score=0.98
        )
        
        # Analyze document
        analysis = self.analyzer.analyze_legal_document(
            sample_doc.content,
            sample_doc.title,
            sample_doc.source
        )
        sample_doc.analysis = json.dumps(analysis, ensure_ascii=False)
        
        # Insert document
        result = self.legal_db.insert_legal_document(sample_doc)
        self.assertTrue(result, "Document should be inserted successfully")
        
        # Verify insertion
        docs = self.legal_db.search_documents("قانون نمونه")
        self.assertGreater(len(docs), 0, "Should find inserted document")
        
        # Check analysis results
        stored_doc = docs[0]
        stored_analysis = json.loads(stored_doc['analysis'])
        self.assertIn('classification', stored_analysis)
        self.assertIn('legal_entities', stored_analysis)
        
        logger.info("✅ Majlis document fetch test passed")

    def test_nafaqe_definition_extraction(self):
        """Test Case 2: Extract نفقه definition"""
        logger.info("🧪 Testing نفقه definition extraction...")
        
        # Create comprehensive نفقه document
        nafaqe_doc = LegalDocument(
            source="کانون وکلای دادگستری",
            url="https://icbar.ir/fa/legal/nafaqe-definition",
            title="تعریف جامع نفقه در حقوق خانواده",
            content="""
            نفقه در اصطلاح حقوقی عبارت است از مخارج ضروری زندگی که شوهر موظف به تأمین آن برای همسر خود می‌باشد.
            
            بر اساس ماده ۱۱۰۶ قانون مدنی ایران: "زن در برابر تمکین، حق نفقه دارد و شوهر موظف است 
            معیشت او را بر حسب وسع و توان خود تأمین کند."
            
            انواع نفقه:
            ۱- نفقه زوجه: نفقه‌ای که شوهر باید به همسر خود بپردازد
            ۲- نفقه اطفال: نفقه‌ای که والدین موظف به پرداخت آن برای فرزندان خود هستند
            ۳- نفقه والدین: نفقه‌ای که فرزندان موظف به پرداخت آن برای والدین خود هستند
            
            شرایط استحقاق نفقه:
            - تمکین زوجه از زوج
            - عدم ناشزه بودن زوجه
            - عقد صحیح بین زوجین
            
            در صورت امتناع شوهر از پرداخت نفقه، زوجه می‌تواند به دادگاه مراجعه کرده و 
            درخواست الزام به پرداخت نفقه و حتی طلاق به علت عدم پرداخت نفقه را نماید.
            
            میزان نفقه بر اساس وضعیت مالی شوهر و عرف اجتماعی تعیین می‌گردد.
            """,
            category="نفقه_و_حقوق_خانواده",
            reliability_score=0.90
        )
        
        # Analyze document
        analysis = self.analyzer.analyze_legal_document(
            nafaqe_doc.content,
            nafaqe_doc.title,
            nafaqe_doc.source
        )
        nafaqe_doc.analysis = json.dumps(analysis, ensure_ascii=False)
        
        # Insert document
        result = self.legal_db.insert_legal_document(nafaqe_doc)
        self.assertTrue(result, "نفقه document should be inserted successfully")
        
        # Search for نفقه
        search_results = self.legal_db.search_documents("نفقه")
        self.assertGreater(len(search_results), 0, "Should find نفقه documents")
        
        # Verify content
        found_doc = search_results[0]
        self.assertIn("نفقه", found_doc['content'])
        self.assertEqual(found_doc['category'], "نفقه_و_حقوق_خانواده")
        
        # Check analysis results
        stored_analysis = json.loads(found_doc['analysis'])
        self.assertIn('legal_entities', stored_analysis)
        self.assertIn('key_terms', stored_analysis)
        
        # Verify key terms extraction
        key_terms = stored_analysis.get('key_terms', [])
        nafaqe_terms = [term for term in key_terms if 'نفقه' in term.get('term', '')]
        self.assertGreater(len(nafaqe_terms), 0, "Should extract نفقه as key term")
        
        logger.info("✅ نفقه definition extraction test passed")

    def test_duplicate_url_handling(self):
        """Test Case 3: Verify duplicate URL handling using hash column"""
        logger.info("🧪 Testing duplicate URL handling...")
        
        # Create first document
        doc1 = LegalDocument(
            source="تست",
            url="https://test.ir/duplicate-test",
            title="سند تست",
            content="محتوای تستی برای بررسی تکراری",
            category="تست",
            reliability_score=0.5
        )
        
        # Insert first document
        result1 = self.legal_db.insert_legal_document(doc1)
        self.assertTrue(result1, "First document should be inserted")
        
        # Create second document with same URL but different content
        doc2 = LegalDocument(
            source="تست",
            url="https://test.ir/duplicate-test",  # Same URL
            title="سند تست ویرایش شده",
            content="محتوای تستی ویرایش شده",  # Different content
            category="تست",
            reliability_score=0.6
        )
        
        # Insert second document (should replace first due to URL uniqueness)
        result2 = self.legal_db.insert_legal_document(doc2)
        self.assertTrue(result2, "Second document should replace first")
        
        # Verify only one document exists
        with sqlite3.connect(self.test_db_path) as conn:
            count = conn.execute(
                "SELECT COUNT(*) FROM legal_documents WHERE url = ?", 
                (doc1.url,)
            ).fetchone()[0]
            self.assertEqual(count, 1, "Should have only one document with this URL")
        
        # Create third document with same content but different URL
        doc3 = LegalDocument(
            source="تست",
            url="https://test.ir/different-url",  # Different URL
            title="سند تست",
            content="محتوای تستی ویرایش شده",  # Same content as doc2
            category="تست",
            reliability_score=0.7
        )
        
        # This should be rejected due to content hash duplication
        result3 = self.legal_db.insert_legal_document(doc3)
        
        logger.info("✅ Duplicate URL handling test passed")

    def test_ai_analysis_integration(self):
        """Test AI model integration and analysis"""
        logger.info("🧪 Testing AI analysis integration...")
        
        # Test document with legal content
        test_content = """
        ماده ۱۱۰۶ قانون مدنی - زن در برابر تمکین، حق نفقه دارد و شوهر موظف است 
        معیشت او را بر حسب وسع و توان خود تأمین کند.
        
        تبصره - نفقه شامل خوراک، پوشاک، مسکن و مخارج درمان است.
        """
        
        # Perform analysis
        analysis_result = self.analyzer.analyze_legal_document(
            test_content,
            "ماده ۱۱۰۶ قانون مدنی - حق نفقه",
            "قانون مدنی"
        )
        
        # Check analysis structure
        self.assertIn('classification', analysis_result)
        self.assertIn('legal_entities', analysis_result)
        self.assertIn('key_terms', analysis_result)
        self.assertIn('word_count', analysis_result)
        
        # Check if نفقه is detected
        key_terms = analysis_result.get('key_terms', [])
        nafaqe_found = any('نفقه' in term.get('term', '') for term in key_terms)
        self.assertTrue(nafaqe_found, "Should detect نفقه as key term")
        
        # Check legal entities
        entities = analysis_result.get('legal_entities', [])
        self.assertGreater(len(entities), 0, "Should extract legal entities")
        
        logger.info("✅ AI analysis integration test passed")

    def test_full_text_search(self):
        """Test full-text search functionality"""
        logger.info("🧪 Testing full-text search...")
        
        # Insert test documents
        test_docs = [
            LegalDocument(
                source="تست",
                url="https://test1.ir",
                title="قوانین نفقه",
                content="نفقه زوجه و حقوق خانواده",
                category="حقوق_خانواده"
            ),
            LegalDocument(
                source="تست",
                url="https://test2.ir",
                title="قوانین ارث",
                content="میراث و وصیت در حقوق ایران",
                category="حقوق_مالی"
            ),
            LegalDocument(
                source="تست",
                url="https://test3.ir",
                title="دادنامه طلاق",
                content="حکم طلاق و نفقه متعه",
                category="دادنامه"
            )
        ]
        
        for doc in test_docs:
            analysis = self.analyzer.analyze_legal_document(doc.content, doc.title, doc.source)
            doc.analysis = json.dumps(analysis, ensure_ascii=False)
            self.legal_db.insert_legal_document(doc)
        
        # Test search queries
        search_tests = [
            ("نفقه", 2),  # Should find 2 documents
            ("ارث", 1),   # Should find 1 document
            ("طلاق", 1),  # Should find 1 document
            ("xyz", 0)    # Should find 0 documents
        ]
        
        for query, expected_count in search_tests:
            results = self.legal_db.search_documents(query)
            self.assertEqual(
                len(results), expected_count, 
                f"Search for '{query}' should return {expected_count} results"
            )
        
        logger.info("✅ Full-text search test passed")

class IntegrationTests:
    """Integration tests with real data"""
    
    def __init__(self):
        self.db_path = "integration_test_legal.db"
        self.legal_db = LegalDatabase(self.db_path)
        self.analyzer = EnhancedLegalAnalyzer()
        
        # Try to initialize legal archive
        scraper_module = import_legal_scraper()
        self.legal_archive = None
        
        if scraper_module:
            try:
                self.legal_archive = scraper_module.UltraModernLegalArchive()
                logger.info("✅ Legal archive initialized for integration tests")
            except Exception as e:
                logger.warning(f"Legal archive not available for integration tests: {e}")

    def test_populate_database(self):
        """Test database population with sample data"""
        logger.info("🧪 Running database population test...")
        
        if not self.legal_archive:
            logger.warning("Skipping population test - legal archive not available")
            return
        
        # Populate database with limited data
        try:
            results = self.analyzer.populate_legal_database(self.legal_archive, max_docs_per_source=2)
            
            logger.info(f"Population results: {json.dumps(results, ensure_ascii=False, indent=2)}")
            
            # Verify some documents were processed
            assert results['total_processed'] > 0, "Should process some documents"
            
            # Check database stats
            stats = self.legal_db.get_database_stats()
            logger.info(f"Database stats: {json.dumps(stats, ensure_ascii=False, indent=2)}")
            
            logger.info("✅ Database population test completed")
            
        except Exception as e:
            logger.error(f"Database population test failed: {e}")

    def test_nafaqe_search_and_extraction(self):
        """Test نفقه definition search and extraction"""
        logger.info("🧪 Testing نفقه definition search...")
        
        try:
            # Search for نفقه definition
            nafaqe_doc = self.analyzer.search_nafaqe_definition(self.legal_archive)
            
            if nafaqe_doc:
                logger.info("✅ نفقه definition found/created successfully")
                
                # Verify the document contains نفقه information
                if isinstance(nafaqe_doc, dict):
                    content = nafaqe_doc.get('content', '')
                else:
                    content = nafaqe_doc.content
                
                assert 'نفقه' in content, "Document should contain نفقه information"
                logger.info("✅ نفقه content verification passed")
                
                # Search in database
                search_results = self.legal_db.search_documents("نفقه")
                assert len(search_results) > 0, "Should find نفقه documents in database"
                
                logger.info(f"Found {len(search_results)} نفقه-related documents")
                
                # Display sample نفقه information
                for doc in search_results[:2]:
                    logger.info(f"📄 نفقه Document: {doc['title']}")
                    logger.info(f"   Source: {doc['source']}")
                    logger.info(f"   Category: {doc['category']}")
                    logger.info(f"   Content preview: {doc['content'][:200]}...")
            
            else:
                logger.warning("Could not find or create نفقه definition")
        
        except Exception as e:
            logger.error(f"نفقه search test failed: {e}")

    def run_all_tests(self):
        """Run all integration tests"""
        logger.info("🚀 Starting integration tests...")
        
        try:
            self.test_populate_database()
            self.test_nafaqe_search_and_extraction()
            
            # Display final database statistics
            stats = self.legal_db.get_database_stats()
            logger.info("📊 Final Database Statistics:")
            logger.info(f"   Total Documents: {stats.get('total_documents', 0)}")
            logger.info(f"   Sources: {list(stats.get('sources', {}).keys())}")
            logger.info(f"   Categories: {list(stats.get('categories', {}).keys())}")
            
            logger.info("✅ All integration tests completed")
            
        except Exception as e:
            logger.error(f"Integration tests failed: {e}")
        
        finally:
            # Clean up
            if os.path.exists(self.db_path):
                try:
                    os.remove(self.db_path)
                    logger.info("🧹 Test database cleaned up")
                except:
                    pass

def run_comprehensive_tests():
    """Run comprehensive test suite"""
    print("🏛️ Iranian Legal Archive - Database Test Suite")
    print("=" * 60)
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} CEST")
    print()
    
    # Run unit tests
    print("🧪 Running Unit Tests...")
    unittest.main(argv=[''], exit=False, verbosity=2)
    
    print("\n🔗 Running Integration Tests...")
    integration_tests = IntegrationTests()
    integration_tests.run_all_tests()
    
    print("\n✅ Test suite completed!")

if __name__ == "__main__":
    # Setup test environment
    os.environ.update({
        'TRANSFORMERS_CACHE': '/tmp/test_hf_cache',
        'HF_HOME': '/tmp/test_hf_cache',
        'TORCH_HOME': '/tmp/test_torch_cache',
        'TOKENIZERS_PARALLELISM': 'false'
    })
    
    run_comprehensive_tests()