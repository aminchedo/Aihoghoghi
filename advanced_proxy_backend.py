#!/usr/bin/env python3
"""
Advanced Proxy Backend for Iranian Legal Archive
Smart proxy rotation, Iranian DNS, CORS bypass, and restriction circumvention
"""

import asyncio
import aiohttp
import requests
import random
import time
import json
import socket
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import dns.resolver

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Advanced Iranian Legal Archive API", version="3.0.0")

# Enhanced CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class AdvancedProxyManager:
    def __init__(self):
        # Iranian DNS servers for bypassing restrictions
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
            '4.2.2.4',         # Level3
            '8.8.8.8'          # Google
        ]
        
        # Smart proxy pools
        self.proxy_pools = {
            'iranian': [
                'http://proxy.iran.ir:8080',
                'http://proxy.tehran.ir:3128',
                'http://proxy.isf.ir:8080'
            ],
            'international': [
                'http://proxy-server.com:8080',
                'http://free-proxy.cz:8080'
            ],
            'socks': [
                'socks5://127.0.0.1:1080',
                'socks4://127.0.0.1:1081'
            ]
        }
        
        # Advanced headers for different scenarios
        self.header_profiles = {
            'standard_persian': {
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
            'mobile_iranian': {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fa-IR,fa;q=0.9',
                'Accept-Encoding': 'gzip, deflate'
            },
            'search_engine': {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': '*/*',
                'Accept-Language': 'fa,en'
            },
            'curl_like': {
                'User-Agent': 'curl/7.68.0',
                'Accept': '*/*'
            }
        }
        
        self.active_proxies = []
        self.failed_proxies = []
        self.proxy_index = 0
        self.dns_resolver = None
        self.setup_dns()
        
        self.stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'proxy_successes': 0,
            'dns_resolutions': 0,
            'cors_bypasses': 0,
            'restriction_bypasses': 0
        }
    
    def setup_dns(self):
        """Setup Iranian DNS resolver"""
        try:
            self.dns_resolver = dns.resolver.Resolver()
            self.dns_resolver.nameservers = self.iranian_dns[:5]  # Use first 5
            self.dns_resolver.timeout = 5
            self.dns_resolver.lifetime = 10
            print(f"✅ تنظیم DNS ایرانی: {len(self.iranian_dns)} سرور")
        except Exception as e:
            print(f"⚠️ خطا در تنظیم DNS: {e}")
    
    async def resolve_with_iranian_dns(self, hostname: str) -> Optional[str]:
        """Resolve hostname using Iranian DNS"""
        if not self.dns_resolver:
            return None
            
        try:
            self.stats['dns_resolutions'] += 1
            result = self.dns_resolver.resolve(hostname, 'A')
            ip = str(result[0])
            print(f"🌐 DNS Resolution: {hostname} -> {ip}")
            return ip
        except Exception as e:
            print(f"❌ DNS Resolution failed for {hostname}: {e}")
            return None
    
    async def smart_request(self, url: str, max_retries: int = 4) -> Optional[Dict[str, Any]]:
        """Advanced smart request with multiple bypass techniques"""
        
        print(f"\n🎯 Advanced Smart Request: {url}")
        self.stats['total_requests'] += 1
        
        parsed_url = urlparse(url)
        hostname = parsed_url.hostname
        
        # Strategy 1: Direct connection with Iranian DNS
        resolved_ip = await self.resolve_with_iranian_dns(hostname)
        
        strategies = [
            ('Direct Connection', self._direct_request),
            ('Iranian DNS + Direct', lambda u: self._dns_request(u, resolved_ip, hostname)),
            ('Mobile Headers', lambda u: self._mobile_request(u)),
            ('Search Engine Bot', lambda u: self._bot_request(u)),
            ('CORS Proxy Bypass', self._cors_bypass_request),
            ('Curl-like Request', lambda u: self._curl_request(u))
        ]
        
        for attempt in range(max_retries):
            print(f"🔄 Attempt {attempt + 1}/{max_retries}")
            
            for strategy_name, strategy_func in strategies:
                try:
                    print(f"   📡 Strategy: {strategy_name}")
                    
                    result = await strategy_func(url)
                    
                    if result and result.get('success'):
                        self.stats['successful_requests'] += 1
                        if 'proxy' in strategy_name.lower():
                            self.stats['proxy_successes'] += 1
                        if 'cors' in strategy_name.lower():
                            self.stats['cors_bypasses'] += 1
                        if 'dns' in strategy_name.lower():
                            self.stats['restriction_bypasses'] += 1
                            
                        print(f"   ✅ Success! Status: {result.get('status_code')}")
                        return result
                    else:
                        print(f"   ⚠️ Failed: {result.get('error', 'Unknown error') if result else 'No response'}")
                        
                except Exception as e:
                    print(f"   ❌ Exception: {str(e)[:50]}")
                
                await asyncio.sleep(1)  # Delay between strategies
            
            await asyncio.sleep(2)  # Delay between attempts
        
        self.stats['failed_requests'] += 1
        print(f"❌ All strategies failed for: {url}")
        return None
    
    async def _direct_request(self, url: str) -> Dict[str, Any]:
        """Direct request with standard headers"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    url,
                    headers=self.header_profiles['standard_persian'],
                    timeout=aiohttp.ClientTimeout(total=15),
                    ssl=False
                ) as response:
                    content = await response.text()
                    return {
                        'success': response.status == 200,
                        'status_code': response.status,
                        'content': content,
                        'content_length': len(content),
                        'method': 'direct'
                    }
            except Exception as e:
                return {'success': False, 'error': str(e), 'method': 'direct'}
    
    async def _dns_request(self, url: str, resolved_ip: str, original_hostname: str) -> Dict[str, Any]:
        """Request using resolved IP with Host header"""
        if not resolved_ip:
            return {'success': False, 'error': 'No resolved IP', 'method': 'dns'}
        
        # Replace hostname with IP
        ip_url = url.replace(original_hostname, resolved_ip)
        headers = self.header_profiles['standard_persian'].copy()
        headers['Host'] = original_hostname
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    ip_url,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=15),
                    ssl=False
                ) as response:
                    content = await response.text()
                    return {
                        'success': response.status == 200,
                        'status_code': response.status,
                        'content': content,
                        'content_length': len(content),
                        'method': 'dns_resolution',
                        'resolved_ip': resolved_ip
                    }
            except Exception as e:
                return {'success': False, 'error': str(e), 'method': 'dns_resolution'}
    
    async def _mobile_request(self, url: str) -> Dict[str, Any]:
        """Mobile user agent request"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    url,
                    headers=self.header_profiles['mobile_iranian'],
                    timeout=aiohttp.ClientTimeout(total=15),
                    ssl=False
                ) as response:
                    content = await response.text()
                    return {
                        'success': response.status == 200,
                        'status_code': response.status,
                        'content': content,
                        'content_length': len(content),
                        'method': 'mobile_headers'
                    }
            except Exception as e:
                return {'success': False, 'error': str(e), 'method': 'mobile_headers'}
    
    async def _bot_request(self, url: str) -> Dict[str, Any]:
        """Search engine bot request"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    url,
                    headers=self.header_profiles['search_engine'],
                    timeout=aiohttp.ClientTimeout(total=15),
                    ssl=False
                ) as response:
                    content = await response.text()
                    return {
                        'success': response.status == 200,
                        'status_code': response.status,
                        'content': content,
                        'content_length': len(content),
                        'method': 'search_bot'
                    }
            except Exception as e:
                return {'success': False, 'error': str(e), 'method': 'search_bot'}
    
    async def _cors_bypass_request(self, url: str) -> Dict[str, Any]:
        """CORS bypass using proxy services"""
        cors_proxies = [
            f"https://api.allorigins.win/get?url={url}",
            f"https://corsproxy.io/?{url}"
        ]
        
        for proxy_url in cors_proxies:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        proxy_url,
                        timeout=aiohttp.ClientTimeout(total=20)
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            content = data.get('contents', data.get('data', ''))
                            return {
                                'success': True,
                                'status_code': 200,
                                'content': content,
                                'content_length': len(content),
                                'method': 'cors_bypass',
                                'proxy_used': proxy_url
                            }
            except Exception as e:
                continue
        
        return {'success': False, 'error': 'All CORS proxies failed', 'method': 'cors_bypass'}
    
    async def _curl_request(self, url: str) -> Dict[str, Any]:
        """Curl-like request"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    url,
                    headers=self.header_profiles['curl_like'],
                    timeout=aiohttp.ClientTimeout(total=15),
                    ssl=False
                ) as response:
                    content = await response.text()
                    return {
                        'success': response.status == 200,
                        'status_code': response.status,
                        'content': content,
                        'content_length': len(content),
                        'method': 'curl_like'
                    }
            except Exception as e:
                return {'success': False, 'error': str(e), 'method': 'curl_like'}
    
    def extract_legal_content(self, html: str, url: str) -> Dict[str, Any]:
        """Extract and analyze legal content"""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove script and style elements
        for script in soup(['script', 'style', 'nav', 'footer']):
            script.decompose()
        
        extracted = {
            'url': url,
            'extraction_time': datetime.now().isoformat()
        }
        
        # Extract title
        title = soup.find('title')
        if title:
            extracted['title'] = title.get_text().strip()
        
        # Extract meta information
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            extracted['meta_description'] = meta_desc.get('content', '').strip()
        
        # Extract main content
        content_selectors = ['main', 'article', '.content', '.main-content', '#content', 'body']
        main_content = ''
        
        for selector in content_selectors:
            element = soup.select_one(selector)
            if element:
                main_content = element.get_text(separator=' ', strip=True)
                break
        
        extracted['content'] = main_content
        extracted['word_count'] = len(main_content.split()) if main_content else 0
        
        # Extract headings
        headings = []
        for tag in ['h1', 'h2', 'h3']:
            for heading in soup.find_all(tag, limit=5):
                text = heading.get_text().strip()
                if text and len(text) > 3:
                    headings.append({'tag': tag, 'text': text[:200]})
        
        extracted['headings'] = headings
        
        # Extract links
        links = []
        for link in soup.find_all('a', href=True, limit=10):
            href = link.get('href')
            text = link.get_text().strip()
            if href and text and len(text) > 2:
                if href.startswith('/'):
                    href = urljoin(url, href)
                links.append({'url': href, 'text': text[:100]})
        
        extracted['links'] = links
        
        # Legal content analysis
        legal_keywords = {
            'قضایی': ['قاضی', 'دادگاه', 'حکم', 'رأی', 'محاکمه'],
            'قانونی': ['قانون', 'ماده', 'تبصره', 'آیین‌نامه', 'مقررات'],
            'اداری': ['وزارت', 'سازمان', 'بخشنامه', 'دستورالعمل'],
            'مدنی': ['ملک', 'قرارداد', 'خرید', 'فروش', 'اجاره'],
            'کیفری': ['جرم', 'مجازات', 'زندان', 'جریمه']
        }
        
        legal_analysis = {}
        content_lower = main_content.lower() if main_content else ''
        
        for category, keywords in legal_keywords.items():
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
        
        extracted['legal_analysis'] = legal_analysis
        
        # Calculate legal relevance score
        total_legal_terms = sum(data['total_matches'] for data in legal_analysis.values())
        extracted['legal_relevance_score'] = min(total_legal_terms * 10, 100)
        
        return extracted

# Initialize proxy manager
proxy_manager = AdvancedProxyManager()

# Global storage
scraping_results = []
analysis_results = []

# Serve static files
if os.path.exists("dist"):
    app.mount("/dist", StaticFiles(directory="dist"), name="dist")

@app.get("/")
async def read_root():
    """Serve main page"""
    if os.path.exists("index.html"):
        return FileResponse("index.html")
    return {"message": "Advanced Iranian Legal Archive API v3.0.0"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "3.0.0-advanced",
        "features": ["smart_proxy", "iranian_dns", "cors_bypass", "restriction_circumvention"],
        "proxy_pools": len(proxy_manager.proxy_pools),
        "dns_servers": len(proxy_manager.iranian_dns),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/status")
async def get_system_status():
    return {
        "status": "operational",
        "proxy_manager": "active",
        "dns_resolver": "iranian_configured",
        "cors_bypass": "enabled",
        "stats": proxy_manager.stats,
        "active_proxies": len(proxy_manager.active_proxies),
        "failed_proxies": len(proxy_manager.failed_proxies),
        "timestamp": datetime.now().isoformat()
    }

class ScrapeRequest(BaseModel):
    urls: List[str]
    use_smart_proxy: bool = True
    use_iranian_dns: bool = True
    bypass_cors: bool = True
    max_retries: int = 3

@app.post("/api/scraping/smart-scrape")
async def smart_scrape_endpoints(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Start smart scraping with advanced proxy techniques"""
    
    async def run_smart_scraping():
        global scraping_results, analysis_results
        scraping_results.clear()
        analysis_results.clear()
        
        print(f"🚀 Starting smart scraping for {len(request.urls)} URLs")
        
        for i, url in enumerate(request.urls):
            print(f"\n📍 Scraping {i+1}/{len(request.urls)}: {url}")
            
            result = await proxy_manager.smart_request(url, request.max_retries)
            
            if result and result.get('success'):
                # Extract and analyze content
                extracted = proxy_manager.extract_legal_content(result['content'], url)
                
                scrape_result = {
                    'id': i + 1,
                    'url': url,
                    'success': True,
                    'status_code': result['status_code'],
                    'method': result['method'],
                    'content_length': result['content_length'],
                    'extracted_data': extracted,
                    'timestamp': datetime.now().isoformat()
                }
                
                scraping_results.append(scrape_result)
                
                # Perform legal analysis
                if extracted.get('legal_analysis'):
                    analysis_results.append({
                        'url': url,
                        'legal_score': extracted['legal_relevance_score'],
                        'categories': list(extracted['legal_analysis'].keys()),
                        'total_legal_terms': sum(
                            data['total_matches'] 
                            for data in extracted['legal_analysis'].values()
                        )
                    })
            else:
                scraping_results.append({
                    'id': i + 1,
                    'url': url,
                    'success': False,
                    'error': result.get('error', 'Unknown error') if result else 'No response',
                    'timestamp': datetime.now().isoformat()
                })
            
            # Respectful delay between requests
            await asyncio.sleep(3)
        
        print(f"✅ Smart scraping completed! {len(scraping_results)} results")
    
    background_tasks.add_task(run_smart_scraping)
    
    return {
        "message": "Smart scraping started with advanced proxy techniques",
        "urls_count": len(request.urls),
        "features_enabled": {
            "smart_proxy": request.use_smart_proxy,
            "iranian_dns": request.use_iranian_dns,
            "cors_bypass": request.bypass_cors
        },
        "estimated_duration": f"{len(request.urls) * 10}-{len(request.urls) * 15} seconds",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/scraping/results")
async def get_scraping_results():
    """Get smart scraping results"""
    return {
        "results": scraping_results,
        "analysis": analysis_results,
        "total_scraped": len(scraping_results),
        "successful_scrapes": len([r for r in scraping_results if r.get('success')]),
        "stats": proxy_manager.stats,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/proxy/stats")
async def get_proxy_stats():
    """Get detailed proxy statistics"""
    return {
        "proxy_stats": proxy_manager.stats,
        "dns_servers": proxy_manager.iranian_dns,
        "proxy_pools": {
            "iranian": len(proxy_manager.proxy_pools['iranian']),
            "international": len(proxy_manager.proxy_pools['international']),
            "socks": len(proxy_manager.proxy_pools['socks'])
        },
        "active_proxies": len(proxy_manager.active_proxies),
        "failed_proxies": len(proxy_manager.failed_proxies),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/proxy/test")
async def test_proxy_system():
    """Test the smart proxy system"""
    test_urls = [
        'https://www.judiciary.ir',
        'https://www.dolat.ir',
        'https://httpbin.org/ip'  # For testing
    ]
    
    results = []
    for url in test_urls:
        result = await proxy_manager.smart_request(url, max_retries=2)
        results.append({
            'url': url,
            'success': result.get('success', False) if result else False,
            'method': result.get('method', 'unknown') if result else 'none',
            'status_code': result.get('status_code', 0) if result else 0
        })
    
    return {
        "test_results": results,
        "successful_tests": len([r for r in results if r['success']]),
        "total_tests": len(results),
        "proxy_stats": proxy_manager.stats,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Advanced Proxy Backend...")
    print("🌐 Features: Smart Proxy, Iranian DNS, CORS Bypass")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")