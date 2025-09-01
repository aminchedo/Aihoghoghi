"""
HuggingFace Optimized AI Classifier for Iranian Legal Archive System
Provides Persian BERT classification with fallback rule-based system
"""

import time
import ssl
import logging
import re
from typing import Dict, Any, List, Optional
from pathlib import Path
try:
    from hazm import Normalizer
    HAZM_AVAILABLE = True
except ImportError:
    HAZM_AVAILABLE = False
    logging.warning("hazm not available, Persian normalization disabled")
    
    # Fallback normalizer
    class Normalizer:
        def normalize(self, text):
            return text

try:
    import torch
    from transformers import pipeline, AutoTokenizer, AutoModel
    from sentence_transformers import SentenceTransformer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logging.warning("Transformers not available, using rule-based classification only")

from .legal_sources import OPTIMIZED_MODELS, COMPREHENSIVE_LEGAL_TERMS

logger = logging.getLogger(__name__)

# Enhanced paths
DATA_DIR = Path("/tmp/data")
MODELS_CACHE_PATH = DATA_DIR / "models_cache"
MODELS_CACHE_PATH.mkdir(parents=True, exist_ok=True)


class HuggingFaceOptimizedClassifier:
    """سیستم طبقه‌بندی بهینه‌شده برای Hugging Face"""
    
    def __init__(self, cache_system=None):
        self.cache_system = cache_system
        self.models = {}
        self.tokenizers = {}
        self.is_ready = False
        self.load_attempts = 0
        self.max_attempts = 2
        self.normalizer = Normalizer()
        
        # Enhanced legal categories
        self.enhanced_categories = {
            'قانون_اساسی': {
                'keywords': ['قانون اساسی', 'اصول اساسی', 'مجلس شورای اسلامی', 'شورای نگهبان', 'مجمع تشخیص'],
                'patterns': [r'اصل\s*\d+', r'قانون\s*اساسی'],
                'weight': 1.0,
                'min_confidence': 0.8
            },
            'قانون_عادی': {
                'keywords': ['قانون', 'مقررات', 'آیین‌نامه', 'ماده', 'تبصره', 'فصل', 'مصوبه'],
                'patterns': [r'ماده\s*\d+', r'تبصره\s*\d*', r'قانون\s+[آ-ی\s]{5,}'],
                'weight': 0.95,
                'min_confidence': 0.7
            },
            'دادنامه': {
                'keywords': ['دادنامه', 'رای', 'حکم', 'قرار', 'دادگاه', 'قاضی', 'محکمه'],
                'patterns': [r'دادنامه\s*شماره', r'رای\s*شماره', r'حکم\s*به'],
                'weight': 0.90,
                'min_confidence': 0.7
            },
            'رویه_قضایی': {
                'keywords': ['آرای وحدت رویه', 'دیوان عالی', 'تفسیر', 'رویه', 'نظریه مشورتی'],
                'patterns': [r'نظریه\s*شماره', r'رای\s*وحدت\s*رویه'],
                'weight': 0.85,
                'min_confidence': 0.6
            },
            'آگهی_قانونی': {
                'keywords': ['آگهی', 'اعلان', 'فراخوان', 'مناقصه', 'مزایده', 'روزنامه رسمی'],
                'patterns': [r'آگهی\s*شماره', r'اعلان\s*مناقصه'],
                'weight': 0.80,
                'min_confidence': 0.6
            }
        }
        
        if TRANSFORMERS_AVAILABLE:
            self._load_models_optimized()
        else:
            logger.warning("Using rule-based classification only")

    def _load_models_optimized(self):
        """بارگذاری بهینه مدل‌ها برای HF"""
        self.load_attempts += 1
        logger.info(f"Loading optimized models (attempt {self.load_attempts})...")
        
        try:
            # Disable SSL temporarily for model downloads
            original_ssl_context = ssl._create_default_https_context
            ssl._create_default_https_context = ssl._create_unverified_context
            
            try:
                # Load embedding model (lightweight)
                self.models['embedder'] = SentenceTransformer(
                    OPTIMIZED_MODELS['embedding']['primary'],
                    device='cpu',
                    cache_folder=str(MODELS_CACHE_PATH),
                    trust_remote_code=True
                )
                logger.info("✅ Embedding model loaded")
                
                # Load classification model with fallbacks
                for model_type in ['primary', 'fallback', 'lightweight']:
                    try:
                        model_name = OPTIMIZED_MODELS['classification'][model_type]
                        self.models['classifier'] = pipeline(
                            "text-classification",
                            model=model_name,
                            device=-1,  # CPU only
                            max_length=512,
                            truncation=True,
                            trust_remote_code=True,
                            model_kwargs={"torch_dtype": torch.float32}
                        )
                        
                        # Load tokenizer separately for better control
                        self.tokenizers['classifier'] = AutoTokenizer.from_pretrained(
                            model_name,
                            trust_remote_code=True,
                            cache_dir=str(MODELS_CACHE_PATH)
                        )
                        
                        logger.info(f"✅ Classification model loaded: {model_type}")
                        break
                        
                    except Exception as e:
                        logger.warning(f"Failed to load {model_type} classifier: {e}")
                        if model_type == 'lightweight':  # Last attempt
                            raise e
                
                self.is_ready = True
                logger.info("🎯 HF-optimized classification system ready")
                
            finally:
                ssl._create_default_https_context = original_ssl_context
                
        except Exception as e:
            logger.error(f"Model loading failed (attempt {self.load_attempts}): {e}")
            if self.load_attempts < self.max_attempts:
                logger.info("Retrying model loading...")
                time.sleep(10)
                self._load_models_optimized()
            else:
                logger.error("Model loading permanently failed, using rule-based only")
                self.is_ready = False

    def classify_document_enhanced(self, content: str, source_info: Dict = None) -> Dict[str, Any]:
        """طبقه‌بندی پیشرفته سند"""
        if not content or not content.strip():
            return {'error': 'Empty content', 'classification': 'نامشخص'}
        
        start_time = time.time()
        result = {'status': 'processing', 'models_used': []}
        
        try:
            # نرمال‌سازی محتوا
            normalized_content = self.normalizer.normalize(content)
            
            # محدود کردن محتوا برای پردازش
            words = normalized_content.split()
            if len(words) > 400:
                sample_content = ' '.join(words[:400])
            else:
                sample_content = normalized_content
            
            # طبقه‌بندی مبتنی بر قوانین (همیشه فعال)
            rule_result = self._enhanced_rule_based_classify(normalized_content, source_info)
            result['rule_based'] = rule_result
            result['models_used'].append('rule_based')
            
            # طبقه‌بندی با مدل transformer (در صورت آمادگی)
            if self.is_ready and 'classifier' in self.models:
                try:
                    transformer_result = self.models['classifier'](sample_content)
                    result['transformer'] = transformer_result[:3]  # Top 3 predictions
                    result['models_used'].append('transformer')
                except Exception as e:
                    logger.warning(f"Transformer classification failed: {e}")
                    result['transformer_error'] = str(e)
            
            # ترکیب نتایج و انتخاب بهترین
            final_classification = self._combine_classification_results(result, source_info)
            result.update(final_classification)
            
            result['processing_time'] = time.time() - start_time
            result['status'] = 'completed'
            
            return result
            
        except Exception as e:
            logger.error(f"Classification error: {e}")
            return {
                'error': str(e),
                'classification': 'خطا',
                'confidence': 0.0,
                'status': 'error',
                'processing_time': time.time() - start_time
            }

    def _enhanced_rule_based_classify(self, content: str, source_info: Dict = None) -> Dict[str, Any]:
        """طبقه‌بندی پیشرفته مبتنی بر قوانین"""
        scores = {}
        
        # امتیازدهی بر اساس منبع
        if source_info:
            source_category = source_info.get('category', '')
            if source_category in self.enhanced_categories:
                scores[source_category] = 0.3  # امتیاز پایه از منبع
        
        # امتیازدهی بر اساس کلمات کلیدی و الگوها
        for category, config in self.enhanced_categories.items():
            category_score = scores.get(category, 0.0)
            
            # امتیاز کلمات کلیدی
            keyword_matches = sum(1 for keyword in config['keywords'] 
                                if keyword in content)
            if keyword_matches > 0:
                category_score += (keyword_matches / len(config['keywords'])) * 0.4
            
            # امتیاز الگوها
            pattern_matches = sum(1 for pattern in config['patterns'] 
                                if re.search(pattern, content))
            if pattern_matches > 0:
                category_score += (pattern_matches / len(config['patterns'])) * 0.3
            
            # اعمال وزن
            scores[category] = category_score * config['weight']
        
        # انتخاب بهترین دسته
        if scores:
            best_category = max(scores.keys(), key=lambda k: scores[k])
            best_score = scores[best_category]
            min_confidence = self.enhanced_categories[best_category]['min_confidence']
            
            if best_score >= min_confidence:
                return {
                    'classification': best_category,
                    'confidence': min(best_score, 1.0),
                    'all_scores': scores,
                    'method': 'rule_based'
                }
        
        # پیش‌فرض
        return {
            'classification': 'نامشخص',
            'confidence': 0.1,
            'all_scores': scores,
            'method': 'rule_based'
        }

    def _combine_classification_results(self, results: Dict, source_info: Dict = None) -> Dict[str, Any]:
        """ترکیب نتایج طبقه‌بندی از منابع مختلف"""
        rule_result = results.get('rule_based', {})
        transformer_result = results.get('transformer', [])
        
        # اگر فقط rule-based داریم
        if not transformer_result:
            return {
                'classification': rule_result.get('classification', 'نامشخص'),
                'confidence': rule_result.get('confidence', 0.1),
                'method': 'rule_based_only'
            }
        
        # ترکیب نتایج
        rule_confidence = rule_result.get('confidence', 0.0)
        transformer_confidence = transformer_result[0].get('score', 0.0) if transformer_result else 0.0
        
        # اگر rule-based اعتماد بالایی دارد، آن را انتخاب کن
        if rule_confidence > 0.7:
            return {
                'classification': rule_result.get('classification'),
                'confidence': rule_confidence,
                'method': 'rule_based_high_confidence',
                'transformer_backup': transformer_result[0] if transformer_result else None
            }
        
        # اگر transformer اعتماد بالایی دارد
        if transformer_confidence > 0.8:
            return {
                'classification': self._map_transformer_label(transformer_result[0]['label']),
                'confidence': transformer_confidence,
                'method': 'transformer_high_confidence',
                'rule_backup': rule_result
            }
        
        # ترکیب وزن‌دار
        combined_confidence = (rule_confidence * 0.6) + (transformer_confidence * 0.4)
        
        if rule_confidence >= transformer_confidence:
            return {
                'classification': rule_result.get('classification'),
                'confidence': combined_confidence,
                'method': 'combined_rule_preferred'
            }
        else:
            return {
                'classification': self._map_transformer_label(transformer_result[0]['label']),
                'confidence': combined_confidence,
                'method': 'combined_transformer_preferred'
            }

    def _map_transformer_label(self, label: str) -> str:
        """نگاشت برچسب‌های مدل transformer به دسته‌های محلی"""
        # نگاشت احتمالی برچسب‌های انگلیسی به فارسی
        mapping = {
            'LEGAL': 'قانون_عادی',
            'CONSTITUTIONAL': 'قانون_اساسی',
            'JUDGMENT': 'دادنامه',
            'REGULATION': 'مقررات',
            'NOTICE': 'آگهی_قانونی',
            'PROCEDURE': 'رویه_قضایی'
        }
        
        return mapping.get(label, label)

    def generate_embeddings(self, text: str) -> Optional[List[float]]:
        """تولید embeddings برای متن"""
        if not self.is_ready or 'embedder' not in self.models:
            return None
        
        try:
            # محدود کردن طول متن
            words = text.split()
            if len(words) > 300:
                text = ' '.join(words[:300])
            
            embeddings = self.models['embedder'].encode(text, convert_to_numpy=True)
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return None

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """محاسبه شباهت بین دو متن"""
        try:
            if not self.is_ready or 'embedder' not in self.models:
                # Fallback to simple word overlap
                return self._simple_similarity(text1, text2)
            
            embeddings = self.models['embedder'].encode([text1, text2])
            similarity = self.models['embedder'].similarity(embeddings[0:1], embeddings[1:2])
            return float(similarity[0][0])
            
        except Exception as e:
            logger.error(f"Similarity calculation failed: {e}")
            return self._simple_similarity(text1, text2)

    def _simple_similarity(self, text1: str, text2: str) -> float:
        """محاسبه شباهت ساده بر اساس کلمات مشترک"""
        try:
            words1 = set(text1.split())
            words2 = set(text2.split())
            
            if not words1 or not words2:
                return 0.0
            
            intersection = words1.intersection(words2)
            union = words1.union(words2)
            
            return len(intersection) / len(union) if union else 0.0
            
        except Exception as e:
            logger.error(f"Simple similarity calculation failed: {e}")
            return 0.0

    def extract_legal_entities(self, content: str) -> Dict[str, List[str]]:
        """استخراج موجودیت‌های حقوقی از متن"""
        entities = {
            'laws': [],
            'articles': [],
            'courts': [],
            'judges': [],
            'cases': [],
            'dates': [],
            'amounts': []
        }
        
        try:
            # استخراج شماره مواد
            articles = re.findall(r'ماده\s*(\d+)', content)
            entities['articles'] = list(set(articles))
            
            # استخراج قوانین
            laws = re.findall(r'قانون\s+([آ-ی\s]{5,30})', content)
            entities['laws'] = list(set(laws))
            
            # استخراج دادگاه‌ها
            courts = re.findall(r'دادگاه\s+([آ-ی\s]{5,30})', content)
            entities['courts'] = list(set(courts))
            
            # استخراج تاریخ‌ها
            dates = re.findall(r'\d{4}/\d{1,2}/\d{1,2}|\d{1,2}/\d{1,2}/\d{4}', content)
            entities['dates'] = list(set(dates))
            
            # استخراج مبالغ
            amounts = re.findall(r'\d+(?:،\d{3})*\s*(?:ریال|تومان|درهم)', content)
            entities['amounts'] = list(set(amounts))
            
            return entities
            
        except Exception as e:
            logger.error(f"Entity extraction failed: {e}")
            return entities

    def get_model_status(self) -> Dict[str, Any]:
        """دریافت وضعیت مدل‌ها"""
        return {
            'is_ready': self.is_ready,
            'transformers_available': TRANSFORMERS_AVAILABLE,
            'load_attempts': self.load_attempts,
            'models_loaded': list(self.models.keys()),
            'cache_path': str(MODELS_CACHE_PATH),
            'categories_count': len(self.enhanced_categories)
        }