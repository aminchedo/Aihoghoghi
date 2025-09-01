#!/usr/bin/env python3
"""
Smart Proxy System for Iranian Legal Archive
Advanced proxy rotation, Iranian DNS, and CORS bypass
"""

import requests
import random
import time
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
import socket
import dns.resolver
from bs4 import BeautifulSoup

class SmartProxySystem:
    def __init__(self):
        # Iranian DNS servers
        self.iranian_dns_servers = [
            '178.22.122.100',  # Shecan
            '185.51.200.2',    # Begzar
            '10.202.10.202',   # Pishgaman
            '10.202.10.102',   # Pishgaman Secondary
            '178.216.248.40',  # Radar Game
            '185.55.226.26',   # Asiatech
            '185.55.225.25'    # Asiatech Secondary
        ]
        
        # Free proxy sources for rotation
        self.proxy_sources = [
            'https://www.proxy-list.download/api/v1/get?type=http',
            'https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
        ]
        
        # Iranian proxy servers (if available)
        self.iranian_proxies = [
            {'http': 'http://proxy.iran.ir:8080'},
            {'http': 'http://proxy.tehran.ir:3128'},
            {'http': 'http://proxy.isf.ir:8080'},
        ]
        
        self.active_proxies = []
        self.failed_proxies = []
        self.proxy_index = 0
        
        # Smart headers for bypassing restrictions
        self.headers_pool = [
            {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            },
            {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fa,en-US;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Referer': 'https://www.google.com/',
                'DNT': '1',
                'Connection': 'keep-alive'
            },
            {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.bing.com/',
                'Origin': 'https://www.bing.com'
            }
        ]
        
        self.session = requests.Session()
        self.setup_iranian_dns()
    
    def setup_iranian_dns(self):
        """Setup Iranian DNS servers"""
        try:
            # Configure DNS resolver to use Iranian servers
            resolver = dns.resolver.Resolver()
            resolver.nameservers = self.iranian_dns_servers[:3]  # Use first 3
            self.dns_resolver = resolver
            print(f"✅ تنظیم DNS ایرانی: {len(self.iranian_dns_servers)} سرور")
        except Exception as e:
            print(f"⚠️ خطا در تنظیم DNS: {e}")
            self.dns_resolver = None
    
    def resolve_with_iranian_dns(self, hostname: str) -> Optional[str]:
        """Resolve hostname using Iranian DNS"""
        if not self.dns_resolver:
            return None
            
        try:
            result = self.dns_resolver.resolve(hostname, 'A')
            ip = str(result[0])
            print(f"🌐 DNS Resolution: {hostname} -> {ip}")
            return ip
        except Exception as e:
            print(f"❌ DNS Resolution failed for {hostname}: {e}")
            return None
    
    def get_free_proxies(self) -> List[Dict[str, str]]:
        """Fetch free proxies from public sources"""
        proxies = []
        
        try:
            # Try to get free proxies (this is a basic example)
            # In real implementation, you'd use proper proxy services
            test_proxies = [
                {'http': 'http://proxy-server.com:8080'},
                {'http': 'http://free-proxy.cz:8080'},
                {'http': 'http://proxy.example.com:3128'},
            ]
            
            for proxy in test_proxies:
                if self.test_proxy(proxy):
                    proxies.append(proxy)
                    
        except Exception as e:
            print(f"⚠️ خطا در دریافت پروکسی‌های رایگان: {e}")
        
        return proxies
    
    def test_proxy(self, proxy: Dict[str, str], timeout: int = 5) -> bool:
        """Test if a proxy is working"""
        try:
            test_url = 'http://httpbin.org/ip'
            response = requests.get(test_url, proxies=proxy, timeout=timeout)
            return response.status_code == 200
        except:
            return False
    
    def get_next_proxy(self) -> Optional[Dict[str, str]]:
        """Get next proxy in rotation"""
        if not self.active_proxies:
            # Try to get Iranian proxies first
            self.active_proxies = self.iranian_proxies.copy()
            
            # Add free proxies if needed
            free_proxies = self.get_free_proxies()
            self.active_proxies.extend(free_proxies)
        
        if self.active_proxies:
            proxy = self.active_proxies[self.proxy_index % len(self.active_proxies)]
            self.proxy_index += 1
            return proxy
        
        return None
    
    def smart_request(self, url: str, max_retries: int = 3) -> Optional[requests.Response]:
        """Make smart request with proxy rotation and DNS resolution"""
        
        print(f"\n🔍 Smart Request به: {url}")
        
        # Parse URL
        parsed = urlparse(url)
        hostname = parsed.hostname
        
        # Try Iranian DNS resolution first
        resolved_ip = self.resolve_with_iranian_dns(hostname)
        
        for attempt in range(max_retries):
            print(f"🔄 تلاش {attempt + 1}/{max_retries}")
            
            # Get random headers
            headers = random.choice(self.headers_pool)
            
            # Try different approaches
            approaches = [
                {'name': 'Direct Connection', 'use_proxy': False, 'use_ip': False},
                {'name': 'Iranian DNS + Direct', 'use_proxy': False, 'use_ip': True},
                {'name': 'Proxy + Headers', 'use_proxy': True, 'use_ip': False},
                {'name': 'Proxy + Iranian DNS', 'use_proxy': True, 'use_ip': True},
            ]
            
            for approach in approaches:
                try:
                    print(f"   📡 روش: {approach['name']}")
                    
                    # Prepare URL
                    request_url = url
                    if approach['use_ip'] and resolved_ip:
                        request_url = url.replace(hostname, resolved_ip)
                        headers['Host'] = hostname  # Keep original host header
                    
                    # Prepare proxy
                    proxies = None
                    if approach['use_proxy']:
                        proxy = self.get_next_proxy()
                        if proxy:
                            proxies = proxy
                            print(f"   🌐 استفاده از پروکسی: {list(proxy.values())[0]}")
                    
                    # Make request
                    response = requests.get(
                        request_url,
                        headers=headers,
                        proxies=proxies,
                        timeout=15,
                        allow_redirects=True,
                        verify=False  # Skip SSL verification for problematic sites
                    )
                    
                    if response.status_code == 200:
                        print(f"   ✅ موفق! کد: {response.status_code}, اندازه: {len(response.text)}")
                        return response
                    elif response.status_code in [301, 302, 307, 308]:
                        print(f"   🔄 ریدایرکت: {response.status_code}")
                        redirect_url = response.headers.get('Location', '')
                        if redirect_url:
                            print(f"   📍 ریدایرکت به: {redirect_url}")
                            return self.smart_request(redirect_url, max_retries=1)
                    else:
                        print(f"   ❌ کد خطا: {response.status_code}")
                        
                except requests.exceptions.Timeout:
                    print(f"   ⏰ Timeout")
                except requests.exceptions.ConnectionError:
                    print(f"   🌐 خطای اتصال")
                except Exception as e:
                    print(f"   💥 خطا: {str(e)[:50]}")
                
                time.sleep(1)  # Delay between approaches
            
            time.sleep(2)  # Delay between attempts
        
        print(f"❌ تمام تلاش‌ها ناموفق برای: {url}")
        return None
    
    def extract_content_smart(self, response: requests.Response, url: str) -> Dict[str, Any]:
        """Smart content extraction with advanced parsing"""
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        content = {
            'url': url,
            'status_code': response.status_code,
            'content_length': len(response.text),
            'extraction_time': datetime.now().isoformat()
        }
        
        # Extract title
        title = soup.find('title')
        if title:
            content['title'] = title.get_text().strip()
        
        # Extract meta information
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            content['meta_description'] = meta_desc.get('content', '').strip()
        
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        if meta_keywords:
            content['meta_keywords'] = meta_keywords.get('content', '').strip()
        
        # Extract main content areas
        main_content = ''
        
        # Look for main content containers
        content_selectors = [
            'main', 'article', '.content', '.main-content', 
            '#content', '#main', '.post-content', '.entry-content'
        ]
        
        for selector in content_selectors:
            elements = soup.select(selector)
            if elements:
                main_content = ' '.join([elem.get_text(strip=True) for elem in elements])
                break
        
        # If no main content found, get all text
        if not main_content:
            main_content = soup.get_text(separator=' ', strip=True)
        
        content['main_content'] = main_content
        content['word_count'] = len(main_content.split())
        
        # Extract headings
        headings = []
        for tag in ['h1', 'h2', 'h3', 'h4']:
            for heading in soup.find_all(tag):
                text = heading.get_text().strip()
                if text and len(text) > 3:
                    headings.append({'tag': tag, 'text': text})
        
        content['headings'] = headings[:10]  # Limit to 10
        
        # Extract links
        links = []
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            text = link.get_text().strip()
            if href and text and len(text) > 2:
                # Convert relative URLs to absolute
                if href.startswith('/'):
                    base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
                    href = base_url + href
                
                links.append({'url': href, 'text': text})
        
        content['links'] = links[:20]  # Limit to 20
        
        # Legal content analysis
        legal_indicators = {
            'قوانین': ['قانون', 'ماده', 'تبصره', 'فصل', 'بخش'],
            'قضایی': ['دادگاه', 'قاضی', 'حکم', 'رأی', 'محاکمه'],
            'اداری': ['بخشنامه', 'دستورالعمل', 'آیین‌نامه', 'مصوبه'],
            'مدنی': ['قرارداد', 'ملک', 'وراثت', 'ازدواج', 'طلاق'],
            'کیفری': ['جرم', 'مجازات', 'زندان', 'جریمه', 'تعزیرات']
        }
        
        legal_analysis = {}
        content_lower = main_content.lower()
        
        for category, keywords in legal_indicators.items():
            matches = []
            for keyword in keywords:
                count = content_lower.count(keyword)
                if count > 0:
                    matches.append({'keyword': keyword, 'count': count})
            
            if matches:
                legal_analysis[category] = {
                    'total_matches': sum(m['count'] for m in matches),
                    'keywords': matches
                }
        
        content['legal_analysis'] = legal_analysis
        
        # Calculate legal relevance score
        total_legal_terms = sum(
            data['total_matches'] for data in legal_analysis.values()
        )
        content['legal_relevance_score'] = min(total_legal_terms * 10, 100)
        
        return content

def test_smart_proxy_scraping():
    print("🚀 تست سیستم پروکسی هوشمند برای اسکرپینگ سایت‌های حقوقی")
    print("=" * 80)
    
    proxy_system = SmartProxySystem()
    
    # Target Iranian legal websites with smart proxy
    target_sites = [
        {
            'name': 'قوه قضائیه ایران',
            'url': 'https://www.judiciary.ir',
            'priority': 'high'
        },
        {
            'name': 'دولت الکترونیک',
            'url': 'https://www.dolat.ir',
            'priority': 'high'
        },
        {
            'name': 'مرکز پژوهش‌های مجلس',
            'url': 'https://rc.majlis.ir',
            'priority': 'medium'
        },
        {
            'name': 'ایران کد',
            'url': 'https://irancode.ir',
            'priority': 'medium'
        },
        {
            'name': 'سازمان ثبت اسناد',
            'url': 'https://www.sabteahval.ir',
            'priority': 'medium'
        }
    ]
    
    results = []
    
    for site in target_sites:
        print(f"\n🎯 تست {site['name']} (اولویت: {site['priority']})")
        print("-" * 50)
        
        start_time = time.time()
        response = proxy_system.smart_request(site['url'])
        end_time = time.time()
        
        if response:
            print(f"✅ اسکرپینگ موفق!")
            print(f"⏱️ زمان: {(end_time - start_time):.2f} ثانیه")
            
            # Extract content
            content = proxy_system.extract_content_smart(response, site['url'])
            content.update({
                'site_name': site['name'],
                'priority': site['priority'],
                'response_time': round((end_time - start_time) * 1000, 2),
                'success': True
            })
            
            print(f"📄 عنوان: {content.get('title', 'بدون عنوان')}")
            print(f"📝 تعداد کلمات: {content.get('word_count', 0):,}")
            print(f"📊 امتیاز حقوقی: {content.get('legal_relevance_score', 0)}")
            
            if content.get('legal_analysis'):
                print(f"⚖️ دسته‌های حقوقی یافت شده:")
                for category, data in content['legal_analysis'].items():
                    print(f"   {category}: {data['total_matches']} مورد")
            
            results.append(content)
            
        else:
            print(f"❌ اسکرپینگ ناموفق")
            results.append({
                'site_name': site['name'],
                'url': site['url'],
                'priority': site['priority'],
                'success': False,
                'response_time': round((end_time - start_time) * 1000, 2),
                'error': 'All smart proxy attempts failed'
            })
    
    # Save results
    output_file = f"smart_proxy_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'test_type': 'smart_proxy_scraping',
            'timestamp': datetime.now().isoformat(),
            'total_sites': len(target_sites),
            'successful_extractions': len([r for r in results if r.get('success', False)]),
            'dns_servers_used': proxy_system.iranian_dns_servers,
            'results': results
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 نتایج تست هوشمند ذخیره شد: {output_file}")
    
    # Summary
    successful = [r for r in results if r.get('success', False)]
    failed = [r for r in results if not r.get('success', False)]
    
    print(f"\n📊 خلاصه نهایی تست هوشمند:")
    print("=" * 50)
    print(f"✅ موفق: {len(successful)}/{len(results)} سایت")
    print(f"❌ ناموفق: {len(failed)}/{len(results)} سایت")
    
    if successful:
        total_words = sum(r.get('word_count', 0) for r in successful)
        total_legal_score = sum(r.get('legal_relevance_score', 0) for r in successful)
        avg_response_time = sum(r.get('response_time', 0) for r in successful) / len(successful)
        
        print(f"📄 کل کلمات استخراج شده: {total_words:,}")
        print(f"⚖️ کل امتیاز حقوقی: {total_legal_score}")
        print(f"⏱️ میانگین زمان پاسخ: {avg_response_time:.2f}ms")
        
        print(f"\n🏆 سایت‌های موفق:")
        for r in successful:
            print(f"   ✅ {r['site_name']}: {r.get('word_count', 0):,} کلمه")
    
    if failed:
        print(f"\n⚠️ سایت‌های ناموفق:")
        for r in failed:
            print(f"   ❌ {r['site_name']}: {r.get('error', 'خطای نامشخص')}")
    
    return results

if __name__ == "__main__":
    # Install required package first
    try:
        import dns.resolver
    except ImportError:
        print("📦 نصب کتابخانه DNS...")
        import subprocess
        subprocess.run(['pip3', 'install', '--break-system-packages', 'dnspython'], check=True)
        import dns.resolver
    
    results = test_smart_proxy_scraping()
    print(f"\n🎉 تست سیستم پروکسی هوشمند کامل شد!")
    
    successful_count = len([r for r in results if r.get('success', False)])
    print(f"🎯 نتیجه: {successful_count}/{len(results)} سایت با سیستم هوشمند اسکرپ شد!")