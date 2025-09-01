"""
Ultra Advanced Scoring System for Iranian Legal Archive System
Provides comprehensive content quality evaluation and scoring
"""

import re
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from hazm import Normalizer

logger = logging.getLogger(__name__)


class UltraAdvancedScoringSystem:
    """سیستم امتیازدهی پیشرفته برای کیفیت محتوا"""
    
    def __init__(self):
        self.normalizer = Normalizer()
        
        # وزن‌های مختلف معیارهای کیفیت
        self.weights = {
            'content_quality': 0.25,
            'structure_quality': 0.20,
            'legal_relevance': 0.20,
            'source_reliability': 0.15,
            'completeness': 0.10,
            'readability': 0.10
        }
        
        # الگوهای حقوقی برای تشخیص محتوای مرتبط
        self.legal_patterns = {
            'high_value': [
                r'ماده\s+\d+',
                r'تبصره\s*\d*',
                r'فصل\s+\d+',
                r'باب\s+\d+',
                r'قانون\s+[آ-ی\s]{5,}',
                r'دادنامه\s+شماره',
                r'رای\s+شماره',
                r'حکم\s+به'
            ],
            'medium_value': [
                r'مقررات',
                r'آیین\s*نامه',
                r'دستورالعمل',
                r'بخشنامه',
                r'اعلامیه',
                r'ابلاغیه'
            ],
            'indicators': [
                r'مجلس\s+شورای\s+اسلامی',
                r'قوه\s+قضاییه',
                r'شورای\s+نگهبان',
                r'دیوان\s+عالی',
                r'دادگاه\s+',
                r'دادستان'
            ]
        }
        
        # الگوهای نویز که کیفیت را کاهش می‌دهند
        self.noise_patterns = [
            r'کپی\s*رایت',
            r'تمامی\s+حقوق\s+محفوظ',
            r'کلیک\s+کنید',
            r'دانلود\s+فایل',
            r'مشاهده\s+بیشتر',
            r'ادامه\s+مطلب',
            r'صفحه\s+اصلی',
            r'منوی\s+اصلی',
            r'جستجو\s+در\s+سایت'
        ]
        
        logger.info("Ultra Advanced Scoring System initialized")

    def calculate_comprehensive_score(self, content: str, title: str = "", 
                                    source_info: Dict = None, metadata: Dict = None,
                                    processing_metrics: Dict = None) -> Dict[str, Any]:
        """محاسبه امتیاز جامع کیفیت محتوا"""
        try:
            if not content or not content.strip():
                return self._create_zero_score("Empty content")
            
            # نرمال‌سازی محتوا
            normalized_content = self.normalizer.normalize(content)
            
            # محاسبه امتیازهای جزئی
            scores = {}
            
            # 1. کیفیت محتوا (25%)
            scores['content_quality'] = self._evaluate_content_quality(normalized_content)
            
            # 2. کیفیت ساختار (20%)
            scores['structure_quality'] = self._evaluate_structure_quality(normalized_content, title)
            
            # 3. مرتبط بودن حقوقی (20%)
            scores['legal_relevance'] = self._evaluate_legal_relevance(normalized_content)
            
            # 4. قابلیت اعتماد منبع (15%)
            scores['source_reliability'] = self._evaluate_source_reliability(source_info)
            
            # 5. کامل بودن (10%)
            scores['completeness'] = self._evaluate_completeness(normalized_content, metadata)
            
            # 6. خوانایی (10%)
            scores['readability'] = self._evaluate_readability(normalized_content)
            
            # محاسبه امتیاز نهایی
            final_score = sum(scores[key] * self.weights[key] for key in scores)
            
            # اعمال جریمه‌ها
            penalties = self._calculate_penalties(normalized_content, processing_metrics)
            final_score = max(0, final_score - penalties['total'])
            
            # اعمال پاداش‌ها
            bonuses = self._calculate_bonuses(normalized_content, source_info, processing_metrics)
            final_score = min(100, final_score + bonuses['total'])
            
            # تعیین رتبه کیفیت
            quality_grade = self._determine_quality_grade(final_score)
            
            return {
                'final_score': round(final_score, 2),
                'quality_grade': quality_grade,
                'detailed_scores': {k: round(v, 2) for k, v in scores.items()},
                'penalties': penalties,
                'bonuses': bonuses,
                'recommendations': self._generate_recommendations(scores, final_score),
                'evaluation_timestamp': datetime.now().isoformat(),
                'content_length': len(normalized_content),
                'word_count': len(normalized_content.split())
            }
            
        except Exception as e:
            logger.error(f"Scoring error: {e}")
            return self._create_zero_score(f"Scoring error: {str(e)}")

    def _evaluate_content_quality(self, content: str) -> float:
        """ارزیابی کیفیت محتوا"""
        score = 0.0
        word_count = len(content.split())
        
        # امتیاز طول مناسب
        if 100 <= word_count <= 2000:
            score += 30
        elif 50 <= word_count < 100:
            score += 25
        elif 2000 < word_count <= 5000:
            score += 20
        elif word_count > 5000:
            score += 15
        else:
            score += 5
        
        # امتیاز تراکم اطلاعات
        unique_words = len(set(content.split()))
        if word_count > 0:
            uniqueness_ratio = unique_words / word_count
            score += uniqueness_ratio * 20
        
        # امتیاز وجود اعداد و تاریخ‌ها (نشان‌دهنده جزئیات)
        numbers = len(re.findall(r'\d+', content))
        dates = len(re.findall(r'\d{4}/\d{1,2}/\d{1,2}|\d{1,2}/\d{1,2}/\d{4}', content))
        score += min((numbers + dates * 2) / 10, 15)
        
        # کسر امتیاز برای محتوای تکراری
        sentences = content.split('.')
        unique_sentences = len(set(sentences))
        if len(sentences) > 0:
            repetition_penalty = (1 - unique_sentences / len(sentences)) * 10
            score -= repetition_penalty
        
        return max(0, min(100, score))

    def _evaluate_structure_quality(self, content: str, title: str) -> float:
        """ارزیابی کیفیت ساختار"""
        score = 0.0
        
        # امتیاز وجود عنوان
        if title and len(title.strip()) > 5:
            score += 20
        
        # امتیاز ساختار پاراگرافی
        paragraphs = [p.strip() for p in content.split('\n') if p.strip()]
        if len(paragraphs) > 1:
            score += 15
            # امتیاز تعادل پاراگراف‌ها
            avg_para_length = sum(len(p.split()) for p in paragraphs) / len(paragraphs)
            if 20 <= avg_para_length <= 100:
                score += 10
        
        # امتیاز وجود فهرست یا شماره‌گذاری
        numbered_items = len(re.findall(r'^\d+[.\)]', content, re.MULTILINE))
        if numbered_items > 0:
            score += min(numbered_items * 2, 15)
        
        # امتیاز استفاده از علائم نگارشی
        punctuation_score = 0
        punctuation_marks = ['.', '،', '؛', ':', '؟', '!']
        for mark in punctuation_marks:
            if mark in content:
                punctuation_score += 2
        score += min(punctuation_score, 10)
        
        # امتیاز سازماندهی منطقی
        if any(word in content for word in ['اول', 'دوم', 'سوم', 'نخست', 'دومین']):
            score += 10
        
        return max(0, min(100, score))

    def _evaluate_legal_relevance(self, content: str) -> float:
        """ارزیابی مرتبط بودن با موضوعات حقوقی"""
        score = 0.0
        
        # امتیاز الگوهای حقوقی پرارزش
        high_value_matches = sum(1 for pattern in self.legal_patterns['high_value'] 
                               if re.search(pattern, content))
        score += min(high_value_matches * 8, 40)
        
        # امتیاز الگوهای متوسط
        medium_value_matches = sum(1 for pattern in self.legal_patterns['medium_value'] 
                                 if re.search(pattern, content))
        score += min(medium_value_matches * 5, 25)
        
        # امتیاز نشانگرهای حقوقی
        indicator_matches = sum(1 for pattern in self.legal_patterns['indicators'] 
                              if re.search(pattern, content))
        score += min(indicator_matches * 3, 15)
        
        # امتیاز اصطلاحات تخصصی
        legal_terms = ['حقوق', 'قانون', 'مقررات', 'دادگاه', 'قاضی', 'وکیل', 'دادستان']
        term_matches = sum(1 for term in legal_terms if term in content)
        score += min(term_matches * 2, 10)
        
        # امتیاز ارجاعات قانونی
        references = len(re.findall(r'مطابق\s+(?:ماده|قانون|مقررات)', content))
        score += min(references * 3, 10)
        
        return max(0, min(100, score))

    def _evaluate_source_reliability(self, source_info: Dict) -> float:
        """ارزیابی قابلیت اعتماد منبع"""
        if not source_info:
            return 50.0  # امتیاز متوسط برای منابع نامشخص
        
        score = 0.0
        
        # امتیاز بر اساس رتبه منبع
        reliability = source_info.get('reliability_score', 0.5)
        score += reliability * 60
        
        # امتیاز اولویت منبع
        priority = source_info.get('priority', 3)
        if priority == 1:
            score += 25
        elif priority == 2:
            score += 15
        elif priority == 3:
            score += 5
        
        # امتیاز رسمی بودن
        if source_info.get('category') in ['قانون', 'دادنامه']:
            score += 15
        
        return max(0, min(100, score))

    def _evaluate_completeness(self, content: str, metadata: Dict) -> float:
        """ارزیابی کامل بودن محتوا"""
        score = 50.0  # امتیاز پایه
        
        # امتیاز وجود متادیتا
        if metadata:
            if metadata.get('description'):
                score += 10
            if metadata.get('keywords'):
                score += 10
            if metadata.get('author'):
                score += 5
        
        # امتیاز وجود جزئیات
        if 'تاریخ' in content or 'شماره' in content:
            score += 10
        
        # امتیاز وجود نتیجه‌گیری یا خلاصه
        conclusion_indicators = ['نتیجه', 'خلاصه', 'در نهایت', 'بنابراین']
        if any(indicator in content for indicator in conclusion_indicators):
            score += 15
        
        return max(0, min(100, score))

    def _evaluate_readability(self, content: str) -> float:
        """ارزیابی خوانایی متن"""
        score = 0.0
        
        sentences = [s.strip() for s in re.split(r'[.!?]', content) if s.strip()]
        words = content.split()
        
        if not sentences or not words:
            return 0.0
        
        # امتیاز طول متوسط جمله
        avg_sentence_length = len(words) / len(sentences)
        if 10 <= avg_sentence_length <= 25:
            score += 30
        elif 5 <= avg_sentence_length < 10 or 25 < avg_sentence_length <= 35:
            score += 20
        else:
            score += 10
        
        # امتیاز استفاده از کلمات ساده
        simple_words = sum(1 for word in words if len(word) <= 6)
        simple_ratio = simple_words / len(words)
        score += simple_ratio * 20
        
        # امتیاز تنوع واژگان
        unique_words = len(set(words))
        vocabulary_diversity = unique_words / len(words)
        score += vocabulary_diversity * 25
        
        # امتیاز استفاده صحیح از علائم نگارشی
        punctuation_density = len(re.findall(r'[.،؛:؟!]', content)) / len(words)
        if 0.05 <= punctuation_density <= 0.15:
            score += 15
        
        # کسر امتیاز برای جملات خیلی طولانی
        long_sentences = sum(1 for s in sentences if len(s.split()) > 40)
        score -= long_sentences * 2
        
        return max(0, min(100, score))

    def _calculate_penalties(self, content: str, processing_metrics: Dict) -> Dict[str, float]:
        """محاسبه جریمه‌ها"""
        penalties = {'details': {}, 'total': 0.0}
        
        # جریمه نویز
        noise_matches = sum(1 for pattern in self.noise_patterns 
                          if re.search(pattern, content, re.IGNORECASE))
        if noise_matches > 0:
            noise_penalty = min(noise_matches * 3, 15)
            penalties['details']['noise'] = noise_penalty
            penalties['total'] += noise_penalty
        
        # جریمه محتوای تکراری
        words = content.split()
        if len(words) > 0:
            word_freq = {}
            for word in words:
                if len(word) > 3:  # فقط کلمات معنادار
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            repeated_words = sum(1 for freq in word_freq.values() if freq > 5)
            if repeated_words > 0:
                repetition_penalty = min(repeated_words * 2, 10)
                penalties['details']['repetition'] = repetition_penalty
                penalties['total'] += repetition_penalty
        
        # جریمه زمان پردازش بالا
        if processing_metrics:
            processing_time = processing_metrics.get('processing_time', 0)
            if processing_time > 10:  # بیش از 10 ثانیه
                time_penalty = min((processing_time - 10) * 0.5, 5)
                penalties['details']['slow_processing'] = time_penalty
                penalties['total'] += time_penalty
        
        return penalties

    def _calculate_bonuses(self, content: str, source_info: Dict, 
                         processing_metrics: Dict) -> Dict[str, float]:
        """محاسبه پاداش‌ها"""
        bonuses = {'details': {}, 'total': 0.0}
        
        # پاداش منبع رسمی
        if source_info and source_info.get('reliability_score', 0) > 0.9:
            official_bonus = 5
            bonuses['details']['official_source'] = official_bonus
            bonuses['total'] += official_bonus
        
        # پاداش محتوای غنی
        word_count = len(content.split())
        if word_count > 1000:
            rich_content_bonus = min((word_count - 1000) / 200, 5)
            bonuses['details']['rich_content'] = rich_content_bonus
            bonuses['total'] += rich_content_bonus
        
        # پاداش سرعت پردازش
        if processing_metrics:
            processing_time = processing_metrics.get('processing_time', 10)
            if processing_time < 3:  # کمتر از 3 ثانیه
                speed_bonus = 3
                bonuses['details']['fast_processing'] = speed_bonus
                bonuses['total'] += speed_bonus
        
        # پاداش وجود ساختار پیشرفته
        if re.search(r'فهرست|جدول|نمودار', content):
            structure_bonus = 3
            bonuses['details']['advanced_structure'] = structure_bonus
            bonuses['total'] += structure_bonus
        
        return bonuses

    def _determine_quality_grade(self, score: float) -> str:
        """تعیین رتبه کیفیت"""
        if score >= 90:
            return 'عالی'
        elif score >= 80:
            return 'خوب'
        elif score >= 70:
            return 'متوسط'
        elif score >= 60:
            return 'قابل قبول'
        elif score >= 50:
            return 'ضعیف'
        else:
            return 'نامناسب'

    def _generate_recommendations(self, scores: Dict, final_score: float) -> List[str]:
        """تولید توصیه‌های بهبود"""
        recommendations = []
        
        if scores.get('content_quality', 0) < 70:
            recommendations.append('بهبود کیفیت محتوا: افزایش جزئیات و کاهش تکرار')
        
        if scores.get('structure_quality', 0) < 70:
            recommendations.append('بهبود ساختار: استفاده از پاراگراف‌بندی و شماره‌گذاری')
        
        if scores.get('legal_relevance', 0) < 70:
            recommendations.append('افزایش مرتبط بودن حقوقی: اضافه کردن اصطلاحات و ارجاعات قانونی')
        
        if scores.get('readability', 0) < 70:
            recommendations.append('بهبود خوانایی: کوتاه‌تر کردن جملات و استفاده از واژگان ساده‌تر')
        
        if final_score < 60:
            recommendations.append('بازبینی کامل محتوا و منبع توصیه می‌شود')
        
        return recommendations

    def _create_zero_score(self, reason: str) -> Dict[str, Any]:
        """ایجاد امتیاز صفر با دلیل"""
        return {
            'final_score': 0.0,
            'quality_grade': 'نامناسب',
            'error': reason,
            'detailed_scores': {},
            'penalties': {'details': {}, 'total': 0.0},
            'bonuses': {'details': {}, 'total': 0.0},
            'recommendations': ['محتوا قابل ارزیابی نیست'],
            'evaluation_timestamp': datetime.now().isoformat(),
            'content_length': 0,
            'word_count': 0
        }

    def compare_documents(self, doc1_score: Dict, doc2_score: Dict) -> Dict[str, Any]:
        """مقایسه دو سند بر اساس امتیاز"""
        try:
            comparison = {
                'winner': None,
                'score_difference': 0.0,
                'detailed_comparison': {},
                'recommendations': []
            }
            
            score1 = doc1_score.get('final_score', 0)
            score2 = doc2_score.get('final_score', 0)
            
            if score1 > score2:
                comparison['winner'] = 'document_1'
                comparison['score_difference'] = score1 - score2
            elif score2 > score1:
                comparison['winner'] = 'document_2'
                comparison['score_difference'] = score2 - score1
            else:
                comparison['winner'] = 'tie'
                comparison['score_difference'] = 0.0
            
            # مقایسه جزئی
            scores1 = doc1_score.get('detailed_scores', {})
            scores2 = doc2_score.get('detailed_scores', {})
            
            for category in self.weights.keys():
                s1 = scores1.get(category, 0)
                s2 = scores2.get(category, 0)
                comparison['detailed_comparison'][category] = {
                    'doc1_score': s1,
                    'doc2_score': s2,
                    'difference': s1 - s2,
                    'better_doc': 'doc1' if s1 > s2 else 'doc2' if s2 > s1 else 'tie'
                }
            
            return comparison
            
        except Exception as e:
            logger.error(f"Document comparison error: {e}")
            return {'error': str(e)}

    def get_scoring_stats(self, scores_list: List[Dict]) -> Dict[str, Any]:
        """محاسبه آمار امتیازدهی"""
        try:
            if not scores_list:
                return {'error': 'No scores provided'}
            
            final_scores = [s.get('final_score', 0) for s in scores_list]
            
            stats = {
                'count': len(final_scores),
                'average': sum(final_scores) / len(final_scores),
                'min': min(final_scores),
                'max': max(final_scores),
                'median': sorted(final_scores)[len(final_scores) // 2],
                'grade_distribution': {},
                'category_averages': {}
            }
            
            # توزیع رتبه‌ها
            grades = [s.get('quality_grade', 'نامشخص') for s in scores_list]
            for grade in set(grades):
                stats['grade_distribution'][grade] = grades.count(grade)
            
            # میانگین دسته‌ها
            for category in self.weights.keys():
                category_scores = [s.get('detailed_scores', {}).get(category, 0) 
                                 for s in scores_list]
                if category_scores:
                    stats['category_averages'][category] = sum(category_scores) / len(category_scores)
            
            return stats
            
        except Exception as e:
            logger.error(f"Scoring stats error: {e}")
            return {'error': str(e)}