#!/usr/bin/env python3
"""
Ultimate Proxy System for Iranian Legal Archive
Advanced techniques for bypassing all restrictions and achieving 90%+ success rate
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
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import dns.resolver
from concurrent.futures import ThreadPoolExecutor
import threading

class UltimateProxySystem:
    def __init__(self):
        # Enhanced Iranian DNS servers with more options + Alternative DNS
        self.iranian_dns = [
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
            '4.2.2.4',         # Level3
            '208.67.222.222',  # OpenDNS
            '208.67.220.220',  # OpenDNS Secondary
            # Additional powerful DNS servers
            '9.9.9.9',         # Quad9 Primary
            '149.112.112.112', # Quad9 Secondary
            '76.76.19.19',     # Alternate DNS Primary
            '76.223.100.101',  # Alternate DNS Secondary
            '94.140.14.14',    # AdGuard DNS
            '94.140.15.15'     # AdGuard DNS Secondary
        ]
        
        # Comprehensive proxy pools
        self.proxy_pools = {
            'iranian_free': [
                'http://proxy.iran.ir:8080',
                'http://proxy.tehran.ir:3128',
                'http://proxy.isf.ir:8080',
                'http://proxy.tabriz.ir:8080',
                'http://proxy.mashhad.ir:8080'
            ],
            'international_free': [
                'http://proxy-server.com:8080',
                'http://free-proxy.cz:8080',
                'http://proxy.example.com:3128',
                'http://proxylist.hidemyass.com:8080'
            ],
            'cors_bypass': [
                'https://cors-anywhere.herokuapp.com/',
                'https://api.allorigins.win/get?url=',
                'https://corsproxy.io/?',
                'https://proxy.cors.sh/',
                'https://yacdn.org/proxy/',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://thingproxy.freeboard.io/fetch/'
            ],
            'mirror_services': [
                'https://web.archive.org/web/',
                'https://archive.today/newest/',
                'https://webcache.googleusercontent.com/search?q=cache:',
                'https://cc.bingj.com/cache.aspx?q=cache:',
                'https://www.bing.com/search?q=cache:'
            ],
            'advanced_bypass': [
                'https://translate.google.com/translate?sl=fa&tl=en&u=',
                'https://www.google.com/search?q=site:',
                'https://duckduckgo.com/?q=site:'
            ]
        }
        
        # Advanced header pools for different scenarios
        self.header_pools = {
            'standard_browser': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none'
            },
            'iranian_mobile': {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=1.0',
                'Accept-Encoding': 'gzip, deflate'
            },
            'search_bot': {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': '*/*',
                'Accept-Language': 'fa,en'
            },
            'social_bot': {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                'Accept': '*/*'
            },
            'news_aggregator': {
                'User-Agent': 'Mozilla/5.0 (compatible; news bot)',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'fa-IR'
            },
            'curl_minimal': {
                'User-Agent': 'curl/7.68.0',
                'Accept': '*/*'
            },
            'wget_like': {
                'User-Agent': 'Wget/1.20.3 (linux-gnu)',
                'Accept': '*/*'
            },
            'arvan_bypass': {
                'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'X-Forwarded-For': '66.249.66.1',  # Google IP
                'X-Real-IP': '66.249.66.1'
            },
            'cloudflare_bypass': {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'X-Forwarded-For': '66.249.79.1',  # Googlebot IP
                'X-Real-IP': '66.249.79.1',
                'CF-Connecting-IP': '66.249.79.1'
            }
        }
        
        # Iranian website mirrors and alternatives
        self.site_mirrors = {
            'judiciary.ir': [
                'https://www.judiciary.ir',
                'https://judiciary.ir',
                'http://www.judiciary.ir',
                'http://judiciary.ir',
                # Alternative judiciary sites
                'https://eadl.ir',  # Electronic Archive of Legal Documents
                'https://www.eadl.ir',
                'https://divan.ir', # Administrative Justice Court
                'https://www.divan.ir'
            ],
            'dolat.ir': [
                'https://www.dolat.ir',
                'https://dolat.ir',
                'http://www.dolat.ir',
                'http://dolat.ir',
                'https://portal.dolat.ir',
                # Alternative government sites
                'https://www.president.ir',
                'https://president.ir',
                'https://www.moi.ir',  # Ministry of Interior
                'https://moi.ir'
            ],
            'majlis.ir': [
                'https://rc.majlis.ir',
                'https://www.majlis.ir',
                'http://rc.majlis.ir',
                'https://majlis.ir'
            ]
        }
        
        self.stats = {
            'total_attempts': 0,
            'successful_connections': 0,
            'failed_connections': 0,
            'dns_resolutions': 0,
            'proxy_successes': 0,
            'mirror_successes': 0,
            'cors_bypasses': 0,
            'tor_attempts': 0,
            'vpn_detections': 0
        }
        
        self.active_proxies = []
        self.failed_proxies = []
        self.working_dns = []
        self.session = None
        self.setup_session()
    
    def setup_session(self):
        """Setup enhanced session with all configurations"""
        self.session = requests.Session()
        
        # Disable SSL verification for problematic sites
        self.session.verify = False
        
        # Disable warnings
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Enhanced timeout configuration
        self.session.timeout = (10, 30)  # (connect, read)
        
        # Retry configuration
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry
        
        retry_strategy = Retry(
            total=5,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
    
    def resolve_dns_advanced(self, hostname: str) -> List[str]:
        """Advanced DNS resolution with multiple servers + fallback techniques"""
        ips = []
        self.stats['dns_resolutions'] += 1
        
        # Try each DNS server with extended list
        for dns_server in self.iranian_dns:  # Use all DNS servers
            try:
                resolver = dns.resolver.Resolver()
                resolver.nameservers = [dns_server]
                resolver.timeout = 5  # Increased timeout
                resolver.lifetime = 8
                
                result = resolver.resolve(hostname, 'A')
                for rdata in result:
                    ip = str(rdata)
                    if ip not in ips:
                        ips.append(ip)
                        print(f"🌐 DNS {dns_server}: {hostname} -> {ip}")
                
                if dns_server not in self.working_dns:
                    self.working_dns.append(dns_server)
                    
            except Exception as e:
                print(f"❌ DNS {dns_server} failed for {hostname}: {str(e)[:50]}")
                continue
        
        # Fallback: Try alternative hostnames if main fails
        if not ips and hostname:
            alternative_hostnames = []
            
            # Try www variant
            if not hostname.startswith('www.'):
                alternative_hostnames.append(f"www.{hostname}")
            else:
                alternative_hostnames.append(hostname.replace('www.', ''))
            
            # Try alternative TLDs for Iranian sites
            if hostname.endswith('.ir'):
                base_name = hostname.replace('.ir', '')
                alternative_hostnames.extend([
                    f"{base_name}.org",
                    f"{base_name}.com",
                    f"{base_name}.net"
                ])
            
            # Try resolving alternatives
            for alt_hostname in alternative_hostnames:
                for dns_server in self.iranian_dns[:5]:  # Try top 5 DNS
                    try:
                        resolver = dns.resolver.Resolver()
                        resolver.nameservers = [dns_server]
                        resolver.timeout = 3
                        resolver.lifetime = 5
                        
                        result = resolver.resolve(alt_hostname, 'A')
                        for rdata in result:
                            ip = str(rdata)
                            if ip not in ips:
                                ips.append(ip)
                                print(f"🔄 Alternative DNS {dns_server}: {alt_hostname} -> {ip}")
                        break  # Stop after first success
                    except:
                        continue
        
        return ips
    
    def get_all_site_variants(self, url: str) -> List[str]:
        """Get all possible variants of a site URL"""
        parsed = urlparse(url)
        hostname = parsed.hostname
        path = parsed.path
        
        variants = []
        
        # Original URL
        variants.append(url)
        
        # Mirror sites if available
        for domain_key, mirrors in self.site_mirrors.items():
            if domain_key in hostname:
                variants.extend(mirrors)
        
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
        
        # IP-based variants
        ips = self.resolve_dns_advanced(hostname)
        for ip in ips:
            ip_url = url.replace(hostname, ip)
            variants.append(ip_url)
        
        # Remove duplicates while preserving order
        unique_variants = []
        for variant in variants:
            if variant not in unique_variants:
                unique_variants.append(variant)
        
        print(f"🔍 Generated {len(unique_variants)} variants for {url}")
        return unique_variants
    
    def ultimate_request(self, url: str, max_attempts: int = 15) -> Optional[Dict[str, Any]]:
        """Ultimate request with all bypass techniques"""
        
        print(f"\n🎯 ULTIMATE REQUEST: {url}")
        self.stats['total_attempts'] += 1
        
        # Get all possible URLs to try
        url_variants = self.get_all_site_variants(url)
        
        # All possible strategies + Advanced bypass techniques
        strategies = [
            ('Direct Connection', self._direct_request),
            ('Mobile Headers', self._mobile_request),
            ('Search Bot', self._bot_request),
            ('Social Bot', self._social_bot_request),
            ('News Aggregator', self._news_request),
            ('Curl Minimal', self._curl_request),
            ('Wget Style', self._wget_request),
            ('ArvanCloud Bypass', self._arvan_bypass_request),
            ('Cloudflare Bypass', self._cloudflare_bypass_request),
            ('Google Translate Proxy', self._google_translate_request),
            ('CORS Bypass #1', lambda u: self._cors_bypass_request(u, 0)),
            ('CORS Bypass #2', lambda u: self._cors_bypass_request(u, 1)),
            ('CORS Bypass #3', lambda u: self._cors_bypass_request(u, 2)),
            ('CORS Bypass #4', lambda u: self._cors_bypass_request(u, 5)),
            ('CORS Bypass #5', lambda u: self._cors_bypass_request(u, 6)),
            ('Archive.org Mirror', self._archive_request),
            ('Google Cache', self._google_cache_request),
            ('Bing Cache', self._bing_cache_request),
            ('Proxy Chain #1', lambda u: self._proxy_request(u, 0)),
            ('Proxy Chain #2', lambda u: self._proxy_request(u, 1)),
            ('Proxy Chain #3', lambda u: self._proxy_request(u, 2))
        ]
        
        # Try each URL variant with each strategy
        for attempt in range(max_attempts):
            print(f"🔄 MEGA ATTEMPT {attempt + 1}/{max_attempts}")
            
            # Randomize order for better success
            random.shuffle(strategies)
            random.shuffle(url_variants)
            
            for url_variant in url_variants[:8]:  # Try top 8 variants (increased)
                print(f"   🌐 Trying variant: {url_variant}")
                
                for strategy_name, strategy_func in strategies[:12]:  # Try top 12 strategies (increased)
                    try:
                        print(f"      📡 Strategy: {strategy_name}")
                        
                        result = strategy_func(url_variant)
                        
                        if result and result.get('success'):
                            self.stats['successful_connections'] += 1
                            
                            # Track success type
                            if 'proxy' in strategy_name.lower():
                                self.stats['proxy_successes'] += 1
                            elif 'cors' in strategy_name.lower():
                                self.stats['cors_bypasses'] += 1
                            elif 'mirror' in strategy_name.lower():
                                self.stats['mirror_successes'] += 1
                            
                            print(f"      ✅ SUCCESS! Method: {strategy_name}")
                            print(f"      📊 Status: {result.get('status_code')}, Size: {result.get('content_length', 0)}")
                            
                            return {
                                **result,
                                'final_url': url_variant,
                                'successful_strategy': strategy_name,
                                'attempt_number': attempt + 1
                            }
                        else:
                            error_msg = result.get('error', 'Unknown error') if result else 'No response'
                            print(f"      ❌ Failed: {error_msg[:50]}")
                            
                    except Exception as e:
                        print(f"      💥 Exception: {str(e)[:50]}")
                    
                    # Small delay between strategies
                    time.sleep(0.5)
                
                # Delay between URL variants
                time.sleep(1)
            
            # Progressive delay between major attempts
            time.sleep(2 + attempt)
        
        self.stats['failed_connections'] += 1
        print(f"❌ ULTIMATE FAILURE: All {max_attempts} attempts failed for {url}")
        return None
    
    def _direct_request(self, url: str) -> Dict[str, Any]:
        """Enhanced direct request"""
        try:
            headers = self.header_pools['standard_browser'].copy()
            headers['Referer'] = 'https://www.google.com/'
            
            response = self.session.get(url, headers=headers, timeout=15)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'direct_enhanced',
                'headers_sent': headers
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'direct_enhanced'}
    
    def _mobile_request(self, url: str) -> Dict[str, Any]:
        """Mobile request with Iranian characteristics"""
        try:
            headers = self.header_pools['iranian_mobile'].copy()
            headers['X-Forwarded-For'] = '185.143.235.201'  # Iranian IP
            headers['X-Real-IP'] = '185.143.235.201'
            
            response = self.session.get(url, headers=headers, timeout=15)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'mobile_iranian'
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'mobile_iranian'}
    
    def _bot_request(self, url: str) -> Dict[str, Any]:
        """Search engine bot request"""
        try:
            headers = self.header_pools['search_bot'].copy()
            response = self.session.get(url, headers=headers, timeout=15)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'search_bot'
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'search_bot'}
    
    def _social_bot_request(self, url: str) -> Dict[str, Any]:
        """Social media bot request"""
        try:
            headers = self.header_pools['social_bot'].copy()
            response = self.session.get(url, headers=headers, timeout=15)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'social_bot'
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'social_bot'}
    
    def _news_request(self, url: str) -> Dict[str, Any]:
        """News aggregator request"""
        try:
            headers = self.header_pools['news_aggregator'].copy()
            response = self.session.get(url, headers=headers, timeout=15)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'news_aggregator'
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'news_aggregator'}
    
    def _curl_request(self, url: str) -> Dict[str, Any]:
        """Curl-like minimal request"""
        try:
            headers = self.header_pools['curl_minimal'].copy()
            response = self.session.get(url, headers=headers, timeout=15)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'curl_minimal'
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'curl_minimal'}
    
    def _wget_request(self, url: str) -> Dict[str, Any]:
        """Wget-style request"""
        try:
            headers = self.header_pools['wget_like'].copy()
            response = self.session.get(url, headers=headers, timeout=15)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'wget_style'
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'wget_style'}
    
    def _cors_bypass_request(self, url: str, proxy_index: int) -> Dict[str, Any]:
        """CORS bypass with multiple services"""
        try:
            cors_proxies = self.proxy_pools['cors_bypass']
            if proxy_index >= len(cors_proxies):
                return {'success': False, 'error': 'No more CORS proxies', 'method': 'cors_bypass'}
            
            proxy_url = cors_proxies[proxy_index] + url
            response = self.session.get(proxy_url, timeout=20)
            
            if response.status_code == 200:
                # Handle different response formats
                try:
                    # Try JSON response first
                    data = response.json()
                    content = data.get('contents', data.get('data', response.text))
                except:
                    # Use raw text
                    content = response.text
                
                return {
                    'success': True,
                    'status_code': 200,
                    'content': content,
                    'content_length': len(content),
                    'method': f'cors_bypass_{proxy_index}',
                    'proxy_used': cors_proxies[proxy_index]
                }
            
            return {'success': False, 'error': f'Status {response.status_code}', 'method': 'cors_bypass'}
            
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'cors_bypass'}
    
    def _archive_request(self, url: str) -> Dict[str, Any]:
        """Archive.org mirror request"""
        try:
            archive_url = f"https://web.archive.org/web/{url}"
            headers = self.header_pools['standard_browser'].copy()
            
            response = self.session.get(archive_url, headers=headers, timeout=20)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'archive_mirror',
                'archive_url': archive_url
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'archive_mirror'}
    
    def _google_cache_request(self, url: str) -> Dict[str, Any]:
        """Google cache request"""
        try:
            cache_url = f"https://webcache.googleusercontent.com/search?q=cache:{url}"
            headers = self.header_pools['search_bot'].copy()
            
            response = self.session.get(cache_url, headers=headers, timeout=20)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'google_cache',
                'cache_url': cache_url
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'google_cache'}
    
    def _proxy_request(self, url: str, proxy_index: int) -> Dict[str, Any]:
        """Proxy request with rotation"""
        try:
            all_proxies = self.proxy_pools['iranian_free'] + self.proxy_pools['international_free']
            
            if proxy_index >= len(all_proxies):
                return {'success': False, 'error': 'No more proxies', 'method': 'proxy_chain'}
            
            proxy_url = all_proxies[proxy_index]
            proxies = {'http': proxy_url, 'https': proxy_url}
            
            headers = self.header_pools['standard_browser'].copy()
            
            response = self.session.get(url, headers=headers, proxies=proxies, timeout=20)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': f'proxy_chain_{proxy_index}',
                'proxy_used': proxy_url
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'proxy_chain'}
    
    def _arvan_bypass_request(self, url: str) -> Dict[str, Any]:
        """ArvanCloud bypass using search bot headers"""
        try:
            headers = self.header_pools['arvan_bypass'].copy()
            
            # Add random delay to avoid rate limiting
            time.sleep(random.uniform(1, 3))
            
            response = self.session.get(url, headers=headers, timeout=25)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'arvan_bypass'
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'arvan_bypass'}
    
    def _cloudflare_bypass_request(self, url: str) -> Dict[str, Any]:
        """Cloudflare bypass using Googlebot headers"""
        try:
            headers = self.header_pools['cloudflare_bypass'].copy()
            
            # Add random delay to avoid detection
            time.sleep(random.uniform(0.5, 2))
            
            response = self.session.get(url, headers=headers, timeout=25)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'cloudflare_bypass'
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'cloudflare_bypass'}
    
    def _google_translate_request(self, url: str) -> Dict[str, Any]:
        """Google Translate proxy bypass"""
        try:
            translate_url = f"https://translate.google.com/translate?sl=fa&tl=en&u={url}"
            headers = self.header_pools['standard_browser'].copy()
            
            response = self.session.get(translate_url, headers=headers, timeout=25)
            
            if response.status_code == 200:
                # Extract content from Google Translate page
                soup = BeautifulSoup(response.text, 'html.parser')
                translated_content = soup.find('div', {'class': 'result-container'})
                
                if translated_content:
                    content = translated_content.get_text()
                else:
                    content = response.text
                
                return {
                    'success': True,
                    'status_code': 200,
                    'content': content,
                    'content_length': len(content),
                    'method': 'google_translate'
                }
            
            return {'success': False, 'error': f'Status {response.status_code}', 'method': 'google_translate'}
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'google_translate'}
    
    def _bing_cache_request(self, url: str) -> Dict[str, Any]:
        """Bing cache request"""
        try:
            cache_url = f"https://cc.bingj.com/cache.aspx?q=cache:{url}"
            headers = self.header_pools['search_bot'].copy()
            
            response = self.session.get(cache_url, headers=headers, timeout=25)
            
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'content': response.text,
                'content_length': len(response.text),
                'method': 'bing_cache'
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'method': 'bing_cache'}
    
    def extract_comprehensive_content(self, html: str, url: str) -> Dict[str, Any]:
        """Comprehensive content extraction and analysis"""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove unwanted elements
        for element in soup(['script', 'style', 'nav', 'footer', 'aside', 'header']):
            element.decompose()
        
        extracted = {
            'url': url,
            'extraction_time': datetime.now().isoformat(),
            'success': True
        }
        
        # Extract title with multiple methods
        title_candidates = []
        
        # Method 1: <title> tag
        title_tag = soup.find('title')
        if title_tag:
            title_candidates.append(title_tag.get_text().strip())
        
        # Method 2: h1 tags
        h1_tags = soup.find_all('h1', limit=3)
        for h1 in h1_tags:
            text = h1.get_text().strip()
            if text and len(text) > 5:
                title_candidates.append(text)
        
        # Method 3: meta title
        meta_title = soup.find('meta', attrs={'property': 'og:title'})
        if meta_title:
            title_candidates.append(meta_title.get('content', '').strip())
        
        extracted['title'] = title_candidates[0] if title_candidates else 'بدون عنوان'
        extracted['title_candidates'] = title_candidates
        
        # Extract meta information
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            extracted['meta_description'] = meta_desc.get('content', '').strip()
        
        og_desc = soup.find('meta', attrs={'property': 'og:description'})
        if og_desc:
            extracted['og_description'] = og_desc.get('content', '').strip()
        
        # Extract main content with multiple selectors
        content_selectors = [
            'main', 'article', '.content', '.main-content', '#content',
            '.post-content', '.entry-content', '.article-content',
            '.news-content', '.page-content', 'body'
        ]
        
        main_content = ''
        for selector in content_selectors:
            elements = soup.select(selector)
            if elements:
                main_content = ' '.join([elem.get_text(separator=' ', strip=True) for elem in elements])
                if len(main_content) > 100:  # Minimum content length
                    break
        
        extracted['content'] = main_content
        extracted['word_count'] = len(main_content.split()) if main_content else 0
        
        # Extract all headings
        headings = []
        for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            for heading in soup.find_all(tag, limit=10):
                text = heading.get_text().strip()
                if text and len(text) > 2:
                    headings.append({
                        'tag': tag,
                        'text': text[:300],
                        'level': int(tag[1])
                    })
        
        extracted['headings'] = headings
        
        # Extract all links with categorization
        links = []
        for link in soup.find_all('a', href=True, limit=50):
            href = link.get('href', '')
            text = link.get_text().strip()
            
            if href and text and len(text) > 1:
                # Convert relative URLs
                if href.startswith('/'):
                    href = urljoin(url, href)
                elif not href.startswith(('http://', 'https://')):
                    href = urljoin(url, href)
                
                # Categorize link
                link_category = 'general'
                if any(term in text.lower() for term in ['قانون', 'ماده', 'آیین']):
                    link_category = 'legal'
                elif any(term in text.lower() for term in ['خبر', 'اطلاعیه', 'اعلام']):
                    link_category = 'news'
                elif any(term in text.lower() for term in ['تماس', 'درباره', 'معرفی']):
                    link_category = 'info'
                
                links.append({
                    'url': href,
                    'text': text[:150],
                    'category': link_category
                })
        
        extracted['links'] = links
        extracted['links_by_category'] = {}
        for link in links:
            category = link['category']
            if category not in extracted['links_by_category']:
                extracted['links_by_category'][category] = []
            extracted['links_by_category'][category].append(link)
        
        # Advanced legal content analysis
        legal_analysis = self._analyze_legal_content_advanced(main_content, headings, links)
        extracted['legal_analysis'] = legal_analysis
        
        return extracted
    
    def _analyze_legal_content_advanced(self, content: str, headings: List[Dict], links: List[Dict]) -> Dict[str, Any]:
        """Advanced legal content analysis"""
        
        # Comprehensive legal keywords
        legal_categories = {
            'قضایی': {
                'keywords': ['قاضی', 'دادگاه', 'حکم', 'رأی', 'محاکمه', 'قضاوت', 'دادرسی', 'دادستان', 'وکیل', 'دادخواست'],
                'weight': 10
            },
            'قانونی': {
                'keywords': ['قانون', 'ماده', 'تبصره', 'آیین‌نامه', 'مقررات', 'مصوبه', 'فصل', 'بخش', 'قانون‌نامه'],
                'weight': 15
            },
            'اداری': {
                'keywords': ['وزارت', 'سازمان', 'اداره', 'مدیریت', 'بخشنامه', 'دستورالعمل', 'دولت', 'استانداری'],
                'weight': 8
            },
            'کیفری': {
                'keywords': ['جرم', 'مجازات', 'زندان', 'جریمه', 'تعزیرات', 'قصاص', 'دیه', 'محکومیت'],
                'weight': 12
            },
            'مدنی': {
                'keywords': ['ملک', 'قرارداد', 'خرید', 'فروش', 'اجاره', 'وراثت', 'ازدواج', 'طلاق', 'وکالت'],
                'weight': 10
            },
            'اقتصادی': {
                'keywords': ['بانک', 'اقتصاد', 'مالیات', 'گمرک', 'تجارت', 'صنعت', 'بازرگانی', 'شرکت'],
                'weight': 8
            }
        }
        
        analysis = {
            'categories': {},
            'total_legal_score': 0,
            'dominant_category': 'عمومی',
            'confidence': 0,
            'legal_entities': [],
            'importance_indicators': []
        }
        
        content_lower = content.lower() if content else ''
        
        # Analyze each category
        category_scores = {}
        for category, data in legal_categories.items():
            matches = []
            total_score = 0
            
            for keyword in data['keywords']:
                count = content_lower.count(keyword)
                if count > 0:
                    score = count * data['weight']
                    matches.append({
                        'keyword': keyword,
                        'count': count,
                        'score': score
                    })
                    total_score += score
            
            if matches:
                analysis['categories'][category] = {
                    'matches': matches,
                    'total_score': total_score,
                    'keyword_count': len(matches)
                }
                category_scores[category] = total_score
        
        # Determine dominant category
        if category_scores:
            analysis['dominant_category'] = max(category_scores, key=category_scores.get)
            analysis['total_legal_score'] = sum(category_scores.values())
        
        # Calculate confidence based on multiple factors
        factors = [
            len(analysis['categories']) * 20,  # Category diversity
            min(analysis['total_legal_score'], 100),  # Legal score
            min(len(content.split()) / 10, 50) if content else 0,  # Content length
            len([h for h in headings if any(kw in h['text'].lower() for cat in legal_categories.values() for kw in cat['keywords'])]) * 10  # Legal headings
        ]
        
        analysis['confidence'] = min(sum(factors) / 4, 100)
        
        # Extract legal entities (Persian patterns)
        import re
        
        # Persian names
        name_pattern = r'[\u0600-\u06FF\s]{2,40}(?:زاده|پور|نژاد|فر|یان|ی)'
        names = re.findall(name_pattern, content)
        analysis['legal_entities'].extend([{'type': 'person', 'value': name.strip()} for name in names[:10]])
        
        # Persian dates
        date_patterns = [
            r'\d{4}/\d{1,2}/\d{1,2}',  # 1402/08/15
            r'\d{1,2}/\d{1,2}/\d{4}',  # 15/08/1402
            r'\d{4}-\d{1,2}-\d{1,2}'   # 1402-08-15
        ]
        
        for pattern in date_patterns:
            dates = re.findall(pattern, content)
            analysis['legal_entities'].extend([{'type': 'date', 'value': date} for date in dates[:5]])
        
        # Legal case numbers
        case_pattern = r'(?:پرونده|کلاسه|شماره)\s*:?\s*\d+[/\-]\d+'
        cases = re.findall(case_pattern, content)
        analysis['legal_entities'].extend([{'type': 'case_number', 'value': case} for case in cases[:5]])
        
        # Importance indicators
        importance_terms = ['مهم', 'ضروری', 'فوری', 'اساسی', 'حیاتی', 'بحرانی', 'اولویت', 'ویژه']
        for term in importance_terms:
            if term in content_lower:
                analysis['importance_indicators'].append(term)
        
        return analysis

def test_ultimate_system():
    print("🚀 تست سیستم نهایی قدرتمند برای دسترسی به سایت‌های ایرانی")
    print("=" * 80)
    
    ultimate_system = UltimateProxySystem()
    
    # Target sites with high priority
    target_sites = [
        {
            'name': 'قوه قضائیه ایران',
            'url': 'https://www.judiciary.ir',
            'priority': 'critical',
            'expected_content': 'قضایی'
        },
        {
            'name': 'دولت الکترونیک',
            'url': 'https://www.dolat.ir',
            'priority': 'critical',
            'expected_content': 'اداری'
        },
        {
            'name': 'مجلس شورای اسلامی',
            'url': 'https://www.majlis.ir',
            'priority': 'high',
            'expected_content': 'قانونی'
        },
        {
            'name': 'مرکز پژوهش‌های مجلس',
            'url': 'https://rc.majlis.ir',
            'priority': 'high',
            'expected_content': 'قانونی'
        },
        {
            'name': 'ایران کد',
            'url': 'https://irancode.ir',
            'priority': 'medium',
            'expected_content': 'اداری'
        },
        {
            'name': 'سازمان ثبت اسناد',
            'url': 'https://www.sabteahval.ir',
            'priority': 'medium',
            'expected_content': 'اداری'
        },
        {
            'name': 'دیوان عدالت اداری',
            'url': 'https://www.divan.ir',
            'priority': 'high',
            'expected_content': 'قضایی'
        }
    ]
    
    results = []
    successful_extractions = 0
    
    for i, site in enumerate(target_sites):
        print(f"\n🎯 تست {i+1}/{len(target_sites)}: {site['name']} (اولویت: {site['priority']})")
        print("-" * 60)
        
        start_time = time.time()
        result = ultimate_system.ultimate_request(site['url'], max_attempts=10)
        end_time = time.time()
        
        if result and result.get('success'):
            successful_extractions += 1
            
            print(f"✅ اسکرپینگ موفق!")
            print(f"⏱️ زمان: {(end_time - start_time):.2f} ثانیه")
            print(f"📡 روش موفق: {result.get('successful_strategy', 'نامشخص')}")
            print(f"🌐 URL نهایی: {result.get('final_url', site['url'])}")
            
            # Extract comprehensive content
            extracted = ultimate_system.extract_comprehensive_content(result['content'], site['url'])
            
            print(f"📄 عنوان: {extracted.get('title', 'بدون عنوان')}")
            print(f"📝 تعداد کلمات: {extracted.get('word_count', 0):,}")
            print(f"📊 امتیاز حقوقی: {extracted['legal_analysis'].get('total_legal_score', 0)}")
            print(f"🎯 اطمینان: {extracted['legal_analysis'].get('confidence', 0):.1f}%")
            
            if extracted['legal_analysis'].get('dominant_category') != 'عمومی':
                print(f"📂 دسته غالب: {extracted['legal_analysis']['dominant_category']}")
            
            if extracted['legal_analysis'].get('legal_entities'):
                entities_count = len(extracted['legal_analysis']['legal_entities'])
                print(f"🏷️ موجودیت‌های حقوقی: {entities_count} مورد")
            
            result.update({
                'site_name': site['name'],
                'priority': site['priority'],
                'response_time': round((end_time - start_time) * 1000, 2),
                'extracted_data': extracted
            })
            
        else:
            print(f"❌ اسکرپینگ ناموفق")
            result = {
                'site_name': site['name'],
                'url': site['url'],
                'priority': site['priority'],
                'success': False,
                'response_time': round((end_time - start_time) * 1000, 2),
                'error': 'All ultimate strategies failed'
            }
        
        results.append(result)
        
        # Respectful delay between sites
        time.sleep(3)
    
    # Calculate final statistics
    success_rate = (successful_extractions / len(target_sites)) * 100
    
    print(f"\n📊 گزارش نهایی سیستم قدرتمند:")
    print("=" * 60)
    print(f"✅ موفق: {successful_extractions}/{len(target_sites)} سایت ({success_rate:.1f}%)")
    print(f"📊 آمار کلی سیستم:")
    print(f"   🔄 کل تلاش‌ها: {ultimate_system.stats['total_attempts']}")
    print(f"   ✅ اتصالات موفق: {ultimate_system.stats['successful_connections']}")
    print(f"   🌐 DNS موفق: {ultimate_system.stats['dns_resolutions']}")
    print(f"   🔄 پروکسی موفق: {ultimate_system.stats['proxy_successes']}")
    print(f"   🌉 CORS موفق: {ultimate_system.stats['cors_bypasses']}")
    print(f"   🪞 Mirror موفق: {ultimate_system.stats['mirror_successes']}")
    
    if successful_extractions > 0:
        total_words = sum(r.get('extracted_data', {}).get('word_count', 0) for r in results if r.get('success'))
        total_legal_score = sum(r.get('extracted_data', {}).get('legal_analysis', {}).get('total_legal_score', 0) for r in results if r.get('success'))
        
        print(f"📄 کل کلمات: {total_words:,}")
        print(f"⚖️ کل امتیاز حقوقی: {total_legal_score}")
        
        print(f"\n🏆 سایت‌های موفق:")
        for r in results:
            if r.get('success'):
                strategy = r.get('successful_strategy', 'نامشخص')
                words = r.get('extracted_data', {}).get('word_count', 0)
                print(f"   ✅ {r['site_name']}: {words:,} کلمه (روش: {strategy})")
    
    # Save comprehensive results
    output_file = f"ultimate_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'test_type': 'ultimate_proxy_system',
            'timestamp': datetime.now().isoformat(),
            'total_sites': len(target_sites),
            'successful_extractions': successful_extractions,
            'success_rate': success_rate,
            'system_stats': ultimate_system.stats,
            'working_dns_servers': ultimate_system.working_dns,
            'results': results
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 نتایج کامل ذخیره شد: {output_file}")
    print(f"🎯 نرخ موفقیت نهایی: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🏆 هدف 90%+ محقق شد!")
    elif success_rate >= 70:
        print("🎉 عملکرد عالی!")
    else:
        print("⚠️ نیاز به بهبود بیشتر")
    
    return results, success_rate

if __name__ == "__main__":
    results, success_rate = test_ultimate_system()
    print(f"\n🎉 تست سیستم قدرتمند کامل شد!")
    print(f"📈 نرخ موفقیت نهایی: {success_rate:.1f}%")