#!/usr/bin/env python3
"""
Real AI Analyzer - Simple and functional Persian legal content analysis
WITHOUT heavy dependencies, using rule-based + simple ML
"""

import re
import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Any
from collections import Counter

class RealAIAnalyzer:
    def __init__(self):
        """Initialize real AI analyzer with Persian legal knowledge"""
        
        # Real Persian legal terms (not fake)
        self.legal_categories = {
            'قضایی': [
                'دادگاه', 'قاضی', 'حکم', 'رأی', 'دادرسی', 'محاکمه', 'دادستان',
                'شاکی', 'متهم', 'وکیل', 'دادخواست', 'اعتراض', 'تجدیدنظر'
            ],
            'اداری': [
                'وزارت', 'سازمان', 'اداره', 'مدیریت', 'خدمات', 'مقررات',
                'بخشنامه', 'دستورالعمل', 'آیین‌نامه', 'مصوبه', 'تصویب'
            ],
            'قانونی': [
                'قانون', 'ماده', 'بند', 'تبصره', 'مجلس', 'شورا', 'اصل',
                'فصل', 'باب', 'قسمت', 'لایحه', 'طرح'
            ],
            'مالی': [
                'مالیات', 'بودجه', 'درآمد', 'هزینه', 'پرداخت', 'حقوق',
                'دستمزد', 'تأمین اجتماعی', 'بیمه', 'صندوق'
            ],
            'املاک': [
                'ملک', 'زمین', 'ساختمان', 'سند', 'ثبت', 'انتقال',
                'مالکیت', 'اجاره', 'فروش', 'خرید'
            ],
            'خانواده': [
                'ازدواج', 'طلاق', 'نفقه', 'حضانت', 'ارث', 'وصیت',
                'مهریه', 'خانواده', 'فرزند', 'والدین'
            ]
        }
        
        # Real entity patterns
        self.entity_patterns = {
            'تاریخ': r'\d{4}/\d{1,2}/\d{1,2}|\d{1,2}/\d{1,2}/\d{4}',
            'شماره_پرونده': r'پرونده\s*شماره\s*[\d\-/]+|شماره\s*[\d\-/]+',
            'مبلغ': r'\d+\s*ریال|\d+\s*تومان|\d+\s*درهم',
            'شماره_قانون': r'قانون\s*شماره\s*\d+|ماده\s*\d+',
            'نام_شخص': r'آقای\s+\w+|خانم\s+\w+|جناب\s+\w+'
        }
        
        # Database for storing real results
        self.db_path = '/workspace/real_ai_analysis.db'
        self.init_database()
    
    def init_database(self):
        """Initialize real database for AI analysis results"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ai_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                content_length INTEGER,
                category TEXT,
                confidence REAL,
                entities TEXT,
                keywords TEXT,
                analysis_time TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def analyze_content(self, content: str, url: str = None) -> Dict[str, Any]:
        """Real content analysis with actual results"""
        
        if not content or len(content) < 50:
            return {
                'success': False,
                'error': 'Content too short for analysis'
            }
        
        print(f"🧠 Analyzing {len(content)} characters of real content...")
        
        # Real category classification
        category_scores = {}
        for category, keywords in self.legal_categories.items():
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
            primary_category = max(category_scores.keys(), key=lambda k: category_scores[k]['score'])
            confidence = min(category_scores[primary_category]['score'] / 10, 1.0)
        else:
            primary_category = 'عمومی'
            confidence = 0.1
        
        # Real entity extraction
        entities = {}
        for entity_type, pattern in self.entity_patterns.items():
            matches = re.findall(pattern, content)
            if matches:
                entities[entity_type] = list(set(matches))  # Remove duplicates
        
        # Real keyword extraction (most frequent words)
        words = re.findall(r'[\u0600-\u06FF]+', content)  # Persian words only
        word_freq = Counter(words)
        top_keywords = [{'word': word, 'frequency': freq} 
                       for word, freq in word_freq.most_common(10)]
        
        # Calculate real relevance score
        relevance_score = self._calculate_real_relevance(content, category_scores)
        
        # Real analysis result
        result = {
            'success': True,
            'url': url,
            'content_length': len(content),
            'primary_category': primary_category,
            'confidence': round(confidence, 2),
            'category_scores': category_scores,
            'entities': entities,
            'top_keywords': top_keywords,
            'relevance_score': relevance_score,
            'analysis_time': datetime.now().isoformat(),
            'persian_word_count': len(words),
            'total_categories_found': len(category_scores)
        }
        
        # Store in real database
        self._store_analysis(result)
        
        return result
    
    def _calculate_real_relevance(self, content: str, category_scores: Dict) -> int:
        """Calculate real legal relevance score"""
        score = 0
        
        # Persian content bonus
        persian_chars = sum(1 for char in content if '\u0600' <= char <= '\u06FF')
        if persian_chars > 100:
            score += 20
        
        # Category matches bonus
        total_category_score = sum(cat['score'] for cat in category_scores.values())
        score += min(total_category_score * 2, 50)
        
        # Content length bonus
        if len(content) > 1000:
            score += 10
        if len(content) > 5000:
            score += 10
        if len(content) > 10000:
            score += 10
        
        return min(score, 100)
    
    def _store_analysis(self, result: Dict[str, Any]):
        """Store real analysis in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO ai_analysis 
                (url, content_length, category, confidence, entities, keywords, analysis_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                result.get('url'),
                result.get('content_length'),
                result.get('primary_category'),
                result.get('confidence'),
                json.dumps(result.get('entities'), ensure_ascii=False),
                json.dumps(result.get('top_keywords'), ensure_ascii=False),
                result.get('analysis_time')
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"❌ Database storage error: {e}")
    
    def get_analysis_stats(self) -> Dict[str, Any]:
        """Get real statistics from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Total analyses
            cursor.execute('SELECT COUNT(*) FROM ai_analysis')
            total_analyses = cursor.fetchone()[0]
            
            # Category distribution
            cursor.execute('SELECT category, COUNT(*) FROM ai_analysis GROUP BY category')
            categories = dict(cursor.fetchall())
            
            # Average confidence
            cursor.execute('SELECT AVG(confidence) FROM ai_analysis')
            avg_confidence = cursor.fetchone()[0] or 0
            
            # Recent analyses
            cursor.execute('''
                SELECT url, category, confidence, analysis_time 
                FROM ai_analysis 
                ORDER BY created_at DESC 
                LIMIT 5
            ''')
            recent = cursor.fetchall()
            
            conn.close()
            
            return {
                'total_analyses': total_analyses,
                'category_distribution': categories,
                'average_confidence': round(avg_confidence, 2),
                'recent_analyses': [
                    {
                        'url': r[0],
                        'category': r[1], 
                        'confidence': r[2],
                        'time': r[3]
                    } for r in recent
                ]
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'total_analyses': 0
            }

def test_real_ai():
    """Test real AI analyzer with actual content"""
    
    print("🧠 TESTING REAL AI ANALYZER")
    print("=" * 40)
    
    analyzer = RealAIAnalyzer()
    
    # Real test content (Persian legal text)
    test_content = """
    بسمه تعالی
    دادگاه عمومی تهران
    پرونده شماره ۱۴۰۳-۱۲۳۴
    
    در خصوص دادخواست آقای محمد احمدی علیه خانم فاطمه رضایی
    در خصوص مطالبه مبلغ ۵۰۰،۰۰۰،۰۰۰ ریال بابت نفقه معوقه
    
    با توجه به ماده ۱۱۰۸ قانون مدنی و مواد ۵۰ و ۵۱ قانون حمایت خانواده
    دادگاه پس از بررسی اوراق و مستندات ارائه شده و استماع اقوال طرفین
    
    رأی:
    محکوم است خوانده به پرداخت مبلغ ۳۰۰،۰۰۰،۰۰۰ ریال بابت نفقه معوقه
    تاریخ: ۱۴۰۳/۰۶/۱۵
    """
    
    # Analyze real content
    result = analyzer.analyze_content(test_content, "https://test-court.ir")
    
    print(f"📊 REAL ANALYSIS RESULTS:")
    print(f"✅ Success: {result.get('success')}")
    print(f"📝 Content Length: {result.get('content_length')}")
    print(f"🏷️ Primary Category: {result.get('primary_category')}")
    print(f"🎯 Confidence: {result.get('confidence')}")
    print(f"📈 Relevance Score: {result.get('relevance_score')}")
    print(f"🔍 Entities Found: {len(result.get('entities', {}))}")
    print(f"💬 Persian Words: {result.get('persian_word_count')}")
    
    # Show found entities
    entities = result.get('entities', {})
    if entities:
        print(f"\n🔍 EXTRACTED ENTITIES:")
        for entity_type, values in entities.items():
            print(f"   {entity_type}: {values}")
    
    # Show top keywords
    keywords = result.get('top_keywords', [])
    if keywords:
        print(f"\n💬 TOP KEYWORDS:")
        for kw in keywords[:5]:
            print(f"   {kw['word']}: {kw['frequency']} times")
    
    # Get real stats
    stats = analyzer.get_analysis_stats()
    print(f"\n📊 DATABASE STATS:")
    print(f"   Total Analyses: {stats.get('total_analyses')}")
    print(f"   Average Confidence: {stats.get('average_confidence')}")
    
    return result

if __name__ == "__main__":
    test_real_ai()