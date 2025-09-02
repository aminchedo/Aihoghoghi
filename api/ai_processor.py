#!/usr/bin/env python3
"""
AI Processor Module - HuggingFace Persian BERT Integration
Real implementation for Persian legal document analysis
"""

import logging
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from collections import Counter
import sqlite3

# Try to import transformers for real HuggingFace integration
try:
    from transformers import AutoTokenizer, AutoModel, pipeline
    import torch
    HF_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("✅ HuggingFace transformers available")
except ImportError:
    HF_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ HuggingFace transformers not available - using fallback")

class PersianLegalAIProcessor:
    def __init__(self):
        """Initialize Persian legal AI processor"""
        
        self.model_name = "HooshvareLab/bert-fa-base-uncased"  # Real Persian BERT model
        self.tokenizer = None
        self.model = None
        self.classifier = None
        
        # Initialize HuggingFace models if available
        if HF_AVAILABLE:
            try:
                self.initialize_hf_models()
            except Exception as e:
                logger.error(f"HuggingFace model initialization failed: {e}")
                HF_AVAILABLE = False
        
        # Persian legal knowledge base
        self.legal_categories = {
            'قضایی': {
                'keywords': ['دادگاه', 'قاضی', 'حکم', 'رأی', 'دادرسی', 'محاکمه', 'دادستان', 
                           'شاکی', 'متهم', 'وکیل', 'دادخواست', 'اعتراض', 'تجدیدنظر', 'دیوان عالی'],
                'weight': 1.0
            },
            'اداری': {
                'keywords': ['وزارت', 'سازمان', 'اداره', 'مدیریت', 'خدمات', 'مقررات',
                           'بخشنامه', 'دستورالعمل', 'آیین‌نامه', 'مصوبه', 'تصویب', 'هیئت وزیران'],
                'weight': 1.0
            },
            'قانونی': {
                'keywords': ['قانون', 'ماده', 'بند', 'تبصره', 'مجلس', 'شورا', 'اصل',
                           'فصل', 'باب', 'قسمت', 'لایحه', 'طرح', 'قانون اساسی'],
                'weight': 1.2
            },
            'مالی': {
                'keywords': ['مالیات', 'بودجه', 'درآمد', 'هزینه', 'پرداخت', 'حقوق',
                           'دستمزد', 'تأمین اجتماعی', 'بیمه', 'صندوق', 'بانک مرکزی'],
                'weight': 1.1
            },
            'املاک': {
                'keywords': ['ملک', 'زمین', 'ساختمان', 'سند', 'ثبت', 'انتقال',
                           'مالکیت', 'اجاره', 'فروش', 'خرید', 'رهن', 'وثیقه'],
                'weight': 1.0
            },
            'خانواده': {
                'keywords': ['ازدواج', 'طلاق', 'نفقه', 'حضانت', 'ارث', 'وصیت',
                           'مهریه', 'خانواده', 'فرزند', 'والدین', 'نسب'],
                'weight': 1.0
            },
            'کیفری': {
                'keywords': ['جرم', 'مجازات', 'حبس', 'جزا', 'تعزیر', 'قصاص', 'دیه',
                           'سرقت', 'کلاهبرداری', 'قتل', 'ضرب و جرح', 'مواد مخدر'],
                'weight': 1.1
            }
        }
        
        # Entity extraction patterns
        self.entity_patterns = {
            'تاریخ_شمسی': r'\d{4}/\d{1,2}/\d{1,2}',
            'تاریخ_میلادی': r'\d{1,2}/\d{1,2}/\d{4}',
            'شماره_پرونده': r'پرونده\s*شماره\s*[\d\-/]+|شماره\s*[\d\-/]+',
            'مبلغ_ریال': r'\d+\s*ریال',
            'مبلغ_تومان': r'\d+\s*تومان',
            'کد_ملی': r'\d{10}',
            'شماره_تلفن': r'0\d{10}',
            'نام_شخص': r'آقای\s+\w+|خانم\s+\w+|جناب\s+\w+',
            'نام_شرکت': r'شرکت\s+[\w\s]+|موسسه\s+[\w\s]+',
            'آدرس': r'تهران|اصفهان|مشهد|شیراز|تبریز|کرج|قم|اهواز',
        }
        
        # Confidence thresholds
        self.confidence_thresholds = {
            'high': 0.8,
            'medium': 0.6,
            'low': 0.4
        }
    
    def initialize_hf_models(self):
        """Initialize HuggingFace models for real AI processing"""
        try:
            logger.info("🤖 Initializing HuggingFace Persian BERT models...")
            
            # Load Persian BERT tokenizer and model
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            
            # Create text classification pipeline
            self.classifier = pipeline(
                "text-classification",
                model=self.model_name,
                tokenizer=self.tokenizer,
                return_all_scores=True
            )
            
            logger.info("✅ HuggingFace models initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ HuggingFace model initialization failed: {e}")
            raise
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Comprehensive text analysis using AI and rule-based methods"""
        
        if not text or len(text.strip()) < 10:
            return {
                'error': 'Text too short for analysis',
                'confidence': 0.0,
                'timestamp': datetime.now().isoformat()
            }
        
        analysis_result = {
            'original_text': text[:500],  # First 500 chars for reference
            'text_length': len(text),
            'analysis_method': 'hybrid',
            'timestamp': datetime.now().isoformat()
        }
        
        # Method 1: HuggingFace AI Analysis (if available)
        if HF_AVAILABLE and self.classifier:
            try:
                hf_analysis = self.hf_analyze_text(text)
                analysis_result.update(hf_analysis)
                analysis_result['analysis_method'] = 'huggingface_bert'
                logger.info("🤖 Used HuggingFace BERT for analysis")
            except Exception as e:
                logger.warning(f"HuggingFace analysis failed: {e}")
                # Fall back to rule-based
                rule_analysis = self.rule_based_analysis(text)
                analysis_result.update(rule_analysis)
        else:
            # Method 2: Advanced Rule-Based Analysis
            rule_analysis = self.rule_based_analysis(text)
            analysis_result.update(rule_analysis)
            analysis_result['analysis_method'] = 'rule_based'
            logger.info("📋 Used rule-based analysis")
        
        # Method 3: Entity Extraction
        entities = self.extract_entities(text)
        analysis_result['entities'] = entities
        
        # Method 4: Confidence Calculation
        confidence = self.calculate_confidence(analysis_result)
        analysis_result['confidence'] = confidence
        
        # Method 5: Generate Summary
        summary = self.generate_summary(text, analysis_result)
        analysis_result['summary'] = summary
        
        return analysis_result
    
    def hf_analyze_text(self, text: str) -> Dict[str, Any]:
        """Real HuggingFace BERT analysis"""
        
        # Truncate text to model limits
        max_length = 512
        if len(text) > max_length:
            text = text[:max_length]
        
        # Get model predictions
        predictions = self.classifier(text)
        
        # Process predictions
        categories = []
        for pred in predictions[0]:  # First result
            if pred['score'] > 0.1:  # Minimum threshold
                categories.append({
                    'category': pred['label'],
                    'confidence': pred['score']
                })
        
        # Sort by confidence
        categories.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'hf_predictions': categories,
            'primary_category': categories[0]['category'] if categories else 'نامشخص',
            'hf_confidence': categories[0]['confidence'] if categories else 0.0,
            'model_used': self.model_name
        }
    
    def rule_based_analysis(self, text: str) -> Dict[str, Any]:
        """Advanced rule-based analysis for Persian legal text"""
        
        text_lower = text.lower()
        category_scores = {}
        found_keywords = {}
        
        # Calculate category scores
        for category, data in self.legal_categories.items():
            score = 0
            keywords_found = []
            
            for keyword in data['keywords']:
                # Count keyword occurrences
                count = text_lower.count(keyword.lower())
                if count > 0:
                    score += count * data['weight']
                    keywords_found.append(keyword)
            
            if score > 0:
                category_scores[category] = score
                found_keywords[category] = keywords_found
        
        # Determine primary category
        if category_scores:
            primary_category = max(category_scores, key=category_scores.get)
            max_score = category_scores[primary_category]
            
            # Normalize confidence (0-1 scale)
            confidence = min(max_score / 10.0, 1.0)
        else:
            primary_category = 'نامشخص'
            confidence = 0.0
        
        return {
            'primary_category': primary_category,
            'category_scores': category_scores,
            'keywords_found': found_keywords,
            'rule_confidence': confidence,
            'total_keywords': sum(len(kw) for kw in found_keywords.values())
        }
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract legal entities from text using regex patterns"""
        
        entities = {}
        
        for entity_type, pattern in self.entity_patterns.items():
            matches = re.findall(pattern, text)
            if matches:
                # Remove duplicates and limit results
                unique_matches = list(set(matches))[:10]
                entities[entity_type] = unique_matches
        
        return entities
    
    def calculate_confidence(self, analysis: Dict[str, Any]) -> float:
        """Calculate overall confidence score for the analysis"""
        
        confidence_factors = []
        
        # Factor 1: HuggingFace confidence (if available)
        if 'hf_confidence' in analysis:
            confidence_factors.append(analysis['hf_confidence'] * 0.6)
        
        # Factor 2: Rule-based confidence
        if 'rule_confidence' in analysis:
            confidence_factors.append(analysis['rule_confidence'] * 0.4)
        
        # Factor 3: Entity extraction success
        entity_count = len(analysis.get('entities', {}))
        entity_confidence = min(entity_count / 5.0, 1.0) * 0.2
        confidence_factors.append(entity_confidence)
        
        # Factor 4: Text length adequacy
        text_length = analysis.get('text_length', 0)
        length_confidence = min(text_length / 1000.0, 1.0) * 0.1
        confidence_factors.append(length_confidence)
        
        # Calculate weighted average
        if confidence_factors:
            final_confidence = sum(confidence_factors) / len(confidence_factors)
        else:
            final_confidence = 0.0
        
        return round(final_confidence, 3)
    
    def generate_summary(self, text: str, analysis: Dict[str, Any]) -> str:
        """Generate analysis summary in Persian"""
        
        category = analysis.get('primary_category', 'نامشخص')
        confidence = analysis.get('confidence', 0.0)
        entities = analysis.get('entities', {})
        
        summary_parts = []
        
        # Category summary
        summary_parts.append(f"این سند در دسته «{category}» طبقه‌بندی شده است")
        
        # Confidence summary
        if confidence > 0.8:
            summary_parts.append("با اطمینان بالا")
        elif confidence > 0.6:
            summary_parts.append("با اطمینان متوسط")
        else:
            summary_parts.append("با اطمینان پایین")
        
        # Entity summary
        if entities:
            entity_summary = []
            for entity_type, values in entities.items():
                if values:
                    entity_summary.append(f"{len(values)} {entity_type}")
            
            if entity_summary:
                summary_parts.append(f"شامل {', '.join(entity_summary)}")
        
        # Keywords summary
        if 'keywords_found' in analysis:
            total_keywords = sum(len(kw) for kw in analysis['keywords_found'].values())
            if total_keywords > 0:
                summary_parts.append(f"با {total_keywords} کلمه کلیدی حقوقی")
        
        return '. '.join(summary_parts) + '.'
    
    async def batch_analyze(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze multiple documents efficiently"""
        
        results = []
        
        for i, doc in enumerate(documents):
            try:
                logger.info(f"🔍 Analyzing document {i+1}/{len(documents)}")
                
                content = doc.get('content', '')
                if isinstance(content, str):
                    text = content
                else:
                    # Handle JSON content
                    text = json.dumps(content, ensure_ascii=False)
                
                analysis = self.analyze_text(text)
                analysis['document_id'] = doc.get('id')
                analysis['document_title'] = doc.get('title', 'بدون عنوان')
                
                results.append(analysis)
                
                # Small delay to prevent overwhelming
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error analyzing document {i+1}: {e}")
                results.append({
                    'document_id': doc.get('id'),
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })
        
        return results
    
    def get_category_statistics(self) -> Dict[str, Any]:
        """Get statistics about categorized documents"""
        
        try:
            conn = sqlite3.connect('/workspace/real_legal_archive.db')
            cursor = conn.cursor()
            
            # Get category distribution
            cursor.execute("""
                SELECT category, COUNT(*) as count 
                FROM scraped_documents 
                WHERE category IS NOT NULL 
                GROUP BY category
            """)
            
            category_stats = dict(cursor.fetchall())
            
            # Get analysis statistics
            cursor.execute("""
                SELECT AVG(confidence) as avg_confidence, COUNT(*) as total_analyzed
                FROM ai_analysis
            """)
            
            stats = cursor.fetchone()
            avg_confidence = stats[0] if stats[0] else 0.0
            total_analyzed = stats[1] if stats[1] else 0
            
            conn.close()
            
            return {
                'category_distribution': category_stats,
                'total_categories': len(category_stats),
                'total_analyzed': total_analyzed,
                'average_confidence': round(avg_confidence, 3),
                'most_common_category': max(category_stats, key=category_stats.get) if category_stats else 'نامشخص'
            }
            
        except Exception as e:
            logger.error(f"Statistics error: {e}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# Global processor instance
ai_processor = PersianLegalAIProcessor()

async def run_ai_analysis() -> Dict[str, Any]:
    """Main function for running AI analysis operation"""
    
    try:
        logger.info("🤖 Starting AI analysis operation")
        
        # Get unprocessed documents from database
        conn = sqlite3.connect('/workspace/real_legal_archive.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, content 
            FROM scraped_documents 
            WHERE processed = FALSE 
            LIMIT 20
        """)
        
        documents = []
        for row in cursor.fetchall():
            documents.append({
                'id': row[0],
                'title': row[1],
                'content': row[2]
            })
        
        conn.close()
        
        if not documents:
            return {
                'success': True,
                'message': 'No unprocessed documents found',
                'analyzed_count': 0,
                'timestamp': datetime.now().isoformat()
            }
        
        # Perform batch analysis
        analysis_results = await ai_processor.batch_analyze(documents)
        
        # Store results in database
        conn = sqlite3.connect('/workspace/real_legal_archive.db')
        cursor = conn.cursor()
        
        successful_analyses = 0
        for result in analysis_results:
            if 'error' not in result:
                doc_id = result['document_id']
                
                cursor.execute('''
                    INSERT INTO ai_analysis (document_id, analysis_result, confidence, categories, entities)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    doc_id,
                    json.dumps(result, ensure_ascii=False),
                    result.get('confidence', 0.0),
                    json.dumps([result.get('primary_category', 'نامشخص')], ensure_ascii=False),
                    json.dumps(result.get('entities', {}), ensure_ascii=False)
                ))
                
                # Update document as processed
                cursor.execute("UPDATE scraped_documents SET processed = TRUE WHERE id = ?", (doc_id,))
                
                successful_analyses += 1
        
        conn.commit()
        conn.close()
        
        # Get category statistics
        category_stats = ai_processor.get_category_statistics()
        
        return {
            'success': True,
            'analyzed_count': successful_analyses,
            'total_documents': len(documents),
            'accuracy': f"{int((successful_analyses / len(documents)) * 100)}%" if documents else "0%",
            'categories_found': category_stats.get('total_categories', 0),
            'analysis_results': [
                {
                    'category': r.get('primary_category', 'نامشخص'),
                    'confidence': int(r.get('confidence', 0) * 100),
                    'keywords': list(r.get('keywords_found', {}).get(r.get('primary_category', ''), []))[:5]
                }
                for r in analysis_results if 'error' not in r
            ][:10],  # Limit results for display
            'category_statistics': category_stats,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI analysis operation error: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

if __name__ == "__main__":
    # Test the AI processor
    import asyncio
    
    async def test_ai_processor():
        processor = PersianLegalAIProcessor()
        
        # Test text
        test_text = """
        دادگاه عالی کشور در پرونده شماره 1400/123 رأی داد که متهم به پرداخت 
        1000000 تومان جریمه محکوم است. این حکم در تاریخ 1400/05/15 صادر شده است.
        """
        
        result = processor.analyze_text(test_text)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    asyncio.run(test_ai_processor())