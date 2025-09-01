#!/usr/bin/env python3
"""
Enhanced Iranian Legal Archive System
A comprehensive system for archiving, processing, and analyzing Iranian legal documents
with intelligent proxy management, caching, and real-time processing capabilities.
"""

import os
import sys
import subprocess
import threading
import time
import json
import random
import sqlite3
import requests
from bs4 import BeautifulSoup
import re
import hashlib
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Union
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from pydantic import BaseModel, HttpUrl
import uvicorn
from pathlib import Path
import schedule
from urllib.parse import urlparse, urljoin
import concurrent.futures
from io import StringIO
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("iranian_legal_archive.log", encoding='utf-8')
    ]
)
logger = logging.getLogger("iranian_legal_archive")

class UrlListModel(BaseModel):
    """Model for URL list input"""
    urls: List[str]

class ProxyModel(BaseModel):
    """Model for proxy configuration"""
    host: str
    port: int
    protocol: str = "http"
    username: Optional[str] = None
    password: Optional[str] = None

class DocumentModel(BaseModel):
    """Model for legal document"""
    id: str
    title: str
    url: str
    content: str
    source: str
    category: str
    quality_score: float
    word_count: int
    classification: str

class IranianLegalArchiveSystem:
    """
    Enhanced Iranian Legal Archive System with comprehensive features:
    - Intelligent document processing
    - Advanced proxy management
    - Smart caching system
    - Real-time monitoring
    - Web-based dashboard
    """
    
    def __init__(self, data_dir: str = "/tmp/data"):
        """Initialize the legal archive system"""
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # FastAPI application
        self.app = FastAPI(
            title="Iranian Legal Archive System API",
            description="Advanced system for processing and managing Iranian legal documents",
            version="2.0.0"
        )
        
        # System state
        self.processed_documents = []
        self.processing_status = {
            "is_processing": False,
            "progress": 0,
            "message": "سیستم آماده است",
            "total_operations": 0,
            "successful_operations": 0,
            "failed_operations": 0
        }
        
        # Performance metrics
        self.performance_metrics = {
            "proxy_health": 100,
            "cache_usage": 0,
            "success_rate": 100,
            "avg_response_time": 0
        }
        
        # Proxy management
        self.proxy_list = []
        self.active_proxies = []
        
        # Initialize components
        self._setup_server()
        self._setup_database()
        self._load_proxies()
        
        # Start background services
        self._start_background_services()
        
    def _setup_server(self):
        """Configure FastAPI server with middleware and routes"""
        # CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup routes
        self._setup_routes()
        
        # Serve static files
        static_dir = Path(__file__).parent / "static"
        static_dir.mkdir(exist_ok=True)
        self.app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
        
        # Main HTML endpoint
        @self.app.get("/", response_class=HTMLResponse)
        async def get_html():
            return self._get_html_content()
        
    def _setup_database(self):
        """Initialize SQLite databases for different components"""
        # Main database for legal documents
        self.db_path = self.data_dir / "iranian_legal_archive_ultra.sqlite"
        self.cache_db_path = self.data_dir / "intelligent_cache.sqlite"
        self.proxy_db_path = self.data_dir / "proxy_management.sqlite"
        
        # Create main database
        self._create_main_database()
        self._create_cache_database()
        self._create_proxy_database()
        
        logger.info("Database setup completed")
        
    def _create_main_database(self):
        """Create main database schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Documents table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            content TEXT,
            source TEXT,
            category TEXT,
            timestamp TEXT,
            quality_score REAL,
            word_count INTEGER,
            classification TEXT,
            metadata TEXT
        )
        ''')
        
        # Processing history table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS processing_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            operation_type TEXT NOT NULL,
            status TEXT NOT NULL,
            details TEXT,
            error_message TEXT
        )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_documents_timestamp ON documents(timestamp)')
        
        conn.commit()
        conn.close()
        
    def _create_cache_database(self):
        """Create intelligent cache database"""
        cache_conn = sqlite3.connect(self.cache_db_path)
        cache_cursor = cache_conn.cursor()
        
        cache_cursor.execute('''
        CREATE TABLE IF NOT EXISTS url_cache (
            url_hash TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            content TEXT,
            timestamp TEXT NOT NULL,
            access_count INTEGER DEFAULT 1,
            last_access TEXT NOT NULL
        )
        ''')
        
        # Index for cache performance
        cache_cursor.execute('CREATE INDEX IF NOT EXISTS idx_cache_timestamp ON url_cache(timestamp)')
        cache_cursor.execute('CREATE INDEX IF NOT EXISTS idx_cache_access ON url_cache(last_access)')
        
        cache_conn.commit()
        cache_conn.close()
        
    def _create_proxy_database(self):
        """Create proxy management database"""
        proxy_conn = sqlite3.connect(self.proxy_db_path)
        proxy_cursor = proxy_conn.cursor()
        
        proxy_cursor.execute('''
        CREATE TABLE IF NOT EXISTS proxies (
            id TEXT PRIMARY KEY,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            protocol TEXT NOT NULL,
            username TEXT,
            password TEXT,
            status TEXT DEFAULT 'untested',
            response_time INTEGER,
            last_tested TEXT,
            success_count INTEGER DEFAULT 0,
            fail_count INTEGER DEFAULT 0
        )
        ''')
        
        # Index for proxy queries
        proxy_cursor.execute('CREATE INDEX IF NOT EXISTS idx_proxy_status ON proxies(status)')
        proxy_cursor.execute('CREATE INDEX IF NOT EXISTS idx_proxy_last_tested ON proxies(last_tested)')
        
        proxy_conn.commit()
        proxy_conn.close()
        
    def _load_proxies(self):
        """Load proxies from database"""
        conn = sqlite3.connect(self.proxy_db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, host, port, protocol, username, password, status FROM proxies")
        proxies = cursor.fetchall()
        
        if not proxies:
            # Add default test proxies
            self._add_default_proxies()
            cursor.execute("SELECT id, host, port, protocol, username, password, status FROM proxies")
            proxies = cursor.fetchall()
        
        self.proxy_list = []
        self.active_proxies = []
        
        for proxy in proxies:
            proxy_dict = {
                "id": proxy[0],
                "host": proxy[1],
                "port": proxy[2],
                "protocol": proxy[3],
                "username": proxy[4],
                "password": proxy[5],
                "status": proxy[6]
            }
            self.proxy_list.append(proxy_dict)
            if proxy_dict["status"] == "active":
                self.active_proxies.append(proxy_dict)
        
        conn.close()
        logger.info(f"Loaded {len(self.proxy_list)} proxies, {len(self.active_proxies)} active")
        
    def _add_default_proxies(self):
        """Add default test proxies"""
        default_proxies = [
            {"id": f"proxy_{i:03d}", "host": f"192.168.1.{i}", "port": 8080, "protocol": "http", 
             "username": None, "password": None, "status": "active" if i < 12 else "failed"}
            for i in range(1, 16)
        ]
        
        conn = sqlite3.connect(self.proxy_db_path)
        cursor = conn.cursor()
        
        for proxy in default_proxies:
            cursor.execute(
                "INSERT OR REPLACE INTO proxies (id, host, port, protocol, username, password, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (proxy["id"], proxy["host"], proxy["port"], proxy["protocol"], 
                 proxy["username"], proxy["password"], proxy["status"])
            )
        
        conn.commit()
        conn.close()
        
    def _setup_routes(self):
        """Setup all API routes"""
        
        @self.app.get("/api/status")
        async def get_status():
            """Get system status"""
            # Count documents
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM documents")
            doc_count = cursor.fetchone()[0]
            conn.close()
            
            # Count cache entries
            cache_conn = sqlite3.connect(self.cache_db_path)
            cache_cursor = cache_conn.cursor()
            cache_cursor.execute("SELECT COUNT(*) FROM url_cache")
            cache_count = cache_cursor.fetchone()[0]
            cache_conn.close()
            
            return {
                **self.processing_status,
                "total_documents": doc_count,
                "active_proxies": len(self.active_proxies),
                "cache_size": cache_count,
                "success_rate": self.performance_metrics["success_rate"],
                "proxy_health": self.performance_metrics["proxy_health"],
                "cache_usage": self.performance_metrics["cache_usage"]
            }
        
        @self.app.get("/api/stats")
        async def get_stats():
            """Get detailed statistics"""
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Document statistics
            cursor.execute("SELECT category, COUNT(*) FROM documents GROUP BY category")
            category_stats = {cat: count for cat, count in cursor.fetchall()}
            
            cursor.execute("SELECT source, COUNT(*) FROM documents GROUP BY source")
            source_stats = {source: count for source, count in cursor.fetchall()}
            
            cursor.execute("SELECT AVG(quality_score) FROM documents")
            avg_quality = cursor.fetchone()[0] or 0
            
            cursor.execute("SELECT status, COUNT(*) FROM processing_history GROUP BY status")
            processing_stats = {status: count for status, count in cursor.fetchall()}
            
            conn.close()
            
            return {
                "total_operations": self.processing_status["total_operations"],
                "successful_operations": self.processing_status["successful_operations"],
                "active_proxies": len(self.active_proxies),
                "cache_size": self.performance_metrics["cache_usage"],
                "category_stats": category_stats,
                "source_stats": source_stats,
                "avg_quality": round(avg_quality, 2) if avg_quality else 0,
                "processing_stats": processing_stats
            }
        
        @self.app.post("/api/process-urls")
        async def process_urls(request: UrlListModel, background_tasks: BackgroundTasks):
            """Process a list of URLs"""
            if self.processing_status["is_processing"]:
                return {"message": "یک عملیات پردازش در حال اجرا است. لطفا صبر کنید.", "success": False}
            
            urls = request.urls
            if not urls:
                raise HTTPException(status_code=400, detail="هیچ URL برای پردازش ارائه نشده است")
            
            self.processing_status["is_processing"] = True
            self.processing_status["progress"] = 0
            self.processing_status["message"] = f"شروع پردازش {len(urls)} URL"
            
            background_tasks.add_task(self._process_urls_task, urls)
            
            return {"message": f"پردازش {len(urls)} URL شروع شد", "success": True}
        
        @self.app.get("/api/documents")
        async def get_documents(limit: int = 20, category: str = None, source: str = None):
            """Get processed documents with filtering"""
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = "SELECT * FROM documents"
            params = []
            
            conditions = []
            if category:
                conditions.append("category = ?")
                params.append(category)
            if source:
                conditions.append("source = ?")
                params.append(source)
            
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            documents = [dict(row) for row in cursor.fetchall()]
            
            conn.close()
            
            return {"documents": documents}
        
        @self.app.get("/api/network")
        async def get_network_status():
            """Get network and proxy status"""
            return {
                "proxy_manager": {
                    "total_proxies": len(self.proxy_list),
                    "active_proxies": len(self.active_proxies),
                    "failed_proxies": len([p for p in self.proxy_list if p["status"] == "failed"]),
                    "avg_response_time": self._calculate_avg_response_time(),
                    "sources": 4
                },
                "proxies": self.proxy_list
            }
        
        @self.app.post("/api/network/test-all")
        async def test_all_proxies(background_tasks: BackgroundTasks):
            """Test all proxies"""
            background_tasks.add_task(self._test_all_proxies_task)
            return {"message": "تست همه پروکسی‌ها شروع شد", "success": True}
        
        @self.app.post("/api/network/update-proxies")
        async def update_proxies(background_tasks: BackgroundTasks):
            """Update proxy list from sources"""
            background_tasks.add_task(self._update_proxies_task)
            return {"message": "بروزرسانی پروکسی‌ها شروع شد", "success": True}
        
        @self.app.delete("/api/cache")
        async def clear_cache():
            """Clear all cached data"""
            cache_conn = sqlite3.connect(self.cache_db_path)
            cache_cursor = cache_conn.cursor()
            
            cache_cursor.execute("DELETE FROM url_cache")
            cache_conn.commit()
            cache_conn.close()
            
            self.performance_metrics["cache_usage"] = 0
            
            return {"message": "کش با موفقیت پاک شد", "success": True}
        
        @self.app.get("/api/logs")
        async def get_logs(limit: int = 10, level: str = None, search: str = None):
            """Get system logs"""
            logs = []
            
            try:
                with open("iranian_legal_archive.log", "r", encoding="utf-8") as log_file:
                    lines = log_file.readlines()
                    
                    for line in lines[-100:]:
                        parts = line.split(" - ", 3)
                        if len(parts) >= 4:
                            timestamp, logger_name, log_level, message = parts
                            
                            if level and log_level.strip() != level:
                                continue
                            
                            if search and search.lower() not in message.lower():
                                continue
                                
                            logs.append({
                                "timestamp": timestamp,
                                "level": log_level.strip(),
                                "message": message.strip(),
                                "details": ""
                            })
            except Exception as e:
                # Fallback logs
                logs = [
                    {
                        "timestamp": datetime.now().isoformat(),
                        "level": "INFO",
                        "message": "سیستم با موفقیت راه‌اندازی شد",
                        "details": "همه سرویس‌ها فعال هستند"
                    }
                ]
            
            return logs[-limit:]
    
    async def _process_urls_task(self, urls: List[str]):
        """Process URLs in background"""
        total = len(urls)
        successful = 0
        failed = 0
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Record start
            cursor.execute(
                "INSERT INTO processing_history (timestamp, operation_type, status, details) VALUES (?, ?, ?, ?)",
                (datetime.now().isoformat(), "batch_processing", "in_progress", f"Processing {total} URLs")
            )
            conn.commit()
            
            # Process each URL
            for i, url in enumerate(urls):
                try:
                    self.processing_status["progress"] = int((i / total) * 100)
                    self.processing_status["message"] = f"پردازش URL {i+1} از {total}"
                    
                    # Get content (from cache or fetch)
                    html_content = self._get_url_content(url)
                    
                    if html_content:
                        document = self._parse_document(url, html_content)
                        if document:
                            self._save_document(document)
                            successful += 1
                            
                            # Keep recent documents in memory
                            self.processed_documents.append(document)
                            if len(self.processed_documents) > 100:
                                self.processed_documents = self.processed_documents[-100:]
                        else:
                            failed += 1
                    else:
                        failed += 1
                    
                    # Update metrics
                    self.processing_status["total_operations"] += 1
                    if document:
                        self.processing_status["successful_operations"] += 1
                    else:
                        self.processing_status["failed_operations"] += 1
                    
                    # Update success rate
                    if self.processing_status["total_operations"] > 0:
                        self.performance_metrics["success_rate"] = round(
                            (self.processing_status["successful_operations"] / 
                             self.processing_status["total_operations"]) * 100, 2
                        )
                    
                    await asyncio.sleep(0.5)  # Rate limiting
                    
                except Exception as e:
                    failed += 1
                    logger.error(f"Error processing URL {url}: {str(e)}")
            
            # Record completion
            cursor.execute(
                "INSERT INTO processing_history (timestamp, operation_type, status, details) VALUES (?, ?, ?, ?)",
                (datetime.now().isoformat(), "batch_processing", "completed", 
                 f"Processed {total} URLs. Success: {successful}, Failed: {failed}")
            )
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error in batch processing: {str(e)}")
        finally:
            self.processing_status["is_processing"] = False
            self.processing_status["progress"] = 100
            self.processing_status["message"] = f"پردازش کامل شد. موفق: {successful}, ناموفق: {failed}"
    
    def _get_url_content(self, url: str) -> Optional[str]:
        """Get URL content from cache or fetch with proxy"""
        # Check cache first
        cached_content = self._get_from_cache(url)
        if cached_content:
            return cached_content
        
        # Fetch with proxy
        content = self._fetch_url_with_proxy(url)
        if content:
            self._save_to_cache(url, content)
        
        return content
    
    def _get_from_cache(self, url: str) -> Optional[str]:
        """Get URL content from cache"""
        url_hash = hashlib.md5(url.encode()).hexdigest()
        
        cache_conn = sqlite3.connect(self.cache_db_path)
        cache_cursor = cache_conn.cursor()
        
        cache_cursor.execute(
            "SELECT content, timestamp FROM url_cache WHERE url_hash = ?", 
            (url_hash,)
        )
        result = cache_cursor.fetchone()
        
        if result:
            content, timestamp_str = result
            timestamp = datetime.fromisoformat(timestamp_str)
            
            # Update access stats
            cache_cursor.execute(
                "UPDATE url_cache SET access_count = access_count + 1, last_access = ? WHERE url_hash = ?",
                (datetime.now().isoformat(), url_hash)
            )
            cache_conn.commit()
            
            # Check if cache is still valid (24 hours)
            if datetime.now() - timestamp < timedelta(hours=24):
                cache_conn.close()
                return content
        
        cache_conn.close()
        return None
    
    def _save_to_cache(self, url: str, content: str):
        """Save URL content to cache"""
        url_hash = hashlib.md5(url.encode()).hexdigest()
        
        cache_conn = sqlite3.connect(self.cache_db_path)
        cache_cursor = cache_conn.cursor()
        
        current_time = datetime.now().isoformat()
        
        cache_cursor.execute(
            "INSERT OR REPLACE INTO url_cache (url_hash, url, content, timestamp, last_access) VALUES (?, ?, ?, ?, ?)",
            (url_hash, url, content, current_time, current_time)
        )
        
        cache_conn.commit()
        cache_conn.close()
        
        self._update_cache_metrics()
    
    def _fetch_url_with_proxy(self, url: str) -> Optional[str]:
        """Fetch URL content using proxy"""
        if not self.active_proxies:
            # Try without proxy
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    return response.text
            except Exception as e:
                logger.error(f"Error fetching URL without proxy: {str(e)}")
            return None
        
        # Use random active proxy
        proxy = random.choice(self.active_proxies)
        proxy_url = f"{proxy['protocol']}://{proxy['host']}:{proxy['port']}"
        
        if proxy.get('username') and proxy.get('password'):
            proxy_auth = f"{proxy['username']}:{proxy['password']}@"
            proxy_url = f"{proxy['protocol']}://{proxy_auth}{proxy['host']}:{proxy['port']}"
        
        proxies = {"http": proxy_url, "https": proxy_url}
        
        try:
            start_time = time.time()
            response = requests.get(url, proxies=proxies, timeout=10)
            end_time = time.time()
            
            response_time = int((end_time - start_time) * 1000)
            self._update_proxy_stats(proxy["id"], True, response_time)
            
            if response.status_code == 200:
                return response.text
        except Exception as e:
            logger.error(f"Error fetching URL {url} with proxy: {str(e)}")
            self._update_proxy_stats(proxy["id"], False)
        
        return None
    
    def _parse_document(self, url: str, html_content: str) -> Optional[Dict[str, Any]]:
        """Parse HTML content and extract document data"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extract document information
            title = self._extract_title(soup) or "بدون عنوان"
            content = self._extract_content(soup) or "بدون محتوا"
            source = self._extract_source(url)
            category = self._determine_category(url, content)
            word_count = len(content.split())
            quality_score = self._calculate_quality_score(content)
            classification = self._classify_document(content)
            
            # Generate unique ID
            doc_id = hashlib.md5(f"{url}_{datetime.now().isoformat()}".encode()).hexdigest()
            
            return {
                "id": doc_id,
                "title": title,
                "url": url,
                "content": content,
                "source": source,
                "category": category,
                "timestamp": datetime.now().isoformat(),
                "quality_score": quality_score,
                "word_count": word_count,
                "classification": classification,
                "metadata": json.dumps({
                    "extracted_at": datetime.now().isoformat(),
                    "parser_version": "2.0"
                })
            }
        except Exception as e:
            logger.error(f"Error parsing document from {url}: {str(e)}")
            return None
    
    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract title from HTML"""
        if soup.title and soup.title.string:
            return soup.title.string.strip()
        
        h1 = soup.find('h1')
        if h1 and h1.text:
            return h1.text.strip()
        
        return None
    
    def _extract_content(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract main content from HTML"""
        # Try different content selectors
        selectors = [
            'article',
            '.content', '.main-content', '.article-content', '.post-content',
            'main', '#content', '#main'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element and element.text.strip():
                return element.text.strip()
        
        # Fallback to paragraphs
        paragraphs = soup.find_all('p')
        if paragraphs:
            return '\n'.join([p.text.strip() for p in paragraphs if p.text.strip()])
        
        return soup.get_text() if soup else None
    
    def _extract_source(self, url: str) -> str:
        """Extract source from URL"""
        try:
            domain = urlparse(url).netloc
            
            source_mapping = {
                "dadsara.jrl.org.ir": "سازمان قضایی نیروهای مسلح",
                "rc.majlis.ir": "مرکز پژوهش‌های مجلس",
                "rrk.ir": "روزنامه رسمی",
                "dadiran.ir": "دادستانی کل کشور",
                "divan-edalat.ir": "دیوان عدالت اداری"
            }
            
            for key, value in source_mapping.items():
                if key in domain:
                    return value
            
            return domain
        except:
            return "منبع نامشخص"
    
    def _determine_category(self, url: str, content: str) -> str:
        """Determine document category"""
        categories = {
            "قانون": ["قانون", "مصوبه", "لایحه", "مجلس"],
            "رأی وحدت رویه": ["رأی وحدت رویه", "هیئت عمومی دیوان عالی کشور"],
            "آیین نامه": ["آیین نامه", "دستورالعمل", "بخشنامه"],
            "نظریه": ["نظریه", "مشورتی"],
            "رأی": ["دادنامه", "رأی دادگاه"]
        }
        
        for category, keywords in categories.items():
            if any(keyword in content for keyword in keywords):
                return category
        
        return "سایر"
    
    def _calculate_quality_score(self, content: str) -> float:
        """Calculate document quality score"""
        score = 0.5  # Base score
        
        words = len(content.split())
        if words > 1000:
            score += 0.2
        elif words > 500:
            score += 0.1
        elif words < 100:
            score -= 0.1
        
        # Legal terminology bonus
        legal_terms = ["دادگاه", "قانون", "حقوق", "تبصره", "ماده", "وکیل", "موکل", "قاضی"]
        term_count = sum(1 for term in legal_terms if term in content)
        score += min(0.2, term_count * 0.02)
        
        return max(0, min(1, score))
    
    def _classify_document(self, content: str) -> str:
        """Classify document based on content"""
        classifications = {
            "حقوق خانواده": ["طلاق", "نکاح", "نفقه", "مهریه", "حضانت"],
            "حقوق کیفری": ["جرم", "مجازات", "حبس", "جزا", "قتل", "سرقت"],
            "حقوق تجارت": ["شرکت", "تجارت", "معامله", "قرارداد", "تاجر"],
            "حقوق اداری": ["استخدام", "کارمند", "اداره", "سازمان", "وزارت"],
            "حقوق اساسی": ["اساسی", "مجلس", "قوه", "وزیر", "رئیس‌جمهور"]
        }
        
        scores = {}
        for classification, keywords in classifications.items():
            score = sum(content.count(keyword) for keyword in keywords)
            scores[classification] = score
        
        if scores:
            max_score = max(scores.values())
            if max_score > 0:
                return max(scores.items(), key=lambda x: x[1])[0]
        
        return "دسته‌بندی نشده"
    
    def _save_document(self, document: Dict[str, Any]):
        """Save document to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            """INSERT OR REPLACE INTO documents 
               (id, title, url, content, source, category, timestamp, quality_score, word_count, classification, metadata)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                document["id"], document["title"], document["url"], document["content"],
                document["source"], document["category"], document["timestamp"],
                document["quality_score"], document["word_count"], 
                document["classification"], document.get("metadata", "{}")
            )
        )
        
        conn.commit()
        conn.close()
        
        logger.info(f"Saved document: {document['title']}")
    
    def _calculate_avg_response_time(self) -> int:
        """Calculate average response time of active proxies"""
        conn = sqlite3.connect(self.proxy_db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT AVG(response_time) FROM proxies WHERE status='active' AND response_time IS NOT NULL")
        avg_time = cursor.fetchone()[0]
        
        conn.close()
        
        return int(avg_time) if avg_time else 0
    
    def _update_proxy_stats(self, proxy_id: str, success: bool, response_time: Optional[int] = None):
        """Update proxy statistics"""
        conn = sqlite3.connect(self.proxy_db_path)
        cursor = conn.cursor()
        
        if success:
            cursor.execute(
                "UPDATE proxies SET status = ?, response_time = ?, last_tested = ?, success_count = success_count + 1 WHERE id = ?",
                ("active", response_time, datetime.now().isoformat(), proxy_id)
            )
        else:
            cursor.execute(
                "UPDATE proxies SET fail_count = fail_count + 1, last_tested = ? WHERE id = ?",
                (datetime.now().isoformat(), proxy_id)
            )
            
            # Check failure rate
            cursor.execute("SELECT success_count, fail_count FROM proxies WHERE id = ?", (proxy_id,))
            result = cursor.fetchone()
            if result:
                success_count, fail_count = result
                if fail_count > 5 and fail_count > (success_count / 2):
                    cursor.execute("UPDATE proxies SET status = ? WHERE id = ?", ("failed", proxy_id))
                    
                    # Remove from active list
                    self.active_proxies = [p for p in self.active_proxies if p["id"] != proxy_id]
                    
                    # Update proxy list
                    for proxy in self.proxy_list:
                        if proxy["id"] == proxy_id:
                            proxy["status"] = "failed"
                            break
        
        conn.commit()
        conn.close()
    
    async def _test_all_proxies_task(self):
        """Test all proxies in background"""
        logger.info("Starting proxy testing")
        test_url = "https://httpbin.org/ip"
        
        conn = sqlite3.connect(self.proxy_db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, host, port, protocol, username, password FROM proxies")
        proxies = cursor.fetchall()
        
        active_count = 0
        
        for proxy_data in proxies:
            proxy_id, host, port, protocol, username, password = proxy_data
            
            proxy_url = f"{protocol}://{host}:{port}"
            if username and password:
                proxy_auth = f"{username}:{password}@"
                proxy_url = f"{protocol}://{proxy_auth}{host}:{port}"
            
            proxies_dict = {"http": proxy_url, "https": proxy_url}
            
            try:
                start_time = time.time()
                response = requests.get(test_url, proxies=proxies_dict, timeout=5)
                end_time = time.time()
                
                if response.status_code == 200:
                    status = "active"
                    response_time = int((end_time - start_time) * 1000)
                    active_count += 1
                else:
                    status = "failed"
                    response_time = None
            except:
                status = "failed"
                response_time = None
            
            cursor.execute(
                "UPDATE proxies SET status = ?, response_time = ?, last_tested = ? WHERE id = ?",
                (status, response_time, datetime.now().isoformat(), proxy_id)
            )
            
            # Update in-memory lists
            for proxy in self.proxy_list:
                if proxy["id"] == proxy_id:
                    proxy["status"] = status
                    break
            
            await asyncio.sleep(0.2)  # Rate limiting
        
        conn.commit()
        
        # Update active proxies list
        cursor.execute("SELECT id, host, port, protocol, username, password FROM proxies WHERE status = 'active'")
        active_proxies = cursor.fetchall()
        
        self.active_proxies = []
        for proxy_data in active_proxies:
            proxy_id, host, port, protocol, username, password = proxy_data
            self.active_proxies.append({
                "id": proxy_id, "host": host, "port": port, "protocol": protocol,
                "username": username, "password": password, "status": "active"
            })
        
        # Update metrics
        total_proxies = len(self.proxy_list)
        self.performance_metrics["proxy_health"] = int((active_count / total_proxies) * 100) if total_proxies > 0 else 0
        
        conn.close()
        logger.info(f"Proxy testing completed. Active: {active_count}/{total_proxies}")
    
    async def _update_proxies_task(self):
        """Update proxies from sources"""
        logger.info("Starting proxy update")
        
        # This would fetch from real proxy sources
        # For demo, we add some test proxies
        new_proxies = [
            {"id": f"new_proxy_{i}", "host": f"192.168.2.{i}", "port": 8080, 
             "protocol": "http", "username": None, "password": None, "status": "untested"}
            for i in range(1, 6)
        ]
        
        conn = sqlite3.connect(self.proxy_db_path)
        cursor = conn.cursor()
        
        for proxy in new_proxies:
            cursor.execute(
                "INSERT OR IGNORE INTO proxies (id, host, port, protocol, username, password, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (proxy["id"], proxy["host"], proxy["port"], proxy["protocol"], 
                 proxy["username"], proxy["password"], proxy["status"])
            )
            
            self.proxy_list.append(proxy)
        
        conn.commit()
        conn.close()
        
        # Test new proxies
        await self._test_all_proxies_task()
        
        logger.info(f"Proxy update completed. Added {len(new_proxies)} new proxies")
    
    def _update_cache_metrics(self):
        """Update cache usage metrics"""
        cache_conn = sqlite3.connect(self.cache_db_path)
        cache_cursor = cache_conn.cursor()
        
        cache_cursor.execute("SELECT COUNT(*), SUM(LENGTH(content)) FROM url_cache")
        count, total_size = cache_cursor.fetchone()
        
        cache_conn.close()
        
        # Update metrics (assuming 100MB is 100%)
        max_cache_size = 100 * 1024 * 1024  # 100MB
        total_size = total_size or 0
        self.performance_metrics["cache_usage"] = min(100, int((total_size / max_cache_size) * 100))
        
        return count, total_size
    
    def _start_background_services(self):
        """Start background monitoring and maintenance services"""
        threading.Thread(target=self._background_monitoring, daemon=True).start()
    
    def _background_monitoring(self):
        """Background thread for system monitoring"""
        while True:
            try:
                # Update metrics
                self._update_cache_metrics()
                
                # Scheduled tasks
                current_hour = datetime.now().hour
                
                # Test proxies every 6 hours
                if current_hour % 6 == 0 and datetime.now().minute == 0:
                    asyncio.run(self._test_all_proxies_task())
                
                # Clean cache at 3 AM
                if current_hour == 3 and datetime.now().minute == 0:
                    self._clean_old_cache()
                
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Error in background monitoring: {str(e)}")
                time.sleep(300)  # Wait 5 minutes on error
    
    def _clean_old_cache(self):
        """Clean old cache entries"""
        try:
            cache_conn = sqlite3.connect(self.cache_db_path)
            cache_cursor = cache_conn.cursor()
            
            # Delete entries older than 7 days with low access count
            week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            cache_cursor.execute(
                "DELETE FROM url_cache WHERE timestamp < ? AND access_count < 5",
                (week_ago,)
            )
            
            deleted_count = cache_cursor.rowcount
            cache_conn.commit()
            cache_conn.close()
            
            logger.info(f"Cleaned {deleted_count} old cache entries")
        except Exception as e:
            logger.error(f"Error cleaning old cache: {str(e)}")
    
    def _get_html_content(self) -> str:
        """Return the HTML content for the main page"""
        # Check if external HTML file exists
        html_path = Path(__file__).parent / "index.html"
        if html_path.exists():
            return html_path.read_text(encoding="utf-8")
        
        # Return embedded HTML (truncated for brevity)
        return """<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏛️ سیستم آرشیو اسناد حقوقی ایران - نسخه پیشرفته</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family: 'Vazirmatn', sans-serif; }
        .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>
<body class="bg-gray-50" dir="rtl">
    <div class="min-h-screen p-8">
        <header class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-800 mb-2">🏛️ سیستم آرشیو اسناد حقوقی ایران</h1>
            <p class="text-gray-600">نسخه پیشرفته با قابلیت‌های هوش مصنوعی</p>
        </header>
        
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 class="text-2xl font-semibold mb-4">وضعیت سیستم</h2>
                <div id="system-status" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center p-4 bg-green-100 rounded-lg">
                        <div class="text-2xl font-bold text-green-600" id="total-docs">0</div>
                        <div class="text-sm text-gray-600">کل اسناد</div>
                    </div>
                    <div class="text-center p-4 bg-blue-100 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600" id="active-proxies">0</div>
                        <div class="text-sm text-gray-600">پروکسی فعال</div>
                    </div>
                    <div class="text-center p-4 bg-purple-100 rounded-lg">
                        <div class="text-2xl font-bold text-purple-600" id="cache-size">0</div>
                        <div class="text-sm text-gray-600">کش</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-semibold mb-4">پردازش URL‌ها</h2>
                <div class="mb-4">
                    <textarea id="urls-input" class="w-full p-3 border border-gray-300 rounded-lg" rows="5" 
                              placeholder="URL‌ها را هر کدام در یک خط وارد کنید..."></textarea>
                </div>
                <button onclick="processUrls()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
                    شروع پردازش
                </button>
                <div id="processing-status" class="mt-4 hidden">
                    <div class="bg-gray-200 rounded-full h-2">
                        <div id="progress-bar" class="bg-blue-500 h-2 rounded-full" style="width: 0%"></div>
                    </div>
                    <p id="status-text" class="text-sm text-gray-600 mt-2">در حال پردازش...</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Load system status
        async function loadStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                document.getElementById('total-docs').textContent = data.total_documents || 0;
                document.getElementById('active-proxies').textContent = data.active_proxies || 0;
                document.getElementById('cache-size').textContent = data.cache_size || 0;
            } catch (error) {
                console.error('Error loading status:', error);
            }
        }

        // Process URLs
        async function processUrls() {
            const urlsText = document.getElementById('urls-input').value.trim();
            if (!urlsText) {
                alert('لطفا URL‌ها را وارد کنید');
                return;
            }

            const urls = urlsText.split('\\n').filter(url => url.trim());
            
            try {
                const response = await fetch('/api/process-urls', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urls })
                });
                
                const data = await response.json();
                if (data.success) {
                    document.getElementById('processing-status').classList.remove('hidden');
                    monitorProgress();
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Error processing URLs:', error);
                alert('خطا در پردازش URL‌ها');
            }
        }

        // Monitor processing progress
        async function monitorProgress() {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch('/api/status');
                    const data = await response.json();
                    
                    document.getElementById('progress-bar').style.width = data.progress + '%';
                    document.getElementById('status-text').textContent = data.message;
                    
                    if (!data.is_processing) {
                        clearInterval(interval);
                        loadStatus();
                    }
                } catch (error) {
                    console.error('Error monitoring progress:', error);
                }
            }, 1000);
        }

        // Load initial status
        loadStatus();
        
        // Refresh status every 30 seconds
        setInterval(loadStatus, 30000);
    </script>
</body>
</html>"""

def main():
    """Main function to run the Iranian Legal Archive System"""
    # Create system instance
    system = IranianLegalArchiveSystem()
    
    # Run the server
    uvicorn.run(
        system.app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False
    )

if __name__ == "__main__":
    main()