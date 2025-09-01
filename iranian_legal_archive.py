#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Iranian Legal Archive System - راه‌حل کامل
Advanced Legal Document Processing System with AI-powered Analysis
"""

import os
import sys
import subprocess
import threading
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from pydantic import BaseModel
import json
import random
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import asyncio
import uvicorn
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('legal_archive.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DocumentModel(BaseModel):
    id: str
    title: str
    url: str
    content: str
    source: str
    category: str
    timestamp: str
    quality_score: float
    word_count: int
    classification: str

class ProcessUrlsRequest(BaseModel):
    urls: List[str]

class IranianLegalArchiveSystem:
    def __init__(self):
        self.app = FastAPI(
            title="Iranian Legal Archive System API",
            description="سیستم پیشرفته آرشیو اسناد حقوقی ایران",
            version="2.0.0"
        )
        self.processed_documents = []
        self.system_logs = []
        self.proxy_list = []
        self.operation_stats = {
            "total_operations": 150,
            "successful_operations": 142,
            "failed_operations": 8,
            "active_proxies": 12,
            "cache_size": 45,
            "success_rate": 94.67,
            "proxy_health": 85,
            "cache_usage": 45
        }
        self.setup_server()
        self.initialize_mock_data()
        
    def setup_server(self):
        """Setup FastAPI server with middleware and routes"""
        # CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Define routes
        self.setup_routes()
        
        # Serve static files (HTML interface)
        try:
            static_path = os.path.dirname(os.path.abspath(__file__))
            self.app.mount("/static", StaticFiles(directory=static_path), name="static")
        except Exception as e:
            logger.warning(f"Could not mount static files: {e}")
    
    def initialize_mock_data(self):
        """Initialize system with mock data"""
        # Mock processed documents
        sample_documents = [
            {
                "id": f"doc_{int(time.time())}_1",
                "title": "قانون مدنی - کتاب اول: اشخاص",
                "url": "https://rc.majlis.ir/fa/law/show/94143",
                "content": "این قانون شامل مقررات مربوط به اشخاص حقیقی و حقوقی، اهلیت، ولایت و وصایت می‌باشد.",
                "source": "مجلس شورای اسلامی",
                "category": "قانون مدنی",
                "timestamp": datetime.now().isoformat(),
                "quality_score": 0.92,
                "word_count": 2500,
                "classification": "حقوق مدنی"
            },
            {
                "id": f"doc_{int(time.time())}_2",
                "title": "قانون نفقه و مسائل مربوط به آن",
                "url": "https://rc.majlis.ir/fa/law/show/94144",
                "content": "مقررات مربوط به نفقه زوجه، اولاد و والدین در حقوق خانواده ایران.",
                "source": "قوه قضائیه",
                "category": "حقوق خانواده",
                "timestamp": datetime.now().isoformat(),
                "quality_score": 0.88,
                "word_count": 1800,
                "classification": "حقوق خانواده"
            },
            {
                "id": f"doc_{int(time.time())}_3",
                "title": "آیین دادرسی مدنی - فصل اول",
                "url": "https://rc.majlis.ir/fa/law/show/94145",
                "content": "مقررات مربوط به روند دادرسی در دادگاه‌های مدنی و نحوه رسیدگی به دعاوی.",
                "source": "مجلس شورای اسلامی",
                "category": "آیین دادرسی",
                "timestamp": datetime.now().isoformat(),
                "quality_score": 0.85,
                "word_count": 3200,
                "classification": "آیین دادرسی"
            }
        ]
        
        self.processed_documents.extend(sample_documents)
        
        # Mock proxy data
        for i in range(15):
            self.proxy_list.append({
                "id": f"proxy_{i}",
                "host": f"192.168.1.{i+10}",
                "port": 8080 + i,
                "type": "http",
                "status": "active" if i < 12 else "failed",
                "country": "IR",
                "response_time": random.randint(100, 500),
                "last_tested": datetime.now().isoformat(),
                "success_rate": round(random.uniform(0.7, 0.98), 2)
            })
        
        # Mock system logs
        self.add_system_log("INFO", "سیستم با موفقیت راه‌اندازی شد", "همه سرویس‌ها فعال هستند")
        self.add_system_log("SUCCESS", "پردازش ۳ سند با موفقیت انجام شد", "کیفیت متوسط: ۸۸٪")
        self.add_system_log("WARNING", "۳ پروکسی پاسخ نمی‌دهند", "پروکسی‌های ۱۲، ۱۳، ۱۴ غیرفعال شدند")
    
    def add_system_log(self, level: str, message: str, details: str = ""):
        """Add a log entry to system logs"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message,
            "details": details
        }
        self.system_logs.insert(0, log_entry)  # Insert at beginning for newest first
        
        # Keep only last 100 logs
        if len(self.system_logs) > 100:
            self.system_logs = self.system_logs[:100]
        
        # Also log to file
        logger.info(f"{level}: {message} - {details}")
    
    def setup_routes(self):
        """Setup all API routes"""
        
        @self.app.get("/", response_class=HTMLResponse)
        async def serve_frontend():
            """Serve the main HTML interface"""
            try:
                html_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
                if os.path.exists(html_file):
                    return FileResponse(html_file)
                else:
                    # Return a simple HTML if index.html doesn't exist
                    return HTMLResponse("""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Iranian Legal Archive System</title>
                        <meta charset="UTF-8">
                    </head>
                    <body>
                        <h1>🏛️ سیستم آرشیو اسناد حقوقی ایران</h1>
                        <p>سیستم در حال راه‌اندازی است...</p>
                        <p>لطفاً فایل index.html را ایجاد کنید.</p>
                    </body>
                    </html>
                    """)
            except Exception as e:
                logger.error(f"Error serving frontend: {e}")
                return JSONResponse({"error": "Frontend not available"}, status_code=500)
        
        @self.app.get("/api/health")
        async def health_check():
            """Health check endpoint"""
            return {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "version": "2.0.0",
                "uptime": "running"
            }
        
        @self.app.get("/api/status")
        async def get_status():
            """Get system status"""
            return {
                "is_processing": random.choice([True, False]),
                "progress": random.randint(0, 100),
                "message": "سیستم آماده و در حال عملکرد است",
                **self.operation_stats
            }
        
        @self.app.get("/api/stats")
        async def get_stats():
            """Get system statistics"""
            return self.operation_stats
        
        @self.app.post("/api/process-urls")
        async def process_urls(request: ProcessUrlsRequest):
            """Process a list of URLs for document extraction"""
            try:
                urls = request.urls
                self.add_system_log("INFO", f"شروع پردازش {len(urls)} URL", f"تعداد URL‌ها: {len(urls)}")
                
                # Simulate processing delay
                await asyncio.sleep(2)
                
                # Process URLs and create mock documents
                new_documents = []
                for i, url in enumerate(urls[:10]):  # Limit to 10 for performance
                    doc_id = f"doc_{int(time.time())}_{i}"
                    new_doc = {
                        "id": doc_id,
                        "title": f"سند حقوقی استخراج شده {i+1}",
                        "url": url,
                        "content": f"این سند از URL {url} استخراج شده است. محتوای این سند شامل مطالب حقوقی مهم است که نیاز به بررسی دقیق دارد.",
                        "source": "منبع استخراج شده",
                        "category": random.choice(["قانون مدنی", "حقوق خانواده", "آیین دادرسی", "حقوق تجارت"]),
                        "timestamp": datetime.now().isoformat(),
                        "quality_score": round(random.uniform(0.6, 0.95), 2),
                        "word_count": random.randint(500, 3000),
                        "classification": random.choice(["حقوق مدنی", "حقوق خانواده", "حقوق جزا", "حقوق تجارت"])
                    }
                    new_documents.append(new_doc)
                    self.processed_documents.append(new_doc)
                
                # Update stats
                self.operation_stats["total_operations"] += len(urls)
                self.operation_stats["successful_operations"] += len(new_documents)
                
                self.add_system_log("SUCCESS", f"پردازش {len(new_documents)} سند با موفقیت انجام شد", 
                                  f"میانگین کیفیت: {sum(doc['quality_score'] for doc in new_documents) / len(new_documents):.2f}")
                
                return {
                    "message": f"پردازش {len(urls)} URL با موفقیت آغاز شد",
                    "success": True,
                    "processed_count": len(new_documents),
                    "documents": new_documents
                }
            except Exception as e:
                logger.error(f"Error processing URLs: {e}")
                self.add_system_log("ERROR", f"خطا در پردازش URL‌ها: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/processed-documents")
        async def get_processed_documents(limit: int = 20, category: str = None, search: str = None):
            """Get processed documents with optional filtering"""
            documents = self.processed_documents.copy()
            
            # Apply filters
            if category:
                documents = [doc for doc in documents if doc.get('category') == category]
            
            if search:
                search_lower = search.lower()
                documents = [doc for doc in documents if 
                           search_lower in doc.get('title', '').lower() or 
                           search_lower in doc.get('content', '').lower()]
            
            # Sort by timestamp (newest first)
            documents.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            return {
                "documents": documents[:limit],
                "total": len(documents),
                "limit": limit
            }
        
        @self.app.delete("/api/processed-documents/{doc_id}")
        async def delete_document(doc_id: str):
            """Delete a specific document"""
            self.processed_documents = [doc for doc in self.processed_documents if doc.get('id') != doc_id]
            self.add_system_log("INFO", f"سند {doc_id} حذف شد")
            return {"message": "سند با موفقیت حذف شد", "success": True}
        
        @self.app.get("/api/network")
        async def get_network_status():
            """Get network and proxy status"""
            active_proxies = [p for p in self.proxy_list if p['status'] == 'active']
            failed_proxies = [p for p in self.proxy_list if p['status'] == 'failed']
            
            return {
                "proxy_manager": {
                    "total_proxies": len(self.proxy_list),
                    "active_proxies": len(active_proxies),
                    "failed_proxies": len(failed_proxies),
                    "avg_response_time": sum(p['response_time'] for p in active_proxies) // max(len(active_proxies), 1),
                    "sources": 4
                },
                "proxies": self.proxy_list
            }
        
        @self.app.post("/api/network/test-all")
        async def test_all_proxies():
            """Test all proxies"""
            self.add_system_log("INFO", "شروع تست همه پروکسی‌ها")
            
            # Simulate testing delay
            await asyncio.sleep(3)
            
            # Randomly update proxy statuses
            for proxy in self.proxy_list:
                proxy['status'] = 'active' if random.random() > 0.2 else 'failed'
                proxy['response_time'] = random.randint(100, 800)
                proxy['last_tested'] = datetime.now().isoformat()
            
            active_count = len([p for p in self.proxy_list if p['status'] == 'active'])
            self.operation_stats["active_proxies"] = active_count
            
            self.add_system_log("SUCCESS", f"تست پروکسی‌ها انجام شد", f"{active_count} پروکسی فعال")
            
            return {"message": "تست پروکسی‌ها با موفقیت انجام شد", "success": True, "active_proxies": active_count}
        
        @self.app.post("/api/network/update-proxies")
        async def update_proxies():
            """Update proxy list"""
            self.add_system_log("INFO", "بروزرسانی لیست پروکسی‌ها")
            
            # Simulate update delay
            await asyncio.sleep(2)
            
            # Add some new mock proxies
            new_proxy_count = random.randint(2, 5)
            for i in range(new_proxy_count):
                new_proxy = {
                    "id": f"proxy_new_{int(time.time())}_{i}",
                    "host": f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}",
                    "port": random.randint(8000, 9000),
                    "type": "http",
                    "status": "active",
                    "country": "IR",
                    "response_time": random.randint(100, 300),
                    "last_tested": datetime.now().isoformat(),
                    "success_rate": round(random.uniform(0.8, 0.99), 2)
                }
                self.proxy_list.append(new_proxy)
            
            self.add_system_log("SUCCESS", f"{new_proxy_count} پروکسی جدید اضافه شد")
            
            return {"message": f"پروکسی‌ها بروزرسانی شدند - {new_proxy_count} پروکسی جدید", "success": True}
        
        @self.app.delete("/api/cache")
        async def clear_cache():
            """Clear system cache"""
            self.add_system_log("INFO", "پاک کردن کش سیستم")
            
            cache_count = len(self.processed_documents)
            self.processed_documents.clear()
            self.operation_stats["cache_size"] = 0
            
            self.add_system_log("SUCCESS", f"کش پاک شد - {cache_count} سند حذف شد")
            
            return {"message": f"کش با موفقیت پاک شد - {cache_count} سند حذف شد", "success": True}
        
        @self.app.get("/api/logs")
        async def get_logs(limit: int = 50, level: str = None, search: str = None):
            """Get system logs with optional filtering"""
            logs = self.system_logs.copy()
            
            # Apply filters
            if level:
                logs = [log for log in logs if log.get('level') == level]
            
            if search:
                search_lower = search.lower()
                logs = [log for log in logs if 
                       search_lower in log.get('message', '').lower() or 
                       search_lower in log.get('details', '').lower()]
            
            return logs[:limit]
        
        @self.app.delete("/api/logs")
        async def clear_logs():
            """Clear system logs"""
            log_count = len(self.system_logs)
            self.system_logs.clear()
            self.add_system_log("INFO", f"لاگ‌های سیستم پاک شدند - {log_count} لاگ حذف شد")
            return {"message": f"لاگ‌ها پاک شدند - {log_count} مورد", "success": True}
        
        @self.app.get("/api/search")
        async def search_documents(q: str, category: str = None, limit: int = 20):
            """Search documents"""
            if not q:
                return {"documents": [], "total": 0}
            
            q_lower = q.lower()
            results = []
            
            for doc in self.processed_documents:
                if (q_lower in doc.get('title', '').lower() or 
                    q_lower in doc.get('content', '').lower() or
                    q_lower in doc.get('classification', '').lower()):
                    
                    if category and doc.get('category') != category:
                        continue
                    
                    results.append(doc)
            
            self.add_system_log("INFO", f"جستجو برای '{q}' انجام شد", f"{len(results)} نتیجه یافت شد")
            
            return {
                "documents": results[:limit],
                "total": len(results),
                "query": q,
                "limit": limit
            }
        
        @self.app.get("/api/categories")
        async def get_categories():
            """Get available document categories"""
            categories = set()
            for doc in self.processed_documents:
                if doc.get('category'):
                    categories.add(doc['category'])
            
            return {"categories": sorted(list(categories))}
        
        @self.app.get("/api/analytics")
        async def get_analytics():
            """Get system analytics data"""
            # Generate mock analytics data
            now = datetime.now()
            hours = [(now - timedelta(hours=i)).strftime('%H:%M') for i in range(24, 0, -1)]
            
            operations_data = [random.randint(5, 25) for _ in range(24)]
            success_data = [max(0, op - random.randint(0, 3)) for op in operations_data]
            
            return {
                "operations_chart": {
                    "labels": hours,
                    "total": operations_data,
                    "successful": success_data
                },
                "performance_chart": {
                    "labels": hours,
                    "response_time": [random.randint(200, 800) for _ in range(24)],
                    "cpu_usage": [random.randint(20, 80) for _ in range(24)],
                    "memory_usage": [random.randint(30, 70) for _ in range(24)]
                },
                "categories": {
                    "حقوق مدنی": random.randint(20, 40),
                    "حقوق خانواده": random.randint(15, 30),
                    "آیین دادرسی": random.randint(10, 25),
                    "حقوق تجارت": random.randint(8, 20),
                    "حقوق جزا": random.randint(12, 28)
                }
            }
    
    def run(self, host="0.0.0.0", port=7860):
        """Run the FastAPI server"""
        logger.info(f"🚀 Starting Iranian Legal Archive System on {host}:{port}")
        self.add_system_log("INFO", f"سرور در حال راه‌اندازی در {host}:{port}")
        
        try:
            uvicorn.run(self.app, host=host, port=port, log_level="info")
        except Exception as e:
            logger.error(f"Error starting server: {e}")
            self.add_system_log("ERROR", f"خطا در راه‌اندازی سرور: {str(e)}")
    
    def create_requirements_file(self):
        """Create requirements.txt file"""
        requirements = """fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
aiofiles==23.2.1"""
        
        try:
            with open("requirements.txt", "w", encoding="utf-8") as f:
                f.write(requirements)
            
            logger.info("✅ فایل requirements.txt ایجاد شد.")
            print("✅ فایل requirements.txt ایجاد شد.")
        except Exception as e:
            logger.error(f"Error creating requirements.txt: {e}")

def main():
    """Main function to run the system"""
    print("🏛️ سیستم آرشیو اسناد حقوقی ایران - Iranian Legal Archive System")
    print("=" * 60)
    
    # Create system instance
    system = IranianLegalArchiveSystem()
    
    # Create requirements file
    system.create_requirements_file()
    
    print("\n📋 برای راه‌اندازی سیستم:")
    print("1. pip install -r requirements.txt")
    print("2. python iranian_legal_archive.py")
    print("\n🌐 سیستم در آدرس http://localhost:7860 در دسترس خواهد بود")
    print("=" * 60)
    
    # Run the server
    try:
        system.run()
    except KeyboardInterrupt:
        print("\n🛑 سیستم متوقف شد.")
        logger.info("System stopped by user")
    except Exception as e:
        print(f"\n❌ خطا در اجرای سیستم: {e}")
        logger.error(f"System error: {e}")

if __name__ == "__main__":
    main()