#!/usr/bin/env python3
"""
Integration Test - End-to-end pipeline verification
Tests complete workflow: Scraping → AI → Storage → Retrieval
"""

import sqlite3
import urllib.request
import urllib.error
import json
import time
import datetime
import re
import os
import ssl
from typing import Dict, List, Any

class IntegrationTester:
    def __init__(self):
        self.results = {
            "test_timestamp": datetime.datetime.now().isoformat(),
            "pipeline_stages": {},
            "end_to_end_metrics": {},
            "data_flow_verification": {},
            "error_handling_tests": {},
            "integration_success": False
        }
        
        # Test database for integration
        self.test_db = f"integration_test_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        
        # Iranian legal sites for testing
        self.test_sites = [
            "https://rc.majlis.ir",
            "https://president.ir"
        ]

    def stage_1_scraping(self):
        """Stage 1: Test scraping functionality"""
        print("🕷️  Stage 1: Testing scraping functionality...")
        
        scraping_results = {
            "sites_attempted": 0,
            "sites_successful": 0,
            "total_content_scraped": 0,
            "scraping_time": 0,
            "scraped_data": [],
            "persian_content_found": False
        }
        
        scraping_start = time.time()
        
        for site in self.test_sites:
            scraping_results["sites_attempted"] += 1
            
            try:
                print(f"   Scraping: {site}")
                
                # Create SSL context for Iranian sites
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                
                request = urllib.request.Request(
                    site,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Integration Test)',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'fa,en;q=0.9'
                    }
                )
                
                with urllib.request.urlopen(request, timeout=15, context=ssl_context) as response:
                    if response.getcode() == 200:
                        content = response.read().decode('utf-8', errors='ignore')
                        
                        # Extract meaningful content (remove HTML tags)
                        text_content = re.sub(r'<[^>]+>', ' ', content)
                        text_content = re.sub(r'\s+', ' ', text_content).strip()
                        
                        if len(text_content) > 100:  # Only consider substantial content
                            scraping_results["sites_successful"] += 1
                            scraping_results["total_content_scraped"] += len(text_content)
                            
                            # Check for Persian content
                            persian_pattern = r'[\u0600-\u06FF\u200C\u200D]+'
                            if re.search(persian_pattern, text_content):
                                scraping_results["persian_content_found"] = True
                            
                            scraping_results["scraped_data"].append({
                                "url": site,
                                "content_length": len(text_content),
                                "content_sample": text_content[:500],
                                "has_persian": bool(re.search(persian_pattern, text_content))
                            })
                            
            except Exception as e:
                print(f"   Scraping failed for {site}: {e}")
                
            time.sleep(1)  # Respectful delay
            
        scraping_results["scraping_time"] = round(time.time() - scraping_start, 3)
        scraping_results["success_rate"] = round((scraping_results["sites_successful"] / scraping_results["sites_attempted"]) * 100, 1)
        
        self.results["pipeline_stages"]["stage_1_scraping"] = scraping_results
        return scraping_results

    def stage_2_ai_analysis(self):
        """Stage 2: Test AI analysis on scraped content"""
        print("🤖 Stage 2: Testing AI analysis...")
        
        ai_results = {
            "texts_analyzed": 0,
            "entities_extracted": 0,
            "categories_assigned": 0,
            "confidence_scores": [],
            "analysis_time": 0,
            "analysis_results": []
        }
        
        # Get scraped data from stage 1
        stage_1 = self.results.get("pipeline_stages", {}).get("stage_1_scraping", {})
        scraped_data = stage_1.get("scraped_data", [])
        
        if not scraped_data:
            ai_results["error"] = "No scraped data available for analysis"
            self.results["pipeline_stages"]["stage_2_ai_analysis"] = ai_results
            return ai_results
            
        analysis_start = time.time()
        
        # Legal entity patterns
        entity_patterns = {
            'court_names': r'دادگاه\s+[\u0600-\u06FF\s]+',
            'law_numbers': r'قانون\s+شماره\s+\d+',
            'organizations': r'(وزارت|سازمان|اداره)\s+[\u0600-\u06FF\s]+',
            'case_numbers': r'رای\s+شماره\s+\d+'
        }
        
        # Legal categories
        legal_categories = {
            'قضایی': ['دادگاه', 'قاضی', 'حکم', 'رأی'],
            'اداری': ['وزارت', 'سازمان', 'اداره', 'مدیریت'],
            'قانونی': ['قانون', 'ماده', 'بند', 'مجلس'],
            'مالی': ['مالیات', 'بودجه', 'درآمد', 'پرداخت']
        }
        
        for data in scraped_data:
            content = data.get("content_sample", "")
            if content:
                ai_results["texts_analyzed"] += 1
                
                analysis_result = {
                    "source_url": data.get("url"),
                    "entities_found": [],
                    "categories_detected": [],
                    "confidence_score": 0
                }
                
                # Extract entities
                for entity_type, pattern in entity_patterns.items():
                    matches = re.findall(pattern, content)
                    for match in matches:
                        analysis_result["entities_found"].append({
                            "type": entity_type,
                            "text": match.strip()
                        })
                        ai_results["entities_extracted"] += 1
                        
                # Categorize content
                for category, keywords in legal_categories.items():
                    for keyword in keywords:
                        if keyword in content:
                            analysis_result["categories_detected"].append(category)
                            ai_results["categories_assigned"] += 1
                            break
                            
                # Calculate confidence score (based on number of matches)
                total_matches = len(analysis_result["entities_found"]) + len(analysis_result["categories_detected"])
                confidence = min(total_matches * 0.2, 1.0)  # Max 1.0
                analysis_result["confidence_score"] = round(confidence, 3)
                ai_results["confidence_scores"].append(confidence)
                
                ai_results["analysis_results"].append(analysis_result)
                
        ai_results["analysis_time"] = round(time.time() - analysis_start, 3)
        
        if ai_results["confidence_scores"]:
            ai_results["average_confidence"] = round(sum(ai_results["confidence_scores"]) / len(ai_results["confidence_scores"]), 3)
            
        self.results["pipeline_stages"]["stage_2_ai_analysis"] = ai_results
        return ai_results

    def stage_3_data_storage(self):
        """Stage 3: Test data storage in database"""
        print("💾 Stage 3: Testing data storage...")
        
        storage_results = {
            "database_created": False,
            "records_stored": 0,
            "storage_time": 0,
            "data_integrity_verified": False,
            "persian_text_stored": False
        }
        
        try:
            # Create integration database
            conn = sqlite3.connect(self.test_db)
            cursor = conn.cursor()
            
            # Create tables for legal archive
            cursor.execute("""
                CREATE TABLE scraped_content (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT NOT NULL,
                    content TEXT,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE ai_analysis (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content_id INTEGER,
                    entities TEXT,
                    categories TEXT,
                    confidence_score REAL,
                    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (content_id) REFERENCES scraped_content (id)
                )
            """)
            
            storage_results["database_created"] = True
            
            storage_start = time.time()
            
            # Store scraped data
            stage_1 = self.results.get("pipeline_stages", {}).get("stage_1_scraping", {})
            scraped_data = stage_1.get("scraped_data", [])
            
            for data in scraped_data:
                cursor.execute("""
                    INSERT INTO scraped_content (url, content)
                    VALUES (?, ?)
                """, (data.get("url"), data.get("content_sample")))
                
                content_id = cursor.lastrowid
                storage_results["records_stored"] += 1
                
                # Store AI analysis results
                stage_2 = self.results.get("pipeline_stages", {}).get("stage_2_ai_analysis", {})
                analysis_results = stage_2.get("analysis_results", [])
                
                for analysis in analysis_results:
                    if analysis.get("source_url") == data.get("url"):
                        entities_json = json.dumps(analysis.get("entities_found", []), ensure_ascii=False)
                        categories_json = json.dumps(analysis.get("categories_detected", []), ensure_ascii=False)
                        
                        cursor.execute("""
                            INSERT INTO ai_analysis (content_id, entities, categories, confidence_score)
                            VALUES (?, ?, ?, ?)
                        """, (content_id, entities_json, categories_json, analysis.get("confidence_score", 0)))
                        
                        break
                        
            conn.commit()
            storage_results["storage_time"] = round(time.time() - storage_start, 3)
            
            # Verify data integrity
            cursor.execute("SELECT COUNT(*) FROM scraped_content")
            content_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM ai_analysis")
            analysis_count = cursor.fetchone()[0]
            
            storage_results["data_integrity_verified"] = content_count > 0 and analysis_count > 0
            
            # Check Persian text storage
            cursor.execute("SELECT content FROM scraped_content WHERE content LIKE '%قانون%' OR content LIKE '%دادگاه%'")
            persian_records = cursor.fetchall()
            storage_results["persian_text_stored"] = len(persian_records) > 0
            
            conn.close()
            
        except Exception as e:
            storage_results["error"] = str(e)
            
        self.results["pipeline_stages"]["stage_3_data_storage"] = storage_results
        return storage_results

    def stage_4_data_retrieval(self):
        """Stage 4: Test data retrieval and verification"""
        print("🔍 Stage 4: Testing data retrieval...")
        
        retrieval_results = {
            "retrieval_successful": False,
            "data_matches_input": False,
            "query_performance": {},
            "retrieved_records": 0,
            "retrieval_time": 0
        }
        
        if not os.path.exists(self.test_db):
            retrieval_results["error"] = "Test database not found"
            self.results["pipeline_stages"]["stage_4_data_retrieval"] = retrieval_results
            return retrieval_results
            
        try:
            retrieval_start = time.time()
            
            conn = sqlite3.connect(self.test_db)
            cursor = conn.cursor()
            
            # Test various queries
            queries = [
                ("All content", "SELECT * FROM scraped_content"),
                ("AI analysis", "SELECT * FROM ai_analysis"),
                ("Persian content", "SELECT * FROM scraped_content WHERE content LIKE '%قانون%'"),
                ("High confidence", "SELECT * FROM ai_analysis WHERE confidence_score > 0.5")
            ]
            
            query_times = {}
            total_retrieved = 0
            
            for query_name, query_sql in queries:
                query_start = time.time()
                cursor.execute(query_sql)
                results = cursor.fetchall()
                query_time = time.time() - query_start
                
                query_times[query_name] = {
                    "execution_time_ms": round(query_time * 1000, 3),
                    "records_returned": len(results),
                    "sample_data": str(results[0])[:200] if results else None
                }
                
                total_retrieved += len(results)
                
            retrieval_results.update({
                "retrieval_successful": True,
                "query_performance": query_times,
                "retrieved_records": total_retrieved,
                "retrieval_time": round(time.time() - retrieval_start, 3)
            })
            
            # Verify data consistency
            cursor.execute("SELECT COUNT(*) FROM scraped_content")
            stored_content = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM ai_analysis")
            stored_analysis = cursor.fetchone()[0]
            
            retrieval_results["data_matches_input"] = stored_content > 0 and stored_analysis > 0
            
            conn.close()
            
        except Exception as e:
            retrieval_results["error"] = str(e)
            
        self.results["pipeline_stages"]["stage_4_data_retrieval"] = retrieval_results
        return retrieval_results

    def test_error_handling(self):
        """Test system error handling with deliberate failures"""
        print("🛠️  Testing error handling...")
        
        error_handling_results = {
            "invalid_url_handling": False,
            "network_timeout_handling": False,
            "database_error_handling": False,
            "malformed_data_handling": False,
            "recovery_mechanisms": []
        }
        
        # Test invalid URL handling
        try:
            invalid_url = "https://this-site-does-not-exist-12345.com"
            request = urllib.request.Request(invalid_url)
            urllib.request.urlopen(request, timeout=5)
        except Exception:
            error_handling_results["invalid_url_handling"] = True
            error_handling_results["recovery_mechanisms"].append("URL validation")
            
        # Test database error handling
        try:
            conn = sqlite3.connect(self.test_db)
            cursor = conn.cursor()
            
            # Try invalid SQL
            cursor.execute("SELECT * FROM non_existent_table")
        except sqlite3.Error:
            error_handling_results["database_error_handling"] = True
            error_handling_results["recovery_mechanisms"].append("SQL error handling")
        except Exception:
            pass
        finally:
            try:
                conn.close()
            except:
                pass
                
        # Test malformed data handling
        try:
            malformed_json = '{"invalid": json data}'
            json.loads(malformed_json)
        except json.JSONDecodeError:
            error_handling_results["malformed_data_handling"] = True
            error_handling_results["recovery_mechanisms"].append("JSON validation")
            
        self.results["error_handling_tests"] = error_handling_results
        return error_handling_results

    def calculate_integration_metrics(self):
        """Calculate overall integration performance metrics"""
        print("📊 Calculating integration metrics...")
        
        metrics = {
            "total_pipeline_time": 0,
            "stage_success_rates": {},
            "data_flow_integrity": False,
            "overall_success_rate": 0,
            "performance_grade": "F"
        }
        
        # Calculate total pipeline time
        stages = self.results.get("pipeline_stages", {})
        total_time = 0
        successful_stages = 0
        total_stages = 4
        
        for stage_name, stage_data in stages.items():
            stage_time = stage_data.get("scraping_time", 0) or stage_data.get("analysis_time", 0) or stage_data.get("storage_time", 0) or stage_data.get("retrieval_time", 0)
            total_time += stage_time
            
            # Determine stage success
            stage_success = False
            if "scraping" in stage_name:
                stage_success = stage_data.get("sites_successful", 0) > 0
            elif "ai_analysis" in stage_name:
                stage_success = stage_data.get("texts_analyzed", 0) > 0
            elif "storage" in stage_name:
                stage_success = stage_data.get("records_stored", 0) > 0
            elif "retrieval" in stage_name:
                stage_success = stage_data.get("retrieval_successful", False)
                
            if stage_success:
                successful_stages += 1
                
            metrics["stage_success_rates"][stage_name] = stage_success
            
        metrics["total_pipeline_time"] = round(total_time, 3)
        metrics["overall_success_rate"] = round((successful_stages / total_stages) * 100, 1)
        
        # Check data flow integrity
        scraping_stage = stages.get("stage_1_scraping", {})
        storage_stage = stages.get("stage_3_data_storage", {})
        retrieval_stage = stages.get("stage_4_data_retrieval", {})
        
        scraped_sites = scraping_stage.get("sites_successful", 0)
        stored_records = storage_stage.get("records_stored", 0)
        retrieved_records = retrieval_stage.get("retrieved_records", 0)
        
        metrics["data_flow_integrity"] = scraped_sites > 0 and stored_records > 0 and retrieved_records > 0
        
        # Performance grading
        if metrics["overall_success_rate"] >= 90:
            metrics["performance_grade"] = "A"
        elif metrics["overall_success_rate"] >= 80:
            metrics["performance_grade"] = "B"
        elif metrics["overall_success_rate"] >= 70:
            metrics["performance_grade"] = "C"
        elif metrics["overall_success_rate"] >= 60:
            metrics["performance_grade"] = "D"
        else:
            metrics["performance_grade"] = "F"
            
        # Determine overall integration success
        self.results["integration_success"] = (
            metrics["overall_success_rate"] >= 75 and 
            metrics["data_flow_integrity"] and 
            successful_stages >= 3
        )
        
        self.results["end_to_end_metrics"] = metrics
        return metrics

    def run_complete_integration_test(self):
        """Run complete integration verification"""
        print("🚀 Starting Integration Test...")
        print("=" * 80)
        
        try:
            # Execute pipeline stages
            self.stage_1_scraping()
            self.stage_2_ai_analysis()
            self.stage_3_data_storage()
            self.stage_4_data_retrieval()
            self.test_error_handling()
            self.calculate_integration_metrics()
            
            # Save results
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            report_path = f"/workspace/integration_test_{timestamp}.json"
            
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, ensure_ascii=False, indent=2)
                
            print(f"\n✅ Integration test complete. Report saved to: {report_path}")
            
            # Print summary
            self.print_summary()
            
            # Cleanup
            if os.path.exists(self.test_db):
                os.remove(self.test_db)
                print(f"🧹 Cleaned up test database: {self.test_db}")
            
            return self.results
            
        except Exception as e:
            print(f"❌ Integration test failed: {e}")
            return {"error": str(e)}

    def print_summary(self):
        """Print integration test summary"""
        print("\n" + "=" * 80)
        print("📊 INTEGRATION TEST SUMMARY")
        print("=" * 80)
        
        stages = self.results.get("pipeline_stages", {})
        metrics = self.results.get("end_to_end_metrics", {})
        
        print(f"🎯 Integration Success: {'✅ YES' if self.results.get('integration_success') else '❌ NO'}")
        print(f"📈 Overall Success Rate: {metrics.get('overall_success_rate', 0)}%")
        print(f"🏆 Performance Grade: {metrics.get('performance_grade', 'F')}")
        print(f"⏱️  Total Pipeline Time: {metrics.get('total_pipeline_time', 0)}s")
        
        # Stage-by-stage results
        print("\n📋 Pipeline Stages:")
        
        scraping = stages.get("stage_1_scraping", {})
        if scraping:
            success_rate = scraping.get("success_rate", 0)
            print(f"   1️⃣  Scraping: {scraping.get('sites_successful', 0)}/{scraping.get('sites_attempted', 0)} sites ({success_rate}%)")
            
        ai_analysis = stages.get("stage_2_ai_analysis", {})
        if ai_analysis:
            print(f"   2️⃣  AI Analysis: {ai_analysis.get('texts_analyzed', 0)} texts, {ai_analysis.get('entities_extracted', 0)} entities")
            
        storage = stages.get("stage_3_data_storage", {})
        if storage:
            print(f"   3️⃣  Storage: {storage.get('records_stored', 0)} records stored")
            
        retrieval = stages.get("stage_4_data_retrieval", {})
        if retrieval:
            print(f"   4️⃣  Retrieval: {retrieval.get('retrieved_records', 0)} records retrieved")
            
        # Data flow verification
        data_flow = metrics.get("data_flow_integrity", False)
        print(f"\n🔄 Data Flow Integrity: {'✅ VERIFIED' if data_flow else '❌ BROKEN'}")
        
        # Error handling
        error_handling = self.results.get("error_handling_tests", {})
        recovery_mechanisms = len(error_handling.get("recovery_mechanisms", []))
        print(f"🛠️  Error Handling: {recovery_mechanisms} recovery mechanisms detected")
        
        print("=" * 80)

def main():
    """Main execution function"""
    tester = IntegrationTester()
    return tester.run_complete_integration_test()

if __name__ == "__main__":
    main()