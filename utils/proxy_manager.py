"""
Modern Proxy Manager for Iranian Legal Archive System
Provides proxy pool management, testing, rotation, and fallback capabilities
"""

import time
import random
import logging
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import ssl

try:
    import requests
    from urllib3.util.retry import Retry
    from requests.adapters import HTTPAdapter
    from requests.packages.urllib3.util.ssl_ import create_urllib3_context
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logging.warning("requests not available, proxy manager disabled")

logger = logging.getLogger(__name__)

# Modern proxy sources for 2024
MODERN_PROXY_SOURCES = {
    "iranian_proxies_2024": [
        "185.55.226.26:8080",
        "185.55.225.25:8080", 
        "78.109.23.1:8080",
        "94.182.190.241:8080",
        "37.156.28.2:8080",
        "185.143.232.50:8080",
        "195.191.56.49:8080",
        "91.107.6.115:8080",
        "185.142.239.50:8080",
        "78.109.23.134:8080"
    ],
    "international_backup": [
        "8.210.83.33:80",
        "47.74.152.29:8888",
        "103.149.162.194:80",
        "103.148.72.192:80",
        "154.236.184.70:1981",
        "185.32.6.129:8090",
        "103.105.197.22:80",
        "190.61.101.39:8080"
    ]
}

# Free proxy API sources
PROXY_API_SOURCES = [
    "https://www.proxy-list.download/api/v1/get?type=http",
    "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
    "https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt",
    "https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/proxies.txt"
]


class EnhancedHTTPAdapter(HTTPAdapter):
    """HTTP Adapter بهینه‌شده با SSL relaxed"""
    
    def init_poolmanager(self, *args, **kwargs):
        ctx = create_urllib3_context()
        ctx.set_ciphers('DEFAULT@SECLEVEL=1')
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs['ssl_context'] = ctx
        return super().init_poolmanager(*args, **kwargs)


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
        if not REQUESTS_AVAILABLE:
            return {
                'status': 'unavailable',
                'error_message': 'requests library not available'
            }
            
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

    def get_proxy_for_session(self) -> Optional[Dict]:
        """دریافت پروکسی برای استفاده در session"""
        proxy = self.get_random_active_proxy()
        if proxy:
            return {
                'http': proxy['url'],
                'https': proxy['url']
            }
        return None

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

    def setup_session_with_proxy(self, session) -> bool:
        """تنظیم session با پروکسی فعال"""
        try:
            proxy_dict = self.get_proxy_for_session()
            if proxy_dict:
                session.proxies.update(proxy_dict)
                
                # Add enhanced HTTP adapter
                adapter = EnhancedHTTPAdapter()
                session.mount('http://', adapter)
                session.mount('https://', adapter)
                
                logger.info(f"Session configured with proxy: {proxy_dict['http']}")
                return True
        except Exception as e:
            logger.error(f"Failed to setup session with proxy: {e}")
        
        return False

    def get_status(self) -> Dict:
        """دریافت وضعیت کامل proxy manager"""
        return {
            'total_proxies': len(self.all_proxies),
            'active_proxies': len(self.active_proxies),
            'failed_proxies': len(self.failed_proxies),
            'last_update': self.last_update,
            'update_interval': self.update_interval,
            'needs_update': time.time() - self.last_update > self.update_interval if self.last_update else True,
            'dashboard_data': self.get_proxy_dashboard_data()
        }