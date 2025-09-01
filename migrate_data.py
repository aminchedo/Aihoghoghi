#!/usr/bin/env python3
"""
Migration script for Iranian Legal Archive System
Migrates data from old Gradio-based version to new modular architecture
"""

import sqlite3
import logging
import json
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

def migrate_from_old_database():
    """Migrate data from old database format"""
    old_db_path = "demo_legal_archive.db"
    new_db_path = "data/databases/legal_archive.sqlite"
    
    if not Path(old_db_path).exists():
        logger.info("No old database found, starting fresh")
        return True
    
    try:
        logger.info("🔄 Migrating data from old database...")
        
        # Connect to both databases
        old_conn = sqlite3.connect(old_db_path)
        new_conn = sqlite3.connect(new_db_path)
        
        # Get old data
        old_cursor = old_conn.execute("""
            SELECT url, title, content, quality_score, classification, 
                   scraped_at, source, word_count
            FROM documents
        """)
        
        old_records = old_cursor.fetchall()
        
        if old_records:
            logger.info(f"Found {len(old_records)} records to migrate")
            
            # Insert into new database with enhanced schema
            for record in old_records:
                url, title, content, quality_score, classification, scraped_at, source, word_count = record
                
                new_conn.execute("""
                    INSERT OR IGNORE INTO documents (
                        url, title, content, quality_score, classification,
                        scraped_at, source, word_count, source_category,
                        reliability_score, extraction_method, content_hash
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    url, title, content, quality_score, classification,
                    scraped_at, source, word_count, 'migrated',
                    0.7, 'legacy', hash(url) % 1000000
                ))
            
            new_conn.commit()
            logger.info(f"✅ Migrated {len(old_records)} records successfully")
        else:
            logger.info("No records found in old database")
        
        old_conn.close()
        new_conn.close()
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

def backup_old_files():
    """Create backup of old files"""
    try:
        backup_dir = Path("backup") / datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        old_files = [
            "demo_legal_archive.db",
            "enhanced_legal_scraper (3).py",
            "web_server.py",
            "run_legal_archive.py"
        ]
        
        backed_up = 0
        for file_path in old_files:
            if Path(file_path).exists():
                import shutil
                shutil.copy2(file_path, backup_dir / file_path)
                backed_up += 1
                logger.info(f"✅ Backed up: {file_path}")
        
        if backed_up > 0:
            logger.info(f"📦 Created backup in: {backup_dir}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Backup failed: {e}")
        return False

def verify_new_system():
    """Verify the new system is working"""
    try:
        logger.info("🧪 Verifying new system...")
        
        # Test imports
        from utils import UltraModernLegalArchive
        
        # Test initialization
        archive = UltraModernLegalArchive()
        
        # Test basic functionality
        health = archive.get_system_health()
        stats = archive.get_document_statistics()
        
        logger.info(f"✅ System health: {health['overall_status']}")
        logger.info(f"✅ Total documents: {stats.get('total_documents', 0)}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ System verification failed: {e}")
        return False

def main():
    """Main migration function"""
    logger.info("🏛️ Iranian Legal Archive System - Migration Tool")
    
    steps = [
        ("Creating backup", backup_old_files),
        ("Migrating database", migrate_from_old_database),
        ("Verifying new system", verify_new_system)
    ]
    
    for step_name, step_func in steps:
        logger.info(f"\n📋 {step_name}...")
        if not step_func():
            logger.error(f"❌ Migration failed at step: {step_name}")
            return False
    
    logger.info("\n🎉 Migration completed successfully!")
    logger.info("💡 You can now run: python start.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)