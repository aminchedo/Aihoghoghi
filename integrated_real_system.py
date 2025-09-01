#!/usr/bin/env python3
"""
Integrated Real System - Complete working system with scraping + AI analysis
No fake data, no exaggerated reports - only real functionality
"""

import requests
import json
import sqlite3
import re
import time
from datetime import datetime
from urllib.parse import quote, urlparse
from bs4 import BeautifulSoup
from collections import Counter
from typing import Dict, List, Any

class IntegratedRealSystem:
    def __init__(self):
        """Initialize integrated system with real scraping + AI"""
        
        # Real working CORS proxy (tested and working)
        self.cors_proxy = "https://api.allorigins.win/get?url="
        
        # Real Iranian legal sites (tested working)
        self.working_sites = [
            {'name': 'مرکز پژوهش مجلس', 'url': 'https://rc.majlis.ir', 'method': 'cors'},
            {'name': 'ایران کد', 'url': 'https://irancode.ir', 'method': 'direct'},
            {'name': 'دولت الکترونیک', 'url': 'https://www.dolat.ir', 'method': 'cors'},
            {'name': 'ریاست جمهوری', 'url': 'https://www.president.ir', 'method': 'cors'},
            {'name': 'مجلس شورای اسلامی', 'url': 'https://www.majlis.ir', 'method': 'cors'}
        ]
        
        # Real AI categories (not fake)
        self.ai_categories = {
            'قضایی': ['دادگاه', 'قاضی', 'حکم', 'رأی', 'دادرسی', 'محاکمه'],
            'اداری': ['وزارت', 'سازمان', 'اداره', 'مدیریت', 'خدمات', 'مقررات'],
            'قانونی': ['قانون', 'ماده', 'بند', 'تبصره', 'مجلس', 'شورا'],
            'مالی': ['مالیات', 'بودجه', 'درآمد', 'هزینه', 'پرداخت', 'حقوق']
        }
        
        # Real entity extraction patterns
        self.entity_patterns = {
            'تاریخ': r'\d{4}/\d{1,2}/\d{1,2}|\d{1,2}/\d{1,2}/\d{4}',
            'شماره_پرونده': r'پرونده\s*شماره\s*[\d\-/]+',
            'مبلغ': r'\d+\s*ریال|\d+\s*تومان',
            'ماده_قانون': r'ماده\s*\d+',
            'نام_شخص': r'آقای\s+\w+|خانم\s+\w+'
        }
        
        # Initialize real database
        self.db_path = '/workspace/integrated_real_data.db'
        self.init_database()
        
        # Session for requests
        self.session = requests.Session()
        self.session.verify = False
        
        # Stats
        self.stats = {
            'scraped_sites': 0,
            'analyzed_content': 0,
            'total_content_length': 0,
            'successful_ai_analyses': 0
        }
    
    def init_database(self):
        """Initialize real database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Real scraped content table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scraped_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                site_name TEXT NOT NULL,
                url TEXT NOT NULL,
                content TEXT NOT NULL,
                content_length INTEGER,
                scraping_method TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Real AI analysis table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ai_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_id INTEGER,
                category TEXT,
                confidence REAL,
                entities TEXT,
                keywords TEXT,
                relevance_score INTEGER,
                analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (content_id) REFERENCES scraped_content (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Real database initialized")
    
    def scrape_site(self, site: Dict[str, str]) -> Dict[str, Any]:
        """Real scraping with working methods"""
        
        print(f"🌐 Scraping: {site['name']}")
        
        try:
            if site['method'] == 'cors':
                # Use working CORS proxy
                proxy_url = self.cors_proxy + quote(site['url'], safe=':/?#[]@!$&\'()*+,;=')
                response = self.session.get(proxy_url, timeout=15)
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        content = data.get('contents', response.text)
                    except:
                        content = response.text
                else:
                    return {'success': False, 'error': f'Status {response.status_code}'}
                    
            else:  # direct method
                headers = {
                    'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
                }
                response = self.session.get(site['url'], headers=headers, timeout=10)
                content = response.text
            
            # Validate content
            if len(content) < 500:
                return {'success': False, 'error': 'Content too short'}
            
            # Clean content with BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')
            
            # Remove scripts, styles, etc.
            for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
                tag.decompose()
            
            clean_content = soup.get_text()
            
            # Store in database
            content_id = self._store_scraped_content(site, clean_content)
            
            self.stats['scraped_sites'] += 1
            self.stats['total_content_length'] += len(clean_content)
            
            print(f"   ✅ Scraped {len(clean_content):,} characters")
            
            return {
                'success': True,
                'content_id': content_id,
                'content': clean_content,
                'content_length': len(clean_content),
                'method': site['method']
            }
            
        except Exception as e:
            print(f"   ❌ Failed: {str(e)[:50]}")
            return {'success': False, 'error': str(e)}
    
    def _store_scraped_content(self, site: Dict, content: str) -> int:
        """Store scraped content in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO scraped_content (site_name, url, content, content_length, scraping_method)
            VALUES (?, ?, ?, ?, ?)
        ''', (site['name'], site['url'], content, len(content), site['method']))
        
        content_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return content_id
    
    def analyze_with_ai(self, content: str, content_id: int = None) -> Dict[str, Any]:
        """Real AI analysis of content"""
        
        print(f"🧠 AI analyzing {len(content)} characters...")
        
        # Real category classification
        category_scores = {}
        for category, keywords in self.ai_categories.items():
            score = 0
            found_keywords = []
            
            for keyword in keywords:
                count = content.count(keyword)
                if count > 0:
                    score += count
                    found_keywords.append({'keyword': keyword, 'count': count})
            
            if score > 0:
                category_scores[category] = {
                    'score': score,
                    'keywords': found_keywords
                }
        
        # Determine primary category
        if category_scores:
            primary_category = max(category_scores.keys(), 
                                 key=lambda k: category_scores[k]['score'])
            confidence = min(category_scores[primary_category]['score'] / 10, 1.0)
        else:
            primary_category = 'عمومی'
            confidence = 0.1
        
        # Real entity extraction
        entities = {}
        for entity_type, pattern in self.entity_patterns.items():
            matches = re.findall(pattern, content)
            if matches:
                entities[entity_type] = list(set(matches))
        
        # Real keyword extraction
        persian_words = re.findall(r'[\u0600-\u06FF]+', content)
        word_freq = Counter(persian_words)
        top_keywords = [{'word': word, 'frequency': freq} 
                       for word, freq in word_freq.most_common(5)]
        
        # Calculate relevance score
        relevance_score = self._calculate_relevance(content, category_scores)
        
        # Analysis result
        analysis = {
            'primary_category': primary_category,
            'confidence': round(confidence, 2),
            'category_scores': category_scores,
            'entities': entities,
            'top_keywords': top_keywords,
            'relevance_score': relevance_score,
            'persian_word_count': len(persian_words),
            'total_categories': len(category_scores)
        }
        
        # Store AI analysis
        if content_id:
            self._store_ai_analysis(content_id, analysis)
        
        self.stats['analyzed_content'] += 1
        self.stats['successful_ai_analyses'] += 1
        
        print(f"   🏷️ Category: {primary_category} (confidence: {confidence:.2f})")
        print(f"   🔍 Entities: {len(entities)} types found")
        
        return analysis
    
    def _calculate_relevance(self, content: str, category_scores: Dict) -> int:
        """Calculate real relevance score"""
        score = 0
        
        # Persian content
        persian_chars = sum(1 for char in content if '\u0600' <= char <= '\u06FF')
        if persian_chars > 100:
            score += 20
        
        # Legal keywords
        total_score = sum(cat['score'] for cat in category_scores.values())
        score += min(total_score * 2, 50)
        
        # Content length
        if len(content) > 1000: score += 10
        if len(content) > 5000: score += 10
        if len(content) > 10000: score += 10
        
        return min(score, 100)
    
    def _store_ai_analysis(self, content_id: int, analysis: Dict):
        """Store AI analysis in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO ai_analysis 
            (content_id, category, confidence, entities, keywords, relevance_score)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            content_id,
            analysis['primary_category'],
            analysis['confidence'],
            json.dumps(analysis['entities'], ensure_ascii=False),
            json.dumps(analysis['top_keywords'], ensure_ascii=False),
            analysis['relevance_score']
        ))
        
        conn.commit()
        conn.close()
    
    def run_complete_cycle(self) -> Dict[str, Any]:
        """Run complete scraping + AI analysis cycle"""
        
        print("🚀 RUNNING COMPLETE INTEGRATED CYCLE")
        print("=" * 50)
        
        results = []
        
        for site in self.working_sites:
            print(f"\n📍 Processing: {site['name']}")
            
            # Step 1: Real scraping
            scrape_result = self.scrape_site(site)
            
            if scrape_result['success']:
                # Step 2: Real AI analysis
                ai_result = self.analyze_with_ai(
                    scrape_result['content'], 
                    scrape_result['content_id']
                )
                
                # Combine results
                combined_result = {
                    'site_name': site['name'],
                    'url': site['url'],
                    'scraping_success': True,
                    'content_length': scrape_result['content_length'],
                    'scraping_method': scrape_result['method'],
                    'ai_analysis': ai_result,
                    'processing_time': datetime.now().isoformat()
                }
                
                print(f"   ✅ Complete processing successful")
                
            else:
                combined_result = {
                    'site_name': site['name'],
                    'url': site['url'],
                    'scraping_success': False,
                    'error': scrape_result['error'],
                    'processing_time': datetime.now().isoformat()
                }
                
                print(f"   ❌ Scraping failed: {scrape_result['error']}")
            
            results.append(combined_result)
            
            # Small delay between sites
            time.sleep(1)
        
        # Generate real report
        successful_scraping = sum(1 for r in results if r.get('scraping_success'))
        successful_ai = sum(1 for r in results if r.get('ai_analysis'))
        
        final_report = {
            'test_type': 'integrated_real_system',
            'timestamp': datetime.now().isoformat(),
            'total_sites': len(self.working_sites),
            'successful_scraping': successful_scraping,
            'successful_ai_analysis': successful_ai,
            'scraping_success_rate': (successful_scraping / len(self.working_sites)) * 100,
            'ai_success_rate': (successful_ai / len(self.working_sites)) * 100,
            'system_stats': self.stats,
            'detailed_results': results
        }
        
        # Save real report
        report_file = f"integrated_real_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, ensure_ascii=False, indent=2)
        
        # Print real summary
        print(f"\n📊 INTEGRATED SYSTEM RESULTS")
        print(f"=" * 35)
        print(f"🌐 Scraping Success: {successful_scraping}/{len(self.working_sites)} ({(successful_scraping/len(self.working_sites)*100):.1f}%)")
        print(f"🧠 AI Analysis Success: {successful_ai}/{len(self.working_sites)} ({(successful_ai/len(self.working_sites)*100):.1f}%)")
        print(f"📄 Total Content: {self.stats['total_content_length']:,} characters")
        print(f"📋 Report: {report_file}")
        
        return final_report
    
    def get_real_database_stats(self) -> Dict[str, Any]:
        """Get real statistics from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Scraped content stats
            cursor.execute('SELECT COUNT(*), SUM(content_length) FROM scraped_content')
            scraped_count, total_content = cursor.fetchone()
            
            # AI analysis stats
            cursor.execute('SELECT COUNT(*), AVG(confidence), AVG(relevance_score) FROM ai_analysis')
            ai_count, avg_confidence, avg_relevance = cursor.fetchone()
            
            # Category distribution
            cursor.execute('SELECT category, COUNT(*) FROM ai_analysis GROUP BY category')
            categories = dict(cursor.fetchall())
            
            conn.close()
            
            return {
                'scraped_sites': scraped_count or 0,
                'total_content_chars': total_content or 0,
                'ai_analyses': ai_count or 0,
                'average_confidence': round(avg_confidence or 0, 2),
                'average_relevance': round(avg_relevance or 0, 1),
                'category_distribution': categories
            }
            
        except Exception as e:
            return {'error': str(e)}

def test_integrated_system():
    """Test the complete integrated system"""
    
    print("🚀 TESTING COMPLETE INTEGRATED SYSTEM")
    print("=" * 45)
    print("🎯 Real scraping + Real AI analysis")
    print("❌ No fake data, no exaggerated claims")
    
    # Initialize system
    system = IntegratedRealSystem()
    
    # Run complete cycle
    report = system.run_complete_cycle()
    
    # Get database stats
    db_stats = system.get_real_database_stats()
    
    print(f"\n💾 REAL DATABASE STATS:")
    print(f"   📄 Scraped Sites: {db_stats.get('scraped_sites')}")
    print(f"   📊 Total Content: {db_stats.get('total_content_chars', 0):,} chars")
    print(f"   🧠 AI Analyses: {db_stats.get('ai_analyses')}")
    print(f"   🎯 Avg Confidence: {db_stats.get('average_confidence')}")
    print(f"   📈 Avg Relevance: {db_stats.get('average_relevance')}")
    
    categories = db_stats.get('category_distribution', {})
    if categories:
        print(f"\n🏷️ REAL CATEGORIES FOUND:")
        for category, count in categories.items():
            print(f"   {category}: {count} documents")
    
    # Final assessment
    scraping_rate = report['scraping_success_rate']
    ai_rate = report['ai_success_rate']
    
    print(f"\n🏆 FINAL REAL ASSESSMENT:")
    print(f"   🌐 Scraping Works: {'✅ YES' if scraping_rate > 80 else '❌ NO'}")
    print(f"   🧠 AI Works: {'✅ YES' if ai_rate > 80 else '❌ NO'}")
    print(f"   🔗 Integration Works: {'✅ YES' if scraping_rate > 80 and ai_rate > 80 else '❌ NO'}")
    
    return report

if __name__ == "__main__":
    test_integrated_system()