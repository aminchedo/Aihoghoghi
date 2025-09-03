#!/usr/bin/env python3
"""
Enhanced Ultimate Proxy System for Iranian Legal Archive
Advanced techniques for bypassing ALL restrictions and achieving 95%+ success rate
Specifically designed to handle judiciary.ir (DNS issues) and dolat.ir (ArvanCloud 403)
"""

import asyncio
import aiohttp
import requests
import random
import time
import json
import socket
import ssl
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, urljoin, quote
from bs4 import BeautifulSoup
import dns.resolver
from concurrent.futures import ThreadPoolExecutor
import threading
import base64
import hashlib

class EnhancedUltimateProxy:
    def __init__(self):
        # Extended DNS servers including powerful alternatives
        self.dns_servers = [
            '178.22.122.100',  # Shecan Primary
            '178.22.122.101',  # Shecan Secondary
            '185.51.200.2',    # Begzar Primary
            '185.51.200.3',    # Begzar Secondary
            '10.202.10.202',   # Pishgaman
            '10.202.10.102',   # Pishgaman Secondary
            '178.216.248.40',  # Radar Game
            '185.55.226.26',   # Asiatech
            '185.55.225.25',   # Asiatech Secondary
            '1.1.1.1',         # Cloudflare
            '1.0.0.1',         # Cloudflare Secondary
            '8.8.8.8',         # Google Primary
            '8.8.4.4',         # Google Secondary
            '9.9.9.9',         # Quad9 Primary
            '149.112.112.112', # Quad9 Secondary
            '76.76.19.19',     # Alternate DNS Primary
            '76.223.100.101',  # Alternate DNS Secondary
            '94.140.14.14',    # AdGuard DNS
            '94.140.15.15',    # AdGuard DNS Secondary
            '4.2.2.4',         # Level3
            '208.67.222.222',  # OpenDNS
            '208.67.220.220'   # OpenDNS Secondary
        ]
        
        # Advanced bypass techniques
        self.bypass_methods = {
            'cors_proxies': [
                'https://cors-anywhere.herokuapp.com/',
                'https://api.allorigins.win/get?url=',
                'https://corsproxy.io/?',
                'https://proxy.cors.sh/',
                'https://yacdn.org/proxy/',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://thingproxy.freeboard.io/fetch/'
            ],
            'translation_proxies': [
                'https://translate.google.com/translate?sl=fa&tl=en&u=',
                'https://translate.yandex.com/translate?url=',
                'https://www.bing.com/translator?text=&from=fa&to=en&ref='
            ],
            'cache_services': [
                'https://web.archive.org/web/',
                'https://archive.today/newest/',
                'https://webcache.googleusercontent.com/search?q=cache:',
                'https://cc.bingj.com/cache.aspx?q=cache:',
                'https://www.bing.com/search?q=cache:'
            ],
            'search_proxies': [
                'https://www.google.com/search?q=site:',
                'https://duckduckgo.com/?q=site:',
                'https://search.yahoo.com/search?p=site:',
                'https://www.bing.com/search?q=site:'
            ]
        }
        
        # Anti-detection headers for different protection systems
        self.protection_headers = {
            'arvancloud': {
                'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'X-Forwarded-For': '66.249.66.1',  # Bing crawler IP
                'X-Real-IP': '66.249.66.1',
                'X-Forwarded-Proto': 'https'
            },
            'cloudflare': {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'X-Forwarded-For': '66.249.79.1',  # Googlebot IP
                'X-Real-IP': '66.249.79.1',
                'CF-Connecting-IP': '66.249.79.1',
                'CF-RAY': f'{random.randint(100000000000, 999999999999)}-IAD'
            },
            'generic_protection': {
                'User-Agent': 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
                'X-Forwarded-For': '5.255.255.70',  # Yandex IP
                'X-Real-IP': '5.255.255.70'
            },
            'mobile_bypass': {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }
        
        # Site-specific alternative URLs
        self.site_alternatives = {
            'judiciary.ir': [
                'https://www.judiciary.ir',
                'https://judiciary.ir', 
                'https://eadl.ir',  # Electronic Archive of Legal Documents
                'https://www.eadl.ir',
                'https://divan.ir',  # Administrative Justice Court
                'https://www.divan.ir',
                'https://www.dadiran.ir',  # Alternative justice portal
                'https://dadiran.ir'
            ],
            'dolat.ir': [
                'https://www.dolat.ir',
                'https://dolat.ir',
                'https://portal.dolat.ir',
                'https://www.president.ir',  # Presidential site
                'https://president.ir',
                'https://www.moi.ir',  # Ministry of Interior
                'https://moi.ir',
                'https://www.mporg.ir',  # Management and Planning
                'https://mporg.ir'
            ]
        }
        
        # Session setup with advanced configuration
        self.session = requests.Session()
        self.session.verify = False  # Ignore SSL errors
        
        # Advanced retry strategy
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry
        
        retry_strategy = Retry(
            total=5,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504, 403],  # Include 403
            allowed_methods=["HEAD", "GET", "OPTIONS"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Statistics tracking
        self.stats = {
            'total_attempts': 0,
            'successful_connections': 0,
            'dns_resolutions': 0,
            'bypass_successes': 0,
            'protection_detected': 0
        }
    
    def advanced_dns_resolution(self, hostname: str) -> List[str]:
        """Ultra-advanced DNS resolution with fallback techniques"""
        ips = []
        
        print(f"🔍 Advanced DNS resolution for: {hostname}")
        
        # Primary DNS resolution
        for dns_server in self.dns_servers:
            try:
                resolver = dns.resolver.Resolver()
                resolver.nameservers = [dns_server]
                resolver.timeout = 8
                resolver.lifetime = 12
                
                # Try different record types
                for record_type in ['A', 'AAAA', 'CNAME']:
                    try:
                        result = resolver.resolve(hostname, record_type)
                        for rdata in result:
                            ip = str(rdata)
                            if ip not in ips and self._is_valid_ip(ip):
                                ips.append(ip)
                                print(f"✅ DNS {dns_server} ({record_type}): {hostname} -> {ip}")
                    except:
                        continue
                        
            except Exception as e:
                print(f"❌ DNS {dns_server} failed: {str(e)[:40]}")
                continue
        
        # Fallback techniques if no IPs found
        if not ips:
            print(f"🔄 Trying fallback techniques for {hostname}...")
            
            # Try alternative hostnames
            alternatives = self._generate_hostname_alternatives(hostname)
            for alt_hostname in alternatives:
                for dns_server in self.dns_servers[:5]:  # Top 5 DNS only
                    try:
                        resolver = dns.resolver.Resolver()
                        resolver.nameservers = [dns_server]
                        resolver.timeout = 5
                        
                        result = resolver.resolve(alt_hostname, 'A')
                        for rdata in result:
                            ip = str(rdata)
                            if ip not in ips and self._is_valid_ip(ip):
                                ips.append(ip)
                                print(f"🔄 Alternative DNS: {alt_hostname} -> {ip}")
                        
                        if ips:  # Stop after first success
                            break
                    except:
                        continue
                if ips:
                    break
        
        return ips
    
    def _generate_hostname_alternatives(self, hostname: str) -> List[str]:
        """Generate alternative hostnames"""
        alternatives = []
        
        # www variants
        if hostname.startswith('www.'):
            alternatives.append(hostname[4:])
        else:
            alternatives.append(f"www.{hostname}")
        
        # For Iranian sites, try different subdomains
        if hostname.endswith('.ir'):
            base = hostname.replace('.ir', '')
            alternatives.extend([
                f"portal.{base}.ir",
                f"www.portal.{base}.ir",
                f"new.{base}.ir",
                f"m.{base}.ir"  # Mobile version
            ])
        
        return alternatives
    
    def _is_valid_ip(self, ip: str) -> bool:
        """Check if IP is valid and not private/reserved"""
        try:
            socket.inet_aton(ip)
            # Exclude private/reserved ranges
            private_ranges = ['127.', '10.', '172.16.', '192.168.', '169.254.']
            return not any(ip.startswith(pr) for pr in private_ranges)
        except:
            return False
    
    def detect_protection_system(self, response_headers: Dict[str, str]) -> str:
        """Detect which protection system is being used"""
        headers_lower = {k.lower(): v.lower() for k, v in response_headers.items()}
        
        if 'arvancloud' in headers_lower.get('server', ''):
            return 'arvancloud'
        elif 'cloudflare' in headers_lower.get('server', '') or 'cf-ray' in headers_lower:
            return 'cloudflare'
        elif 'nginx' in headers_lower.get('server', ''):
            return 'nginx'
        elif 'apache' in headers_lower.get('server', ''):
            return 'apache'
        else:
            return 'unknown'
    
    def enhanced_request(self, url: str, protection_type: str = None) -> Dict[str, Any]:
        """Enhanced request with protection-specific bypass"""
        
        # Auto-detect protection if not specified
        if not protection_type:
            try:
                test_response = self.session.head(url, timeout=5)
                protection_type = self.detect_protection_system(test_response.headers)
                print(f"🔍 Detected protection: {protection_type}")
            except:
                protection_type = 'unknown'
        
        # Choose appropriate headers
        if protection_type == 'arvancloud':
            headers = self.protection_headers['arvancloud']
        elif protection_type == 'cloudflare':
            headers = self.protection_headers['cloudflare']
        else:
            headers = self.protection_headers['generic_protection']
        
        # Add random delays and session management
        time.sleep(random.uniform(1, 4))
        
        try:
            response = self.session.get(url, headers=headers, timeout=30)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': f'{protection_type}_bypass',
                'headers_used': headers
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': f'{protection_type}_bypass'}
    
    def ultimate_bypass_request(self, url: str) -> Optional[Dict[str, Any]]:
        """Ultimate bypass with all advanced techniques"""
        
        print(f"\n🚀 ULTIMATE BYPASS: {url}")
        self.stats['total_attempts'] += 1
        
        # Get all possible URL variants
        url_variants = self._get_all_url_variants(url)
        
        # Define all bypass strategies in order of effectiveness
        strategies = [
            # Direct approaches with protection-specific headers
            ('ArvanCloud Direct', lambda u: self.enhanced_request(u, 'arvancloud')),
            ('Cloudflare Direct', lambda u: self.enhanced_request(u, 'cloudflare')),
            ('Generic Protection', lambda u: self.enhanced_request(u, 'generic_protection')),
            ('Mobile Bypass', lambda u: self.enhanced_request(u, 'mobile_bypass')),
            
            # CORS bypass techniques
            ('CORS Proxy 1', lambda u: self._cors_bypass(u, 0)),
            ('CORS Proxy 2', lambda u: self._cors_bypass(u, 1)),
            ('CORS Proxy 3', lambda u: self._cors_bypass(u, 2)),
            ('CORS Proxy 4', lambda u: self._cors_bypass(u, 3)),
            ('CORS Proxy 5', lambda u: self._cors_bypass(u, 4)),
            ('CORS Proxy 6', lambda u: self._cors_bypass(u, 5)),
            ('CORS Proxy 7', lambda u: self._cors_bypass(u, 6)),
            
            # Translation proxy techniques
            ('Google Translate', lambda u: self._translation_proxy(u, 0)),
            ('Yandex Translate', lambda u: self._translation_proxy(u, 1)),
            ('Bing Translate', lambda u: self._translation_proxy(u, 2)),
            
            # Cache and mirror techniques
            ('Archive.org', lambda u: self._cache_request(u, 0)),
            ('Archive.today', lambda u: self._cache_request(u, 1)),
            ('Google Cache', lambda u: self._cache_request(u, 2)),
            ('Bing Cache', lambda u: self._cache_request(u, 3)),
            
            # Search engine proxies
            ('Google Search', lambda u: self._search_proxy(u, 0)),
            ('DuckDuckGo Search', lambda u: self._search_proxy(u, 1)),
            ('Yahoo Search', lambda u: self._search_proxy(u, 2)),
            ('Bing Search', lambda u: self._search_proxy(u, 3))
        ]
        
        # Try each strategy on each URL variant
        for attempt in range(3):  # 3 main attempts
            print(f"🔄 ATTEMPT {attempt + 1}/3")
            
            # Randomize for better success
            random.shuffle(strategies)
            random.shuffle(url_variants)
            
            for url_variant in url_variants[:10]:  # Try top 10 variants
                print(f"   🌐 Variant: {url_variant[:60]}...")
                
                for strategy_name, strategy_func in strategies[:15]:  # Try top 15 strategies
                    try:
                        print(f"      📡 {strategy_name}")
                        
                        result = strategy_func(url_variant)
                        
                        if result and result.get('success'):
                            content = result.get('content', '')
                            
                            # Enhanced content validation
                            if self._validate_content(content, url):
                                print(f"✅ SUCCESS! {strategy_name} on {url_variant[:50]}...")
                                print(f"📊 Status: {result.get('status_code')}, Size: {len(content)}")
                                
                                # Extract and analyze content
                                analyzed_content = self._analyze_content(content, url_variant)
                                result.update(analyzed_content)
                                
                                self.stats['successful_connections'] += 1
                                self.stats['bypass_successes'] += 1
                                
                                return result
                            else:
                                print(f"⚠️ Invalid content, trying next...")
                                continue
                        else:
                            error = result.get('error', 'Unknown error') if result else 'No result'
                            print(f"      ❌ Failed: {error[:40]}")
                    
                    except Exception as e:
                        print(f"      💥 Exception: {str(e)[:40]}")
                        continue
                    
                    # Small delay between strategies
                    time.sleep(random.uniform(0.5, 1.5))
            
            # Longer delay between attempts
            if attempt < 2:
                time.sleep(random.uniform(3, 6))
        
        print(f"❌ ALL BYPASS ATTEMPTS FAILED for {url}")
        return None
    
    def _get_all_url_variants(self, url: str) -> List[str]:
        """Generate all possible URL variants"""
        variants = []
        parsed = urlparse(url)
        hostname = parsed.hostname
        
        # Original URL
        variants.append(url)
        
        # Site-specific alternatives
        for site_key, alternatives in self.site_alternatives.items():
            if site_key in hostname:
                variants.extend(alternatives)
        
        # Protocol variants
        if url.startswith('https://'):
            variants.append(url.replace('https://', 'http://'))
        elif url.startswith('http://'):
            variants.append(url.replace('http://', 'https://'))
        
        # www variants
        if 'www.' in hostname:
            variants.append(url.replace('www.', ''))
        else:
            variants.append(url.replace('://', '://www.'))
        
        # IP-based variants (if DNS resolution works)
        try:
            ips = self.advanced_dns_resolution(hostname)
            for ip in ips[:3]:  # Use top 3 IPs only
                ip_url = url.replace(hostname, ip)
                variants.append(ip_url)
        except:
            pass
        
        # Remove duplicates
        unique_variants = list(dict.fromkeys(variants))
        print(f"🔍 Generated {len(unique_variants)} URL variants")
        
        return unique_variants
    
    def _cors_bypass(self, url: str, proxy_index: int) -> Dict[str, Any]:
        """Enhanced CORS bypass"""
        try:
            if proxy_index >= len(self.bypass_methods['cors_proxies']):
                return {'success': False, 'error': 'No more CORS proxies'}
            
            proxy_url = self.bypass_methods['cors_proxies'][proxy_index]
            full_url = proxy_url + quote(url, safe=':/?#[]@!$&\'()*+,;=')
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://example.com',
                'Referer': 'https://example.com/'
            }
            
            response = self.session.get(full_url, headers=headers, timeout=25)
            
            if response.status_code == 200:
                # Handle different response formats
                try:
                    data = response.json()
                    content = data.get('contents', data.get('data', response.text))
                except:
                    content = response.text
                
                return {
                    'success': True,
                    'status_code': 200,
                    'content': content,
                    'content_length': len(content),
                    'method': f'cors_bypass_{proxy_index}',
                    'proxy_used': proxy_url
                }
            
            return {'success': False, 'error': f'Status {response.status_code}'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _translation_proxy(self, url: str, service_index: int) -> Dict[str, Any]:
        """Translation service proxy"""
        try:
            if service_index >= len(self.bypass_methods['translation_proxies']):
                return {'success': False, 'error': 'No more translation proxies'}
            
            service_url = self.bypass_methods['translation_proxies'][service_index]
            full_url = service_url + quote(url, safe=':/?#[]@!$&\'()*+,;=')
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8'
            }
            
            response = self.session.get(full_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Extract translated content
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Try to find translated content area
                content_areas = soup.find_all(['div', 'span'], {'class': lambda x: x and any(
                    term in str(x).lower() for term in ['result', 'translation', 'content', 'text']
                )})
                
                if content_areas:
                    content = ' '.join([area.get_text() for area in content_areas])
                else:
                    content = response.text
                
                return {
                    'success': True,
                    'status_code': 200,
                    'content': content,
                    'content_length': len(content),
                    'method': f'translation_proxy_{service_index}'
                }
            
            return {'success': False, 'error': f'Status {response.status_code}'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _cache_request(self, url: str, service_index: int) -> Dict[str, Any]:
        """Cache service request"""
        try:
            if service_index >= len(self.bypass_methods['cache_services']):
                return {'success': False, 'error': 'No more cache services'}
            
            cache_service = self.bypass_methods['cache_services'][service_index]
            
            if 'archive.org' in cache_service:
                cache_url = f"{cache_service}{url}"
            else:
                cache_url = cache_service + quote(url, safe=':/?#[]@!$&\'()*+,;=')
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; archive.org_bot +http://www.archive.org/details/crawler)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
            
            response = self.session.get(cache_url, headers=headers, timeout=30)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': f'cache_{service_index}',
                'cache_url': cache_url
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _search_proxy(self, url: str, engine_index: int) -> Dict[str, Any]:
        """Search engine proxy"""
        try:
            if engine_index >= len(self.bypass_methods['search_proxies']):
                return {'success': False, 'error': 'No more search engines'}
            
            search_service = self.bypass_methods['search_proxies'][engine_index]
            search_url = search_service + quote(url, safe=':/?#[]@!$&\'()*+,;=')
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
            
            response = self.session.get(search_url, headers=headers, timeout=25)
            
            if response.status_code == 200:
                # Extract relevant content from search results
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for result snippets
                result_elements = soup.find_all(['div', 'span'], {'class': lambda x: x and any(
                    term in str(x).lower() for term in ['result', 'snippet', 'description']
                )})
                
                content = ' '.join([elem.get_text() for elem in result_elements[:5]])  # Top 5 results
                
                return {
                    'success': len(content) > 100,
                    'status_code': 200,
                    'content': content,
                    'content_length': len(content),
                    'method': f'search_proxy_{engine_index}'
                }
            
            return {'success': False, 'error': f'Status {response.status_code}'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _validate_content(self, content: str, url: str) -> bool:
        """Enhanced content validation"""
        if not content or len(content) < 200:
            return False
        
        # Check for error indicators
        error_indicators = [
            'error', 'not found', 'forbidden', 'blocked', 'access denied',
            'site not found', 'connection failed', 'timeout', '403', '404', '500'
        ]
        
        content_lower = content.lower()
        if any(indicator in content_lower for indicator in error_indicators):
            return False
        
        # Check for Persian content (good indicator for Iranian sites)
        persian_chars = sum(1 for char in content if '\u0600' <= char <= '\u06FF')
        if persian_chars > 50:  # Has Persian content
            return True
        
        # Check for legal/government keywords
        legal_keywords = [
            'قانون', 'مقررات', 'دولت', 'وزارت', 'سازمان', 'اداره',
            'قضایی', 'دادگاه', 'حکم', 'رأی', 'مجلس', 'شورا'
        ]
        
        if any(keyword in content for keyword in legal_keywords):
            return True
        
        # For non-Persian sites, check minimum content length
        return len(content) > 1000
    
    def _analyze_content(self, content: str, url: str) -> Dict[str, Any]:
        """Enhanced content analysis"""
        soup = BeautifulSoup(content, 'html.parser')
        
        # Remove unwanted elements
        for element in soup(['script', 'style', 'nav', 'footer', 'aside', 'header', 'meta']):
            element.decompose()
        
        # Extract main content
        main_content = soup.get_text()
        
        # Clean and process text
        lines = [line.strip() for line in main_content.split('\n') if line.strip()]
        clean_content = ' '.join(lines)
        
        # Extract title
        title_tag = soup.find('title')
        title = title_tag.get_text().strip() if title_tag else 'بدون عنوان'
        
        # Extract headings
        headings = []
        for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            for heading in soup.find_all(tag):
                text = heading.get_text().strip()
                if text:
                    headings.append({'tag': tag, 'text': text})
        
        # Extract links
        links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            text = link.get_text().strip()
            if text and href:
                if href.startswith('/'):
                    href = urljoin(url, href)
                links.append({'url': href, 'text': text})
        
        # Legal content analysis
        legal_analysis = self._analyze_legal_content(clean_content)
        
        return {
            'title': title,
            'main_content': clean_content[:5000],  # First 5000 chars
            'word_count': len(clean_content.split()),
            'headings': headings[:10],  # Top 10 headings
            'links': links[:20],  # Top 20 links
            'legal_analysis': legal_analysis,
            'legal_relevance_score': self._calculate_legal_relevance(clean_content),
            'extraction_time': datetime.now().isoformat()
        }
    
    def _analyze_legal_content(self, content: str) -> Dict[str, Any]:
        """Analyze legal content and extract key information"""
        legal_categories = {
            'قضایی': ['دادگاه', 'قاضی', 'حکم', 'رأی', 'دادرسی', 'محاکمه', 'دادستان'],
            'اداری': ['وزارت', 'سازمان', 'اداره', 'مدیریت', 'خدمات', 'مقررات'],
            'قانونی': ['قانون', 'ماده', 'بند', 'تبصره', 'مجلس', 'شورا'],
            'مالی': ['مالیات', 'بودجه', 'درآمد', 'هزینه', 'پرداخت', 'حقوق'],
            'املاک': ['ملک', 'زمین', 'ساختمان', 'سند', 'ثبت', 'انتقال'],
            'خانواده': ['ازدواج', 'طلاق', 'نفقه', 'حضانت', 'ارث', 'وصیت']
        }
        
        analysis = {}
        
        for category, keywords in legal_categories.items():
            matches = []
            for keyword in keywords:
                count = content.count(keyword)
                if count > 0:
                    matches.append({'keyword': keyword, 'count': count})
            
            if matches:
                analysis[category] = {
                    'total_matches': sum(m['count'] for m in matches),
                    'keywords': matches
                }
        
        return analysis
    
    def _calculate_legal_relevance(self, content: str) -> int:
        """Calculate legal relevance score (0-100)"""
        score = 0
        
        # Persian content bonus
        persian_chars = sum(1 for char in content if '\u0600' <= char <= '\u06FF')
        if persian_chars > 100:
            score += 20
        
        # Legal keywords bonus
        legal_keywords = [
            'قانون', 'مقررات', 'دولت', 'وزارت', 'سازمان', 'قضایی', 
            'دادگاه', 'حکم', 'رأی', 'مجلس', 'شورا', 'ماده', 'بند'
        ]
        
        keyword_count = sum(content.count(keyword) for keyword in legal_keywords)
        score += min(keyword_count * 2, 50)  # Max 50 points for keywords
        
        # Content length bonus
        if len(content) > 1000:
            score += 10
        if len(content) > 5000:
            score += 10
        if len(content) > 10000:
            score += 10
        
        return min(score, 100)

# Test function for enhanced system
async def test_enhanced_system():
    """Test the enhanced system on problematic sites"""
    
    print("🚀 Testing Enhanced Ultimate Proxy System")
    print("=" * 60)
    
    proxy_system = EnhancedUltimateProxy()
    
    # Test sites including the problematic ones
    test_sites = [
        {
            'name': 'قوه قضائیه ایران (مشکل‌ساز)',
            'url': 'https://www.judiciary.ir',
            'priority': 'critical'
        },
        {
            'name': 'دولت الکترونیک (مشکل‌ساز)',
            'url': 'https://www.dolat.ir',
            'priority': 'critical'
        },
        {
            'name': 'مرکز پژوهش‌های مجلس (کنترل)',
            'url': 'https://rc.majlis.ir',
            'priority': 'high'
        },
        {
            'name': 'ایران کد (کنترل)',
            'url': 'https://irancode.ir',
            'priority': 'medium'
        },
        {
            'name': 'دیوان عدالت اداری',
            'url': 'https://www.divan.ir',
            'priority': 'high'
        }
    ]
    
    results = []
    successful_extractions = 0
    
    for i, site in enumerate(test_sites):
        print(f"\n🎯 Testing {i+1}/{len(test_sites)}: {site['name']}")
        print(f"🌐 URL: {site['url']}")
        
        start_time = time.time()
        
        try:
            result = proxy_system.ultimate_bypass_request(site['url'])
            
            if result:
                result.update({
                    'site_name': site['name'],
                    'priority': site['priority'],
                    'response_time': (time.time() - start_time) * 1000,
                    'success': True
                })
                successful_extractions += 1
                print(f"✅ SUCCESS: {site['name']}")
            else:
                result = {
                    'site_name': site['name'],
                    'url': site['url'],
                    'priority': site['priority'],
                    'success': False,
                    'response_time': (time.time() - start_time) * 1000,
                    'error': 'All enhanced bypass attempts failed'
                }
                print(f"❌ FAILED: {site['name']}")
            
            results.append(result)
            
        except Exception as e:
            print(f"💥 EXCEPTION for {site['name']}: {str(e)}")
            results.append({
                'site_name': site['name'],
                'url': site['url'],
                'priority': site['priority'],
                'success': False,
                'response_time': (time.time() - start_time) * 1000,
                'error': str(e)
            })
    
    # Calculate success rate
    success_rate = (successful_extractions / len(test_sites)) * 100
    
    # Generate report
    report = {
        'test_type': 'enhanced_ultimate_proxy',
        'timestamp': datetime.now().isoformat(),
        'total_sites': len(test_sites),
        'successful_extractions': successful_extractions,
        'success_rate': success_rate,
        'target_success_rate': 90,
        'goal_achieved': success_rate >= 90,
        'results': results,
        'system_stats': proxy_system.stats
    }
    
    # Save report
    report_filename = f"enhanced_proxy_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 ENHANCED SYSTEM TEST RESULTS")
    print(f"=" * 50)
    print(f"✅ Success Rate: {success_rate:.1f}% (Target: 90%+)")
    print(f"📈 Successful Sites: {successful_extractions}/{len(test_sites)}")
    print(f"🎯 Goal Achieved: {'YES' if success_rate >= 90 else 'NO'}")
    print(f"📄 Report saved: {report_filename}")
    
    return report

if __name__ == "__main__":
    asyncio.run(test_enhanced_system())