"""
Modern Content Extractor for Iranian Legal Archive System
Provides intelligent content extraction with source-specific selectors and noise removal
"""

import re
import logging
from typing import Dict, List, Optional, Tuple

try:
    from bs4 import BeautifulSoup, Tag
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False
    logging.warning("beautifulsoup4 not available, content extraction disabled")

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

from .legal_sources import AUTHORITATIVE_LEGAL_SOURCES, get_source_by_url, get_content_selectors_for_url

logger = logging.getLogger(__name__)


class ModernContentExtractor:
    """استخراج‌کننده مدرن محتوا با قابلیت‌های هوشمند"""
    
    def __init__(self):
        self.normalizer = Normalizer()
        
        # الگوهای شناسایی محتوای حقوقی
        self.content_indicators = [
            r'ماده\s+\d+',
            r'تبصره\s*\d*',
            r'فصل\s+\d+',
            r'باب\s+\d+',
            r'قانون\s+',
            r'مقررات\s+',
            r'آیین\s*نامه',
            r'دستورالعمل',
            r'بخشنامه',
            r'دادنامه',
            r'رای\s+شماره',
            r'حکم\s+',
            r'قرار\s+',
            r'شعبه\s+\d+',
            r'دادگاه\s+',
            r'مجلس\s+شورای\s+اسلامی',
            r'شورای\s+نگهبان',
            r'قوه\s+قضاییه',
            r'روزنامه\s+رسمی'
        ]
        
        # الگوهای نویز برای حذف
        self.noise_patterns = [
            r'کپی\s*رایت|copyright',
            r'تمامی\s+حقوق\s+محفوظ',
            r'نسخه\s+چاپی',
            r'دریافت\s+فایل',
            r'دانلود\s+',
            r'کلیک\s+کنید',
            r'مشاهده\s+بیشتر',
            r'ادامه\s+مطلب',
            r'صفحه\s+اصلی',
            r'منوی\s+اصلی',
            r'جستجو\s+در\s+سایت',
            r'اشتراک\s+گذاری',
            r'پیوند\s+های\s+مفید',
            r'آرشیو\s+اخبار',
            r'نظرات\s+کاربران',
            r'امتیاز\s+دهی'
        ]
        
        # انتخاب‌گرهای عمومی محتوا
        self.generic_content_selectors = [
            'article',
            '.content',
            '.main-content',
            '.article-content',
            '.post-content',
            '.entry-content',
            '#content',
            '#main-content',
            '.text-content',
            '.body-content'
        ]
        
        # انتخاب‌گرهای عنوان
        self.title_selectors = [
            'h1',
            'h2',
            '.title',
            '.main-title',
            '.article-title',
            '.post-title',
            '.entry-title'
        ]
        
        logger.info("Modern Content Extractor initialized")

    def extract_content_intelligent(self, soup, url: str) -> Dict[str, str]:
        """استخراج هوشمند محتوا و عنوان"""
        try:
            # تشخیص منبع و انتخاب استراتژی
            source_info = get_source_by_url(url)
            
            # استخراج عنوان
            title = self._extract_title(soup, url, source_info)
            
            # مرحله 1: استخراج با selectors اختصاصی
            content = ""
            if source_info:
                content = self._extract_with_source_selectors(soup, source_info)
                if content and len(content.split()) >= 20:
                    content = self._post_process_content(content)
                    return {
                        "title": title,
                        "content": content,
                        "method": "source_specific",
                        "source": source_info.get("name", "نامشخص")
                    }
            
            # مرحله 2: استخراج با الگوریتم هوشمند
            content = self._extract_with_smart_algorithm(soup)
            if content and len(content.split()) >= 20:
                content = self._post_process_content(content)
                return {
                    "title": title,
                    "content": content,
                    "method": "smart_algorithm",
                    "source": "تشخیص خودکار"
                }
            
            # مرحله 3: استخراج fallback
            content = self._extract_fallback(soup)
            content = self._post_process_content(content)
            
            return {
                "title": title,
                "content": content,
                "method": "fallback",
                "source": "عمومی"
            }
            
        except Exception as e:
            logger.error(f"Error in intelligent content extraction: {e}")
            return {
                "title": "",
                "content": "",
                "method": "error",
                "source": "خطا"
            }

    def _extract_title(self, soup, url: str, source_info: Dict) -> str:
        """استخراج عنوان سند"""
        try:
            # استفاده از selectors اختصاصی منبع
            if source_info:
                title_selectors = source_info.get("title_selectors", [])
                for selector in title_selectors:
                    element = soup.select_one(selector)
                    if element:
                        title = element.get_text(strip=True)
                        if title and len(title) > 5:
                            return self.normalizer.normalize(title)
            
            # استفاده از selectors عمومی
            for selector in self.title_selectors:
                element = soup.select_one(selector)
                if element:
                    title = element.get_text(strip=True)
                    if title and len(title) > 5:
                        return self.normalizer.normalize(title)
            
            # استفاده از title tag
            title_tag = soup.find('title')
            if title_tag:
                title = title_tag.get_text(strip=True)
                if title:
                    return self.normalizer.normalize(title)
            
            return "بدون عنوان"
            
        except Exception as e:
            logger.error(f"Error extracting title: {e}")
            return "خطا در استخراج عنوان"

    def _extract_with_source_selectors(self, soup, source_info: Dict) -> str:
        """استخراج با selectors اختصاصی منبع"""
        selectors = source_info.get('content_selectors', [])
        
        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                content_parts = []
                for element in elements:
                    text = element.get_text(strip=True)
                    if text and len(text.split()) > 5:
                        content_parts.append(text)
                
                if content_parts:
                    return '\n'.join(content_parts)
        
        return ""

    def _extract_with_smart_algorithm(self, soup) -> str:
        """الگوریتم هوشمند استخراج محتوا"""
        try:
            # حذف عناصر غیرضروری
            for tag in soup(['script', 'style', 'nav', 'footer', 'aside', 'header', 'menu']):
                tag.decompose()
            
            # یافتن بلوک‌های متنی
            text_blocks = []
            
            # جستجو در divها و سایر عناصر
            for element in soup.find_all(['div', 'article', 'section', 'main', 'p']):
                text = element.get_text(strip=True)
                if self._is_content_block(text):
                    text_blocks.append((text, len(text), self._calculate_content_score(text)))
            
            # مرتب‌سازی بر اساس امتیاز
            text_blocks.sort(key=lambda x: x[2], reverse=True)
            
            # انتخاب بهترین بلوک‌ها
            selected_content = []
            total_words = 0
            
            for text, length, score in text_blocks:
                if score > 0.3 and total_words < 5000:  # محدودیت برای کارایی
                    selected_content.append(text)
                    total_words += len(text.split())
            
            return '\n\n'.join(selected_content)
            
        except Exception as e:
            logger.error(f"Error in smart algorithm: {e}")
            return ""

    def _extract_fallback(self, soup) -> str:
        """استخراج fallback با selectors عمومی"""
        try:
            # تلاش با selectors عمومی
            for selector in self.generic_content_selectors:
                elements = soup.select(selector)
                if elements:
                    content_parts = []
                    for element in elements:
                        text = element.get_text(strip=True)
                        if text and len(text.split()) > 10:
                            content_parts.append(text)
                    
                    if content_parts:
                        return '\n\n'.join(content_parts)
            
            # استخراج از کل body
            body = soup.find('body')
            if body:
                # حذف عناصر غیرضروری
                for tag in body(['script', 'style', 'nav', 'footer', 'aside', 'header']):
                    tag.decompose()
                
                text = body.get_text(strip=True)
                if text:
                    return text
            
            # آخرین تلاش: کل HTML
            return soup.get_text(strip=True)
            
        except Exception as e:
            logger.error(f"Error in fallback extraction: {e}")
            return ""

    def _is_content_block(self, text: str) -> bool:
        """تشخیص بلوک محتوای مفید"""
        if not text or len(text.split()) < 10:
            return False
        
        # بررسی وجود الگوهای حقوقی
        legal_pattern_count = sum(1 for pattern in self.content_indicators 
                                 if re.search(pattern, text))
        
        # بررسی عدم وجود نویز
        noise_count = sum(1 for pattern in self.noise_patterns 
                         if re.search(pattern, text, re.IGNORECASE))
        
        return legal_pattern_count > 0 and noise_count == 0

    def _calculate_content_score(self, text: str) -> float:
        """محاسبه امتیاز محتوا"""
        try:
            score = 0.0
            word_count = len(text.split())
            
            # امتیاز طول متن (بهینه: 100-2000 کلمه)
            if 100 <= word_count <= 2000:
                score += 0.3
            elif 50 <= word_count < 100 or 2000 < word_count <= 5000:
                score += 0.2
            elif word_count > 5000:
                score += 0.1
            
            # امتیاز وجود الگوهای حقوقی
            legal_matches = sum(1 for pattern in self.content_indicators 
                               if re.search(pattern, text))
            score += min(legal_matches * 0.1, 0.4)
            
            # کسر امتیاز برای نویز
            noise_matches = sum(1 for pattern in self.noise_patterns 
                               if re.search(pattern, text, re.IGNORECASE))
            score -= min(noise_matches * 0.1, 0.3)
            
            # امتیاز تراکم متن فارسی
            persian_chars = len(re.findall(r'[\u0600-\u06FF]', text))
            persian_ratio = persian_chars / max(len(text), 1)
            if persian_ratio > 0.5:
                score += 0.2
            elif persian_ratio > 0.3:
                score += 0.1
            
            return max(0.0, min(1.0, score))
            
        except Exception as e:
            logger.error(f"Error calculating content score: {e}")
            return 0.0

    def _post_process_content(self, content: str) -> str:
        """پردازش نهایی محتوا"""
        try:
            if not content:
                return ""
            
            # نرمال‌سازی متن فارسی
            content = self.normalizer.normalize(content)
            
            # حذف خطوط خالی اضافی
            lines = content.split('\n')
            cleaned_lines = []
            
            for line in lines:
                line = line.strip()
                if line and not self._is_noise_line(line):
                    cleaned_lines.append(line)
            
            # ترکیب خطوط و حذف فاصله‌های اضافی
            result = '\n'.join(cleaned_lines)
            result = re.sub(r'\n{3,}', '\n\n', result)
            result = re.sub(r' {2,}', ' ', result)
            
            return result.strip()
            
        except Exception as e:
            logger.error(f"Error in post-processing: {e}")
            return content

    def _is_noise_line(self, line: str) -> bool:
        """تشخیص خط نویز"""
        if len(line) < 5:
            return True
        
        # بررسی الگوهای نویز
        for pattern in self.noise_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                return True
        
        # خطوط تکراری یا بی‌معنی
        if re.match(r'^[.\-_=\s]+$', line):
            return True
        
        return False

    def extract_metadata(self, soup, url: str) -> Dict[str, str]:
        """استخراج متادیتای سند"""
        try:
            metadata = {}
            
            # استخراج از meta tags
            meta_tags = soup.find_all('meta')
            for tag in meta_tags:
                if tag.get('name') == 'description':
                    metadata['description'] = tag.get('content', '')
                elif tag.get('name') == 'keywords':
                    metadata['keywords'] = tag.get('content', '')
                elif tag.get('name') == 'author':
                    metadata['author'] = tag.get('content', '')
                elif tag.get('property') == 'og:title':
                    metadata['og_title'] = tag.get('content', '')
                elif tag.get('property') == 'og:description':
                    metadata['og_description'] = tag.get('content', '')
            
            # تشخیص منبع
            source_info = get_source_by_url(url)
            if source_info:
                metadata['source_name'] = source_info.get('name', '')
                metadata['source_category'] = source_info.get('category', '')
                metadata['reliability_score'] = str(source_info.get('reliability_score', 0.5))
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")
            return {}

    def calculate_readability_score(self, text: str) -> float:
        """محاسبه امتیاز خوانایی"""
        try:
            if not text:
                return 0.0
            
            sentences = text.count('.') + text.count('!') + text.count('?')
            words = len(text.split())
            
            if sentences == 0 or words == 0:
                return 0.0
            
            # فرمول ساده‌شده برای فارسی
            avg_sentence_length = words / sentences
            
            # امتیاز بر اساس طول متوسط جمله
            if 10 <= avg_sentence_length <= 20:
                return 0.8
            elif 5 <= avg_sentence_length < 10 or 20 < avg_sentence_length <= 30:
                return 0.6
            elif avg_sentence_length < 5 or avg_sentence_length > 30:
                return 0.4
            else:
                return 0.2
                
        except Exception as e:
            logger.error(f"Error calculating readability: {e}")
            return 0.0

    def calculate_complexity_score(self, text: str) -> float:
        """محاسبه امتیاز پیچیدگی"""
        try:
            if not text:
                return 0.0
            
            score = 0.0
            
            # تعداد اصطلاحات حقوقی
            legal_terms = sum(1 for pattern in self.content_indicators 
                             if re.search(pattern, text))
            score += min(legal_terms / 10, 0.5)
            
            # طول متن
            word_count = len(text.split())
            if word_count > 1000:
                score += 0.3
            elif word_count > 500:
                score += 0.2
            else:
                score += 0.1
            
            # تراکم اعداد و ارجاعات
            numbers = len(re.findall(r'\d+', text))
            score += min(numbers / 50, 0.2)
            
            return min(1.0, score)
            
        except Exception as e:
            logger.error(f"Error calculating complexity: {e}")
            return 0.0