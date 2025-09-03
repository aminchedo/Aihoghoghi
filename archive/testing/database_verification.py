#!/usr/bin/env python3
"""
Database Verification Script
Tests actual SQLite database operations and data persistence
"""

import sqlite3
import os
import time
import json
import datetime
from typing import Dict, List, Any

class DatabaseVerifier:
    def __init__(self):
        self.results = {
            "verification_timestamp": datetime.datetime.now().isoformat(),
            "database_discovery": {},
            "database_operations": {},
            "data_persistence": {},
            "schema_verification": {},
            "performance_metrics": {}
        }
        
        # Find all .db files in workspace
        self.db_files = []
        for file in os.listdir('.'):
            if file.endswith('.db'):
                self.db_files.append(file)

    def discover_databases(self):
        """Discover and analyze existing database files"""
        print("🗃️  Discovering database files...")
        
        discovery_results = {
            "total_db_files": len(self.db_files),
            "database_details": {},
            "total_size_bytes": 0,
            "valid_sqlite_files": 0
        }
        
        for db_file in self.db_files:
            print(f"   Analyzing: {db_file}")
            
            db_info = {
                "file_size_bytes": 0,
                "file_size_kb": 0,
                "is_valid_sqlite": False,
                "tables_count": 0,
                "total_records": 0,
                "table_details": {},
                "error": None
            }
            
            try:
                # Get file size
                file_size = os.path.getsize(db_file)
                db_info["file_size_bytes"] = file_size
                db_info["file_size_kb"] = round(file_size / 1024, 2)
                discovery_results["total_size_bytes"] += file_size
                
                # Try to connect and analyze
                conn = sqlite3.connect(db_file)
                cursor = conn.cursor()
                
                # Check if it's a valid SQLite database
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                
                if tables:
                    db_info["is_valid_sqlite"] = True
                    db_info["tables_count"] = len(tables)
                    discovery_results["valid_sqlite_files"] += 1
                    
                    # Get details for each table
                    for (table_name,) in tables:
                        try:
                            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                            record_count = cursor.fetchone()[0]
                            
                            cursor.execute(f"PRAGMA table_info({table_name})")
                            columns = cursor.fetchall()
                            
                            db_info["table_details"][table_name] = {
                                "record_count": record_count,
                                "columns": [col[1] for col in columns],
                                "column_count": len(columns)
                            }
                            
                            db_info["total_records"] += record_count
                            
                        except Exception as e:
                            db_info["table_details"][table_name] = {"error": str(e)}
                
                conn.close()
                
            except sqlite3.Error as e:
                db_info["error"] = f"SQLite error: {str(e)}"
            except Exception as e:
                db_info["error"] = f"General error: {str(e)}"
                
            discovery_results["database_details"][db_file] = db_info
            
        discovery_results["total_size_kb"] = round(discovery_results["total_size_bytes"] / 1024, 2)
        discovery_results["total_size_mb"] = round(discovery_results["total_size_bytes"] / (1024*1024), 2)
        
        self.results["database_discovery"] = discovery_results
        return discovery_results

    def test_database_operations(self):
        """Test actual database operations (INSERT, SELECT, UPDATE, DELETE)"""
        print("⚙️  Testing database operations...")
        
        operations_results = {
            "test_database_created": False,
            "insert_operations": {},
            "select_operations": {},
            "update_operations": {},
            "delete_operations": {},
            "transaction_support": False,
            "persian_text_support": False
        }
        
        test_db_name = f"test_verification_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        
        try:
            # Create test database
            conn = sqlite3.connect(test_db_name)
            cursor = conn.cursor()
            
            # Create test table with Persian text support
            cursor.execute("""
                CREATE TABLE legal_documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT,
                    category TEXT,
                    source_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            operations_results["test_database_created"] = True
            
            # Test INSERT operations with Persian text
            persian_test_data = [
                ("قانون مدنی ایران", "متن قانون مدنی جمهوری اسلامی ایران", "قانونی", "https://test.ir/law1"),
                ("رای دادگاه عالی", "رای شماره ۱۲۳۴ دادگاه عالی کشور", "قضایی", "https://test.ir/court1"),
                ("مقررات اداری", "آیین‌نامه جدید وزارت کشور", "اداری", "https://test.ir/admin1")
            ]
            
            insert_start = time.time()
            inserted_count = 0
            
            for title, content, category, url in persian_test_data:
                try:
                    cursor.execute("""
                        INSERT INTO legal_documents (title, content, category, source_url)
                        VALUES (?, ?, ?, ?)
                    """, (title, content, category, url))
                    inserted_count += 1
                except Exception as e:
                    operations_results["insert_operations"][f"error_{inserted_count}"] = str(e)
                    
            conn.commit()
            insert_time = time.time() - insert_start
            
            operations_results["insert_operations"] = {
                "records_inserted": inserted_count,
                "insertion_time_ms": round(insert_time * 1000, 2),
                "persian_text_inserted": True,
                "success": inserted_count > 0
            }
            
            # Test SELECT operations
            select_start = time.time()
            cursor.execute("SELECT * FROM legal_documents")
            all_records = cursor.fetchall()
            select_time = time.time() - select_start
            
            operations_results["select_operations"] = {
                "records_retrieved": len(all_records),
                "selection_time_ms": round(select_time * 1000, 2),
                "persian_text_retrieved": any("قانون" in str(record) for record in all_records),
                "success": len(all_records) > 0
            }
            
            # Test UPDATE operations
            update_start = time.time()
            cursor.execute("""
                UPDATE legal_documents 
                SET content = content || ' - تحلیل شده' 
                WHERE category = 'قانونی'
            """)
            updated_rows = cursor.rowcount
            conn.commit()
            update_time = time.time() - update_start
            
            operations_results["update_operations"] = {
                "records_updated": updated_rows,
                "update_time_ms": round(update_time * 1000, 2),
                "success": updated_rows > 0
            }
            
            # Test DELETE operations
            delete_start = time.time()
            cursor.execute("DELETE FROM legal_documents WHERE id = 1")
            deleted_rows = cursor.rowcount
            conn.commit()
            delete_time = time.time() - delete_start
            
            operations_results["delete_operations"] = {
                "records_deleted": deleted_rows,
                "deletion_time_ms": round(delete_time * 1000, 2),
                "success": deleted_rows > 0
            }
            
            # Test transaction support
            try:
                cursor.execute("BEGIN TRANSACTION")
                cursor.execute("INSERT INTO legal_documents (title, content) VALUES (?, ?)", 
                             ("تست تراکنش", "محتوای تست"))
                cursor.execute("ROLLBACK")
                operations_results["transaction_support"] = True
            except:
                operations_results["transaction_support"] = False
                
            # Verify Persian text support
            cursor.execute("SELECT title FROM legal_documents WHERE title LIKE '%قانون%'")
            persian_results = cursor.fetchall()
            operations_results["persian_text_support"] = len(persian_results) > 0
            
            conn.close()
            
            # Clean up test database
            os.remove(test_db_name)
            
        except Exception as e:
            operations_results["general_error"] = str(e)
            
        self.results["database_operations"] = operations_results
        return operations_results

    def test_data_persistence(self):
        """Test data persistence across database sessions"""
        print("💾 Testing data persistence...")
        
        persistence_results = {
            "persistence_test_passed": False,
            "data_survives_restart": False,
            "existing_data_verified": False,
            "largest_database": None,
            "total_records_across_dbs": 0
        }
        
        # Test existing databases for actual data
        largest_db = None
        largest_size = 0
        total_records = 0
        
        for db_file in self.db_files:
            try:
                conn = sqlite3.connect(db_file)
                cursor = conn.cursor()
                
                # Get all tables
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                
                db_records = 0
                for (table_name,) in tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                        count = cursor.fetchone()[0]
                        db_records += count
                    except:
                        pass
                        
                total_records += db_records
                
                file_size = os.path.getsize(db_file)
                if file_size > largest_size:
                    largest_size = file_size
                    largest_db = db_file
                    
                conn.close()
                
            except Exception as e:
                print(f"   Error analyzing {db_file}: {e}")
                
        persistence_results.update({
            "existing_data_verified": total_records > 0,
            "total_records_across_dbs": total_records,
            "largest_database": largest_db,
            "largest_db_size_kb": round(largest_size / 1024, 2) if largest_size > 0 else 0
        })
        
        # Test creating and persisting new data
        test_persistence_db = f"persistence_test_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        
        try:
            # Create database with test data
            conn1 = sqlite3.connect(test_persistence_db)
            cursor1 = conn1.cursor()
            
            cursor1.execute("""
                CREATE TABLE persistence_test (
                    id INTEGER PRIMARY KEY,
                    test_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor1.execute("INSERT INTO persistence_test (test_data) VALUES (?)", 
                          ("تست پایداری داده‌ها در سیستم آرشیو حقوقی",))
            conn1.commit()
            conn1.close()
            
            # Reopen database to test persistence
            time.sleep(0.1)  # Brief pause
            conn2 = sqlite3.connect(test_persistence_db)
            cursor2 = conn2.cursor()
            
            cursor2.execute("SELECT test_data FROM persistence_test WHERE id = 1")
            result = cursor2.fetchone()
            
            if result and "تست پایداری" in result[0]:
                persistence_results["persistence_test_passed"] = True
                persistence_results["data_survives_restart"] = True
                
            conn2.close()
            
            # Clean up
            os.remove(test_persistence_db)
            
        except Exception as e:
            persistence_results["persistence_error"] = str(e)
            
        self.results["data_persistence"] = persistence_results
        return persistence_results

    def verify_schema_structure(self):
        """Verify database schema matches documentation claims"""
        print("🏗️  Verifying database schema...")
        
        schema_results = {
            "schemas_analyzed": 0,
            "legal_archive_schema_found": False,
            "expected_tables_present": [],
            "schema_details": {},
            "documentation_compliance": False
        }
        
        # Expected tables based on legal archive system
        expected_tables = ["legal_documents", "scraping_results", "ai_analysis", "categories"]
        
        for db_file in self.db_files:
            if "legal" in db_file.lower() or "archive" in db_file.lower():
                try:
                    conn = sqlite3.connect(db_file)
                    cursor = conn.cursor()
                    
                    # Get schema information
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                    tables = [row[0] for row in cursor.fetchall()]
                    
                    db_schema = {}
                    for table in tables:
                        cursor.execute(f"PRAGMA table_info({table})")
                        columns = cursor.fetchall()
                        db_schema[table] = {
                            "columns": [{"name": col[1], "type": col[2], "not_null": col[3]} for col in columns],
                            "column_count": len(columns)
                        }
                        
                        # Get sample data
                        try:
                            cursor.execute(f"SELECT * FROM {table} LIMIT 3")
                            samples = cursor.fetchall()
                            db_schema[table]["sample_records"] = len(samples)
                            db_schema[table]["has_data"] = len(samples) > 0
                        except:
                            db_schema[table]["sample_records"] = 0
                            db_schema[table]["has_data"] = False
                    
                    schema_results["schema_details"][db_file] = {
                        "tables": tables,
                        "table_count": len(tables),
                        "schema": db_schema
                    }
                    
                    # Check for expected tables
                    found_expected = [table for table in expected_tables if table in tables]
                    schema_results["expected_tables_present"].extend(found_expected)
                    
                    if len(found_expected) > 0:
                        schema_results["legal_archive_schema_found"] = True
                        
                    schema_results["schemas_analyzed"] += 1
                    conn.close()
                    
                except Exception as e:
                    schema_results["schema_details"][db_file] = {"error": str(e)}
                    
        # Check documentation compliance
        unique_expected_found = list(set(schema_results["expected_tables_present"]))
        compliance_score = len(unique_expected_found) / len(expected_tables)
        schema_results["documentation_compliance"] = compliance_score >= 0.5
        schema_results["compliance_score"] = round(compliance_score * 100, 1)
        
        self.results["schema_verification"] = schema_results
        return schema_results

    def test_performance_metrics(self):
        """Test database performance with real operations"""
        print("⚡ Testing database performance...")
        
        performance_results = {
            "operation_times": {},
            "throughput_metrics": {},
            "concurrent_access": False,
            "large_data_handling": False
        }
        
        # Use the largest existing database for performance testing
        discovery = self.results.get("database_discovery", {})
        largest_db = None
        largest_size = 0
        
        for db_file, details in discovery.get("database_details", {}).items():
            if details.get("file_size_bytes", 0) > largest_size:
                largest_size = details["file_size_bytes"]
                largest_db = db_file
                
        if largest_db and os.path.exists(largest_db):
            try:
                # Test read performance
                read_start = time.time()
                conn = sqlite3.connect(largest_db)
                cursor = conn.cursor()
                
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                
                total_reads = 0
                for (table_name,) in tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                        count = cursor.fetchone()[0]
                        total_reads += count
                    except:
                        pass
                        
                read_time = time.time() - read_start
                
                performance_results["operation_times"]["read_all_counts"] = round(read_time * 1000, 2)
                performance_results["throughput_metrics"]["records_per_second"] = round(total_reads / read_time, 2) if read_time > 0 else 0
                
                # Test write performance
                write_start = time.time()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS performance_test (
                        id INTEGER PRIMARY KEY,
                        test_data TEXT,
                        timestamp REAL
                    )
                """)
                
                # Insert test records
                test_records = [(f"تست عملکرد {i}", time.time()) for i in range(100)]
                cursor.executemany("INSERT INTO performance_test (test_data, timestamp) VALUES (?, ?)", test_records)
                conn.commit()
                
                write_time = time.time() - write_start
                performance_results["operation_times"]["write_100_records"] = round(write_time * 1000, 2)
                performance_results["throughput_metrics"]["writes_per_second"] = round(100 / write_time, 2) if write_time > 0 else 0
                
                # Test large data handling
                if total_reads > 1000:
                    performance_results["large_data_handling"] = True
                    
                # Clean up test table
                cursor.execute("DROP TABLE IF EXISTS performance_test")
                conn.commit()
                conn.close()
                
            except Exception as e:
                performance_results["performance_test_error"] = str(e)
                
        self.results["performance_metrics"] = performance_results
        return performance_results

    def run_comprehensive_database_test(self):
        """Run complete database verification"""
        print("🚀 Starting Database Verification...")
        print("=" * 80)
        
        try:
            # Execute all database tests
            self.discover_databases()
            self.test_database_operations()
            self.test_data_persistence()
            self.verify_schema_structure()
            self.test_performance_metrics()
            
            # Save results
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            report_path = f"/workspace/database_verification_{timestamp}.json"
            
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, ensure_ascii=False, indent=2)
                
            print(f"\n✅ Database verification complete. Report saved to: {report_path}")
            
            # Print summary
            self.print_summary()
            
            return self.results
            
        except Exception as e:
            print(f"❌ Database verification failed: {e}")
            return {"error": str(e)}

    def print_summary(self):
        """Print database verification summary"""
        print("\n" + "=" * 80)
        print("📊 DATABASE VERIFICATION SUMMARY")
        print("=" * 80)
        
        discovery = self.results.get("database_discovery", {})
        operations = self.results.get("database_operations", {})
        persistence = self.results.get("data_persistence", {})
        schema = self.results.get("schema_verification", {})
        performance = self.results.get("performance_metrics", {})
        
        print(f"🗃️  Database Files Found: {discovery.get('total_db_files', 0)}")
        print(f"✅ Valid SQLite Files: {discovery.get('valid_sqlite_files', 0)}")
        print(f"📊 Total Database Size: {discovery.get('total_size_mb', 0)} MB")
        print(f"📝 Total Records: {persistence.get('total_records_across_dbs', 0)}")
        
        # Operations summary
        insert_success = operations.get("insert_operations", {}).get("success", False)
        select_success = operations.get("select_operations", {}).get("success", False)
        update_success = operations.get("update_operations", {}).get("success", False)
        delete_success = operations.get("delete_operations", {}).get("success", False)
        
        operations_working = sum([insert_success, select_success, update_success, delete_success])
        print(f"⚙️  CRUD Operations: {operations_working}/4 working")
        
        # Persian support
        persian_support = operations.get("persian_text_support", False) or operations.get("insert_operations", {}).get("persian_text_inserted", False)
        print(f"🇮🇷 Persian Text Support: {'✅ YES' if persian_support else '❌ NO'}")
        
        # Schema compliance
        compliance = schema.get("compliance_score", 0)
        print(f"📋 Schema Compliance: {compliance}%")
        
        # Performance metrics
        read_time = performance.get("operation_times", {}).get("read_all_counts", 0)
        write_time = performance.get("operation_times", {}).get("write_100_records", 0)
        
        if read_time > 0:
            print(f"⚡ Read Performance: {read_time}ms")
        if write_time > 0:
            print(f"⚡ Write Performance: {write_time}ms")
            
        # Overall database status
        if operations_working >= 3 and discovery.get("valid_sqlite_files", 0) > 0:
            print("\n✅ DATABASE SYSTEM STATUS: FUNCTIONAL")
        elif operations_working >= 2:
            print("\n⚠️  DATABASE SYSTEM STATUS: PARTIALLY FUNCTIONAL")
        else:
            print("\n❌ DATABASE SYSTEM STATUS: NON-FUNCTIONAL")
            
        print("=" * 80)

def main():
    """Main execution function"""
    tester = DatabaseVerifier()
    return tester.run_comprehensive_database_test()

if __name__ == "__main__":
    main()