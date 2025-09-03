"""
پلتفرم فوق‌پیشرفته هوشمند اسناد حقوقی ایران - نسخه بهینه‌شده برای Hugging Face
مجهز به DNS هوشمند، اسکرپینگ مدرن، مدل‌های SOTA فارسی و سیستم کش پیشرفته
"""

import os
import gc
import sys
import time
import json
import logging
import hashlib
import requests
import threading
import re
import random
import sqlite3
import pickle
import tempfile
import asyncio
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple, Union
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse, parse_qs
import warnings
import numpy as np
from collections import defaultdict, Counter
from bs4 import BeautifulSoup
from hazm import Normalizer, word_tokenize

# Network / SSL / DNS utils
import socket
import ssl
import urllib3
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.ssl_ import create_urllib3_context

# --- Enhanced imports for HF compatibility ---
try:
    import dns.resolver
    import dns.exception
    from requests.packages.urllib3.util.ssl_ import create_urllib3_context
    try:
        from requests_doh import RequestsDNSResolver, DOHResolver
        DOH_AVAILABLE = True
    except ImportError:
        DOH_AVAILABLE = False
        logging.getLogger(__name__).warning("requests-doh not available, falling back to standard DNS")
    
    import gradio as gr
    import torch
    from transformers import pipeline, logging as transformers_logging, AutoTokenizer, AutoModel
    from sentence_transformers import SentenceTransformer
    import psutil
    HF_AVAILABLE = True
except ImportError as e:
    HF_AVAILABLE = False
    logging.error(f"Essential libraries missing: {e}")
    print("Missing libraries. Install with: pip install transformers sentence-transformers torch gradio")
    # Don't raise here, allow fallback operation
    
    # Create minimal fallback imports
    class MockGradio:
        def __init__(self):
            pass
        def Blocks(self, *args, **kwargs):
            return self
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def launch(self, *args, **kwargs):
            print("Gradio not available - running in minimal mode")
    
    if 'gr' not in locals():
        gr = MockGradio()
    
    torch = None
    psutil = None

# --- Enhanced Configuration ---
warnings.filterwarnings('ignore')
if HF_AVAILABLE:
    transformers_logging.set_verbosity_error()

os.environ.update({
    'TRANSFORMERS_CACHE': '/tmp/hf_cache',
    'HF_HOME': '/tmp/hf_cache',
    'TORCH_HOME': '/tmp/torch_cache',
    'TOKENIZERS_PARALLELISM': 'false',
    'GRADIO_ANALYTICS_ENABLED': 'False',
    'CUDA_VISIBLE_DEVICES': '',  # Force CPU for HF compatibility
    'TRANSFORMERS_OFFLINE': '0'
})

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# --- Enhanced Paths and Constants ---
DATA_DIR = Path("/tmp/data")
MODELS_CACHE_PATH = DATA_DIR / "models_cache"
DB_PATH = DATA_DIR / "iranian_legal_archive_ultra.sqlite"
CACHE_DB_PATH = DATA_DIR / "intelligent_cache.sqlite"

for path in [DATA_DIR, MODELS_CACHE_PATH]:
    path.mkdir(parents=True, exist_ok=True)

# --- Enhanced Icons and UI Elements ---
ICONS = {
    'search': '🔍', 'document': '📄', 'analyze': '🤖', 'export': '📊',
    'settings': '⚙️', 'link': '🔗', 'success': '✅', 'error': '❌',
    'warning': '⚠️', 'database': '🗄️', 'crawler': '🔄', 'brain': '🧠',
    'cache': '⚡', 'score': '📈', 'classify': '🏷️', 'similarity': '🎯',
    'law': '⚖️', 'verdict': '🏛️', 'contract': '📝', 'regulation': '📋',
    'quality': '💎', 'process': '🔧', 'monitor': '📱', 'report': '📑',
    'majlis': '🏛️', 'judiciary': '⚖️', 'dotic': '📚', 'rrk': '📰',
    'icbar': '👨‍💼', 'scoda': '🤝', 'sid': '🎓', 'jref': '📖',
    'dns': '🌐', 'proxy': '🔐', 'ssl': '🔒', 'speed': '⚡'
}

# --- Enhanced Authoritative Sources with Better URL Patterns ---
AUTHORITATIVE_LEGAL_SOURCES = {
    "مجلس شورای اسلامی": {
        "base_urls": ["https://rc.majlis.ir", "https://majlis.ir", "http://rc.majlis.ir"],
        "url_patterns": ["/fa/law/show/", "/fa/report/show/", "/fa/content/law_cd", "/law/", "/report/"],
        "content_selectors": [".main-content", ".article-body", "article", ".law-content", ".content-body", "#main-content"],
        "title_selectors": ["h1", "h2", ".law-title", ".article-title", ".main-title"],
        "priority": 1,
        "reliability_score": 0.98,
        "category": "قانون",
        "description": "منابع رسمی قوانین مصوب مجلس",
        "icon": ICONS['majlis'],
        "encoding": "utf-8",
        "requires_special_handling": False
    },
    "پورتال ملی قوانین": {
        "base_urls": ["https://www.dotic.ir", "https://dotic.ir", "http://dotic.ir"],
        "url_patterns": ["/portal/law/", "/regulation/", "/cat/88", "/law-detail/"],
        "content_selectors": [".content-area", ".law-content", ".main-content", ".portal-content", ".regulation-text"],
        "title_selectors": ["h1", ".law-title", ".portal-title", ".regulation-title"],
        "priority": 1,
        "reliability_score": 0.96,
        "category": "قانون",
        "description": "سامانه جامع قوانین و مقررات کشور",
        "icon": ICONS['dotic'],
        "encoding": "utf-8",
        "requires_special_handling": False
    },
    "قوه قضاییه": {
        "base_urls": ["https://eadl.ir", "https://www.judiciary.ir", "http://judiciary.ir"],
        "url_patterns": ["/fa/news/", "/fa/verdict/", "/fa/judgment/", "/verdict/", "/judgment/"],
        "content_selectors": [".news-content", ".main-content", ".verdict-content", ".judgment-text", ".article-content"],
        "title_selectors": ["h1", ".news-title", ".verdict-title", ".judgment-title"],
        "priority": 1,
        "reliability_score": 0.95,
        "category": "دادنامه",
        "description": "درگاه ملی خدمات الکترونیک قضایی",
        "icon": ICONS['judiciary'],
        "encoding": "utf-8",
        "requires_special_handling": True
    },
    "روزنامه رسمی": {
        "base_urls": ["https://rrk.ir", "http://rrk.ir"],
        "url_patterns": ["/gazette/", "/official/", "/announcement/", "/paper/"],
        "content_selectors": [".gazette-content", ".official-content", ".announcement-text", ".paper-content"],
        "title_selectors": ["h1", ".gazette-title", ".official-title"],
        "priority": 1,
        "reliability_score": 0.99,
        "category": "آگهی_قانونی",
        "description": "مرجع رسمی انتشار قوانین و آگهی‌های قانونی",
        "icon": ICONS['rrk'],
        "encoding": "utf-8",
        "requires_special_handling": False
    },
    "کانون وکلای دادگستری": {
        "base_urls": ["https://icbar.ir", "http://icbar.ir"],
        "url_patterns": ["/fa/legal/", "/fa/verdict-review/", "/fa/regulation/", "/legal/", "/verdict/"],
        "content_selectors": [".legal-content", ".verdict-analysis", ".regulation-content", ".article-body"],
        "title_selectors": ["h1", ".legal-title", ".verdict-title"],
        "priority": 2,
        "reliability_score": 0.90,
        "category": "رویه_قضایی",
        "description": "آرای وحدت رویه و تحلیل‌های حقوقی",
        "icon": ICONS['icbar'],
        "encoding": "utf-8",
        "requires_special_handling": False
    }
}

# --- Enhanced Legal Terms Dictionary ---
COMPREHENSIVE_LEGAL_TERMS = {
    "قوانین_اساسی": [
        "قانون اساسی", "مجلس شورای اسلامی", "شورای نگهبان", "ولایت فقیه",
        "اصول قانون اساسی", "مجمع تشخیص مصلحت", "رهبری", "نظام جمهوری اسلامی",
        "حاکمیت ملی", "استقلال", "آزادی", "جمهوری اسلامی", "اصل", "تفسیر قانون اساسی"
    ],
    "قوانین_عادی": [
        "ماده", "تبصره", "فصل", "باب", "قسمت", "بخش", "قانون مدنی", "قانون جزا",
        "قانون تجارت", "قانون کار", "قانون مالیات", "آیین دادرسی مدنی",
        "آیین دادرسی کیفری", "مقررات", "آیین‌نامه", "دستورالعمل", "بخشنامه"
    ],
    "اصطلاحات_پردازش": [
        "شخص حقیقی", "شخص حقوقی", "اهلیت", "ولایت", "وصایت", "حضانت",
        "دعوا", "خواهان", "خوانده", "مجازات", "قرارداد", "تعهد", "مسئولیت",
        "ضمان", "التزام", "حق", "تکلیف", "صلاحیت", "اختیار", "وظیفه"
    ],
    "نهادهای_قضایی": [
        "دادگاه", "قاضی", "وکیل", "مدعی‌العموم", "رای", "حکم", "قرار",
        "دادنامه", "دادستان", "بازپرس", "دیوان عدالت اداری", "دیوان عالی کشور",
        "محاکم", "شعبه", "بازداشت", "توقیف", "ضبط", "حبس", "تعلیق"
    ],
    "اصطلاحات_مالی": [
        "مالیات", "عوارض", "جریمه", "خسارت", "تأمین", "ضمانت", "وثیقه",
        "دیه", "ارث", "میراث", "وصیت", "هبه", "بیمه", "سود", "ربا", "زکات",
        "درآمد", "هزینه", "بودجه", "اعتبار"
    ]
}

# --- Enhanced Model Configuration for HF Deployment ---
OPTIMIZED_MODELS = {
    "classification": {
        "primary": "HooshvareLab/bert-base-parsbert-uncased",
        "fallback": "HooshvareLab/bert-fa-base-uncased",
        "lightweight": "distilbert-base-multilingual-cased"
    },
    "embedding": {
        "primary": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        "fallback": "sentence-transformers/all-MiniLM-L6-v2"
    }
}

# --- Enhanced DNS and Network Classes ---
class IntelligentDNSManager:
    """مدیریت هوشمند DNS با قابلیت تعویض خودکار"""
    
    def __init__(self):
        self.iranian_doh_servers = [
            "https://free.shecan.ir/dns-query",
            "https://dns.403.online/dns-query", 
            "https://dns.begzar.ir/dns-query",
            "https://dns1.server.ir/dns-query"
        ]
        
        self.international_doh_servers = [
            "https://cloudflare-dns.com/dns-query",
            "https://dns.google/dns-query",
            "https://dns.quad9.net/dns-query"
        ]
        
        self.public_dns_servers = [
            "8.8.8.8", "8.8.4.4",  # Google
            "1.1.1.1", "1.0.0.1",  # Cloudflare
            "9.9.9.9", "149.112.112.112",  # Quad9
            "185.55.226.26", "185.55.225.25"  # Shecan
        ]
        
        self.current_strategy = "hybrid"
        self.successful_servers = []
        self.failed_servers = []
        
        logger.info(f"DNS Manager initialized with {len(self.iranian_doh_servers + self.international_doh_servers)} DoH servers")

    def test_dns_server(self, dns_server: str, test_domain: str = "google.com") -> bool:
        """تست کارکرد DNS server"""
        try:
            resolver = dns.resolver.Resolver()
            resolver.nameservers = [dns_server]
            resolver.timeout = 3
            resolver.lifetime = 5
            
            answers = resolver.resolve(test_domain, 'A')
            return len(answers) > 0
        except:
            return False

    def get_best_dns_servers(self, max_test: int = 5) -> List[str]:
        """یافتن بهترین DNS serverها"""
        working_servers = []
        
        # تست DNS های عمومی
        for dns in self.public_dns_servers[:max_test]:
            if self.test_dns_server(dns):
                working_servers.append(dns)
                
        logger.info(f"Found {len(working_servers)} working DNS servers")
        return working_servers

    def setup_custom_dns_resolution(self, session: requests.Session) -> bool:
        """تنظیم DNS سفارشی برای session"""
        try:
            working_dns = self.get_best_dns_servers(3)
            if working_dns:
                # اگر امکان DoH وجود دارد
                if DOH_AVAILABLE and self.iranian_doh_servers:
                    try:
                        doh_resolver = DOHResolver(random.choice(self.iranian_doh_servers))
                        dns_resolver = RequestsDNSResolver(doh_resolver)
                        session.mount('http://', dns_resolver)
                        session.mount('https://', dns_resolver)
                        logger.info("DoH DNS resolver configured")
                        return True
                    except Exception as e:
                        logger.warning(f"DoH setup failed: {e}")
                
                # Fallback به DNS عادی
                original_getaddrinfo = socket.getaddrinfo
                
                def custom_getaddrinfo(host, port, *args, **kwargs):
                    for dns_server in working_dns:
                        try:
                            resolver = dns.resolver.Resolver()
                            resolver.nameservers = [dns_server]
                            answers = resolver.resolve(host, 'A')
                            if answers:
                                ip = str(answers[0])
                                return original_getaddrinfo(ip, port, *args, **kwargs)
                        except:
                            continue
                    return original_getaddrinfo(host, port, *args, **kwargs)
                
                socket.getaddrinfo = custom_getaddrinfo
                logger.info("Custom DNS resolution configured")
                return True
                
        except Exception as e:
            logger.error(f"DNS setup failed: {e}")
            
        return False

class ModernProxyManager:
    """مدیریت پیشرفته پروکسی با نظارت زنده و تست خودکار"""
    
    def __init__(self):
        self.active_proxies = []
        self.failed_proxies = []
        self.proxy_stats = {}
        self.last_update = 0
        self.update_interval = 900  # 15 minutes
        self.test_url = "http://httpbin.org/ip"
        self.backup_test_urls = [
            "http://icanhazip.com",
            "https://api.ipify.org?format=json",
            "http://checkip.amazonaws.com"
        ]
        
        # Initialize with built-in proxies
        self._initialize_builtin_proxies()
        
    def _initialize_builtin_proxies(self):
        """مقداردهی اولیه با پروکسی‌های داخلی"""
        all_proxies = []
        
        # Add Iranian proxies
        for proxy in MODERN_PROXY_SOURCES["iranian_proxies_2024"]:
            all_proxies.append({
                'url': f"http://{proxy}",
                'country': 'IR',
                'type': 'iranian',
                'status': 'untested'
            })
        
        # Add international backups
        for proxy in MODERN_PROXY_SOURCES["international_backup"]:
            all_proxies.append({
                'url': f"http://{proxy}",
                'country': 'International', 
                'type': 'backup',
                'status': 'untested'
            })
            
        self.all_proxies = all_proxies
        logger.info(f"Initialized with {len(all_proxies)} built-in proxies")

    def test_single_proxy(self, proxy_info: Dict, timeout: int = 10) -> Dict:
        """تست تک پروکسی با جزئیات کامل"""
        proxy_url = proxy_info['url']
        start_time = time.time()
        
        try:
            proxy_dict = {
                'http': proxy_url,
                'https': proxy_url
            }
            
            # Test with primary URL
            response = requests.get(
                self.test_url,
                proxies=proxy_dict,
                timeout=timeout,
                verify=False,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            )
            
            response_time = (time.time() - start_time) * 1000  # Convert to ms
            
            if response.status_code == 200:
                try:
                    ip_info = response.json()
                    detected_ip = ip_info.get('origin', 'Unknown')
                except:
                    detected_ip = response.text.strip()
                
                return {
                    'status': 'active',
                    'response_time': round(response_time, 2),
                    'detected_ip': detected_ip,
                    'country': proxy_info.get('country', 'Unknown'),
                    'type': proxy_info.get('type', 'unknown'),
                    'last_tested': datetime.now().isoformat(),
                    'success_count': self.proxy_stats.get(proxy_url, {}).get('success_count', 0) + 1,
                    'error_message': None
                }
            else:
                raise requests.RequestException(f"HTTP {response.status_code}")
                
        except requests.exceptions.Timeout:
            return {
                'status': 'timeout',
                'response_time': timeout * 1000,
                'error_message': 'Connection timeout',
                'last_tested': datetime.now().isoformat()
            }
        except requests.exceptions.ConnectionError:
            return {
                'status': 'connection_error',
                'error_message': 'Connection failed',
                'last_tested': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'failed',
                'error_message': str(e)[:100],
                'last_tested': datetime.now().isoformat()
            }

    def bulk_test_proxies(self, max_workers: int = 10, progress_callback=None) -> Dict:
        """تست انبوه پروکسی‌ها با نمایش پیشرفت"""
        active_proxies = []
        failed_proxies = []
        total_proxies = len(self.all_proxies)
        
        logger.info(f"Testing {total_proxies} proxies with {max_workers} workers...")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tests
            future_to_proxy = {
                executor.submit(self.test_single_proxy, proxy): proxy 
                for proxy in self.all_proxies
            }
            
            completed = 0
            for future in as_completed(future_to_proxy, timeout=300):  # 5 min timeout
                proxy_info = future_to_proxy[future]
                completed += 1
                
                try:
                    result = future.result()
                    proxy_url = proxy_info['url']
                    
                    # Update proxy info with test results
                    updated_proxy = {**proxy_info, **result}
                    
                    if result['status'] == 'active':
                        active_proxies.append(updated_proxy)
                        self.proxy_stats[proxy_url] = result
                    else:
                        failed_proxies.append(updated_proxy)
                    
                    # Call progress callback if provided
                    if progress_callback:
                        progress_value = completed / total_proxies
                        progress_callback(progress_value, f"Tested {completed}/{total_proxies} proxies")
                        
                except Exception as e:
                    logger.error(f"Error testing proxy {proxy_info['url']}: {e}")
                    failed_proxies.append({
                        **proxy_info,
                        'status': 'error',
                        'error_message': str(e)[:100]
                    })
        
        # Update instance variables
        self.active_proxies = sorted(active_proxies, key=lambda x: x.get('response_time', 9999))
        self.failed_proxies = failed_proxies
        self.last_update = time.time()
        
        result_summary = {
            'total_tested': total_proxies,
            'active_count': len(active_proxies),
            'failed_count': len(failed_proxies),
            'success_rate': (len(active_proxies) / total_proxies * 100) if total_proxies > 0 else 0,
            'average_response_time': sum(p.get('response_time', 0) for p in active_proxies) / len(active_proxies) if active_proxies else 0,
            'iranian_proxies': len([p for p in active_proxies if p.get('type') == 'iranian']),
            'international_proxies': len([p for p in active_proxies if p.get('type') == 'backup'])
        }
        
        logger.info(f"Proxy test completed: {result_summary['active_count']}/{total_proxies} active ({result_summary['success_rate']:.1f}%)")
        return result_summary

    def fetch_fresh_proxies(self, max_fetch: int = 50) -> List[Dict]:
        """دریافت پروکسی‌های تازه از منابع آنلاین"""
        fresh_proxies = []
        
        for source_url in PROXY_API_SOURCES:
            try:
                logger.info(f"Fetching proxies from: {source_url}")
                response = requests.get(source_url, timeout=15)
                
                if response.status_code == 200:
                    # Extract IP:PORT patterns
                    proxy_pattern = r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{2,5})'
                    matches = re.findall(proxy_pattern, response.text)
                    
                    for ip, port in matches:
                        if len(fresh_proxies) >= max_fetch:
                            break
                            
                        proxy_info = {
                            'url': f"http://{ip}:{port}",
                            'country': 'Unknown',
                            'type': 'online',
                            'status': 'untested',
                            'source': source_url
                        }
                        fresh_proxies.append(proxy_info)
                        
                    logger.info(f"Found {len(matches)} proxies from {source_url}")
                    
            except Exception as e:
                logger.warning(f"Failed to fetch from {source_url}: {e}")
                continue
                
            # Don't overload servers
            time.sleep(1)
            
        logger.info(f"Total fresh proxies fetched: {len(fresh_proxies)}")
        return fresh_proxies

    def update_proxy_list(self, include_fresh: bool = True, progress_callback=None) -> Dict:
        """به‌روزرسانی کامل لیست پروکسی‌ها"""
        try:
            # Add fresh proxies if requested
            if include_fresh:
                if progress_callback:
                    progress_callback(0.1, "Fetching fresh proxies...")
                    
                fresh_proxies = self.fetch_fresh_proxies(30)
                
                # Avoid duplicates
                existing_urls = {p['url'] for p in self.all_proxies}
                new_proxies = [p for p in fresh_proxies if p['url'] not in existing_urls]
                
                self.all_proxies.extend(new_proxies)
                logger.info(f"Added {len(new_proxies)} new proxies to test list")
            
            if progress_callback:
                progress_callback(0.2, "Starting proxy tests...")
            
            # Test all proxies
            def test_progress_wrapper(progress, desc):
                if progress_callback:
                    # Scale progress from 0.2 to 1.0
                    scaled_progress = 0.2 + (progress * 0.8)
                    progress_callback(scaled_progress, desc)
            
            results = self.bulk_test_proxies(max_workers=8, progress_callback=test_progress_wrapper)
            
            return results
            
        except Exception as e:
            logger.error(f"Error updating proxy list: {e}")
            return {'error': str(e)}

    def get_random_active_proxy(self) -> Optional[Dict]:
        """انتخاب تصادفی پروکسی فعال"""
        if not self.active_proxies:
            return None
            
        # Prefer Iranian proxies with good response times
        iranian_proxies = [p for p in self.active_proxies 
                          if p.get('type') == 'iranian' and p.get('response_time', 9999) < 5000]
        
        if iranian_proxies:
            return random.choice(iranian_proxies)
        
        # Fallback to any active proxy
        return random.choice(self.active_proxies)

    def get_proxy_dashboard_data(self) -> Dict:
        """دریافت داده‌های داشبورد پروکسی"""
        try:
            active_count = len(self.active_proxies)
            total_count = len(self.all_proxies)
            
            # Response time categories
            fast_proxies = len([p for p in self.active_proxies if p.get('response_time', 9999) < 2000])
            medium_proxies = len([p for p in self.active_proxies if 2000 <= p.get('response_time', 9999) < 5000])
            slow_proxies = len([p for p in self.active_proxies if p.get('response_time', 9999) >= 5000])
            
            # Country distribution
            iranian_active = len([p for p in self.active_proxies if p.get('type') == 'iranian'])
            international_active = len([p for p in self.active_proxies if p.get('type') == 'backup'])
            online_active = len([p for p in self.active_proxies if p.get('type') == 'online'])
            
            # Average response time
            avg_response = sum(p.get('response_time', 0) for p in self.active_proxies) / max(active_count, 1)
            
            return {
                'total_proxies': total_count,
                'active_proxies': active_count,
                'failed_proxies': len(self.failed_proxies),
                'success_rate': (active_count / total_count * 100) if total_count > 0 else 0,
                'average_response_time': round(avg_response, 2),
                'response_categories': {
                    'fast': fast_proxies,
                    'medium': medium_proxies, 
                    'slow': slow_proxies
                },
                'country_distribution': {
                    'iranian': iranian_active,
                    'international': international_active,
                    'online': online_active
                },
                'last_update': datetime.fromtimestamp(self.last_update).strftime('%Y-%m-%d %H:%M:%S') if self.last_update else 'Never',
                'needs_update': time.time() - self.last_update > self.update_interval if self.last_update else True
            }
            
        except Exception as e:
            logger.error(f"Error generating dashboard data: {e}")
            return {'error': str(e)}

class EnhancedHTTPAdapter(HTTPAdapter):
    """HTTP Adapter بهینه‌شده با SSL relaxed"""
    
    def init_poolmanager(self, *args, **kwargs):
        ctx = create_urllib3_context()
        ctx.set_ciphers('DEFAULT@SECLEVEL=1')
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs['ssl_context'] = ctx
        return super().init_poolmanager(*args, **kwargs)

class AdvancedURLManager:
    """مدیریت پیشرفته URL با قابلیت‌های حرفه‌ای"""
    
    def __init__(self):
        self.url_queue = []
        self.processed_urls = []
        self.failed_urls = []
        self.current_batch = []
        self.session_data = {}
        self.supported_file_types = ['.txt', '.csv']
        
    def parse_bulk_urls(self, bulk_text: str) -> List[Dict]:
        """تجزیه URLs از متن انبوه"""
        if not bulk_text:
            return []
            
        lines = bulk_text.strip().split('\n')
        parsed_urls = []
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            
            # Skip empty lines and comments
            if not line or line.startswith('#'):
                continue
                
            # Validate URL format
            if self._is_valid_url(line):
                parsed_urls.append({
                    'url': line,
                    'line_number': i,
                    'status': 'pending',
                    'source': 'bulk_input',
                    'added_at': datetime.now().isoformat()
                })
            else:
                # Try to fix common URL issues
                fixed_url = self._fix_common_url_issues(line)
                if fixed_url:
                    parsed_urls.append({
                        'url': fixed_url,
                        'line_number': i,
                        'status': 'pending',
                        'source': 'bulk_input_fixed',
                        'original': line,
                        'added_at': datetime.now().isoformat()
                    })
        
        return parsed_urls
    
    def parse_file_content(self, file_content: str, filename: str) -> List[Dict]:
        """تجزیه محتوای فایل آپلود شده"""
        parsed_urls = []
        file_ext = Path(filename).suffix.lower()
        
        try:
            if file_ext == '.csv':
                # Parse CSV file
                import csv
                from io import StringIO
                
                csv_reader = csv.reader(StringIO(file_content))
                for i, row in enumerate(csv_reader, 1):
                    if row:  # Skip empty rows
                        url = row[0].strip()  # Take first column
                        if self._is_valid_url(url):
                            parsed_urls.append({
                                'url': url,
                                'line_number': i,
                                'status': 'pending',
                                'source': f'csv_file_{filename}',
                                'added_at': datetime.now().isoformat()
                            })
                            
            elif file_ext == '.txt':
                # Parse text file (one URL per line)
                lines = file_content.strip().split('\n')
                for i, line in enumerate(lines, 1):
                    url = line.strip()
                    if url and not url.startswith('#'):
                        if self._is_valid_url(url):
                            parsed_urls.append({
                                'url': url,
                                'line_number': i,
                                'status': 'pending',
                                'source': f'txt_file_{filename}',
                                'added_at': datetime.now().isoformat()
                            })
            
            logger.info(f"Parsed {len(parsed_urls)} URLs from {filename}")
            return parsed_urls
            
        except Exception as e:
            logger.error(f"Error parsing file {filename}: {e}")
            return []
    
    def _is_valid_url(self, url: str) -> bool:
        """اعتبارسنجی URL"""
        try:
            parsed = urlparse(url.lower())
            return bool(parsed.netloc and parsed.scheme in ['http', 'https'])
        except:
            return False
    
    def _fix_common_url_issues(self, url: str) -> Optional[str]:
        """تصحیح مشکلات رایج URL"""
        try:
            url = url.strip()
            
            # Add protocol if missing
            if not url.startswith(('http://', 'https://')):
                if url.startswith('www.'):
                    url = 'https://' + url
                elif '.' in url and not url.startswith('//'):
                    url = 'https://' + url
            
            # Remove extra whitespace and invalid characters
            url = re.sub(r'\s+', '', url)
            
            # Validate after fixing
            if self._is_valid_url(url):
                return url
                
        except:
            pass
        
        return None
    
    def add_urls_to_queue(self, urls: List[Dict]) -> Dict:
        """اضافه کردن URLs به صف پردازش"""
        added_count = 0
        duplicate_count = 0
        
        existing_urls = {item['url'] for item in self.url_queue}
        
        for url_info in urls:
            if url_info['url'] not in existing_urls:
                self.url_queue.append(url_info)
                existing_urls.add(url_info['url'])
                added_count += 1
            else:
                duplicate_count += 1
        
        return {
            'added': added_count,
            'duplicates': duplicate_count,
            'total_queue': len(self.url_queue)
        }
    
    def get_queue_status(self) -> Dict:
        """دریافت وضعیت صف پردازش"""
        status_counts = {}
        for url_info in self.url_queue:
            status = url_info.get('status', 'pending')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            'total_urls': len(self.url_queue),
            'status_breakdown': status_counts,
            'processed_count': len(self.processed_urls),
            'failed_count': len(self.failed_urls),
            'completion_rate': (len(self.processed_urls) / max(len(self.url_queue), 1)) * 100
        }
    
    def get_next_batch(self, batch_size: int = 5) -> List[Dict]:
        """دریافت دسته بعدی برای پردازش"""
        pending_urls = [url for url in self.url_queue if url.get('status') == 'pending']
        batch = pending_urls[:batch_size]
        
        # Mark as processing
        for url_info in batch:
            url_info['status'] = 'processing'
            url_info['processing_started'] = datetime.now().isoformat()
        
        self.current_batch = batch
        return batch
    
    def mark_url_completed(self, url: str, result: Dict):
        """علامت‌گذاری URL به عنوان تکمیل شده"""
        for url_info in self.url_queue:
            if url_info['url'] == url:
                url_info['status'] = 'completed'
                url_info['completed_at'] = datetime.now().isoformat()
                url_info['result'] = result
                self.processed_urls.append(url_info)
                break
    
    def mark_url_failed(self, url: str, error: str):
        """علامت‌گذاری URL به عنوان ناموفق"""
        for url_info in self.url_queue:
            if url_info['url'] == url:
                url_info['status'] = 'failed'
                url_info['failed_at'] = datetime.now().isoformat()
                url_info['error'] = error
                self.failed_urls.append(url_info)
                break
    
    def export_results(self, format_type: str = 'json') -> str:
        """صدور نتایج به فرمت‌های مختلف"""
        try:
            if format_type.lower() == 'json':
                return json.dumps({
                    'processed_urls': self.processed_urls,
                    'failed_urls': self.failed_urls,
                    'export_timestamp': datetime.now().isoformat(),
                    'summary': self.get_queue_status()
                }, indent=2, ensure_ascii=False)
            
            elif format_type.lower() == 'csv':
                import csv
                from io import StringIO
                
                output = StringIO()
                writer = csv.writer(output)
                
                # Write header
                writer.writerow(['URL', 'Status', 'Source', 'Added At', 'Completed At', 'Title', 'Quality Score', 'Error'])
                
                # Write processed URLs
                for url_info in self.processed_urls:
                    result = url_info.get('result', {})
                    writer.writerow([
                        url_info['url'],
                        url_info.get('status', ''),
                        url_info.get('source', ''),
                        url_info.get('added_at', ''),
                        url_info.get('completed_at', ''),
                        result.get('title', ''),
                        result.get('quality_score', ''),
                        ''
                    ])
                
                # Write failed URLs
                for url_info in self.failed_urls:
                    writer.writerow([
                        url_info['url'],
                        url_info.get('status', ''),
                        url_info.get('source', ''),
                        url_info.get('added_at', ''),
                        url_info.get('failed_at', ''),
                        '',
                        '',
                        url_info.get('error', '')
                    ])
                
                return output.getvalue()
            
            else:
                return "Unsupported format"
                
        except Exception as e:
            logger.error(f"Error exporting results: {e}")
            return f"Export error: {str(e)}"
    
    def clear_queue(self):
        """پاک کردن صف پردازش"""
        self.url_queue = []
        self.processed_urls = []
        self.failed_urls = []
        self.current_batch = []
    
    def save_session(self, session_name: str) -> bool:
        """ذخیره session برای ادامه بعدی"""
        try:
            session_data = {
                'url_queue': self.url_queue,
                'processed_urls': self.processed_urls,
                'failed_urls': self.failed_urls,
                'saved_at': datetime.now().isoformat(),
                'session_name': session_name
            }
            
            # Save to file (in a real app, this would be a database)
            session_file = DATA_DIR / f"session_{session_name}.json"
            with open(session_file, 'w', encoding='utf-8') as f:
                json.dump(session_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Session '{session_name}' saved successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error saving session: {e}")
            return False
    
    def load_session(self, session_name: str) -> bool:
        """بارگذاری session ذخیره شده"""
        try:
            session_file = DATA_DIR / f"session_{session_name}.json"
            
            if not session_file.exists():
                return False
            
            with open(session_file, 'r', encoding='utf-8') as f:
                session_data = json.load(f)
            
            self.url_queue = session_data.get('url_queue', [])
            self.processed_urls = session_data.get('processed_urls', [])
            self.failed_urls = session_data.get('failed_urls', [])
            
            logger.info(f"Session '{session_name}' loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading session: {e}")
            return False
    """استخراج‌کننده مدرن محتوا با الگوریتم‌های پیشرفته"""
    
    def __init__(self):
        self.normalizer = Normalizer()
        
        # الگوهای تشخیص محتوای اصلی
        self.content_indicators = [
            # Persian specific patterns
            r'ماده\s*\d+',
            r'تبصره\s*\d*',
            r'فصل\s*\d+',
            r'قانون\s+[آ-ی\s]{5,}',
            r'مقررات\s+[آ-ی\s]{5,}',
            # General content patterns
            r'[آ-ی]{20,}',  # Long Persian text
            r'\d+/\d+/\d+',  # Dates
        ]
        
        # الگوهای حذف محتوای غیرضروری
        self.noise_patterns = [
            r'کپی\s*رایت',
            r'تمامی\s*حقوق\s*محفوظ',
            r'بازگشت\s*به\s*صفحه\s*اصلی',
            r'ارسال\s*نظر',
            r'نسخه\s*چاپی'
        ]

    def extract_title_smart(self, soup: BeautifulSoup, url: str) -> str:
        """استخراج هوشمند عنوان"""
        try:
            # اولویت‌بندی selectors بر اساس منبع
            source_info = self._detect_source_from_url(url)
            
            if source_info:
                title_selectors = source_info.get('title_selectors', [])
            else:
                title_selectors = []
            
            # اضافه کردن selectors عمومی
            title_selectors.extend([
                'h1', 'h2', '.title', '.main-title', '.article-title',
                '.law-title', '.content-title', 'title', '.page-title',
                '.post-title', '.entry-title'
            ])
            
            # جستجو با اولویت
            for selector in title_selectors:
                elements = soup.select(selector)
                for element in elements:
                    text = element.get_text(strip=True)
                    if text and len(text) > 5 and len(text) < 200:
                        # تمیز کردن عنوان
                        clean_title = self._clean_title(text)
                        if self._is_valid_title(clean_title):
                            return clean_title
            
            # استخراج از URL در صورت عدم یافتن عنوان
            return self._extract_title_from_url(url)
            
        except Exception as e:
            logger.error(f"Error extracting title: {e}")
            return "سند حقوقی"

    def extract_content_intelligent(self, soup: BeautifulSoup, url: str) -> str:
        """استخراج هوشمند محتوا"""
        try:
            # تشخیص منبع و انتخاب استراتژی
            source_info = self._detect_source_from_url(url)
            
            # مرحله 1: استخراج با selectors اختصاصی
            if source_info:
                content = self._extract_with_source_selectors(soup, source_info)
                if content and len(content.split()) >= 20:
                    return self._post_process_content(content)
            
            # مرحله 2: استخراج با الگوریتم هوشمند
            content = self._extract_with_smart_algorithm(soup)
            if content and len(content.split()) >= 20:
                return self._post_process_content(content)
            
            # مرحله 3: استخراج fallback
            content = self._extract_fallback(soup)
            return self._post_process_content(content)
            
        except Exception as e:
            logger.error(f"Error in intelligent content extraction: {e}")
            return ""

    def _detect_source_from_url(self, url: str) -> Optional[Dict]:
        """تشخیص منبع از URL"""
        for source_name, config in AUTHORITATIVE_LEGAL_SOURCES.items():
            if any(base_url in url for base_url in config['base_urls']):
                return config
        return None

    def _extract_with_source_selectors(self, soup: BeautifulSoup, source_info: Dict) -> str:
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

    def _extract_with_smart_algorithm(self, soup: BeautifulSoup) -> str:
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
            
            # امتیاز طول متن
            word_count = len(text.split())
            if 50 <= word_count <= 2000:
                score += 0.3
            elif word_count > 2000:
                score += 0.2
            
            # امتیاز الگوهای حقوقی
            legal_matches = sum(1 for pattern in self.content_indicators 
                              if re.search(pattern, text))
            score += min(0.4, legal_matches * 0.1)
            
            # امتیاز تراکم اصطلاحات حقوقی
            legal_terms = sum(1 for terms in COMPREHENSIVE_LEGAL_TERMS.values() 
                             for term in terms if term in text.lower())
            term_density = legal_terms / max(word_count, 1)
            score += min(0.3, term_density * 10)
            
            return score
            
        except Exception as e:
            logger.error(f"Error calculating content score: {e}")
            return 0.0

    def _post_process_content(self, content: str) -> str:
        """پردازش نهایی محتوا"""
        try:
            if not content:
                return ""
            
            # نرمال‌سازی با Hazm
            normalized = self.normalizer.normalize(content)
            
            # حذف فاصله‌های اضافی
            cleaned = re.sub(r'\s+', ' ', normalized)
            cleaned = re.sub(r'\n\s*\n', '\n', cleaned)
            
            # حذف خطوط کوتاه غیرمفید
            lines = []
            for line in cleaned.split('\n'):
                line = line.strip()
                if len(line.split()) >= 3:  # حداقل 3 کلمه
                    lines.append(line)
            
            return '\n'.join(lines)
            
        except Exception as e:
            logger.error(f"Error in post-processing: {e}")
            return content

    def _clean_title(self, title: str) -> str:
        """تمیز کردن عنوان"""
        try:
            # حذف کاراکترهای اضافی
            title = re.sub(r'[|•\-–—]+', ' ', title)
            title = re.sub(r'\s+', ' ', title)
            
            # نرمال‌سازی
            return self.normalizer.normalize(title.strip())
        except:
            return title

    def _is_valid_title(self, title: str) -> bool:
        """بررسی معتبر بودن عنوان"""
        if not title or len(title.split()) < 2:
            return False
            
        # حذف عناوین غیرمفید
        invalid_patterns = [
            r'صفحه\s*اصلی',
            r'ورود\s*به\s*سایت',
            r'خطای\s*\d+',
            r'یافت\s*نشد'
        ]
        
        return not any(re.search(pattern, title, re.IGNORECASE) for pattern in invalid_patterns)

    def _extract_title_from_url(self, url: str) -> str:
        """استخراج عنوان از URL"""
        try:
            parsed = urlparse(url)
            path_parts = [part for part in parsed.path.split('/') if part]
            
            if path_parts:
                last_part = path_parts[-1]
                # حذف پسوند فایل
                title = re.sub(r'\.[^.]+$', '', last_part)
                # جایگزینی خط تیره با فاصله
                title = title.replace('-', ' ').replace('_', ' ')
                return title.title()
            
            return "سند حقوقی"
        except:
            return "سند حقوقی"

    def _extract_fallback(self, soup: BeautifulSoup) -> str:
        """استخراج fallback"""
        try:
            # حذف عناصر غیرضروری
            for tag in soup(['script', 'style', 'nav', 'footer', 'aside', 'header']):
                tag.decompose()
            
            # استخراج از body
            body = soup.find('body')
            if body:
                return body.get_text(strip=True)
            
            return soup.get_text(strip=True)
        except:
            return ""

# --- Enhanced Data Classes ---
@dataclass
class EnhancedProcessingResult:
    url: str
    title: str
    content: str
    source: str
    source_category: str = ""
    reliability_score: float = 0.0
    quality_score: float = 0.0
    classification: Dict[str, Any] = field(default_factory=dict)
    legal_entities: List[Dict] = field(default_factory=list)
    processing_time: float = 0.0
    cache_hit: bool = False
    word_count: int = 0
    readability_score: float = 0.0
    complexity_score: float = 0.0
    extracted_dates: List[str] = field(default_factory=list)
    extracted_amounts: List[str] = field(default_factory=list)
    error_message: Optional[str] = None
    content_quality_metrics: Dict[str, float] = field(default_factory=dict)
    extraction_method: str = "unknown"
    response_time: float = 0.0
    status_code: int = 0

class EnhancedLegalWebScraper:
    """اسکراپر پیشرفته با قابلیت‌های مدرن"""
    
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.normalizer = Normalizer()
        self.dns_manager = IntelligentDNSManager()
        self.proxy_manager = SmartProxyManager()
        self.content_extractor = ModernContentExtractor()
        
        # آمار و مترک‌ها
        self.metrics = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'cache_hits': 0,
            'dns_switches': 0,
            'proxy_switches': 0,
            'total_processing_time': 0.0
        }
        
        # User agents مدرن
        self.modern_user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
        ]
        
        self._init_database()
        self.session = self._create_optimized_session()
        
        logger.info("Enhanced Legal Web Scraper initialized")

    def _init_database(self):
        """ایجاد پایگاه داده بهینه‌شده"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS documents (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        url TEXT UNIQUE NOT NULL,
                        title TEXT,
                        source TEXT,
                        content TEXT,
                        quality_score REAL,
                        classification TEXT,
                        legal_entities TEXT,
                        word_count INTEGER,
                        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        source_category TEXT,
                        reliability_score REAL DEFAULT 0.5,
                        processing_time REAL,
                        readability_score REAL,
                        complexity_score REAL,
                        content_hash TEXT,
                        extraction_method TEXT,
                        response_time REAL,
                        status_code INTEGER,
                        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Enhanced indexes
                indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_source ON documents(source)',
                    'CREATE INDEX IF NOT EXISTS idx_quality ON documents(quality_score DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_category ON documents(source_category)',
                    'CREATE INDEX IF NOT EXISTS idx_hash ON documents(content_hash)',
                    'CREATE INDEX IF NOT EXISTS idx_updated ON documents(last_updated DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_word_count ON documents(word_count DESC)'
                ]
                
                for index in indexes:
                    conn.execute(index)
                
                conn.commit()
                logger.info("Enhanced database schema created")
                
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
            raise

    def _create_optimized_session(self) -> requests.Session:
        """ایجاد session بهینه‌شده"""
        try:
            session = requests.Session()
            
            # DNS setup
            dns_configured = self.dns_manager.setup_custom_dns_resolution(session)
            if dns_configured:
                self.metrics['dns_switches'] += 1
            
            # Retry strategy
            retry_strategy = Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[429, 500, 502, 503, 504, 520, 521, 522, 524],
                allowed_methods=["HEAD", "GET", "OPTIONS"]
            )
            
            # Enhanced adapter
            adapter = EnhancedHTTPAdapter(max_retries=retry_strategy)
            session.mount("http://", adapter)
            session.mount("https://", adapter)
            
            # Default headers
            session.headers.update({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8,en-US;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            })
            
            # SSL settings
            session.verify = False
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            
            logger.info("Optimized session created with DNS and SSL configuration")
            return session
            
        except Exception as e:
            logger.error(f"Session creation error: {e}")
            return requests.Session()

    def scrape_document_enhanced(self, url: str, max_retries: int = 3, 
                                use_proxy: bool = True) -> EnhancedProcessingResult:
        """استخراج پیشرفته سند"""
        self.metrics['total_requests'] += 1
        start_time = time.time()
        
        # Validate URL
        if not self._is_valid_url(url):
            return self._create_error_result(url, "Invalid URL format")
        
        for attempt in range(max_retries):
            request_start = time.time()
            
            try:
                # Prepare request configuration
                headers = self._get_dynamic_headers()
                proxies = None
                
                # Use proxy on second attempt or if requested
                if (attempt > 0 or use_proxy) and random.random() > 0.5:
                    proxies = self.proxy_manager.get_random_proxy()
                    if proxies:
                        self.metrics['proxy_switches'] += 1
                
                # Make request
                response = self.session.get(
                    url,
                    headers=headers,
                    proxies=proxies,
                    timeout=(15, 45),
                    allow_redirects=True,
                    stream=False
                )
                
                response_time = time.time() - request_start
                response.raise_for_status()
                
                # Process response
                result = self._process_response(response, url, response_time)
                
                if result.content and len(result.content.split()) >= 10:
                    self.metrics['successful_requests'] += 1
                    logger.info(f"Successfully scraped: {result.title[:50]}... ({result.word_count} words)")
                    return result
                else:
                    raise ValueError("Insufficient content extracted")
                    
            except requests.exceptions.RequestException as e:
                logger.warning(f"Attempt {attempt + 1} failed for {url}: {e}")
                
                if attempt < max_retries - 1:
                    # Progressive backoff with jitter
                    delay = (attempt + 1) * 2 + random.uniform(0, 1)
                    time.sleep(delay)
                    
            except Exception as e:
                logger.error(f"Unexpected error in attempt {attempt + 1}: {e}")
                break
        
        # All attempts failed
        self.metrics['failed_requests'] += 1
        processing_time = time.time() - start_time
        
        return self._create_error_result(url, "All scraping attempts failed", processing_time)

    def _is_valid_url(self, url: str) -> bool:
        """بررسی معتبر بودن URL"""
        try:
            parsed = urlparse(url)
            return bool(parsed.netloc and parsed.scheme in ['http', 'https'])
        except:
            return False

    def _get_dynamic_headers(self) -> Dict[str, str]:
        """تولید headers پویا"""
        return {
            'User-Agent': random.choice(self.modern_user_agents),
            'Accept': random.choice([
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
            ]),
            'Accept-Language': random.choice([
                'fa-IR,fa;q=0.9,en;q=0.8',
                'fa;q=0.9,en-US;q=0.8,en;q=0.7',
                'fa-IR,fa;q=0.8,en-US;q=0.5,en;q=0.3'
            ]),
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': random.choice(['none', 'same-origin', 'cross-site']),
            'Cache-Control': random.choice(['no-cache', 'max-age=0']),
            'Pragma': 'no-cache'
        }

    def _process_response(self, response: requests.Response, url: str, response_time: float) -> EnhancedProcessingResult:
        """پردازش پاسخ HTTP"""
        try:
            # Detect encoding
            encoding = self._detect_encoding(response)
            content_text = response.content.decode(encoding, errors='ignore')
            
            # Parse HTML
            soup = BeautifulSoup(content_text, 'html.parser')
            
            # Extract title and content
            title = self.content_extractor.extract_title_smart(soup, url)
            main_content = self.content_extractor.extract_content_intelligent(soup, url)
            
            # Identify source
            source_info = self._identify_enhanced_source(url, soup)
            
            # Extract metadata
            dates = self._extract_dates_enhanced(main_content)
            amounts = self._extract_amounts_enhanced(main_content)
            
            # Calculate quality metrics
            quality_metrics = self._calculate_content_quality_metrics(main_content)
            
            # Create result
            result = EnhancedProcessingResult(
                url=url,
                title=title,
                content=main_content,
                source=source_info['name'],
                source_category=source_info['category'],
                reliability_score=source_info['reliability_score'],
                word_count=len(main_content.split()) if main_content else 0,
                extracted_dates=dates,
                extracted_amounts=amounts,
                content_quality_metrics=quality_metrics,
                extraction_method="intelligent_multi_stage",
                response_time=response_time,
                status_code=response.status_code,
                processing_time=0  # Will be set by caller
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing response: {e}")
            return self._create_error_result(url, f"Response processing error: {e}")

    def _detect_encoding(self, response: requests.Response) -> str:
        """تشخیص هوشمند encoding"""
        try:
            # اولویت 1: از response header
            if response.encoding and response.encoding.lower() not in ['iso-8859-1', 'windows-1252']:
                return response.encoding
            
            # اولویت 2: از meta tag
            content_type = response.headers.get('content-type', '')
            if 'charset=' in content_type:
                charset = content_type.split('charset=')[1].split(';')[0].strip()
                if charset:
                    return charset
            
            # اولویت 3: تشخیص از محتوا
            raw_content = response.content[:1024]  # اول محتوا
            try:
                raw_content.decode('utf-8')
                return 'utf-8'
            except UnicodeDecodeError:
                pass
            
            # fallback
            return 'utf-8'
            
        except Exception as e:
            logger.warning(f"Encoding detection error: {e}")
            return 'utf-8'

    def _identify_enhanced_source(self, url: str, soup: BeautifulSoup) -> Dict[str, Any]:
        """تشخیص پیشرفته منبع"""
        try:
            # تطبیق با منابع معتبر
            for source_name, config in AUTHORITATIVE_LEGAL_SOURCES.items():
                if any(base_url in url for base_url in config['base_urls']):
                    return {
                        'name': source_name,
                        'category': config['category'],
                        'reliability_score': config['reliability_score'],
                        'priority': config['priority'],
                        'icon': config['icon']
                    }
            
            # تشخیص از محتوای صفحه
            page_title = soup.find('title')
            if page_title:
                title_text = page_title.get_text().lower()
                
                # تشخیص بر اساس کلمات کلیدی در عنوان
                if any(keyword in title_text for keyword in ['مجلس', 'شورا']):
                    return {
                        'name': 'مجلس (تشخیص هوشمند)',
                        'category': 'قانون',
                        'reliability_score': 0.85,
                        'priority': 2,
                        'icon': ICONS['majlis']
                    }
                elif any(keyword in title_text for keyword in ['دادگاه', 'قضایی']):
                    return {
                        'name': 'قوه قضاییه (تشخیص هوشمند)',
                        'category': 'دادنامه',
                        'reliability_score': 0.80,
                        'priority': 2,
                        'icon': ICONS['judiciary']
                    }
            
            # منبع نامشخص
            return {
                'name': 'منبع نامشخص',
                'category': 'نامشخص',
                'reliability_score': 0.3,
                'priority': 5,
                'icon': ICONS['document']
            }
            
        except Exception as e:
            logger.error(f"Enhanced source identification error: {e}")
            return {
                'name': 'خطا در تشخیص',
                'category': 'نامشخص',
                'reliability_score': 0.1,
                'priority': 5,
                'icon': ICONS['error']
            }

    def _extract_dates_enhanced(self, content: str) -> List[str]:
        """استخراج پیشرفته تاریخ‌ها"""
        try:
            date_patterns = [
                r'\d{4}/\d{1,2}/\d{1,2}',  # 1403/05/15
                r'\d{1,2}/\d{1,2}/\d{4}',  # 15/05/1403
                r'\d{1,2}\s*[-/]\s*\d{1,2}\s*[-/]\s*\d{4}',  # 15-05-1403
                r'\d{1,2}\s+(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)\s+\d{4}',
                r'(سال|تاریخ)\s*\d{4}',
                r'مورخ\s*\d{4}/\d{1,2}/\d{1,2}'
            ]
            
            found_dates = []
            for pattern in date_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                found_dates.extend(matches)
            
            # حذف تکراری و اعتبارسنجی
            valid_dates = []
            for date in set(found_dates):
                if self._validate_persian_date(date):
                    valid_dates.append(date)
            
            return valid_dates[:15]  # محدود به 15 تاریخ
            
        except Exception as e:
            logger.error(f"Enhanced date extraction error: {e}")
            return []

    def _extract_amounts_enhanced(self, content: str) -> List[str]:
        """استخراج پیشرفته مبالغ"""
        try:
            amount_patterns = [
                r'\d{1,3}(?:,\d{3})*\s*(ریال|تومان|درهم|دینار|دلار|یورو)',
                r'مبلغ\s+\d{1,3}(?:,\d{3})*',
                r'جریمه\s+\d{1,3}(?:,\d{3})*',
                r'خسارت\s+\d{1,3}(?:,\d{3})*',
                r'دیه\s+\d{1,3}(?:,\d{3})*',
                r'\d+\s*میلیون\s*(ریال|تومان)',
                r'\d+\s*میلیارد\s*(ریال|تومان)'
            ]
            
            found_amounts = []
            for pattern in amount_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                found_amounts.extend(matches)
            
            return list(set(str(amount) for amount in found_amounts))[:10]
            
        except Exception as e:
            logger.error(f"Enhanced amount extraction error: {e}")
            return []

    def _validate_persian_date(self, date_str: str) -> bool:
        """اعتبارسنجی تاریخ فارسی"""
        try:
            # بررسی ساده فرمت
            if re.match(r'\d{4}/\d{1,2}/\d{1,2}', date_str):
                parts = date_str.split('/')
                year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                return 1300 <= year <= 1450 and 1 <= month <= 12 and 1 <= day <= 31
            return True  # سایر فرمت‌ها را معتبر فرض می‌کنیم
        except:
            return False

    def _calculate_content_quality_metrics(self, content: str) -> Dict[str, float]:
        """محاسبه مترک‌های کیفیت محتوا"""
        try:
            if not content:
                return {}
            
            words = content.split()
            word_count = len(words)
            
            # تراکم اصطلاحات حقوقی
            legal_terms_count = sum(1 for terms in COMPREHENSIVE_LEGAL_TERMS.values() 
                                  for term in terms if term in content.lower())
            legal_density = legal_terms_count / max(word_count, 1)
            
            # تنوع واژگان
            unique_words = set(word.lower() for word in words)
            vocabulary_diversity = len(unique_words) / max(word_count, 1)
            
            # ساختار متن
            sentences = re.split(r'[.؟!]', content)
            avg_sentence_length = word_count / max(len(sentences), 1)
            
            # وجود عناصر ساختاری
            structural_elements = {
                'articles': len(re.findall(r'ماده\s*\d+', content)),
                'notes': content.count('تبصره'),
                'chapters': len(re.findall(r'فصل\s*\d+', content)),
                'references': len(re.findall(r'(طبق|مطابق|برابر)', content))
            }
            
            structure_score = min(1.0, sum(structural_elements.values()) / 10)
            
            return {
                'legal_density': legal_density,
                'vocabulary_diversity': vocabulary_diversity,
                'avg_sentence_length': avg_sentence_length,
                'structure_score': structure_score,
                'structural_elements': structural_elements,
                'readability_estimate': self._estimate_readability(avg_sentence_length, vocabulary_diversity),
                'complexity_estimate': self._estimate_complexity(legal_density, structure_score)
            }
            
        except Exception as e:
            logger.error(f"Content quality metrics error: {e}")
            return {}

    def _estimate_readability(self, avg_sentence_length: float, vocabulary_diversity: float) -> float:
        """تخمین خوانایی"""
        try:
            # فرمول ساده برای فارسی
            readability = 1.0 - (avg_sentence_length / 50) - (vocabulary_diversity - 0.5) ** 2
            return max(0.0, min(1.0, readability))
        except:
            return 0.5

    def _estimate_complexity(self, legal_density: float, structure_score: float) -> float:
        """تخمین پیچیدگی"""
        try:
            complexity = legal_density * 0.6 + structure_score * 0.4
            return max(0.0, min(1.0, complexity))
        except:
            return 0.5

    def _create_error_result(self, url: str, error_message: str, processing_time: float = 0.0) -> EnhancedProcessingResult:
        """ایجاد نتیجه خطا"""
        return EnhancedProcessingResult(
            url=url,
            title="خطا در استخراج",
            content="",
            source="نامشخص",
            error_message=error_message,
            processing_time=processing_time
        )

# --- Enhanced Classification System ---
class HuggingFaceOptimizedClassifier:
    """سیستم طبقه‌بندی بهینه‌شده برای Hugging Face"""
    
    def __init__(self, cache_system):
        self.cache_system = cache_system
        self.models = {}
        self.tokenizers = {}
        self.is_ready = False
        self.load_attempts = 0
        self.max_attempts = 2
        
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
            }
        }
        
        self._load_models_optimized()

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
            
            # تولید embedding (در صورت آمادگی)
            if self.is_ready and 'embedder' in self.models:
                try:
                    embedding = self.models['embedder'].encode(sample_content)
                    result['embedding'] = {
                        'vector': embedding.tolist()[:50],  # محدود برای کارایی
                        'dimension': len(embedding)
                    }
                    result['models_used'].append('embedder')
                except Exception as e:
                    logger.warning(f"Embedding generation failed: {e}")
            
            # تعیین طبقه‌بندی نهایی
            final_classification = self._determine_final_classification(result, source_info)
            result['final_classification'] = final_classification
            result['confidence'] = self._calculate_overall_confidence(result)
            result['processing_time'] = time.time() - start_time
            result['status'] = 'success'
            
            return result
            
        except Exception as e:
            logger.error(f"Enhanced classification error: {e}")
            return {
                'error': str(e),
                'classification': 'نامشخص',
                'processing_time': time.time() - start_time,
                'status': 'failed'
            }

    def _enhanced_rule_based_classify(self, content: str, source_info: Dict = None) -> Dict:
        """طبقه‌بندی پیشرفته مبتنی بر قوانین"""
        try:
            content_lower = content.lower()
            scores = {}
            details = {}
            
            for category, config in self.enhanced_categories.items():
                score = 0.0
                matched_items = {'keywords': [], 'patterns': []}
                
                # امتیاز کلمات کلیدی
                for keyword in config['keywords']:
                    count = content_lower.count(keyword.lower())
                    if count > 0:
                        score += count * 0.1
                        matched_items['keywords'].append((keyword, count))
                
                # امتیاز الگوها
                for pattern in config.get('patterns', []):
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        score += len(matches) * 0.15
                        matched_items['patterns'].append((pattern, matches))
                
                # بونوس منبع
                if source_info and source_info.get('category') == config.get('expected_source_category'):
                    score *= 1.3
                
                # نرمال‌سازی امتیاز
                scores[category] = min(1.0, score) * config['weight']
                details[category] = {
                    'matched_items': matched_items,
                    'raw_score': score,
                    'normalized_score': scores[category]
                }
            
            # یافتن بهترین دسته
            if scores:
                total_score = sum(scores.values())
                if total_score > 0:
                    normalized_scores = {k: v/total_score for k, v in scores.items()}
                    primary_category = max(normalized_scores, key=normalized_scores.get)
                    confidence = normalized_scores[primary_category]
                    
                    # اعمال حد آستانه اعتماد
                    min_confidence = self.enhanced_categories[primary_category]['min_confidence']
                    if confidence < min_confidence:
                        primary_category = 'نامشخص'
                        confidence = 0.0
                else:
                    primary_category = 'نامشخص'
                    confidence = 0.0
                    normalized_scores = {}
            else:
                primary_category = 'نامشخص'
                confidence = 0.0
                normalized_scores = {}
            
            return {
                'scores': normalized_scores,
                'primary_category': primary_category,
                'confidence': confidence,
                'details': details,
                'method': 'enhanced_rule_based'
            }
            
        except Exception as e:
            logger.error(f"Enhanced rule-based classification error: {e}")
            return {
                'scores': {},
                'primary_category': 'نامشخص',
                'confidence': 0.0,
                'details': {},
                'error': str(e)
            }

    def _determine_final_classification(self, result: Dict, source_info: Dict) -> str:
        """تعیین طبقه‌بندی نهایی"""
        try:
            rule_category = result.get('rule_based', {}).get('primary_category', 'نامشخص')
            rule_confidence = result.get('rule_based', {}).get('confidence', 0.0)
            
            # اگر مدل transformer موجود است
            if 'transformer' in result and result['transformer']:
                transformer_result = result['transformer'][0]
                transformer_confidence = transformer_result.get('score', 0.0)
                
                # ترکیب نتایج
                if transformer_confidence > 0.8 and rule_confidence > 0.5:
                    return rule_category  # اعتماد به rule-based
                elif transformer_confidence > 0.9:
                    transformer_label = transformer_result.get('label', 'نامشخص')
                    if transformer_label in self.enhanced_categories:
                        return transformer_label
            
            # استفاده از اطلاعات منبع
            if source_info and rule_confidence < 0.5:
                source_category = source_info.get('category')
                if source_category in ['قانون', 'دادنامه', 'رویه_قضایی']:
                    return source_category
            
            return rule_category
            
        except Exception as e:
            logger.error(f"Final classification determination error: {e}")
            return 'نامشخص'

    def _calculate_overall_confidence(self, result: Dict) -> float:
        """محاسبه اعتماد کلی"""
        try:
            rule_confidence = result.get('rule_based', {}).get('confidence', 0.0)
            transformer_confidence = 0.0
            
            if 'transformer' in result and result['transformer']:
                transformer_confidence = result['transformer'][0].get('score', 0.0)
            
            # میانگین وزنی
            if transformer_confidence > 0:
                overall = rule_confidence * 0.6 + transformer_confidence * 0.4
            else:
                overall = rule_confidence
            
            return overall
            
        except Exception as e:
            logger.error(f"Overall confidence calculation error: {e}")
            return 0.0

# --- Enhanced Main Application Class ---
class UltraModernLegalArchive:
    """کلاس اصلی آرشیو مدرن اسناد حقوقی با قابلیت‌های حرفه‌ای"""
    
    def __init__(self):
        # Initialize enhanced systems
        self.cache_system = UltraIntelligentCacheSystem()
        self.proxy_manager = ModernProxyManager()
        self.url_manager = AdvancedURLManager()
        self.scraper = EnhancedLegalWebScraper()
        self.classifier = HuggingFaceOptimizedClassifier(self.cache_system)
        self.scoring_system = UltraAdvancedScoringSystem()
        
        # Enhanced metrics and monitoring
        self.operation_logs = []
        self.current_operation = None
        self.is_processing = False
        self.session_stats = {
            'start_time': time.time(),
            'total_operations': 0,
            'successful_operations': 0,
            'failed_operations': 0,
            'total_urls_processed': 0,
            'average_quality_score': 0.0,
            'proxy_switches': 0,
            'cache_hits': 0
        }
        
        # Update scraper to use new proxy manager
        self.scraper.proxy_manager = self.proxy_manager
        
        logger.info("🚀 Ultra Modern Legal Archive System with Enhanced Infrastructure Ready")

    def log_operation(self, operation_type: str, message: str, level: str = "INFO"):
        """ثبت عملیات در سیستم لاگ"""
        log_entry = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'operation': operation_type,
            'message': message,
            'level': level
        }
        
        self.operation_logs.append(log_entry)
        
        # Keep only last 100 logs for memory efficiency
        if len(self.operation_logs) > 100:
            self.operation_logs = self.operation_logs[-100:]
        
        # Also log to standard logger
        if level == "ERROR":
            logger.error(f"[{operation_type}] {message}")
        elif level == "WARNING":
            logger.warning(f"[{operation_type}] {message}")
        else:
            logger.info(f"[{operation_type}] {message}")

    def process_bulk_urls_enhanced(self, bulk_text: str, enable_proxy: bool = True, 
                                  batch_size: int = 3, progress=gr.Progress()) -> Tuple[str, str, str, str]:
        """پردازش پیشرفته URLs انبوه با نظارت کامل"""
        
        if self.is_processing:
            return "⚠️ پردازش قبلی در جریان است", "", "", self._get_logs_html()
        
        self.is_processing = True
        start_time = time.time()
        
        try:
            self.log_operation("BULK_PROCESS", "Starting bulk URL processing", "INFO")
            
            # Parse URLs
            progress(0.05, "Parsing URLs...")
            parsed_urls = self.url_manager.parse_bulk_urls(bulk_text)
            
            if not parsed_urls:
                self.is_processing = False
                return "❌ No valid URLs found", "", "", self._get_logs_html()
            
            # Add to queue
            queue_result = self.url_manager.add_urls_to_queue(parsed_urls)
            self.log_operation("URL_QUEUE", f"Added {queue_result['added']} URLs to queue", "INFO")
            
            # Initialize proxy system if enabled
            if enable_proxy:
                progress(0.10, "Testing proxy infrastructure...")
                self.log_operation("PROXY_INIT", "Initializing proxy system", "INFO")
                
                # Test proxies if needed
                if not self.proxy_manager.active_proxies:
                    def proxy_progress(p, desc):
                        progress(0.10 + p * 0.15, f"Proxy testing: {desc}")
                    
                    proxy_results = self.proxy_manager.update_proxy_list(
                        include_fresh=False, 
                        progress_callback=proxy_progress
                    )
                    
                    active_proxies = proxy_results.get('active_count', 0)
                    self.log_operation("PROXY_TEST", f"Found {active_proxies} active proxies", "INFO")
                    
            # Process URLs in batches
            total_urls = len(parsed_urls)
            processed_count = 0
            successful_count = 0
            results_summary = []
            
            self.log_operation("PROCESSING", f"Starting to process {total_urls} URLs in batches of {batch_size}", "INFO")
            
            while True:
                batch = self.url_manager.get_next_batch(batch_size)
                if not batch:
                    break
                
                batch_start_time = time.time()
                self.log_operation("BATCH_START", f"Processing batch of {len(batch)} URLs", "INFO")
                
                # Process each URL in batch
                for i, url_info in enumerate(batch):
                    url = url_info['url']
                    batch_progress = (processed_count + i + 1) / total_urls
                    progress(0.25 + batch_progress * 0.70, f"Processing {processed_count + i + 1}/{total_urls}: {url[:50]}...")
                    
                    try:
                        # Process single URL
                        result = self._process_single_url_complete(url, use_proxy=enable_proxy)
                        
                        if result.get('status') == 'success':
                            self.url_manager.mark_url_completed(url, result)
                            successful_count += 1
                            results_summary.append({
                                'url': url,
                                'title': result.get('title', 'No title'),
                                'quality': result.get('quality_score', 0),
                                'word_count': result.get('word_count', 0)
                            })
                            self.log_operation("URL_SUCCESS", f"Successfully processed: {url[:60]}", "INFO")
                        else:
                            error_msg = result.get('error', 'Unknown error')
                            self.url_manager.mark_url_failed(url, error_msg)
                            self.log_operation("URL_FAILED", f"Failed to process {url[:60]}: {error_msg}", "WARNING")
                        
                    except Exception as e:
                        self.url_manager.mark_url_failed(url, str(e))
                        self.log_operation("URL_ERROR", f"Error processing {url[:60]}: {str(e)}", "ERROR")
                    
                    # Small delay between requests
                    time.sleep(random.uniform(1, 2))
                
                processed_count += len(batch)
                batch_time = time.time() - batch_start_time
                self.log_operation("BATCH_COMPLETE", f"Batch completed in {batch_time:.1f}s", "INFO")
            
            # Generate final results
            total_time = time.time() - start_time
            queue_status = self.url_manager.get_queue_status()
            
            # Update session stats
            self.session_stats['total_operations'] += 1
            self.session_stats['successful_operations'] += 1 if successful_count > 0 else 0
            self.session_stats['total_urls_processed'] += processed_count
            
            # Calculate average quality
            if results_summary:
                avg_quality = sum(r['quality'] for r in results_summary) / len(results_summary)
                self.session_stats['average_quality_score'] = avg_quality
            
            self.log_operation("BULK_COMPLETE", f"Bulk processing completed: {successful_count}/{processed_count} successful", "INFO")
            
            # Generate comprehensive summary
            summary = f"""📊 **نتایج پردازش انبوه URLs:**

✅ **موفق:** {successful_count}/{processed_count}
⏱️ **زمان کل:** {total_time:.1f} ثانیه
📈 **میانگین کیفیت:** {avg_quality:.1f}/100
🌐 **پروکسی فعال:** {'بله' if enable_proxy else 'خیر'} ({len(self.proxy_manager.active_proxies)} آماده)
📚 **کل اسناد آرشیو:** {self._get_total_documents():,}"""

            # Detailed results
            details_lines = []
            for i, result in enumerate(results_summary, 1):
                details_lines.append(f"{i}. **{result['title'][:60]}**")
                details_lines.append(f"   └ کیفیت: {result['quality']:.1f} | کلمات: {result['word_count']:,}")
                details_lines.append(f"   └ URL: {result['url']}")
                details_lines.append("")
            
            details = '\n'.join(details_lines) if details_lines else "No successful results"
            
            # System statistics
            proxy_stats = self.proxy_manager.get_proxy_dashboard_data()
            cache_stats = self.cache_system.get_comprehensive_stats()
            
            system_stats = f"""🔧 **آمار سیستم:**

🔗 **پروکسی:**
• فعال: {proxy_stats.get('active_proxies', 0)}/{proxy_stats.get('total_proxies', 0)}
• نرخ موفقیت: {proxy_stats.get('success_rate', 0):.1f}%
• متوسط پاسخ: {proxy_stats.get('average_response_time', 0):.0f}ms

⚡ **کش:**
• نرخ برخورد: {cache_stats.get('hit_rate_percent', 0):.1f}%
• حافظه: {cache_stats.get('memory_cache_size', 0)} آیتم
• اندازه: {cache_stats.get('total_size_mb', 0):.1f} MB"""
            
            self.is_processing = False
            return summary, details, system_stats, self._get_logs_html()
            
        except Exception as e:
            self.is_processing = False
            self.log_operation("BULK_ERROR", f"Critical error in bulk processing: {str(e)}", "ERROR")
            error_html = f'<div style="color: red; padding: 10px; border: 1px solid red; border-radius: 5px;">❌ Critical Error: {str(e)}</div>'
            return f"❌ Critical error: {str(e)}", "", "", error_html + self._get_logs_html()

    def _get_logs_html(self) -> str:
        """تولید HTML برای نمایش لاگ‌ها"""
        if not self.operation_logs:
            return '<div style="padding: 10px;">No logs available</div>'
        
        html_lines = ['<div style="font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 5px; max-height: 300px; overflow-y: auto;">']
        
        for log in self.operation_logs[-20:]:  # Show last 20 logs
            level_color = {
                'ERROR': '#dc3545',
                'WARNING': '#ffc107', 
                'INFO': '#28a745'
            }.get(log['level'], '#6c757d')
            
            html_lines.append(f'''
                <div style="margin: 2px 0; color: {level_color};">
                    <span style="color: #6c757d;">[{log['timestamp']}]</span>
                    <span style="font-weight: bold;">[{log['operation']}]</span>
                    {log['message']}
                </div>
            ''')
        
        html_lines.append('</div>')
        return ''.join(html_lines)

    def update_proxy_system(self, include_online: bool = True, progress=gr.Progress()) -> Tuple[str, str]:
        """به‌روزرسانی سیستم پروکسی با نمایش پیشرفت"""
        try:
            self.log_operation("PROXY_UPDATE", "Starting proxy system update", "INFO")
            
            def update_progress(p, desc):
                progress(p, desc)
                self.log_operation("PROXY_UPDATE", desc, "INFO")
            
            results = self.proxy_manager.update_proxy_list(
                include_fresh=include_online,
                progress_callback=update_progress
            )
            
            if 'error' in results:
                error_msg = f"Proxy update failed: {results['error']}"
                self.log_operation("PROXY_UPDATE", error_msg, "ERROR")
                return error_msg, self._get_proxy_dashboard_html()
            
            success_msg = f"""✅ **Proxy Update Complete**

📊 **Results:**
• Total tested: {results.get('total_tested', 0)}
• Active proxies: {results.get('active_count', 0)}
• Success rate: {results.get('success_rate', 0):.1f}%
• Iranian proxies: {results.get('iranian_proxies', 0)}
• International proxies: {results.get('international_proxies', 0)}
• Average response: {results.get('average_response_time', 0):.0f}ms"""
            
            self.log_operation("PROXY_UPDATE", f"Update completed: {results.get('active_count', 0)} active proxies found", "INFO")
            return success_msg, self._get_proxy_dashboard_html()
            
        except Exception as e:
            error_msg = f"Proxy update error: {str(e)}"
            self.log_operation("PROXY_UPDATE", error_msg, "ERROR")
            return error_msg, self._get_proxy_dashboard_html()

    def _get_proxy_dashboard_html(self) -> str:
        """تولید HTML داشبورد پروکسی"""
        try:
            dashboard_data = self.proxy_manager.get_proxy_dashboard_data()
            
            if 'error' in dashboard_data:
                return f'<div style="color: red;">Error loading proxy data: {dashboard_data["error"]}</div>'
            
            # Create visual dashboard
            html = f'''
            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h3 style="color: #333; margin-top: 0;">🔗 Proxy Dashboard</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #0066cc;">{dashboard_data.get('active_proxies', 0)}</div>
                        <div style="color: #666;">Active Proxies</div>
                    </div>
                    
                    <div style="background: #fff2e7; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #cc6600;">{dashboard_data.get('success_rate', 0):.1f}%</div>
                        <div style="color: #666;">Success Rate</div>
                    </div>
                    
                    <div style="background: #e7ffe7; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #006600;">{dashboard_data.get('average_response_time', 0):.0f}ms</div>
                        <div style="color: #666;">Avg Response</div>
                    </div>
                    
                    <div style="background: #ffe7e7; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #cc0000;">{dashboard_data.get('failed_proxies', 0)}</div>
                        <div style="color: #666;">Failed Proxies</div>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4 style="color: #333;">Response Time Distribution:</h4>
                    <div style="display: flex; gap: 10px; margin: 10px 0;">
                        <div style="background: #28a745; color: white; padding: 8px 12px; border-radius: 5px;">
                            Fast (&lt;2s): {dashboard_data.get('response_categories', {}).get('fast', 0)}
                        </div>
                        <div style="background: #ffc107; color: black; padding: 8px 12px; border-radius: 5px;">
                            Medium (2-5s): {dashboard_data.get('response_categories', {}).get('medium', 0)}
                        </div>
                        <div style="background: #dc3545; color: white; padding: 8px 12px; border-radius: 5px;">
                            Slow (&gt;5s): {dashboard_data.get('response_categories', {}).get('slow', 0)}
                        </div>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4 style="color: #333;">Geographic Distribution:</h4>
                    <div style="display: flex; gap: 10px; margin: 10px 0;">
                        <div style="background: #17a2b8; color: white; padding: 8px 12px; border-radius: 5px;">
                            Iranian: {dashboard_data.get('country_distribution', {}).get('iranian', 0)}
                        </div>
                        <div style="background: #6f42c1; color: white; padding: 8px 12px; border-radius: 5px;">
                            International: {dashboard_data.get('country_distribution', {}).get('international', 0)}
                        </div>
                        <div style="background: #20c997; color: white; padding: 8px 12px; border-radius: 5px;">
                            Online: {dashboard_data.get('country_distribution', {}).get('online', 0)}
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 15px; font-size: 14px; color: #666;">
                    Last updated: {dashboard_data.get('last_update', 'Never')}
                </div>
            </div>
            '''
            
            return html
            
        except Exception as e:
            return f'<div style="color: red;">Error generating dashboard: {str(e)}</div>'

    def process_urls_intelligently(self, urls_text: str, progress=gr.Progress()) -> Tuple[str, str, str]:
        """پردازش هوشمند URLs با تمام قابلیت‌های پیشرفته"""
        if not urls_text or not urls_text.strip():
            return "❌ لطفاً فهرست آدرس‌ها را وارد کنید", "", ""
        
        # Parse and validate URLs
        urls = self._parse_and_validate_urls(urls_text)
        
        if not urls:
            return "❌ آدرس معتبری یافت نشد", "", ""
        
        # Limit for HF environment
        if len(urls) > 8:  # محدودیت برای HF
            urls = urls[:8]
            warning_msg = f"⚠️ محدود به {len(urls)} آدرس اول"
        else:
            warning_msg = ""
        
        logger.info(f"Processing {len(urls)} URLs intelligently...")
        
        # Process URLs with enhanced pipeline
        results = []
        processing_stats = {
            'successful': 0,
            'failed': 0,
            'cache_hits': 0,
            'total_time': 0,
            'quality_scores': []
        }
        
        for i, url in enumerate(urls):
            progress_pct = (i + 1) / len(urls)
            progress(progress_pct, desc=f"پردازش هوشمند {i+1}/{len(urls)}")
            
            try:
                result = self._process_single_url_complete(url)
                results.append(result)
                
                # Update stats
                if result.get('status') == 'success':
                    processing_stats['successful'] += 1
                    if 'quality_score' in result:
                        processing_stats['quality_scores'].append(result['quality_score'])
                else:
                    processing_stats['failed'] += 1
                
                if result.get('cache_hit'):
                    processing_stats['cache_hits'] += 1
                
                processing_stats['total_time'] += result.get('processing_time', 0)
                
            except Exception as e:
                logger.error(f"Error processing {url}: {e}")
                processing_stats['failed'] += 1
                results.append({'status': 'failed', 'error': str(e), 'url': url})
            
            # Delay between requests
            time.sleep(random.uniform(1, 3))
        
        # Generate comprehensive report
        summary, details, stats = self._generate_comprehensive_report(
            results, processing_stats, warning_msg
        )
        
        return summary, details, stats

    def _parse_and_validate_urls(self, urls_text: str) -> List[str]:
        """تجزیه و اعتبارسنجی URLs"""
        try:
            lines = urls_text.strip().split('\n')
            valid_urls = []
            
            for line in lines:
                url = line.strip()
                
                # Skip empty lines and comments
                if not url or url.startswith('#'):
                    continue
                
                # Validate URL format
                if url.startswith(('http://', 'https://')):
                    # Additional validation
                    try:
                        parsed = urlparse(url)
                        if parsed.netloc:
                            valid_urls.append(url)
                    except:
                        continue
                elif url.startswith('www.'):
                    # Add https prefix
                    valid_urls.append(f'https://{url}')
                
            return valid_urls
            
        except Exception as e:
            logger.error(f"URL parsing error: {e}")
            return []

    def _process_single_url_complete(self, url: str) -> Dict[str, Any]:
        """پردازش کامل تک URL"""
        start_time = time.time()
        
        try:
            # Check cache first
            cache_key = hashlib.sha256(url.encode()).hexdigest()[:16]
            cached = self.cache_system.get(cache_key, 'complete_processing')
            
            if cached:
                cached['cache_hit'] = True
                cached['status'] = 'success'
                return cached
            
            # Scrape document
            scrape_result = self.scraper.scrape_document_enhanced(url)
            
            if scrape_result.error_message:
                return {
                    'status': 'failed',
                    'error': scrape_result.error_message,
                    'url': url,
                    'processing_time': time.time() - start_time
                }
            
            # Classify document
            classification_result = self.classifier.classify_document_enhanced(
                scrape_result.content,
                {
                    'name': scrape_result.source,
                    'category': scrape_result.source_category,
                    'reliability_score': scrape_result.reliability_score
                }
            )
            
            # Calculate quality score
            quality_result = self.scoring_system.calculate_ultra_comprehensive_score(
                scrape_result.content,
                {'reliability_score': scrape_result.reliability_score},
                classification_result.get('legal_entities', []),
                scrape_result.source_category
            )
            
            # Compile final result
            final_result = {
                'status': 'success',
                'url': url,
                'title': scrape_result.title,
                'source': scrape_result.source,
                'word_count': scrape_result.word_count,
                'quality_score': quality_result.get('final_score', 0),
                'classification': classification_result.get('final_classification', 'نامشخص'),
                'confidence': classification_result.get('confidence', 0.0),
                'models_used': classification_result.get('models_used', []),
                'processing_time': time.time() - start_time,
                'cache_hit': False,
                'extracted_dates': scrape_result.extracted_dates,
                'extracted_amounts': scrape_result.extracted_amounts,
                'content_metrics': scrape_result.content_quality_metrics
            }
            
            # Save to database
            self._save_enhanced_result(scrape_result, classification_result, quality_result)
            
            # Cache result
            self.cache_system.set(
                cache_key, final_result, 'complete_processing',
                ttl_seconds=7200, priority=1,
                source_reliability=scrape_result.reliability_score
            )
            
            return final_result
            
        except Exception as e:
            logger.error(f"Complete URL processing error: {e}")
            return {
                'status': 'failed',
                'error': str(e),
                'url': url,
                'processing_time': time.time() - start_time
            }

    def _save_enhanced_result(self, scrape_result: EnhancedProcessingResult, 
                            classification_result: Dict, quality_result: Dict):
        """ذخیره نتیجه پیشرفته در دیتابیس"""
        try:
            content_hash = hashlib.sha256(scrape_result.content.encode()).hexdigest()
            
            with sqlite3.connect(self.scraper.db_path) as conn:
                conn.execute('''
                    INSERT OR REPLACE INTO documents 
                    (url, title, source, content, quality_score, classification, 
                     legal_entities, word_count, source_category, reliability_score,
                     processing_time, readability_score, complexity_score, 
                     content_hash, extraction_method, response_time, status_code, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    scrape_result.url,
                    scrape_result.title,
                    scrape_result.source,
                    scrape_result.content,
                    quality_result.get('final_score', 0),
                    classification_result.get('final_classification', 'نامشخص'),
                    json.dumps(classification_result.get('legal_entities', []), ensure_ascii=False),
                    scrape_result.word_count,
                    scrape_result.source_category,
                    scrape_result.reliability_score,
                    scrape_result.processing_time,
                    scrape_result.readability_score,
                    scrape_result.complexity_score,
                    content_hash,
                    scrape_result.extraction_method,
                    scrape_result.response_time,
                    scrape_result.status_code,
                    datetime.now().isoformat()
                ))
                
        except Exception as e:
            logger.error(f"Enhanced result saving error: {e}")

    def _generate_comprehensive_report(self, results: List[Dict], stats: Dict, warning: str) -> Tuple[str, str, str]:
        """تولید گزارش جامع"""
        try:
            successful = stats['successful']
            failed = stats['failed'] 
            cache_hits = stats['cache_hits']
            total_time = stats['total_time']
            
            # Calculate averages
            avg_quality = sum(stats['quality_scores']) / len(stats['quality_scores']) if stats['quality_scores'] else 0
            avg_time = total_time / len(results) if results else 0
            
            # Summary report
            summary = f"""{warning}
📊 **گزارش پردازش فوق‌هوشمند:**

{ICONS['success']} موفق: {successful}
{ICONS['error']} ناموفق: {failed}  
{ICONS['cache']} استفاده از کش: {cache_hits}
📈 میانگین کیفیت: {avg_quality:.1f}/100
⏱️ میانگین زمان: {avg_time:.1f}s
🎯 نرخ موفقیت: {(successful/(successful+failed)*100):.1f}%
📚 کل اسناد آرشیو: {self._get_total_documents():,}"""

            # Detailed results
            details_lines = []
            for i, result in enumerate(results, 1):
                if result.get('status') == 'success':
                    title = result.get('title', 'بدون عنوان')[:60]
                    quality = result.get('quality_score', 0)
                    classification = result.get('classification', 'نامشخص')
                    source = result.get('source', 'نامشخص')
                    word_count = result.get('word_count', 0)
                    models = ', '.join(result.get('models_used', []))
                    cache_icon = ICONS['cache'] if result.get('cache_hit') else ''
                    
                    details_lines.append(
                        f"{i}. {cache_icon} **{title}**\n"
                        f"   └ منبع: {source} | کیفیت: {quality:.1f} | دسته: {classification}\n"
                        f"   └ کلمات: {word_count:,} | مدل‌ها: {models}\n"
                    )
                else:
                    error = result.get('error', 'نامشخص')[:80]
                    details_lines.append(f"{i}. {ICONS['error']} **خطا:** {error}...")
            
            details = '\n'.join(details_lines)
            
            # System statistics
            cache_stats = self.cache_system.get_comprehensive_stats()
            classifier_status = "آماده" if self.classifier.is_ready else "محدود"
            
            system_stats = f"""📊 **آمار سیستم:**

🧠 **هوش مصنوعی:**
{ICONS['classify']} طبقه‌بند: {classifier_status}
{ICONS['brain']} مدل‌های بارگذاری شده: {len(self.classifier.models)}

{ICONS['cache']} **کش هوشمند:**
💾 حافظه: {cache_stats.get('memory_cache_size', 0)} آیتم
🗄️ دیتابیس: {cache_stats.get('database_entries', 0)} ورودی  
📈 نرخ برخورد: {cache_stats.get('hit_rate_percent', 0):.1f}%
⚡ کارایی: {cache_stats.get('efficiency_score', 0):.3f}

🌐 **شبکه:**
🔄 تعویض DNS: {self.scraper.dns_manager.successful_servers}
🔐 پراکسی فعال: {len(self.scraper.proxy_manager.working_proxies)}"""
            
            return summary, details, system_stats
            
        except Exception as e:
            logger.error(f"Report generation error: {e}")
            return "خطا در تولید گزارش", "", ""

    def _get_total_documents(self) -> int:
        """دریافت تعداد کل اسناد"""
        try:
            with sqlite3.connect(self.scraper.db_path) as conn:
                return conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        except Exception as e:
            logger.error(f"Error getting document count: {e}")
            return 0

    def search_documents_advanced(self, query: str, limit: int = 15, 
                                 category_filter: str = "همه") -> Tuple[str, List[Dict]]:
        """جستجوی پیشرفته در اسناد"""
        if not query or not query.strip():
            return "❌ لطفاً عبارت جستجو را وارد کنید", []
        
        try:
            with sqlite3.connect(self.scraper.db_path) as conn:
                # Build query based on filters
                base_query = '''
                    SELECT url, title, source, quality_score, 
                           substr(content, 1, 300) as preview,
                           word_count, source_category, classification,
                           reliability_score, last_updated
                    FROM documents 
                    WHERE (content LIKE ? OR title LIKE ?)
                '''
                
                params = [f'%{query}%', f'%{query}%']
                
                # Add category filter
                if category_filter != "همه":
                    base_query += " AND (source_category = ? OR classification = ?)"
                    params.extend([category_filter, category_filter])
                
                base_query += " ORDER BY quality_score DESC, reliability_score DESC, last_updated DESC LIMIT ?"
                params.append(limit)
                
                results = conn.execute(base_query, params).fetchall()
            
            if not results:
                return f"🔍 نتیجه‌ای برای '{query}' یافت نشد", []
            
            # Format results
            formatted_results = []
            for i, result in enumerate(results, 1):
                formatted_results.append({
                    'رتبه': i,
                    'عنوان': result[1][:80] + ('...' if len(result[1]) > 80 else ''),
                    'منبع': result[2],
                    'کیفیت': f"{result[3]:.1f}/100",
                    'خلاصه': result[4] + '...',
                    'کلمات': f"{result[5]:,}",
                    'دسته': result[6] or result[7] or 'نامشخص',
                    'اعتبار': f"{result[8]:.2f}",
                    'آپدیت': result[9][:10] if result[9] else 'نامشخص',
                    'آدرس': result[0]
                })
            
            message = f"🔍 **نتایج جستجو:** {query}\n📊 {len(results)} نتیجه از {self._get_total_documents():,} سند"
            
            return message, formatted_results
            
        except Exception as e:
            logger.error(f"Advanced search error: {e}")
            return f"❌ خطا در جستجو: {str(e)}", []

    def create_professional_interface(self):
        """ایجاد رابط کاربری حرفه‌ای با تمام قابلیت‌های مدرن"""
        
        # Professional CSS for modern UI
        professional_css = """
        .rtl { 
            direction: rtl; 
            text-align: right; 
            font-family: 'Vazirmatn', 'Segoe UI', 'Tahoma', sans-serif; 
        }
        .hero-banner { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 15px; 
            text-align: center; 
            margin: 15px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .feature-section {
            background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
            color: white; 
            padding: 20px; 
            border-radius: 12px; 
            margin: 12px 0;
            box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }
        .status-panel {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            font-family: monospace;
        }
        .success-alert {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 15px;
            color: #155724;
            margin: 10px 0;
        }
        .warning-alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            color: #856404;
            margin: 10px 0;
        }
        .error-alert {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            padding: 15px;
            color: #721c24;
            margin: 10px 0;
        }
        .metric-card {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .progress-container {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
        }
        """
        
        def handle_file_upload(file_obj):
            """مدیریت آپلود فایل"""
            if file_obj is None:
                return "No file uploaded", ""
            
            try:
                # Read file content
                file_content = file_obj.decode('utf-8') if isinstance(file_obj, bytes) else file_obj
                filename = getattr(file_obj, 'name', 'uploaded_file.txt')
                
                # Parse file content
                parsed_urls = self.url_manager.parse_file_content(file_content, filename)
                
                if not parsed_urls:
                    return "❌ No valid URLs found in file", ""
                
                # Convert to text format for display
                url_text = '\n'.join([url_info['url'] for url_info in parsed_urls])
                success_msg = f"✅ Successfully parsed {len(parsed_urls)} URLs from {filename}"
                
                self.log_operation("FILE_UPLOAD", f"Parsed {len(parsed_urls)} URLs from {filename}", "INFO")
                return success_msg, url_text
                
            except Exception as e:
                error_msg = f"❌ Error processing file: {str(e)}"
                self.log_operation("FILE_UPLOAD", error_msg, "ERROR")
                return error_msg, ""
        
        def export_results(format_type):
            """صدور نتایج"""
            try:
                exported_data = self.url_manager.export_results(format_type)
                
                # Save to temp file
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"scraping_results_{timestamp}.{format_type.lower()}"
                filepath = f"/tmp/{filename}"
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(exported_data)
                
                success_msg = f"✅ Results exported to {filename}"
                self.log_operation("EXPORT", success_msg, "INFO")
                
                return success_msg, filepath
                
            except Exception as e:
                error_msg = f"❌ Export failed: {str(e)}"
                self.log_operation("EXPORT", error_msg, "ERROR")
                return error_msg, ""
        
        def clear_all_data():
            """پاک کردن همه داده‌ها"""
            self.url_manager.clear_queue()
            self.log_operation("CLEAR", "All data cleared", "INFO")
            return "✅ All data cleared", "", "", "", ""
        
        def get_queue_status():
            """دریافت وضعیت صف"""
            status = self.url_manager.get_queue_status()
            
            return f"""📊 **Queue Status:**
            
🔢 **Total URLs:** {status['total_urls']}
✅ **Completed:** {status['processed_count']}
❌ **Failed:** {status['failed_count']}
📈 **Completion Rate:** {status['completion_rate']:.1f}%

**Status Breakdown:**
{json.dumps(status['status_breakdown'], indent=2, ensure_ascii=False)}"""

        with gr.Blocks(
            title="Professional Iranian Legal Document Scraper",
            theme=gr.themes.Soft(primary_hue="blue", secondary_hue="indigo"),
            css=professional_css
        ) as interface:
            
            # Hero Banner
            gr.HTML(f"""
                <div class="hero-banner">
                    <h1>⚖️ Professional Iranian Legal Document Scraper</h1>
                    <p style="font-size: 1.2em; margin: 15px 0;">
                        Advanced web scraping with modern proxy infrastructure and AI-powered analysis
                    </p>
                    <div style="font-size: 1.1em;">
                        🔗 Modern Proxies | 📊 Bulk Processing | 🤖 AI Classification | ⚡ Real-time Monitoring
                    </div>
                </div>
            """)
            
            # Status indicators
            system_status = gr.HTML(
                value="""<div class="success-alert">🟢 System Ready - All components operational</div>""",
                label="System Status"
            )
            
            with gr.Tabs():
                
                # Main Processing Tab
                with gr.Tab("🚀 Bulk URL Processing"):
                    gr.HTML("""
                        <div class="feature-section">
                            <h3>📋 Advanced Bulk URL Processing</h3>
                            <p>• Process hundreds of URLs efficiently with batch management</p>
                            <p>• Automatic proxy rotation and failover protection</p>
                            <p>• Real-time progress tracking and comprehensive logging</p>
                            <p>• Smart retry mechanisms for failed requests</p>
                        </div>
                    """)
                    
                    with gr.Row():
                        with gr.Column(scale=2):
                            # Bulk URL input
                            bulk_urls_input = gr.Textbox(
                                label="📝 Bulk URLs (one per line)",
                                placeholder="""https://rc.majlis.ir/fa/law/show/139030
https://dotic.ir/portal/law/67890
https://www.judiciary.ir/fa/news/12345
https://icbar.ir/fa/legal/analysis
# Comments start with #
https://rrk.ir/gazette/announcement""",
                                lines=12,
                                elem_classes=["rtl"]
                            )
                        
                        with gr.Column(scale=1):
                            # File upload
                            file_upload = gr.File(
                                label="📁 Upload URL File",
                                file_types=[".txt", ".csv"],
                                file_count="single"
                            )
                            
                            # Upload button
                            upload_btn = gr.Button("📤 Process File", variant="secondary")
                            
                            # File status
                            file_status = gr.Textbox(
                                label="File Status",
                                lines=3,
                                interactive=False
                            )
                    
                    # Processing options
                    with gr.Row():
                        enable_proxy_check = gr.Checkbox(
                            label="🔐 Enable Proxy Rotation", 
                            value=True,
                            info="Use proxy system for enhanced anonymity"
                        )
                        batch_size_slider = gr.Slider(
                            minimum=1,
                            maximum=10, 
                            value=3,
                            step=1,
                            label="📦 Batch Size",
                            info="Number of URLs to process simultaneously"
                        )
                    
                    # Control buttons
                    with gr.Row():
                        process_bulk_btn = gr.Button(
                            "🚀 Start Bulk Processing", 
                            variant="primary",
                            size="lg"
                        )
                        stop_process_btn = gr.Button(
                            "⏹️ Stop Processing", 
                            variant="stop"
                        )
                        clear_queue_btn = gr.Button(
                            "🗑️ Clear All",
                            variant="secondary"
                        )
                    
                    # Results panels
                    with gr.Row():
                        with gr.Column():
                            processing_summary = gr.Textbox(
                                label="📊 Processing Summary",
                                lines=8,
                                elem_classes=["rtl"],
                                interactive=False
                            )
                        
                        with gr.Column():
                            system_metrics = gr.Textbox(
                                label="📈 System Metrics", 
                                lines=8,
                                elem_classes=["rtl"],
                                interactive=False
                            )
                    
                    # Detailed results
                    detailed_results = gr.Textbox(
                        label="📋 Detailed Results",
                        lines=10,
                        elem_classes=["rtl"],
                        interactive=False
                    )
                    
                    # Live logs
                    live_logs = gr.HTML(
                        label="📝 Live Processing Logs",
                        value="<div class='status-panel'>Logs will appear here during processing...</div>"
                    )
                
                # Proxy Management Tab
                with gr.Tab("🔗 Proxy Management"):
                    gr.HTML("""
                        <div class="feature-section">
                            <h3>🌐 Advanced Proxy Infrastructure</h3>
                            <p>• Real-time proxy validation and health monitoring</p>
                            <p>• Support for Iranian and international proxy pools</p>
                            <p>• Automatic failover and load balancing</p>
                            <p>• Comprehensive performance analytics</p>
                        </div>
                    """)
                    
                    with gr.Row():
                        test_proxies_btn = gr.Button(
                            "🔍 Test All Proxies",
                            variant="primary"
                        )
                        fetch_online_btn = gr.Button(
                            "🌐 Fetch Online Proxies", 
                            variant="secondary"
                        )
                        refresh_dashboard_btn = gr.Button(
                            "🔄 Refresh Dashboard",
                            variant="secondary"
                        )
                    
                    # Proxy update status
                    proxy_update_status = gr.Textbox(
                        label="🔄 Proxy Update Status",
                        lines=6,
                        elem_classes=["rtl"],
                        interactive=False
                    )
                    
                    # Proxy dashboard
                    proxy_dashboard = gr.HTML(
                        label="📊 Proxy Dashboard",
                        value="<div class='status-panel'>Loading proxy dashboard...</div>"
                    )
                
                # Results & Export Tab
                with gr.Tab("📊 Results & Export"):
                    gr.HTML("""
                        <div class="feature-section">
                            <h3>📈 Results Management & Export</h3>
                            <p>• Comprehensive results analysis and visualization</p>
                            <p>• Export to multiple formats (JSON, CSV, Excel)</p>
                            <p>• Session management and data persistence</p>
                            <p>• Advanced filtering and search capabilities</p>
                        </div>
                    """)
                    
                    # Queue status
                    with gr.Row():
                        queue_status_btn = gr.Button(
                            "📊 Check Queue Status",
                            variant="primary"
                        )
                        export_json_btn = gr.Button(
                            "📄 Export JSON",
                            variant="secondary"
                        )
                        export_csv_btn = gr.Button(
                            "📊 Export CSV", 
                            variant="secondary"
                        )
                    
                    queue_status_display = gr.Textbox(
                        label="📋 Queue Status",
                        lines=10,
                        elem_classes=["rtl"],
                        interactive=False
                    )
                    
                    export_status = gr.Textbox(
                        label="💾 Export Status",
                        lines=3,
                        interactive=False
                    )
                
                # System Monitoring Tab
                with gr.Tab("📱 System Monitoring"):
                    gr.HTML("""
                        <div class="feature-section">
                            <h3>🖥️ Real-time System Monitoring</h3>
                            <p>• Live system resource monitoring (CPU, RAM, Network)</p>
                            <p>• Performance metrics and optimization recommendations</p>
                            <p>• Error tracking and diagnostic information</p>
                            <p>• Historical performance analysis</p>
                        </div>
                    """)
                    
                    monitor_refresh_btn = gr.Button(
                        "🔄 Refresh Monitoring Data",
                        variant="primary"
                    )
                    
                    monitoring_display = gr.Textbox(
                        label="📊 System Monitoring",
                        lines=20,
                        elem_classes=["rtl"],
                        interactive=False
                    )
            
            # Event Handlers with Error Handling
            
            # File upload handler
            upload_btn.click(
                fn=handle_file_upload,
                inputs=[file_upload],
                outputs=[file_status, bulk_urls_input]
            )
            
            # Main processing handler
            process_bulk_btn.click(
                fn=self.process_bulk_urls_enhanced,
                inputs=[bulk_urls_input, enable_proxy_check, batch_size_slider],
                outputs=[processing_summary, detailed_results, system_metrics, live_logs],
                show_progress=True
            )
            
            # Proxy management handlers
            test_proxies_btn.click(
                fn=lambda: self.update_proxy_system(include_online=False),
                outputs=[proxy_update_status, proxy_dashboard],
                show_progress=True
            )
            
            fetch_online_btn.click(
                fn=lambda: self.update_proxy_system(include_online=True),
                outputs=[proxy_update_status, proxy_dashboard],
                show_progress=True
            )
            
            refresh_dashboard_btn.click(
                fn=lambda: ("Dashboard refreshed", self._get_proxy_dashboard_html()),
                outputs=[proxy_update_status, proxy_dashboard]
            )
            
            # Queue and export handlers
            queue_status_btn.click(
                fn=get_queue_status,
                outputs=[queue_status_display]
            )
            
            export_json_btn.click(
                fn=lambda: export_results("json"),
                outputs=[export_status]
            )
            
            export_csv_btn.click(
                fn=lambda: export_results("csv"),
                outputs=[export_status]
            )
            
            # System monitoring
            monitor_refresh_btn.click(
                fn=self.get_system_monitoring,
                outputs=[monitoring_display]
            )
            
            # Clear all data
            clear_queue_btn.click(
                fn=clear_all_data,
                outputs=[bulk_urls_input, processing_summary, detailed_results, 
                        system_metrics, queue_status_display]
            )
            
            # Auto-refresh dashboard on load
            interface.load(
                fn=lambda: (self._get_proxy_dashboard_html(), self.get_system_monitoring()),
                outputs=[proxy_dashboard, monitoring_display]
            )
        
    def get_system_monitoring(self) -> str:
        """سیستم مانیتورینگ پیشرفته با تمام جزئیات"""
        try:
            monitoring_info = f"""🖥️ **Professional System Monitoring - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}**

"""
            # System Resources
            try:
                import psutil
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                # Network interfaces
                net_io = psutil.net_io_counters()
                
                monitoring_info += f"""💻 **System Resources:**
🔧 CPU Usage: {cpu_percent:.1f}%
💾 Memory: {memory.percent:.1f}% used ({memory.used // 1024**2:,} MB / {memory.total // 1024**2:,} MB)
💽 Disk: {disk.percent:.1f}% used ({disk.used // 1024**3:.1f} GB / {disk.total // 1024**3:.1f} GB)
🌐 Network: ⬇️ {net_io.bytes_recv // 1024**2:,} MB received | ⬆️ {net_io.bytes_sent // 1024**2:,} MB sent

"""
            except ImportError:
                monitoring_info += """💻 **System Resources:**
⚠️ System monitoring requires psutil library
💾 Memory: Information not available
💽 Disk: Information not available

"""
            except Exception as e:
                monitoring_info += f"""💻 **System Resources:**
❌ Error getting system info: {str(e)[:100]}

"""

            # Network Status
            try:
                internet_status = "🟢 Connected" if check_internet_connection() else "🔴 Disconnected"
                monitoring_info += f"""🌐 **Network Status:**
📡 Internet Connection: {internet_status}
"""
                
                # DNS servers
                try:
                    working_dns = len(self.scraper.dns_manager.get_best_dns_servers(5))
                    monitoring_info += f"🔄 Working DNS Servers: {working_dns}\n"
                except:
                    monitoring_info += "🔄 DNS Status: Unknown\n"
                
                # Proxy status
                try:
                    proxy_data = self.proxy_manager.get_proxy_dashboard_data()
                    monitoring_info += f"""🔐 Proxy System:
   • Active Proxies: {proxy_data.get('active_proxies', 0)}/{proxy_data.get('total_proxies', 0)}
   • Success Rate: {proxy_data.get('success_rate', 0):.1f}%
   • Average Response: {proxy_data.get('average_response_time', 0):.0f}ms
   • Last Update: {proxy_data.get('last_update', 'Never')}
"""
                except Exception as e:
                    monitoring_info += f"🔐 Proxy System: Error - {str(e)[:50]}\n"
                    
            except Exception as e:
                monitoring_info += f"""🌐 **Network Status:**
❌ Network monitoring error: {str(e)[:100]}
"""

            monitoring_info += "\n"

            # Processing Statistics
            try:
                queue_status = self.url_manager.get_queue_status()
                cache_stats = self.cache_system.get_comprehensive_stats()
                
                monitoring_info += f"""📊 **Processing Statistics:**
📋 URL Queue:
   • Total URLs: {queue_status.get('total_urls', 0)}
   • Completed: {queue_status.get('processed_count', 0)}
   • Failed: {queue_status.get('failed_count', 0)}
   • Completion Rate: {queue_status.get('completion_rate', 0):.1f}%

⚡ Cache Performance:
   • Memory Cache: {cache_stats.get('memory_cache_size', 0)} items
   • Database Entries: {cache_stats.get('database_entries', 0):,}
   • Hit Rate: {cache_stats.get('hit_rate_percent', 0):.1f}%
   • Total Size: {cache_stats.get('total_size_mb', 0):.1f} MB
   • Efficiency Score: {cache_stats.get('efficiency_score', 0):.3f}

"""
            except Exception as e:
                monitoring_info += f"""📊 **Processing Statistics:**
❌ Statistics error: {str(e)[:100]}

"""

            # Database Information  
            try:
                with sqlite3.connect(self.scraper.db_path) as conn:
                    total_docs = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
                    recent_docs = conn.execute('''
                        SELECT COUNT(*) FROM documents 
                        WHERE datetime(last_updated) > datetime('now', '-1 hour')
                    ''').fetchone()[0]
                    
                    avg_quality = conn.execute("SELECT AVG(quality_score) FROM documents").fetchone()[0] or 0
                    
                monitoring_info += f"""🗄️ **Database Status:**
📚 Total Documents: {total_docs:,}
🆕 Recent (1 hour): {recent_docs}
📈 Average Quality: {avg_quality:.1f}/100

"""
            except Exception as e:
                monitoring_info += f"""🗄️ **Database Status:**
❌ Database error: {str(e)[:100]}

"""

            # AI Models Status
            try:
                models_status = "🟢 Ready" if self.classifier.is_ready else "🟡 Limited"
                models_count = len(self.classifier.models)
                
                monitoring_info += f"""🤖 **AI Models Status:**
🏷️ Classification System: {models_status}
🧠 Loaded Models: {models_count}
📊 Model Performance: {'Optimal' if self.classifier.is_ready else 'Reduced'}

"""
            except Exception as e:
                monitoring_info += f"""🤖 **AI Models Status:**
❌ AI system error: {str(e)[:100]}

"""

            # Session Statistics
            try:
                session_time = time.time() - self.session_stats['start_time']
                hours, remainder = divmod(session_time, 3600)
                minutes, seconds = divmod(remainder, 60)
                
                monitoring_info += f"""📈 **Session Statistics:**
⏱️ Session Duration: {int(hours)}h {int(minutes)}m {int(seconds)}s
🔄 Total Operations: {self.session_stats.get('total_operations', 0)}
✅ Successful Operations: {self.session_stats.get('successful_operations', 0)}
📄 URLs Processed: {self.session_stats.get('total_urls_processed', 0)}
🔀 Proxy Switches: {self.session_stats.get('proxy_switches', 0)}
⚡ Cache Hits: {self.session_stats.get('cache_hits', 0)}

"""
            except Exception as e:
                monitoring_info += f"""📈 **Session Statistics:**
❌ Session stats error: {str(e)[:100]}

"""

            # System Health Assessment
            monitoring_info += "🏥 **System Health Assessment:**\n"
            
            health_issues = []
            performance_score = 100
            
            try:
                # Check various health indicators
                if hasattr(self, 'proxy_manager') and len(self.proxy_manager.active_proxies) < 3:
                    health_issues.append("⚠️ Low proxy availability")
                    performance_score -= 15
                
                if cache_stats.get('hit_rate_percent', 0) < 30:
                    health_issues.append("⚠️ Low cache efficiency")
                    performance_score -= 10
                
                if not check_internet_connection():
                    health_issues.append("❌ Internet connectivity issues")
                    performance_score -= 30
                
                if not self.classifier.is_ready:
                    health_issues.append("⚠️ AI models running in limited mode")
                    performance_score -= 20
                
                # Memory check if available
                try:
                    import psutil
                    if psutil.virtual_memory().percent > 90:
                        health_issues.append("⚠️ High memory usage")
                        performance_score -= 15
                    
                    if psutil.cpu_percent() > 95:
                        health_issues.append("⚠️ High CPU usage")
                        performance_score -= 10
                except:
                    pass
                
                if health_issues:
                    monitoring_info += "Issues detected:\n" + "\n".join(health_issues) + "\n\n"
                else:
                    monitoring_info += "✅ All systems operating normally\n\n"
                
                monitoring_info += f"🎯 **Overall Performance Score: {max(0, performance_score)}/100**\n"
                
                # Recommendations
                if performance_score < 80:
                    monitoring_info += "\n💡 **Recommendations:**\n"
                    if len(self.proxy_manager.active_proxies) < 3:
                        monitoring_info += "• Update proxy list to improve availability\n"
                    if cache_stats.get('hit_rate_percent', 0) < 30:
                        monitoring_info += "• Consider increasing cache TTL settings\n"
                    if not self.classifier.is_ready:
                        monitoring_info += "• Check AI model dependencies\n"
                else:
                    monitoring_info += "\n✨ **System Status: Excellent** - No optimization needed\n"
                
            except Exception as e:
                monitoring_info += f"❌ Health assessment error: {str(e)[:100]}\n"

            return monitoring_info
            
        except Exception as e:
            return f"""❌ **Critical Monitoring Error**

Error details: {str(e)}
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Please check system logs for more information."""

    def create_modern_interface(self):
        """Wrapper method for backward compatibility"""
        return self.create_professional_interface()
        """ایجاد رابط کاربری مدرن"""
        
        # Enhanced CSS
        modern_css = """
        .rtl { 
            direction: rtl; 
            text-align: right; 
            font-family: 'Vazirmatn', 'Tahoma', 'IRANSans', sans-serif; 
        }
        .hero-section { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); 
            color: white; 
            padding: 40px; 
            border-radius: 25px; 
            text-align: center; 
            margin: 20px 0;
            box-shadow: 0 15px 50px rgba(0,0,0,0.2);
            border: 3px solid rgba(255,255,255,0.2);
        }
        .feature-card {
            background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
            color: white; 
            padding: 25px; 
            border-radius: 15px; 
            margin: 15px 0;
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
            transition: transform 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-5px);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-item {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .result-item {
            background: rgba(255,255,255,0.95);
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            box-shadow: 0 3px 15px rgba(0,0,0,0.08);
        }
        .quality-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            color: white;
            font-size: 0.85em;
            font-weight: bold;
        }
        .quality-excellent { background: #4CAF50; }
        .quality-good { background: #2196F3; }
        .quality-average { background: #FF9800; }
        .quality-poor { background: #F44336; }
        """
        
        with gr.Blocks(
            title="آرشیو فوق‌پیشرفته اسناد حقوقی ایران",
            theme=gr.themes.Soft(
                primary_hue=gr.themes.colors.purple,
                secondary_hue=gr.themes.colors.indigo,
                font_mono=gr.themes.fonts.GoogleFont("IBM Plex Mono")
            ),
            css=modern_css,
            analytics_enabled=False
        ) as interface:
            
            # Hero Section
            gr.HTML(f"""
                <div class="hero-section">
                    <h1>{ICONS['law']} آرشیو فوق‌پیشرفته اسناد حقوقی ایران</h1>
                    <p style="font-size: 1.2em; margin: 15px 0;">
                        پلتفرم جامع مجهز به هوش مصنوعی، DNS هوشمند و اسکرپینگ مدرن
                    </p>
                    <div style="font-size: 1.1em;">
                        {ICONS['brain']} AI Classification | {ICONS['cache']} Smart Caching | 
                        {ICONS['dns']} Intelligent DNS | {ICONS['score']} Advanced Scoring
                    </div>
                </div>
            """)
            
            with gr.Tabs():
                # Enhanced Processing Tab
                with gr.Tab(f"{ICONS['process']} پردازش هوشمند پیشرفته"):
                    gr.HTML("""
                        <div class="feature-card">
                            <h3>🎯 پردازش فوق‌هوشمند با تکنولوژی‌های مدرن</h3>
                            <p>• DNS هوشمند با قابلیت تعویض خودکار</p>
                            <p>• اسکرپینگ مدرن با تشخیص منبع</p>
                            <p>• طبقه‌بندی AI با مدل‌های فارسی</p>
                            <p>• کش هوشمند با امتیازدهی پیشرفته</p>
                        </div>
                    """)
                    
                    urls_input = gr.Textbox(
                        label="فهرست آدرس‌های اسناد حقوقی",
                        placeholder="""https://rc.majlis.ir/fa/law/show/139030
https://dotic.ir/portal/law/67890  
https://www.judiciary.ir/fa/news/12345
https://icbar.ir/fa/legal/analysis
https://rrk.ir/gazette/announcement""",
                        lines=10,
                        elem_classes=["rtl"],
                        info="آدرس‌های معتبر اسناد حقوقی را هر کدام در یک خط وارد کنید"
                    )
                    
                    with gr.Row():
                        process_btn = gr.Button(
                            f"{ICONS['brain']} پردازش فوق‌هوشمند شروع", 
                            variant="primary", 
                            size="lg"
                        )
                        clear_urls_btn = gr.Button(
                            "پاک کردن", 
                            variant="secondary"
                        )
                    
                    with gr.Row():
                        summary_output = gr.Textbox(
                            label="خلاصه نتایج",
                            lines=8,
                            elem_classes=["rtl"],
                            interactive=False
                        )
                        stats_output = gr.Textbox(
                            label="آمار سیستم",
                            lines=8,
                            elem_classes=["rtl"],
                            interactive=False
                        )
                    
                    details_output = gr.Textbox(
                        label="جزئیات کامل نتایج",
                        lines=12,
                        elem_classes=["rtl"],
                        interactive=False
                    )
                
                # Enhanced Search Tab
                with gr.Tab(f"{ICONS['search']} جستجوی پیشرفته"):
                    gr.HTML("""
                        <div class="feature-card">
                            <h3>🔍 جستجوی پیشرفته در آرشیو</h3>
                            <p>جستجو در محتوا، عنوان و متادیتای اسناد با فیلترهای پیشرفته</p>
                        </div>
                    """)
                    
                    with gr.Row():
                        search_query = gr.Textbox(
                            label="عبارت جستجو",
                            placeholder="مثال: قانون مدنی، دادنامه طلاق، مقررات مالیاتی",
                            elem_classes=["rtl"]
                        )
                        category_filter = gr.Dropdown(
                            label="فیلتر دسته",
                            choices=["همه", "قانون", "دادنامه", "رویه_قضایی", "قرارداد", "بخشنامه"],
                            value="همه",
                            elem_classes=["rtl"]
                        )
                    
                    with gr.Row():
                        search_btn = gr.Button(
                            f"{ICONS['search']} جستجو", 
                            variant="primary"
                        )
                        export_results_btn = gr.Button(
                            f"{ICONS['export']} صدور نتایج", 
                            variant="secondary"
                        )
                    
                    search_results_text = gr.Textbox(
                        label="نتایج جستجو",
                        lines=6,
                        elem_classes=["rtl"],
                        interactive=False
                    )
                    
                    search_results_table = gr.Dataframe(
                        label="جدول نتایج",
                        headers=["رتبه", "عنوان", "منبع", "کیفیت", "کلمات", "دسته", "اعتبار"],
                        elem_classes=["rtl"],
                        interactive=False
                    )
                
                # System Status Tab  
                with gr.Tab(f"{ICONS['monitor']} وضعیت سیستم"):
                    gr.HTML("""
                        <div class="feature-card">
                            <h3>📊 نظارت بر عملکرد سیستم</h3>
                            <p>آمار جامع عملکرد، کش، مدل‌ها و شبکه</p>
                        </div>
                    """)
                    
                    with gr.Row():
                        refresh_status_btn = gr.Button(
                            f"{ICONS['monitor']} به‌روزرسانی وضعیت", 
                            variant="primary"
                        )
                        optimize_system_btn = gr.Button(
                            f"{ICONS['speed']} بهینه‌سازی سیستم", 
                            variant="secondary"
                        )
                    
                    system_status_output = gr.Textbox(
                        label="وضعیت کامل سیستم",
                        lines=15,
                        elem_classes=["rtl"],
                        interactive=False
                    )
                
                # Advanced Analytics Tab
                with gr.Tab(f"{ICONS['report']} تحلیل‌های پیشرفته"):
                    gr.HTML("""
                        <div class="feature-card">
                            <h3>📈 آنالیز جامع آرشیو</h3>
                            <p>تحلیل‌های آماری پیشرفته از کیفیت، منابع و دسته‌بندی اسناد</p>
                        </div>
                    """)
                    
                    with gr.Row():
                        generate_analytics_btn = gr.Button(
                            f"{ICONS['report']} تولید گزارش تحلیلی", 
                            variant="primary"
                        )
                        export_analytics_btn = gr.Button(
                            f"{ICONS['export']} صدور آنالیز", 
                            variant="secondary"
                        )
                    
                    analytics_output = gr.Textbox(
                        label="گزارش تحلیلی جامع",
                        lines=20,
                        elem_classes=["rtl"],
                        interactive=False
                    )
            
            # Event Handlers
            process_btn.click(
                fn=self.process_urls_intelligently,
                inputs=[urls_input],
                outputs=[summary_output, details_output, stats_output],
                show_progress=True
            )
            
            clear_urls_btn.click(
                fn=lambda: "",
                outputs=[urls_input]
            )
            
            search_btn.click(
                fn=self.search_documents_advanced,
                inputs=[search_query, gr.Number(value=15, visible=False), category_filter],
                outputs=[search_results_text, search_results_table]
            )
            
            refresh_status_btn.click(
                fn=self.get_comprehensive_system_status,
                outputs=[system_status_output]
            )
            
            optimize_system_btn.click(
                fn=self.optimize_system_performance,
                outputs=[system_status_output]
            )
            
            generate_analytics_btn.click(
                fn=self.generate_advanced_analytics,
                outputs=[analytics_output]
            )
        
        return interface

    def get_comprehensive_system_status(self) -> str:
        """دریافت وضعیت جامع سیستم"""
        try:
            # Database stats
            with sqlite3.connect(self.scraper.db_path) as conn:
                total_docs = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
                
                source_stats = conn.execute('''
                    SELECT source, COUNT(*), AVG(quality_score), AVG(reliability_score)
                    FROM documents 
                    GROUP BY source 
                    ORDER BY COUNT(*) DESC
                ''').fetchall()
                
                quality_distribution = conn.execute('''
                    SELECT 
                        CASE 
                            WHEN quality_score >= 80 THEN 'عالی'
                            WHEN quality_score >= 60 THEN 'خوب'
                            WHEN quality_score >= 40 THEN 'متوسط'
                            ELSE 'ضعیف'
                        END as quality_level,
                        COUNT(*)
                    FROM documents
                    GROUP BY quality_level
                ''').fetchall()
                
                recent_docs = conn.execute('''
                    SELECT COUNT(*) FROM documents 
                    WHERE datetime(last_updated) > datetime('now', '-1 day')
                ''').fetchone()[0]
            
            # Cache stats
            cache_stats = self.cache_system.get_comprehensive_stats()
            
            # Memory usage
            memory_usage = psutil.virtual_memory().percent if psutil else 0
            
            # Network stats
            dns_servers = len(self.scraper.dns_manager.get_best_dns_servers(3))
            proxy_count = len(self.scraper.proxy_manager.working_proxies)
            
            # Model status
            models_loaded = len(self.classifier.models)
            classifier_ready = "آماده" if self.classifier.is_ready else "محدود"
            
            status_report = f"""🏛️ **آرشیو فوق‌پیشرفته اسناد حقوقی ایران**
⏰ زمان به‌روزرسانی: {datetime.now().strftime('%Y/%m/%d - %H:%M:%S')}

📊 **آمار پایگاه داده:**
📚 کل اسناد: {total_docs:,}
📅 اسناد امروز: {recent_docs:,}

📈 **توزیع کیفیت اسناد:**"""
            
            for quality_level, count in quality_distribution:
                percentage = (count / max(total_docs, 1)) * 100
                status_report += f"\n  • {quality_level}: {count:,} ({percentage:.1f}%)"
            
            status_report += f"""

🏛️ **منابع اسناد:**"""
            
            for source_data in source_stats[:8]:  # نمایش 8 منبع برتر
                source, count, avg_quality, avg_reliability = source_data
                status_report += f"\n  • {source}: {count:,} سند (کیفیت: {avg_quality:.1f}, اعتبار: {avg_reliability:.2f})"
            
            status_report += f"""

{ICONS['cache']} **سیستم کش هوشمند:**
💾 حافظه کش: {cache_stats.get('memory_cache_size', 0)} آیتم
🗄️ کش دیتابیس: {cache_stats.get('database_entries', 0):,} ورودی
📈 نرخ برخورد: {cache_stats.get('hit_rate_percent', 0):.1f}%
⚡ امتیاز کارایی: {cache_stats.get('efficiency_score', 0):.3f}
💽 حجم کش: {cache_stats.get('total_size_mb', 0):.1f} MB

🤖 **سیستم‌های هوشمند:**
🏷️ طبقه‌بندی: {classifier_ready}
🧠 مدل‌های بارگذاری شده: {models_loaded}
📊 دقت طبقه‌بندی: {'بالا' if self.classifier.is_ready else 'متوسط'}

🌐 **شبکه و اتصال:**
🔄 DNS سرورهای فعال: {dns_servers}
🔐 پراکسی‌های کاربردی: {proxy_count}
💾 استفاده از حافظه: {memory_usage:.1f}%
📡 وضعیت اتصال: {'متصل' if check_internet_connection() else 'قطع'}

⚙️ **عملکرد:**
🔄 کل درخواست‌ها: {self.scraper.metrics.get('total_requests', 0):,}
✅ موفق: {self.scraper.metrics.get('successful_requests', 0):,}
❌ ناموفق: {self.scraper.metrics.get('failed_requests', 0):,}
📊 نرخ موفقیت: {(self.scraper.metrics.get('successful_requests', 0) / max(self.scraper.metrics.get('total_requests', 1), 1) * 100):.1f}%"""
            
            return status_report
            
        except Exception as e:
            logger.error(f"System status error: {e}")
            return f"❌ خطا در دریافت وضعیت سیستم: {str(e)}"

    def optimize_system_performance(self) -> str:
        """بهینه‌سازی عملکرد سیستم"""
        try:
            optimization_results = []
            
            # Cache optimization
            self.cache_system._auto_cleanup()
            optimization_results.append("✅ کش بهینه‌سازی شد")
            
            # Update proxy list
            self.scraper.proxy_manager.update_proxy_list(15)
            working_proxies = len(self.scraper.proxy_manager.working_proxies)
            optimization_results.append(f"✅ {working_proxies} پراکسی کاربردی یافت شد")
            
            # Test DNS servers
            working_dns = len(self.scraper.dns_manager.get_best_dns_servers(5))
            optimization_results.append(f"✅ {working_dns} DNS سرور کاربردی تست شد")
            
            # Memory cleanup
            gc.collect()
            optimization_results.append("✅ حافظه پاکسازی شد")
            
            # Update session configuration
            self.scraper.session = self.scraper._create_optimized_session()
            optimization_results.append("✅ تنظیمات شبکه به‌روزرسانی شد")
            
            results_text = '\n'.join(optimization_results)
            
            return f"""🔧 **بهینه‌سازی سیستم انجام شد:**

{results_text}

⏰ زمان بهینه‌سازی: {datetime.now().strftime('%H:%M:%S')}
📊 وضعیت: آماده برای پردازش بهینه

{self.get_comprehensive_system_status()}"""
            
        except Exception as e:
            logger.error(f"System optimization error: {e}")
            return f"❌ خطا در بهینه‌سازی: {str(e)}"

    def generate_advanced_analytics(self) -> str:
        """تولید تحلیل‌های پیشرفته"""
        try:
            with sqlite3.connect(self.scraper.db_path) as conn:
                # Basic statistics
                total_docs = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
                
                if total_docs == 0:
                    return "📊 آرشیو خالی است. ابتدا اسنادی را پردازش کنید."
                
                # Quality analysis
                quality_stats = conn.execute('''
                    SELECT 
                        AVG(quality_score) as avg_quality,
                        MIN(quality_score) as min_quality,
                        MAX(quality_score) as max_quality,
                        COUNT(CASE WHEN quality_score >= 80 THEN 1 END) as high_quality,
                        COUNT(CASE WHEN quality_score < 40 THEN 1 END) as low_quality
                    FROM documents
                ''').fetchone()
                
                # Source analysis
                source_analysis = conn.execute('''
                    SELECT 
                        source,
                        COUNT(*) as doc_count,
                        AVG(quality_score) as avg_quality,
                        AVG(word_count) as avg_words,
                        AVG(reliability_score) as avg_reliability
                    FROM documents
                    GROUP BY source
                    ORDER BY doc_count DESC
                ''').fetchall()
                
                # Category analysis
                category_analysis = conn.execute('''
                    SELECT 
                        COALESCE(source_category, classification, 'نامشخص') as category,
                        COUNT(*) as count,
                        AVG(quality_score) as avg_quality
                    FROM documents
                    GROUP BY category
                    ORDER BY count DESC
                ''').fetchall()
                
                # Temporal analysis
                temporal_analysis = conn.execute('''
                    SELECT 
                        DATE(scraped_at) as scrape_date,
                        COUNT(*) as daily_count,
                        AVG(quality_score) as daily_avg_quality
                    FROM documents
                    WHERE datetime(scraped_at) > datetime('now', '-7 days')
                    GROUP BY DATE(scraped_at)
                    ORDER BY scrape_date DESC
                ''').fetchall()
                
                # Cache analytics
                cache_stats = self.cache_system.get_comprehensive_stats()
                
            # Generate comprehensive report
            avg_quality, min_quality, max_quality, high_quality, low_quality = quality_stats
            
            analytics_report = f"""📊 **تحلیل جامع آرشیو اسناد حقوقی**
⏰ تاریخ تحلیل: {datetime.now().strftime('%Y/%m/%d - %H:%M:%S')}

🎯 **آمار کلی:**
📚 کل اسناد: {total_docs:,}
📈 میانگین کیفیت: {avg_quality:.1f}/100
🔝 بالاترین کیفیت: {max_quality:.1f}
🔻 پایین‌ترین کیفیت: {min_quality:.1f}
💎 اسناد با کیفیت بالا (≥80): {high_quality:,} ({(high_quality/total_docs)*100:.1f}%)
⚠️ اسناد با کیفیت پایین (<40): {low_quality:,} ({(low_quality/total_docs)*100:.1f}%)

🏛️ **تحلیل منابع:**"""
            
            for source_data in source_analysis:
                source, doc_count, avg_qual, avg_words, avg_rel = source_data
                percentage = (doc_count / total_docs) * 100
                analytics_report += f"""
  📋 {source}:
    • تعداد: {doc_count:,} سند ({percentage:.1f}%)
    • میانگین کیفیت: {avg_qual:.1f}/100
    • میانگین کلمات: {avg_words:.0f}
    • میانگین اعتبار: {avg_rel:.2f}/1.00"""
            
            analytics_report += f"""

🏷️ **تحلیل دسته‌بندی:**"""
            
            for category_data in category_analysis:
                category, count, avg_qual = category_data
                percentage = (count / total_docs) * 100
                analytics_report += f"""
  • {category}: {count:,} سند ({percentage:.1f}%) - کیفیت: {avg_qual:.1f}"""
            
            analytics_report += f"""

📅 **تحلیل زمانی (7 روز اخیر):**"""
            
            for temporal_data in temporal_analysis:
                date, daily_count, daily_quality = temporal_data
                analytics_report += f"""
  • {date}: {daily_count} سند - کیفیت: {daily_quality:.1f}"""
            
            analytics_report += f"""

{ICONS['cache']} **عملکرد کش:**
💾 ورودی‌های کش: {cache_stats.get('database_entries', 0):,}
📈 نرخ برخورد: {cache_stats.get('hit_rate_percent', 0):.1f}%
⚡ امتیاز کارایی: {cache_stats.get('efficiency_score', 0):.3f}
💽 اندازه کش: {cache_stats.get('total_size_mb', 0):.1f} MB
🔄 کل دسترسی‌ها: {cache_stats.get('total_accesses', 0):,}

🌐 **آمار شبکه:**
🔄 تعویض DNS: {self.scraper.metrics.get('dns_switches', 0)}
🔐 تعویض پراکسی: {self.scraper.metrics.get('proxy_switches', 0)}
📡 کل درخواست‌ها: {self.scraper.metrics.get('total_requests', 0):,}
✅ درخواست‌های موفق: {self.scraper.metrics.get('successful_requests', 0):,}

💡 **توصیه‌های بهبود:**"""
            
            # Generate recommendations
            recommendations = []
            if avg_quality < 60:
                recommendations.append("• کیفیت متوسط اسناد قابل بهبود است - منابع معتبرتر انتخاب کنید")
            if cache_stats.get('hit_rate_percent', 0) < 30:
                recommendations.append("• نرخ برخورد کش پایین است - TTL کش را افزایش دهید")
            if low_quality > total_docs * 0.2:
                recommendations.append("• درصد بالای اسناد کم‌کیفیت - فیلترهای بهتری اعمال کنید")
            if proxy_count < 3:
                recommendations.append("• تعداد پراکسی‌های کاربردی کم است - لیست پراکسی را به‌روزرسانی کنید")
            
            if recommendations:
                analytics_report += '\n' + '\n'.join(recommendations)
            else:
                analytics_report += "\n• سیستم در وضعیت بهینه عمل می‌کند 🎯"
            
            return analytics_report
            
        except Exception as e:
            logger.error(f"Analytics generation error: {e}")
            return f"❌ خطا در تولید تحلیل: {str(e)}"

# --- Enhanced Supporting Classes ---
class UltraIntelligentCacheSystem:
    """سیستم کش هوشمند پیشرفته"""
    
    def __init__(self, cache_db_path: str = CACHE_DB_PATH):
        self.cache_db_path = cache_db_path
        self.memory_cache = {}
        self.access_count = {}
        self.hit_count = 0
        self.miss_count = 0
        self.total_requests = 0
        self.max_memory_items = 150  # Reduced for HF
        self.cleanup_interval = 1800  # 30 minutes
        self.last_cleanup = time.time()
        
        try:
            self._init_database()
        except Exception as e:
            logger.error(f"Cache initialization error: {e}")

    def _init_database(self):
        """ایجاد پایگاه داده کش"""
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS cache_entries (
                        key TEXT PRIMARY KEY,
                        value BLOB,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        access_count INTEGER DEFAULT 1,
                        ttl_seconds INTEGER DEFAULT 3600,
                        priority INTEGER DEFAULT 1,
                        size_bytes INTEGER DEFAULT 0,
                        category TEXT DEFAULT 'general',
                        source_reliability REAL DEFAULT 0.5,
                        compression_ratio REAL DEFAULT 1.0,
                        quality_score REAL DEFAULT 0.0
                    )
                ''')
                
                # Enhanced indexes
                indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_created_ttl ON cache_entries(created_at, ttl_seconds)',
                    'CREATE INDEX IF NOT EXISTS idx_priority_quality ON cache_entries(priority DESC, quality_score DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_category ON cache_entries(category)',
                    'CREATE INDEX IF NOT EXISTS idx_last_accessed ON cache_entries(last_accessed DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_access_count ON cache_entries(access_count DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_reliability ON cache_entries(source_reliability DESC)'
                ]
                
                for index in indexes:
                    conn.execute(index)
                
                conn.commit()
                logger.info("Enhanced cache database ready")
                
        except Exception as e:
            logger.error(f"Cache database creation error: {e}")
            raise

    def get(self, url: str, model_type: str = "general", extra_params: Dict = None) -> Optional[Dict]:
        """دریافت هوشمند از کش"""
        if not url:
            return None
            
        self.total_requests += 1
        key = self._generate_smart_key(url, model_type, extra_params)
        
        # Check memory cache first
        if key in self.memory_cache:
            self.access_count[key] = self.access_count.get(key, 0) + 1
            self.hit_count += 1
            return self.memory_cache[key]
        
        # Check database cache
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                cursor = conn.execute('''
                    SELECT value, created_at, ttl_seconds, source_reliability, quality_score
                    FROM cache_entries 
                    WHERE key = ?
                ''', (key,))
                
                row = cursor.fetchone()
                if row:
                    value_blob, created_at, ttl_seconds, reliability, quality = row
                    created_time = datetime.fromisoformat(created_at)
                    
                    # Dynamic TTL based on quality and reliability
                    ttl_multiplier = 1.0 + (reliability * 0.5) + (quality / 100 * 0.3)
                    effective_ttl = ttl_seconds * ttl_multiplier
                    
                    if datetime.now() - created_time < timedelta(seconds=effective_ttl):
                        # Update access info
                        conn.execute('''
                            UPDATE cache_entries 
                            SET access_count = access_count + 1, last_accessed = datetime('now')
                            WHERE key = ?
                        ''', (key,))
                        
                        # Decompress if needed
                        try:
                            value = pickle.loads(value_blob)
                        except:
                            # Try decompression
                            import zlib
                            decompressed = zlib.decompress(value_blob)
                            value = pickle.loads(decompressed)
                        
                        self._add_to_memory_cache(key, value)
                        self.hit_count += 1
                        return value
                    else:
                        # Expired, remove
                        conn.execute('DELETE FROM cache_entries WHERE key = ?', (key,))
                        conn.commit()
                        
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}")
        
        self.miss_count += 1
        
        # Auto cleanup if needed
        if time.time() - self.last_cleanup > self.cleanup_interval:
            self._auto_cleanup()
        
        return None

    def set(self, url: str, value: Dict, model_type: str = "general", ttl_seconds: int = 3600,
            priority: int = 1, extra_params: Dict = None, source_reliability: float = 0.5):
        """ذخیره هوشمند در کش"""
        if not url or not value:
            return
            
        key = self._generate_smart_key(url, model_type, extra_params)
        self._add_to_memory_cache(key, value)
        
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                # Serialize and optionally compress
                value_blob = pickle.dumps(value, protocol=pickle.HIGHEST_PROTOCOL)
                original_size = len(value_blob)
                compression_ratio = 1.0
                
                # Compress large objects
                if original_size > 8192:  # 8KB threshold
                    import zlib
                    compressed_blob = zlib.compress(value_blob)
                    if len(compressed_blob) < original_size * 0.8:  # Only if significant compression
                        value_blob = compressed_blob
                        compression_ratio = len(value_blob) / original_size
                
                # Dynamic TTL adjustment
                quality_score = value.get('quality_score', 0)
                adjusted_ttl = int(ttl_seconds * (1.0 + source_reliability + quality_score / 200))
                
                conn.execute('''
                    INSERT OR REPLACE INTO cache_entries 
                    (key, value, ttl_seconds, priority, size_bytes, category, 
                     source_reliability, compression_ratio, quality_score) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    key, value_blob, adjusted_ttl, priority, len(value_blob),
                    model_type, source_reliability, compression_ratio, quality_score
                ))
                
        except Exception as e:
            logger.error(f"Cache storage error: {e}")

    def _generate_smart_key(self, url: str, model_type: str, extra_params: Dict = None) -> str:
        """تولید کلید هوشمند"""
        try:
            # Normalize URL
            parsed = urlparse(url.lower())
            normalized_url = f"{parsed.netloc}{parsed.path}"
            
            # Create composite key
            key_components = [normalized_url, model_type]
            
            if extra_params:
                params_str = json.dumps(extra_params, sort_keys=True)
                key_components.append(params_str)
            
            combined = ':'.join(key_components)
            return hashlib.sha256(combined.encode()).hexdigest()[:32]
            
        except Exception as e:
            logger.error(f"Smart key generation error: {e}")
            return hashlib.sha256(url.encode()).hexdigest()[:32]

    def _add_to_memory_cache(self, key: str, value: Dict):
        """افزودن به کش حافظه با LFU eviction"""
        try:
            # LFU eviction if cache is full
            if len(self.memory_cache) >= self.max_memory_items:
                # Find least frequently used item
                lfu_key = min(self.access_count.keys(), 
                            key=lambda k: (self.access_count[k], -hash(k)))
                del self.memory_cache[lfu_key]
                del self.access_count[lfu_key]
            
            self.memory_cache[key] = value
            self.access_count[key] = self.access_count.get(key, 0) + 1
            
        except Exception as e:
            logger.error(f"Memory cache addition error: {e}")

    def _auto_cleanup(self):
        """پاکسازی خودکار کش"""
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                # Remove expired entries
                expired_count = conn.execute('''
                    DELETE FROM cache_entries 
                    WHERE datetime(created_at, '+' || ttl_seconds || ' seconds') < datetime('now')
                ''').rowcount
                
                # Remove low-priority, low-access entries if needed
                total_entries = conn.execute('SELECT COUNT(*) FROM cache_entries').fetchone()[0]
                
                if total_entries > 1000:  # Limit for HF environment
                    removed_count = conn.execute('''
                        DELETE FROM cache_entries 
                        WHERE key IN (
                            SELECT key FROM cache_entries 
                            WHERE priority > 2 AND access_count < 2 AND quality_score < 50
                            ORDER BY last_accessed ASC, quality_score ASC
                            LIMIT 200
                        )
                    ''').rowcount
                    
                    logger.info(f"Cache cleanup: {expired_count} expired + {removed_count} low-priority removed")
                else:
                    logger.info(f"Cache cleanup: {expired_count} expired entries removed")
                
                # Optimize database
                if expired_count > 50:
                    conn.execute('VACUUM')
                
                conn.commit()
                self.last_cleanup = time.time()
                
        except Exception as e:
            logger.error(f"Auto cleanup error: {e}")

    def get_comprehensive_stats(self) -> Dict:
        """دریافت آمار جامع کش"""
        try:
            with sqlite3.connect(self.cache_db_path, timeout=10) as conn:
                # Main statistics
                main_stats = conn.execute('''
                    SELECT 
                        COUNT(*) as total_entries,
                        SUM(access_count) as total_accesses,
                        AVG(access_count) as avg_accesses,
                        SUM(size_bytes) as total_size,
                        AVG(size_bytes) as avg_size,
                        COUNT(DISTINCT category) as categories_count,
                        AVG(source_reliability) as avg_reliability,
                        AVG(compression_ratio) as avg_compression,
                        AVG(quality_score) as avg_quality
                    FROM cache_entries
                ''').fetchone()
                
                # Category breakdown
                category_stats = conn.execute('''
                    SELECT category, COUNT(*), SUM(size_bytes), AVG(access_count), AVG(quality_score)
                    FROM cache_entries
                    GROUP BY category
                    ORDER BY COUNT(*) DESC
                ''').fetchall()
                
                # Calculate rates
                hit_rate = (self.hit_count / max(self.total_requests, 1)) * 100
                miss_rate = (self.miss_count / max(self.total_requests, 1)) * 100
                
                return {
                    'memory_cache_size': len(self.memory_cache),
                    'database_entries': main_stats[0] if main_stats else 0,
                    'total_accesses': main_stats[1] if main_stats else 0,
                    'average_accesses': round(main_stats[2] or 0, 2),
                    'total_size_mb': round((main_stats[3] or 0) / (1024*1024), 2),
                    'average_size_kb': round((main_stats[4] or 0) / 1024, 2),
                    'categories_count': main_stats[5] if main_stats else 0,
                    'average_reliability': round(main_stats[6] or 0, 3),
                    'average_compression': round(main_stats[7] or 0, 3),
                    'average_quality': round(main_stats[8] or 0, 1),
                    'hit_rate_percent': round(hit_rate, 2),
                    'miss_rate_percent': round(miss_rate, 2),
                    'total_requests': self.total_requests,
                    'cache_hits': self.hit_count,
                    'cache_misses': self.miss_count,
                    'category_breakdown': category_stats,
                    'efficiency_score': self._calculate_enhanced_efficiency_score(hit_rate, main_stats),
                    'last_cleanup_ago': int(time.time() - self.last_cleanup)
                }
                
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {'error': str(e)}

    def _calculate_enhanced_efficiency_score(self, hit_rate: float, main_stats: tuple) -> float:
        """محاسبه امتیاز کارایی پیشرفته"""
        try:
            if not main_stats or len(main_stats) < 9:
                return 0.0
                
            hit_component = hit_rate / 100 * 0.4
            compression_component = (1 - (main_stats[7] or 1.0)) * 0.2
            quality_component = (main_stats[8] or 0) / 100 * 0.2
            reliability_component = (main_stats[6] or 0) * 0.2
            
            efficiency = hit_component + compression_component + quality_component + reliability_component
            return round(min(1.0, max(0.0, efficiency)), 3)
            
        except Exception as e:
            logger.error(f"Enhanced efficiency calculation error: {e}")
            return 0.0

class UltraAdvancedScoringSystem:
    """سیستم امتیازدهی فوق‌پیشرفته"""
    
    def __init__(self):
        self.weights = {
            'content_length': 0.12,
            'legal_terms_density': 0.22,
            'source_reliability': 0.20,
            'structure_quality': 0.16,
            'linguistic_quality': 0.12,
            'citation_count': 0.10,
            'category_relevance': 0.05,
            'formality_level': 0.03
        }
        
        try:
            self.normalizer = Normalizer()
        except Exception as e:
            logger.warning(f"Hazm Normalizer loading failed: {e}")
            self.normalizer = None

    def calculate_ultra_comprehensive_score(self, content: str, source_info: Dict,
                                          legal_entities: List[Dict],
                                          category: str = "") -> Dict[str, Any]:
        """محاسبه امتیاز فوق‌جامع"""
        if not content or not content.strip():
            return {'final_score': 0, 'error': 'Empty content'}
        
        try:
            # Normalize content
            if self.normalizer:
                normalized_content = self.normalizer.normalize(content)
                words = word_tokenize(normalized_content)
            else:
                normalized_content = content
                words = content.split()
            
            scores = {}
            details = {}
            
            # Calculate component scores
            scores['content_length'], details['content_analysis'] = self._enhanced_content_score(content, words)
            scores['legal_terms_density'], details['legal_terms'] = self._enhanced_legal_terms_score(content)
            scores['source_reliability'] = source_info.get('reliability_score', 0.5)
            scores['structure_quality'], details['structure'] = self._enhanced_structure_score(content)
            scores['linguistic_quality'], details['linguistic'] = self._enhanced_linguistic_score(content, words)
            scores['citation_count'], details['citations'] = self._enhanced_citation_score(content, legal_entities)
            scores['category_relevance'] = self._enhanced_category_score(content, category)
            scores['formality_level'], details['formality'] = self._enhanced_formality_score(content)
            
            # Calculate final weighted score
            final_score = self._calculate_weighted_final_score(scores, source_info)
            
            # Additional metrics
            additional_metrics = self._calculate_enhanced_additional_metrics(content, words)
            
            return {
                'final_score': final_score,
                'component_scores': scores,
                'analysis_details': details,
                'additional_metrics': additional_metrics,
                'quality_grade': self._determine_enhanced_quality_grade(final_score),
                'recommendations': self._generate_enhanced_recommendations(scores, details),
                'scoring_method': 'ultra_comprehensive_v2'
            }
            
        except Exception as e:
            logger.error(f"Ultra comprehensive scoring error: {e}")
            return {'final_score': 0, 'error': str(e)}

    def _enhanced_content_score(self, content: str, words: List[str]) -> Tuple[float, Dict]:
        """امتیاز پیشرفته طول محتوا"""
        try:
            word_count = len(words)
            char_count = len(content)
            
            # Optimized scoring curve
            if word_count < 30:
                length_score = word_count / 30 * 0.2
            elif word_count < 100:
                length_score = 0.2 + (word_count - 30) / 70 * 0.3
            elif word_count < 500:
                length_score = 0.5 + (word_count - 100) / 400 * 0.35
            elif word_count < 2000:
                length_score = 0.85 + (word_count - 500) / 1500 * 0.15
            else:
                length_score = 1.0
            
            analysis = {
                'word_count': word_count,
                'character_count': char_count,
                'content_density': word_count / max(char_count, 1),
                'length_category': self._categorize_length(word_count)
            }
            
            return length_score, analysis
            
        except Exception as e:
            logger.error(f"Enhanced content score error: {e}")
            return 0.0, {}

    def _enhanced_legal_terms_score(self, content: str) -> Tuple[float, Dict]:
        """امتیاز پیشرفته اصطلاحات حقوقی"""
        try:
            content_lower = content.lower()
            category_analysis = {}
            total_terms = 0
            weighted_score = 0.0
            
            for category, terms in COMPREHENSIVE_LEGAL_TERMS.items():
                category_count = 0
                unique_terms = 0
                
                for term in terms:
                    count = content_lower.count(term.lower())
                    if count > 0:
                        category_count += count
                        unique_terms += 1
                
                coverage = unique_terms / len(terms) if terms else 0
                category_weight = self._get_category_weight(category)
                category_score = (category_count * 0.7 + coverage * 0.3) * category_weight
                
                category_analysis[category] = {
                    'count': category_count,
                    'unique_terms': unique_terms,
                    'coverage': coverage,
                    'weighted_score': category_score
                }
                
                total_terms += category_count
                weighted_score += category_score
            
            # Normalize score
            words_count = len(content.split())
            density = total_terms / max(words_count, 1)
            diversity_bonus = len([cat for cat in category_analysis.values() if cat['count'] > 0]) / len(COMPREHENSIVE_LEGAL_TERMS)
            
            final_score = min(1.0, weighted_score / 10 + diversity_bonus * 0.2)
            
            analysis = {
                'total_legal_terms': total_terms,
                'density_ratio': density,
                'category_analysis': category_analysis,
                'diversity_score': diversity_bonus,
                'weighted_score': weighted_score
            }
            
            return final_score, analysis
            
        except Exception as e:
            logger.error(f"Enhanced legal terms score error: {e}")
            return 0.0, {}

    def _get_category_weight(self, category: str) -> float:
        """وزن دسته‌های مختلف"""
        weights = {
            'قوانین_اساسی': 1.0,
            'قوانین_عادی': 0.9,
            'نهادهای_قضایی': 0.8,
            'اصطلاحات_پردازش': 0.7,
            'اصطلاحات_مالی': 0.6
        }
        return weights.get(category, 0.5)

    def _categorize_length(self, word_count: int) -> str:
        """دسته‌بندی طول محتوا"""
        if word_count < 50:
            return "خیلی کوتاه"
        elif word_count < 200:
            return "کوتاه"
        elif word_count < 800:
            return "متوسط"
        elif word_count < 2000:
            return "بلند"
        else:
            return "خیلی بلند"

    def _enhanced_structure_score(self, content: str) -> Tuple[float, Dict]:
        """امتیاز پیشرفته ساختار"""
        try:
            structure_elements = {
                'articles': len(re.findall(r'ماده\s*\d+', content)),
                'notes': content.count('تبصره'),
                'chapters': len(re.findall(r'فصل\s*\d+', content)),
                'sections': len(re.findall(r'بخش\s*\d+', content)),
                'numbered_lists': len(re.findall(r'\d+[\.\-\)]', content)),
                'references': len(re.findall(r'(طبق|مطابق|برابر)', content)),
                'dates': len(re.findall(r'\d{4}/\d{1,2}/\d{1,2}', content)),
                'legal_citations': len(re.findall(r'قانون\s+[آ-ی\s]{5,50}', content))
            }
            
            # Calculate structure score
            structure_score = 0.0
            for element, count in structure_elements.items():
                if count > 0:
                    element_weight = {
                        'articles': 0.20,
                        'chapters': 0.15,
                        'references': 0.15,
                        'legal_citations': 0.15,
                        'notes': 0.10,
                        'sections': 0.10,
                        'numbered_lists': 0.08,
                        'dates': 0.07
                    }.get(element, 0.05)
                    
                    structure_score += min(element_weight, count * element_weight / 5)
            
            # Paragraph analysis
            paragraphs = [p.strip() for p in content.split('\n') if p.strip()]
            paragraph_score = min(0.15, len(paragraphs) / 20 * 0.15)
            structure_score += paragraph_score
            
            analysis = {
                'elements': structure_elements,
                'paragraph_count': len(paragraphs),
                'total_structural_elements': sum(structure_elements.values()),
                'organization_level': self._assess_organization_level(structure_elements, len(paragraphs))
            }
            
            return min(1.0, structure_score), analysis
            
        except Exception as e:
            logger.error(f"Enhanced structure score error: {e}")
            return 0.0, {}

    def _enhanced_linguistic_score(self, content: str, words: List[str]) -> Tuple[float, Dict]:
        """امتیاز پیشرفته زبانی"""
        try:
            if not words:
                return 0.0, {}
            
            # Persian character ratio
            persian_chars = sum(1 for c in content if '\u0600' <= c <= '\u06FF')
            persian_ratio = persian_chars / max(len(content), 1)
            
            # Punctuation analysis
            punctuation_chars = sum(1 for c in content if c in '.,;:!؟»«()[]{}""')
            punctuation_ratio = punctuation_chars / max(len(content), 1)
            
            # Sentence analysis
            sentences = [s.strip() for s in re.split(r'[.؟!]', content) if s.strip()]
            avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
            
            # Vocabulary diversity
            unique_words = set(word.lower() for word in words)
            vocabulary_diversity = len(unique_words) / len(words)
            
            # Calculate linguistic score
            persian_score = min(0.25, persian_ratio * 0.8)
            punctuation_score = min(0.20, punctuation_ratio * 15)
            sentence_score = self._score_sentence_length_enhanced(avg_sentence_length) * 0.25
            diversity_score = min(0.30, vocabulary_diversity * 1.5)
            
            linguistic_score = persian_score + punctuation_score + sentence_score + diversity_score
            
            analysis = {
                'persian_ratio': persian_ratio,
                'punctuation_ratio': punctuation_ratio,
                'avg_sentence_length': avg_sentence_length,
                'vocabulary_diversity': vocabulary_diversity,
                'unique_word_count': len(unique_words),
                'readability_level': self._assess_readability_enhanced(avg_sentence_length, vocabulary_diversity)
            }
            
            return min(1.0, linguistic_score), analysis
            
        except Exception as e:
            logger.error(f"Enhanced linguistic score error: {e}")
            return 0.0, {}

    def _enhanced_citation_score(self, content: str, legal_entities: List[Dict]) -> Tuple[float, Dict]:
        """امتیاز پیشرفته ارجاعات"""
        try:
            citation_patterns = {
                'law_articles': r'ماده\s*(\d+)',
                'law_notes': r'تبصره\s*(\d*)',
                'law_chapters': r'فصل\s*(\d+)',
                'law_references': r'قانون\s+([آ-ی\s]{5,50})',
                'regulations': r'مقررات\s+([آ-ی\s]{5,50})',
                'court_decisions': r'(رای|حکم|دادنامه)\s*شماره\s*(\d+)',
                'legal_codes': r'(ق\.م|ق\.ج|ق\.ت\.ا)\s*[\-\.]?\s*ماده\s*(\d+)'
            }
            
            citation_analysis = {}
            total_citations = 0
            quality_weighted_citations = 0
            
            for pattern_name, pattern in citation_patterns.items():
                matches = re.findall(pattern, content, re.IGNORECASE)
                count = len(matches)
                
                # Weight different types of citations
                weight = {
                    'law_articles': 1.0,
                    'law_references': 0.9,
                    'court_decisions': 0.8,
                    'law_chapters': 0.7,
                    'legal_codes': 0.9,
                    'regulations': 0.6,
                    'law_notes': 0.5
                }.get(pattern_name, 0.5)
                
                citation_analysis[pattern_name] = {
                    'count': count,
                    'weight': weight,
                    'examples': matches[:3]
                }
                
                total_citations += count
                quality_weighted_citations += count * weight
            
            # Entity citations
            entity_citations = len(legal_entities) if legal_entities else 0
            total_citations += entity_citations
            
            # Calculate final citation score
            citation_density = total_citations / max(len(content.split()), 1)
            quality_factor = quality_weighted_citations / max(total_citations, 1)
            
            citation_score = min(1.0, citation_density * 20 * quality_factor)
            
            analysis = {
                'total_citations': total_citations,
                'quality_weighted_citations': quality_weighted_citations,
                'entity_citations': entity_citations,
                'citation_analysis': citation_analysis,
                'citation_density': citation_density,
                'quality_factor': quality_factor
            }
            
            return citation_score, analysis
            
        except Exception as e:
            logger.error(f"Enhanced citation score error: {e}")
            return 0.0, {}

    def _enhanced_category_score(self, content: str, category: str) -> float:
        """امتیاز پیشرفته ارتباط دسته"""
        try:
            if not category:
                return 0.5
            
            category_keywords = {
                'قانون': ['قانون', 'ماده', 'تبصره', 'مصوب', 'لازم‌الاجرا'],
                'دادنامه': ['دادنامه', 'رای', 'حکم', 'دادگاه', 'قاضی', 'محکمه'],
                'رویه_قضایی': ['رویه', 'دیوان عالی', 'وحدت رویه', 'تفسیر'],
                'قرارداد': ['قرارداد', 'توافق‌نامه', 'طرفین', 'تعهد'],
                'بخشنامه': ['بخشنامه', 'دستورالعمل', 'ابلاغ', 'رهنمود']
            }
            
            keywords = category_keywords.get(category, [])
            if not keywords:
                return 0.5
            
            content_lower = content.lower()
            keyword_count = sum(content_lower.count(keyword) for keyword in keywords)
            
            # Normalize by content length
            words_count = len(content.split())
            relevance_score = min(1.0, keyword_count / max(words_count, 1) * 50)
            
            return relevance_score
            
        except Exception as e:
            logger.error(f"Enhanced category score error: {e}")
            return 0.0

    def _enhanced_formality_score(self, content: str) -> Tuple[float, Dict]:
        """امتیاز پیشرفته رسمی بودن"""
        try:
            formal_indicators = [
                'حضرت', 'جناب', 'سرکار', 'احتراماً', 'مستحضر می‌دارد',
                'اعلام می‌گردد', 'مقرر می‌دارد', 'بدینوسیله', 'علیهذا',
                'در اجرای', 'به استناد', 'طبق مقررات'
            ]
            
            informal_indicators = [
                'سلام', 'چطور', 'میشه', 'خیلی', 'یه', 'اون', 'این'
            ]
            
            content_lower = content.lower()
            formal_count = sum(content_lower.count(indicator) for indicator in formal_indicators)
            informal_count = sum(content_lower.count(indicator) for indicator in informal_indicators)
            
            total_indicators = formal_count + informal_count
            
            if total_indicators == 0:
                formality_ratio = 0.7  # Default to formal for legal documents
            else:
                formality_ratio = formal_count / total_indicators
            
            # Legal documents should be formal
            formality_score = formality_ratio
            
            analysis = {
                'formal_count': formal_count,
                'informal_count': informal_count,
                'formality_ratio': formality_ratio,
                'formality_level': self._categorize_formality(formality_ratio)
            }
            
            return formality_score, analysis
            
        except Exception as e:
            logger.error(f"Enhanced formality score error: {e}")
            return 0.0, {}

    def _calculate_weighted_final_score(self, scores: Dict[str, float], source_info: Dict) -> float:
        """محاسبه امتیاز نهایی وزنی"""
        try:
            # Adjust weights based on source reliability
            reliability = source_info.get('reliability_score', 0.5)
            adjusted_weights = self.weights.copy()
            
            if reliability > 0.9:
                adjusted_weights['source_reliability'] *= 1.1
                adjusted_weights['legal_terms_density'] *= 1.05
            
            # Calculate weighted score
            total_weight = sum(adjusted_weights.values())
            normalized_weights = {k: v/total_weight for k, v in adjusted_weights.items()}
            
            final_score = sum(
                scores.get(factor, 0) * weight 
                for factor, weight in normalized_weights.items()
            )
            
            return min(100, max(0, final_score * 100))
            
        except Exception as e:
            logger.error(f"Weighted final score calculation error: {e}")
            return 0.0

    def _calculate_enhanced_additional_metrics(self, content: str, words: List[str]) -> Dict:
        """محاسبه مترک‌های اضافی پیشرفته"""
        try:
            return {
                'word_count': len(words),
                'character_count': len(content),
                'readability': self._calculate_farsi_readability(content, words),
                'complexity': self._calculate_farsi_complexity(content, words),
                'coherence': self._calculate_text_coherence(content),
                'information_density': self._calculate_info_density(content, words),
                'technical_level': self._assess_technical_level(content),
                'citation_richness': self._assess_citation_richness(content)
            }
        except Exception as e:
            logger.error(f"Enhanced additional metrics error: {e}")
            return {}

    def _determine_enhanced_quality_grade(self, score: float) -> str:
        """تعیین درجه کیفیت پیشرفته"""
        if score >= 85:
            return "عالی (A+)"
        elif score >= 75:
            return "خوب (A)"
        elif score >= 65:
            return "متوسط+ (B+)"
        elif score >= 55:
            return "متوسط (B)"
        elif score >= 45:
            return "ضعیف (C)"
        else:
            return "بسیار ضعیف (D)"

    def _generate_enhanced_recommendations(self, scores: Dict, details: Dict) -> List[str]:
        """تولید توصیه‌های پیشرفته"""
        recommendations = []
        
        try:
            if scores.get('legal_terms_density', 0) < 0.4:
                recommendations.append("افزایش استفاده از اصطلاحات تخصصی حقوقی")
            
            if scores.get('structure_quality', 0) < 0.5:
                recommendations.append("بهبود ساختار با افزودن شماره‌گذاری و عناوین")
            
            if scores.get('citation_count', 0) < 0.3:
                recommendations.append("افزایش ارجاعات به منابع حقوقی معتبر")
            
            if scores.get('linguistic_quality', 0) < 0.6:
                recommendations.append("بهبود کیفیت نگارش و استفاده از علائم نگارشی")
            
            if scores.get('formality_level', 0) < 0.7:
                recommendations.append("افزایش سطح رسمی بودن متن")
                
        except Exception as e:
            logger.error(f"Enhanced recommendations error: {e}")
        
        return recommendations

    # Additional helper methods
    def _score_sentence_length_enhanced(self, avg_length: float) -> float:
        """امتیازدهی پیشرفته طول جمله"""
        if 12 <= avg_length <= 22:
            return 1.0
        elif 8 <= avg_length < 12 or 22 < avg_length <= 30:
            return 0.8
        elif 5 <= avg_length < 8 or 30 < avg_length <= 40:
            return 0.6
        else:
            return 0.3

    def _assess_readability_enhanced(self, avg_sentence_length: float, vocabulary_diversity: float) -> str:
        """ارزیابی پیشرفته خوانایی"""
        if avg_sentence_length <= 18 and vocabulary_diversity >= 0.6:
            return "بسیار خوانا"
        elif avg_sentence_length <= 25 and vocabulary_diversity >= 0.4:
            return "خوانا"
        elif avg_sentence_length <= 35:
            return "متوسط"
        else:
            return "دشوار"

    def _assess_organization_level(self, elements: Dict, paragraph_count: int) -> str:
        """ارزیابی سطح سازماندهی"""
        structure_score = sum(min(count, 5) for count in elements.values())
        
        if structure_score >= 15 and paragraph_count >= 8:
            return "بسیار منظم"
        elif structure_score >= 8 and paragraph_count >= 4:
            return "منظم"
        elif structure_score >= 3:
            return "نیمه‌منظم"
        else:
            return "نامنظم"

    def _categorize_formality(self, ratio: float) -> str:
        """دسته‌بندی رسمی بودن"""
        if ratio >= 0.8:
            return "بسیار رسمی"
        elif ratio >= 0.6:
            return "رسمی"
        elif ratio >= 0.4:
            return "نیمه‌رسمی"
        else:
            return "غیررسمی"

    def _calculate_farsi_readability(self, content: str, words: List[str]) -> float:
        """محاسبه خوانایی فارسی"""
        try:
            sentences = [s.strip() for s in re.split(r'[.؟!]', content) if s.strip()]
            if not sentences or not words:
                return 0.0
                
            avg_sentence_length = len(words) / len(sentences)
            avg_word_length = sum(len(word) for word in words) / len(words)
            
            # Farsi readability formula (simplified)
            readability = 100 - (avg_sentence_length * 1.5 + avg_word_length * 2.0)
            return max(0, min(100, readability)) / 100
            
        except Exception as e:
            logger.error(f"Farsi readability calculation error: {e}")
            return 0.0

    def _calculate_farsi_complexity(self, content: str, words: List[str]) -> float:
        """محاسبه پیچیدگی فارسی"""
        try:
            if not words:
                return 0.0
                
            # Complex word analysis
            complex_words = [w for w in words if len(w) > 8]
            complexity_ratio = len(complex_words) / len(words)
            
            # Compound sentence analysis
            compound_indicators = ['که', 'اما', 'ولی', 'چون', 'زیرا', 'بنابراین']
            compound_count = sum(content.lower().count(indicator) for indicator in compound_indicators)
            sentence_count = len(re.split(r'[.؟!]', content))
            compound_ratio = compound_count / max(sentence_count, 1)
            
            # Legal complexity indicators
            legal_complexity_indicators = ['موضوع', 'مشروط بر', 'در صورتی که', 'به شرطی که']
            legal_complexity = sum(content.lower().count(indicator) for indicator in legal_complexity_indicators)
            legal_complexity_ratio = legal_complexity / max(len(words), 1)
            
            # Combined complexity
            complexity = (complexity_ratio * 0.4 + compound_ratio * 0.3 + legal_complexity_ratio * 10 * 0.3)
            return min(1.0, complexity)
            
        except Exception as e:
            logger.error(f"Farsi complexity calculation error: {e}")
            return 0.0

    def _calculate_text_coherence(self, content: str) -> float:
        """محاسبه انسجام متن"""
        try:
            coherence_indicators = [
                'همچنین', 'علاوه بر این', 'در نتیجه', 'بنابراین', 'لذا',
                'از طرف دیگر', 'در مقابل', 'با این حال', 'در ادامه'
            ]
            
            coherence_count = sum(content.lower().count(indicator) for indicator in coherence_indicators)
            sentences = len(re.split(r'[.؟!]', content))
            
            coherence_ratio = coherence_count / max(sentences, 1)
            return min(1.0, coherence_ratio * 3)
            
        except Exception as e:
            logger.error(f"Text coherence calculation error: {e}")
            return 0.0

    def _calculate_info_density(self, content: str, words: List[str]) -> float:
        """محاسبه تراکم اطلاعات"""
        try:
            if not words:
                return 0.0
                
            # Persian stop words
            stop_words = {
                'و', 'در', 'به', 'از', 'با', 'که', 'این', 'آن', 'را', 'است', 'بود',
                'شد', 'می', 'خود', 'تا', 'بر', 'یا', 'هر', 'اگر', 'چه'
            }
            
            content_words = [w for w in words if w.lower() not in stop_words and len(w) > 2]
            density = len(content_words) / len(words)
            
            return density
            
        except Exception as e:
            logger.error(f"Info density calculation error: {e}")
            return 0.0

    def _assess_technical_level(self, content: str) -> str:
        """ارزیابی سطح فنی"""
        try:
            technical_terms = [
                'حقوقی', 'قانونی', 'قضایی', 'اداری', 'تجاری', 'مدنی', 'کیفری',
                'اجرایی', 'تفسیری', 'مقررات', 'آیین‌نامه'
            ]
            
            technical_count = sum(content.lower().count(term) for term in technical_terms)
            word_count = len(content.split())
            
            technical_density = technical_count / max(word_count, 1)
            
            if technical_density >= 0.05:
                return "بسیار تخصصی"
            elif technical_density >= 0.03:
                return "تخصصی"
            elif technical_density >= 0.01:
                return "نیمه‌تخصصی"
            else:
                return "عمومی"
                
        except Exception as e:
            logger.error(f"Technical level assessment error: {e}")
            return "نامشخص"

    def _assess_citation_richness(self, content: str) -> str:
        """ارزیابی غنای ارجاعات"""
        try:
            citation_patterns = [r'ماده\s*\d+', r'قانون\s+[آ-ی\s]{5,}', r'مقررات\s+[آ-ی\s]{5,}']
            total_citations = sum(len(re.findall(pattern, content)) for pattern in citation_patterns)
            
            if total_citations >= 10:
                return "بسیار غنی"
            elif total_citations >= 5:
                return "غنی"
            elif total_citations >= 2:
                return "متوسط"
            else:
                return "فقیر"
                
        except Exception as e:
            logger.error(f"Citation richness assessment error: {e}")
            return "نامشخص"

# --- Application Entry Point ---
def create_application():
    """ایجاد اپلیکیشن با مدیریت خطا"""
    try:
        if not HF_AVAILABLE:
            # Create minimal fallback interface
            return create_minimal_interface()
        
        app = UltraModernLegalArchive()
        interface = app.create_modern_interface()
        
        logger.info("🎯 Application created successfully")
        return interface
        
    except Exception as e:
        logger.error(f"Application creation error: {e}")
        return create_minimal_interface()

def create_minimal_interface():
    """ایجاد رابط کاربری حداقلی در صورت خطا"""
    try:
        import gradio as gr
        
        def minimal_process(urls_text):
            if not urls_text:
                return "❌ لطفاً آدرس‌ها را وارد کنید", ""
            
            return f"⚠️ سیستم در حالت محدود اجرا می‌شود\n📝 {len(urls_text.split())} آدرس دریافت شد", "سیستم آماده سازی می‌شود..."
        
        with gr.Blocks(title="آرشیو اسناد حقوقی - حالت محدود") as interface:
            gr.HTML("""
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
                    <h1>⚖️ آرشیو اسناد حقوقی ایران</h1>
                    <p>سیستم در حال راه‌اندازی - حالت محدود</p>
                </div>
            """)
            
            urls_input = gr.Textbox(
                label="آدرس‌های اسناد حقوقی",
                placeholder="https://rc.majlis.ir/fa/law/show/139030\nhttps://dotic.ir/portal/law/67890",
                lines=5
            )
            
            process_btn = gr.Button("پردازش محدود", variant="primary")
            
            output1 = gr.Textbox(label="نتایج", lines=5)
            output2 = gr.Textbox(label="وضعیت", lines=3)
            
            process_btn.click(
                fn=minimal_process,
                inputs=[urls_input],
                outputs=[output1, output2]
            )
        
        return interface
        
    except Exception as e:
        logger.error(f"Minimal interface creation error: {e}")
        # Return even more basic interface
        def basic_function(x):
            return f"سیستم دریافت کرد: {len(str(x))} کاراکتر"
        
        try:
            import gradio as gr
            return gr.Interface(
                fn=basic_function,
                inputs=gr.Textbox(label="ورودی", placeholder="آدرس‌های اسناد..."),
                outputs=gr.Textbox(label="خروجی"),
                title="آرشیو اسناد حقوقی - حالت پایه"
            )
        except:
            return None

# --- Main Execution ---
if __name__ == "__main__":
    try:
        # Initialize logging first
        logger = logging.getLogger(__name__)
        
        # Check system requirements with fallback
        try:
            internet_available = check_internet_connection()
            if not internet_available:
                logger.warning("No internet connection detected")
        except:
            logger.warning("Cannot check internet connection")
            internet_available = False
        
        # Create and launch application  
        app_interface = create_application()
        
        if app_interface is None:
            logger.error("Failed to create any interface")
            print("❌ خطا: نتوانست رابط کاربری ایجاد شود")
            exit(1)
        
        # Launch with HF-optimized settings
        logger.info("🚀 Launching application...")
        app_interface.launch(
            server_name="0.0.0.0",
            server_port=7860,
            share=True,
            show_error=True,
            quiet=False,
            enable_queue=True,
            max_threads=2  # Limited for HF
        )
        
    except Exception as e:
        logger.error(f"Application launch error: {e}")
        print(f"❌ خطا در راه‌اندازی: {e}")
        
        # Try to create and launch minimal interface as final fallback
        try:
            minimal_interface = create_minimal_interface()
            if minimal_interface:
                logger.info("Launching minimal fallback interface...")
                minimal_interface.launch(
                    server_name="0.0.0.0",
                    server_port=7860, 
                    share=True,
                    show_error=True
                )
            else:
                print("❌ حتی رابط کاربری محدود نیز ایجاد نشد")
        except Exception as final_error:
            print(f"❌ خطای نهایی: {final_error}")
            exit(1)
            
else:
    # For HF Spaces deployment
    logger = logging.getLogger(__name__)
    logger.info("Preparing for HF Spaces deployment...")
    try:
        demo = create_application()
        if demo is None:
            demo = create_minimal_interface()
    except Exception as e:
        logger.error(f"HF Spaces preparation error: {e}")
        # Create minimal fallback interface
        try:
            demo = create_minimal_interface()
        except:
            import gradio as gr
            demo = gr.Interface(
                fn=lambda x: f"سیستم آماده‌سازی: دریافت {len(str(x))} کاراکتر",
                inputs=gr.Textbox(label="ورودی", placeholder="آدرس‌ها..."),
                outputs=gr.Textbox(label="خروجی"),
                title="آرشیو اسناد حقوقی - آماده‌سازی"
            )