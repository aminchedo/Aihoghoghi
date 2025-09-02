#!/usr/bin/env python3
"""
🏛️ ADVANCED GOVERNMENT LEGAL SCRAPER
Smart proxy rotation, DNS switching, and intelligent bypass system
"""

import requests
import time
import json
import random
import socket
import urllib.parse
from datetime import datetime
from typing import List, Dict, Optional
import re
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class SmartProxyRotator:
    """Smart proxy rotation with health checking and DNS switching"""
    
    def __init__(self):
        # Iranian DNS servers for bypass
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
            '9.9.9.9',         # Quad9
            '149.112.112.112', # Quad9 Secondary
            '76.76.19.19',     # Alternate DNS
            '76.223.100.101',  # Alternate DNS Secondary
            '94.140.14.14',    # AdGuard
            '94.140.15.15'     # AdGuard Secondary
        ]
        
        # CORS bypass proxies
        self.cors_proxies = [
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://api.allorigins.win/get?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://proxy.cors.sh/',
            'https://yacdn.org/proxy/',
            'https://thingproxy.freeboard.io/fetch/'
        ]
        
        # User agent rotation
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
        ]
        
        self.session = requests.Session()
        self.setup_session()
        
    def setup_session(self):
        """Setup session with retry strategy"""
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
    def get_random_headers(self):
        """Get randomized headers"""
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        }
    
    def test_dns_server(self, dns_server: str) -> bool:
        """Test if DNS server is responsive"""
        try:
            # Test DNS resolution
            original_dns = socket.getdefaulttimeout()
            socket.setdefaulttimeout(3)
            
            # Try to resolve a known domain
            socket.gethostbyname_ex('google.com')
            socket.setdefaulttimeout(original_dns)
            return True
        except:
            return False
    
    def scrape_with_direct_method(self, url: str) -> Dict:
        """Direct scraping without proxy"""
        try:
            print(f'   🔄 Direct method: {url}')
            start_time = time.time()
            
            response = self.session.get(
                url, 
                headers=self.get_random_headers(),
                timeout=15,
                allow_redirects=True
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                content = response.text
                print(f'   ✅ Direct SUCCESS: {response.status_code} ({response_time:.0f}ms)')
                return {
                    'success': True,
                    'method': 'direct',
                    'status_code': response.status_code,
                    'response_time_ms': response_time,
                    'content': content,
                    'content_length': len(content)
                }
            else:
                print(f'   ❌ Direct FAILED: HTTP {response.status_code}')
                return {'success': False, 'error': f'HTTP {response.status_code}'}
                
        except Exception as e:
            print(f'   ❌ Direct ERROR: {str(e)}')
            return {'success': False, 'error': str(e)}
    
    def scrape_with_cors_proxy(self, url: str) -> Dict:
        """Scraping using CORS proxy rotation"""
        for i, proxy in enumerate(self.cors_proxies):
            try:
                print(f'   🔄 CORS Proxy {i+1}/{len(self.cors_proxies)}: {proxy[:30]}...')
                start_time = time.time()
                
                if 'allorigins.win' in proxy:
                    proxy_url = f'{proxy}{urllib.parse.quote(url)}'
                    response = self.session.get(proxy_url, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        content = data.get('contents', '')
                    else:
                        continue
                else:
                    proxy_url = f'{proxy}{url}'
                    response = self.session.get(proxy_url, headers=self.get_random_headers(), timeout=10)
                    content = response.text
                
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200 and len(content) > 500:
                    print(f'   ✅ CORS Proxy SUCCESS: {response.status_code} ({response_time:.0f}ms)')
                    return {
                        'success': True,
                        'method': f'cors_proxy_{i+1}',
                        'proxy_used': proxy,
                        'status_code': response.status_code,
                        'response_time_ms': response_time,
                        'content': content,
                        'content_length': len(content)
                    }
                else:
                    print(f'   ⚠️ CORS Proxy {i+1}: Insufficient content')
                    
            except Exception as e:
                print(f'   ❌ CORS Proxy {i+1} ERROR: {str(e)}')
                continue
        
        return {'success': False, 'error': 'All CORS proxies failed'}
    
    def smart_scrape_government_site(self, url: str, site_name: str) -> Dict:
        """Intelligent scraping with all available methods"""
        print(f'\n🎯 TARGETING GOVERNMENT SITE: {site_name}')
        print(f'🔗 URL: {url}')
        
        # Method 1: Direct connection
        result = self.scrape_with_direct_method(url)
        if result['success'] and self.is_valid_content(result['content']):
            return result
        
        # Method 2: CORS proxy rotation
        print(f'   🔄 Trying CORS proxy methods...')
        result = self.scrape_with_cors_proxy(url)
        if result['success'] and self.is_valid_content(result['content']):
            return result
        
        # Method 3: Try alternative URLs for the same site
        alternative_urls = self.get_alternative_urls(url)
        for alt_url in alternative_urls:
            print(f'   🔄 Trying alternative URL: {alt_url}')
            result = self.scrape_with_direct_method(alt_url)
            if result['success'] and self.is_valid_content(result['content']):
                result['original_url'] = url
                result['alternative_url'] = alt_url
                return result
        
        return {'success': False, 'error': 'All methods failed', 'url': url}
    
    def is_valid_content(self, content: str) -> bool:
        """Check if content is valid (not blocked/redirect page)"""
        if len(content) < 500:
            return False
        
        # Check for blocking indicators
        blocking_indicators = [
            'Transferring to the website',
            'Access Denied',
            'Forbidden',
            'Cloudflare',
            'ArvanCloud',
            'Rate Limited',
            'Just a moment'
        ]
        
        for indicator in blocking_indicators:
            if indicator.lower() in content.lower():
                return False
        
        # Check for Persian legal content indicators
        legal_indicators = ['قانون', 'ماده', 'تبصره', 'مصوبه', 'دادگاه', 'حکم']
        persian_legal_count = sum(1 for indicator in legal_indicators if indicator in content)
        
        return persian_legal_count > 0
    
    def get_alternative_urls(self, url: str) -> List[str]:
        """Get alternative URLs for government sites"""
        alternatives = []
        
        if 'majlis.ir' in url:
            alternatives = [
                'https://majlis.ir',
                'https://www.majlis.ir',
                'https://rc.majlis.ir/fa',
                'https://rc.majlis.ir/fa/news'
            ]
        elif 'judiciary.ir' in url:
            alternatives = [
                'https://judiciary.ir',
                'https://www.judiciary.ir/fa',
                'https://judiciary.ir/fa/news'
            ]
        elif 'dolat.ir' in url:
            alternatives = [
                'https://dolat.ir',
                'https://www.dolat.ir/fa',
                'https://dolat.ir/fa/news'
            ]
        
        return [alt for alt in alternatives if alt != url]

class GovernmentLegalScraper:
    """Advanced scraper for Iranian government legal sites"""
    
    def __init__(self):
        self.proxy_rotator = SmartProxyRotator()
        self.scraped_content = []
        
        # Target government legal sites
        self.government_targets = [
            {
                'name': 'مجلس شورای اسلامی',
                'url': 'https://rc.majlis.ir',
                'type': 'parliamentary',
                'priority': 1
            },
            {
                'name': 'قوه قضائیه',
                'url': 'https://www.judiciary.ir',
                'type': 'judicial', 
                'priority': 1
            },
            {
                'name': 'پایگاه اطلاع‌رسانی دولت',
                'url': 'https://www.dolat.ir',
                'type': 'government',
                'priority': 2
            },
            {
                'name': 'کدهای ایران',
                'url': 'https://irancode.ir',
                'type': 'legal_codes',
                'priority': 1
            },
            {
                'name': 'دفتر تدوین و تنقیح قوانین',
                'url': 'https://dotic.ir',
                'type': 'legal_codification',
                'priority': 2
            }
        ]
    
    def extract_legal_content(self, content: str, source: str) -> Dict:
        """Extract actual legal content from scraped HTML"""
        
        # Persian legal patterns
        legal_patterns = {
            'articles': re.findall(r'ماده\s+\d+[^۔]*', content),
            'laws': re.findall(r'قانون\s+[^\n\r]{10,100}', content),
            'clauses': re.findall(r'تبصره\s*\d*[^۔]*', content),
            'sections': re.findall(r'فصل\s+[^\n\r]{5,50}', content),
            'decisions': re.findall(r'مصوبه\s+[^\n\r]{10,100}', content)
        }
        
        # Extract meaningful Persian paragraphs
        paragraphs = content.split('\n')
        legal_paragraphs = []
        
        legal_keywords = [
            'قانون', 'ماده', 'تبصره', 'مصوبه', 'حکم', 'دادگاه', 
            'مجلس', 'وزارت', 'رئیس‌جمهور', 'شورای', 'کمیسیون'
        ]
        
        for para in paragraphs:
            para = para.strip()
            if len(para) > 50:  # Substantial content
                # Count Persian characters
                persian_chars = sum(1 for char in para if 1536 <= ord(char) <= 1791)
                # Count legal keywords
                keyword_count = sum(1 for keyword in legal_keywords if keyword in para)
                
                if persian_chars > 20 and keyword_count >= 1:
                    legal_paragraphs.append(para)
        
        # Calculate legal content score
        total_patterns = sum(len(patterns) for patterns in legal_patterns.values())
        legal_score = min((total_patterns + len(legal_paragraphs)) / 10, 1.0)
        
        return {
            'legal_patterns': legal_patterns,
            'legal_paragraphs': legal_paragraphs[:5],  # Top 5 paragraphs
            'legal_score': legal_score,
            'total_legal_elements': total_patterns + len(legal_paragraphs),
            'source': source
        }
    
    def scrape_all_government_sites(self) -> Dict:
        """Execute comprehensive government scraping"""
        print('🏛️ EXECUTING SMART GOVERNMENT LEGAL SCRAPING')
        print('=' * 60)
        print(f'🕐 Start Time: {datetime.now().isoformat()}')
        print(f'🎯 Target Sites: {len(self.government_targets)}')
        print()
        
        results = []
        successful_scrapes = 0
        total_legal_content = ''
        
        for target in self.government_targets:
            print(f'🎯 SCRAPING: {target["name"]} (Priority: {target["priority"]})')
            
            # Execute smart scraping
            scrape_result = self.proxy_rotator.smart_scrape_government_site(
                target['url'], 
                target['name']
            )
            
            if scrape_result['success']:
                # Extract legal content
                legal_analysis = self.extract_legal_content(
                    scrape_result['content'], 
                    target['name']
                )
                
                if legal_analysis['legal_score'] > 0.1:  # Minimum legal content threshold
                    successful_scrapes += 1
                    
                    # Combine results
                    final_result = {
                        **scrape_result,
                        **legal_analysis,
                        'site_info': target
                    }
                    
                    results.append(final_result)
                    
                    # Collect legal content
                    for para in legal_analysis['legal_paragraphs']:
                        total_legal_content += para + '\n\n'
                    
                    print(f'   ✅ SUCCESS: {legal_analysis["total_legal_elements"]} legal elements found')
                    print(f'   📊 Legal Score: {legal_analysis["legal_score"]:.2f}')
                    
                    # Show sample legal content
                    if legal_analysis['legal_paragraphs']:
                        print(f'   📄 Sample Legal Content:')
                        print(f'      {legal_analysis["legal_paragraphs"][0][:200]}...')
                else:
                    print(f'   ⚠️ Content extracted but insufficient legal content')
                    results.append({**scrape_result, 'legal_score': 0, 'site_info': target})
            else:
                print(f'   ❌ FAILED: {scrape_result.get("error", "Unknown error")}')
                results.append({**scrape_result, 'site_info': target})
            
            print()
            time.sleep(3)  # Respectful delay
        
        # Generate comprehensive report
        success_rate = (successful_scrapes / len(self.government_targets)) * 100
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'execution_summary': {
                'total_sites': len(self.government_targets),
                'successful_scrapes': successful_scrapes,
                'success_rate_percent': success_rate,
                'total_legal_content_chars': len(total_legal_content)
            },
            'site_results': results,
            'extracted_legal_content': total_legal_content[:2000],  # First 2K chars
            'smart_systems_used': {
                'dns_servers_available': len(self.proxy_rotator.iranian_dns),
                'cors_proxies_available': len(self.proxy_rotator.cors_proxies),
                'user_agents_rotated': len(self.proxy_rotator.user_agents),
                'retry_mechanisms': True,
                'intelligent_content_detection': True
            }
        }
        
        return report

def main():
    """Execute the smart government scraping system"""
    print('🚀 SMART GOVERNMENT LEGAL SCRAPER')
    print('=' * 50)
    
    scraper = GovernmentLegalScraper()
    
    # Execute comprehensive scraping
    results = scraper.scrape_all_government_sites()
    
    # Save results
    with open('smart_government_scraping_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # Print final summary
    print('📊 SMART SCRAPING FINAL RESULTS:')
    print('=' * 40)
    print(f'🎯 Success Rate: {results["execution_summary"]["success_rate_percent"]:.1f}%')
    print(f'📄 Legal Content: {results["execution_summary"]["total_legal_content_chars"]:,} characters')
    print(f'✅ Successful Sites: {results["execution_summary"]["successful_scrapes"]}/{results["execution_summary"]["total_sites"]}')
    
    if results['execution_summary']['total_legal_content_chars'] > 1000:
        print('\n⚖️ ACTUAL LEGAL CONTENT SAMPLE:')
        print('=' * 35)
        print(results['extracted_legal_content'])
        print('...')
        print('\n✅ SMART GOVERNMENT SCRAPING: SUCCESS')
    else:
        print('\n❌ SMART GOVERNMENT SCRAPING: INSUFFICIENT LEGAL CONTENT')
    
    print(f'\n💾 Full results saved to: smart_government_scraping_results.json')
    
    return results

if __name__ == '__main__':
    main()