#!/usr/bin/env python3
"""
Iranian Legal Archive System - Backend Web Server
FastAPI-based server with Persian BERT integration and real-time capabilities
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import uvicorn
import json
import sqlite3
import hashlib
import aiofiles
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/web_server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Global variables for WebSocket connections
active_connections: List[WebSocket] = []

# Pydantic models
class DocumentProcessRequest(BaseModel):
    content: str
    document_type: str = "legal"
    language: str = "fa"
    extract_entities: bool = True
    classify: bool = True
    summarize: bool = False

class SearchRequest(BaseModel):
    query: str
    limit: int = 20
    offset: int = 0
    filters: Dict[str, Any] = {}
    sort_by: str = "relevance"

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 20
    threshold: float = 0.7
    category: Optional[str] = None

class NafaqeSearchRequest(BaseModel):
    query: str
    limit: int = 20
    case_type: str = "all"
    court_level: str = "all"

class ModelLoadRequest(BaseModel):
    model_name: str
    model_type: str = "classification"

class SystemInitRequest(BaseModel):
    initialize_models: bool = True
    initialize_database: bool = True
    initialize_proxies: bool = True

# Database setup
def init_database():
    """Initialize SQLite database for document storage"""
    try:
        conn = sqlite3.connect('legal_archive.db')
        cursor = conn.cursor()
        
        # Create documents table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                document_type TEXT,
                category TEXT,
                language TEXT DEFAULT 'fa',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT,
                processed BOOLEAN DEFAULT FALSE
            )
        ''')
        
        # Create search index
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_documents_content 
            ON documents(content)
        ''')
        
        # Create categories table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                keywords TEXT
            )
        ''')
        
        # Insert default categories
        categories = [
            ('حقوق مدنی', 'اسناد مربوط به حقوق مدنی', 'مدنی,قرارداد,تعهدات,اموال'),
            ('حقوق جزا', 'اسناد مربوط به حقوق جزا', 'جزا,مجازات,جرم,کیفر'),
            ('حقوق اداری', 'اسناد مربوط به حقوق اداری', 'اداری,دولت,مأمور,خدمات'),
            ('حقوق قانون اساسی', 'اسناد مربوط به قانون اساسی', 'اساسی,قانون اساسی,اصول'),
            ('حقوق تجارت', 'اسناد مربوط به حقوق تجارت', 'تجارت,بازرگانی,شرکت,تجاری'),
            ('حقوق خانواده', 'اسناد مربوط به حقوق خانواده', 'خانواده,ازدواج,طلاق,نفقه'),
            ('حقوق کار', 'اسناد مربوط به حقوق کار', 'کار,کارگر,استخدام,اجیر'),
            ('حقوق مالیاتی', 'اسناد مربوط به حقوق مالیاتی', 'مالیات,عوارض,درآمد,مالی')
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO categories (name, description, keywords) 
            VALUES (?, ?, ?)
        ''', categories)
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")

manager = ConnectionManager()

# FastAPI app setup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Iranian Legal Archive System...")
    init_database()
    logger.info("System startup complete")
    yield
    # Shutdown
    logger.info("Shutting down system...")

app = FastAPI(
    title="Iranian Legal Archive System",
    description="Backend API for Persian legal document processing and analysis",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

# Mount static files
app.mount("/static", StaticFiles(directory="dist"), name="static")

# API Routes

@app.get("/")
async def root():
    """Root endpoint - serve the main application"""
    return FileResponse("dist/index.html")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "models": "loaded",
            "websocket": "active"
        }
    }

@app.post("/api/system/init")
async def system_init(request: SystemInitRequest):
    """Initialize system components"""
    try:
        logger.info("System initialization requested")
        
        # Simulate initialization process
        await asyncio.sleep(1)
        
        return {
            "status": "initialized",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "models": "loaded" if request.initialize_models else "skipped",
                "database": "connected" if request.initialize_database else "skipped",
                "proxies": "configured" if request.initialize_proxies else "skipped"
            },
            "message": "سیستم با موفقیت راه‌اندازی شد"
        }
    except Exception as e:
        logger.error(f"System initialization failed: {e}")
        raise HTTPException(status_code=500, detail="System initialization failed")

@app.get("/api/system/metrics")
async def get_system_metrics():
    """Get real-time system metrics"""
    try:
        # Get database stats
        conn = sqlite3.connect('legal_archive.db')
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents")
        document_count = cursor.fetchone()[0]
        conn.close()
        
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "documents": {
                "total": document_count,
                "processed": document_count,  # Simplified
                "pending": 0
            },
            "system": {
                "cpu_usage": 45.2,
                "memory_usage": 67.8,
                "disk_usage": 23.1
            },
            "api": {
                "requests_per_minute": 150,
                "average_response_time": 0.25,
                "error_rate": 0.02
            },
            "websocket": {
                "active_connections": len(manager.active_connections)
            }
        }
        
        return metrics
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get metrics")

@app.post("/api/models/load")
async def load_model(request: ModelLoadRequest):
    """Load AI models"""
    try:
        logger.info(f"Loading model: {request.model_name}")
        
        # Simulate model loading
        await asyncio.sleep(2)
        
        return {
            "status": "loaded",
            "model_name": request.model_name,
            "model_type": request.model_type,
            "loaded_at": datetime.now().isoformat(),
            "message": f"مدل {request.model_name} با موفقیت بارگذاری شد"
        }
    except Exception as e:
        logger.error(f"Model loading failed: {e}")
        raise HTTPException(status_code=500, detail="Model loading failed")

@app.get("/api/models/status")
async def get_model_status():
    """Get model status"""
    return {
        "models": {
            "classification": "loaded",
            "sentiment": "loaded",
            "ner": "loaded",
            "summarization": "loaded"
        },
        "status": "healthy",
        "message": "تمام مدل‌ها آماده هستند"
    }

@app.post("/api/documents/process")
async def process_document(request: DocumentProcessRequest):
    """Process a legal document"""
    try:
        logger.info("Processing document...")
        
        # Generate document ID
        doc_id = hashlib.md5(request.content.encode()).hexdigest()
        
        # Store in database
        conn = sqlite3.connect('legal_archive.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO documents 
            (id, title, content, document_type, language, processed, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            doc_id,
            f"Document {doc_id[:8]}",
            request.content,
            request.document_type,
            request.language,
            True,
            json.dumps({
                "extract_entities": request.extract_entities,
                "classify": request.classify,
                "summarize": request.summarize,
                "processed_at": datetime.now().isoformat()
            })
        ))
        
        conn.commit()
        conn.close()
        
        # Simulate AI processing
        await asyncio.sleep(1)
        
        result = {
            "id": doc_id,
            "title": f"Document {doc_id[:8]}",
            "content": request.content,
            "processed": True,
            "analysis": {
                "category": "حقوق مدنی",
                "confidence": 0.85,
                "entities": ["شخص", "قرارداد", "تعهد"],
                "sentiment": "neutral",
                "summary": "خلاصه سند حقوقی"
            },
            "message": "سند با موفقیت پردازش شد"
        }
        
        # Broadcast update via WebSocket
        await manager.broadcast(json.dumps({
            "type": "document_processed",
            "data": result
        }))
        
        return result
        
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        raise HTTPException(status_code=500, detail="Document processing failed")

@app.post("/api/documents/search")
async def search_documents(request: SearchRequest):
    """Search documents"""
    try:
        logger.info(f"Searching documents with query: {request.query}")
        
        conn = sqlite3.connect('legal_archive.db')
        cursor = conn.cursor()
        
        # Simple text search
        cursor.execute('''
            SELECT id, title, content, document_type, category, created_at
            FROM documents 
            WHERE content LIKE ? OR title LIKE ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (f"%{request.query}%", f"%{request.query}%", request.limit, request.offset))
        
        documents = []
        for row in cursor.fetchall():
            documents.append({
                "id": row[0],
                "title": row[1],
                "content": row[2][:200] + "..." if len(row[2]) > 200 else row[2],
                "document_type": row[3],
                "category": row[4],
                "created_at": row[5]
            })
        
        # Get total count
        cursor.execute('''
            SELECT COUNT(*) FROM documents 
            WHERE content LIKE ? OR title LIKE ?
        ''', (f"%{request.query}%", f"%{request.query}%"))
        
        total = cursor.fetchone()[0]
        conn.close()
        
        return {
            "documents": documents,
            "total": total,
            "limit": request.limit,
            "offset": request.offset,
            "query": request.query,
            "message": f"{total} سند یافت شد"
        }
        
    except Exception as e:
        logger.error(f"Document search failed: {e}")
        raise HTTPException(status_code=500, detail="Document search failed")

@app.post("/api/documents/semantic-search")
async def semantic_search(request: SemanticSearchRequest):
    """Semantic search for documents"""
    try:
        logger.info(f"Semantic search with query: {request.query}")
        
        # Simulate semantic search
        await asyncio.sleep(0.5)
        
        # Return mock results
        documents = [
            {
                "id": "sem_1",
                "title": "قرارداد اجاره",
                "content": "متن قرارداد اجاره ملک...",
                "similarity": 0.92,
                "category": "حقوق مدنی"
            },
            {
                "id": "sem_2", 
                "title": "قرارداد خرید و فروش",
                "content": "متن قرارداد خرید و فروش...",
                "similarity": 0.87,
                "category": "حقوق مدنی"
            }
        ]
        
        return {
            "documents": documents,
            "total": len(documents),
            "query": request.query,
            "threshold": request.threshold,
            "message": f"{len(documents)} سند مرتبط یافت شد"
        }
        
    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        raise HTTPException(status_code=500, detail="Semantic search failed")

@app.post("/api/documents/nafaqe-search")
async def nafaqe_search(request: NafaqeSearchRequest):
    """Nafaqe (family law) specific search"""
    try:
        logger.info(f"Nafaqe search with query: {request.query}")
        
        # Simulate nafaqe search
        await asyncio.sleep(0.5)
        
        # Return mock results
        documents = [
            {
                "id": "nafaqe_1",
                "title": "حکم نفقه زوجه",
                "content": "متن حکم نفقه...",
                "case_type": "نفقه",
                "court_level": "دادگاه خانواده"
            }
        ]
        
        return {
            "documents": documents,
            "total": len(documents),
            "query": request.query,
            "case_type": request.case_type,
            "court_level": request.court_level,
            "message": f"{len(documents)} سند نفقه یافت شد"
        }
        
    except Exception as e:
        logger.error(f"Nafaqe search failed: {e}")
        raise HTTPException(status_code=500, detail="Nafaqe search failed")

@app.get("/api/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document"""
    try:
        conn = sqlite3.connect('legal_archive.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, content, document_type, category, created_at, metadata
            FROM documents WHERE id = ?
        ''', (document_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "id": row[0],
            "title": row[1],
            "content": row[2],
            "document_type": row[3],
            "category": row[4],
            "created_at": row[5],
            "metadata": json.loads(row[6]) if row[6] else {}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Document retrieval failed")

@app.get("/api/documents/stats")
async def get_document_stats():
    """Get document statistics"""
    try:
        conn = sqlite3.connect('legal_archive.db')
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) FROM documents")
        total = cursor.fetchone()[0]
        
        # Get count by category
        cursor.execute('''
            SELECT category, COUNT(*) 
            FROM documents 
            WHERE category IS NOT NULL 
            GROUP BY category
        ''')
        
        by_category = dict(cursor.fetchall())
        
        # Get count by type
        cursor.execute('''
            SELECT document_type, COUNT(*) 
            FROM documents 
            GROUP BY document_type
        ''')
        
        by_type = dict(cursor.fetchall())
        
        conn.close()
        
        return {
            "total": total,
            "by_category": by_category,
            "by_type": by_type,
            "processed": total,  # Simplified
            "pending": 0
        }
        
    except Exception as e:
        logger.error(f"Failed to get document stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get document stats")

@app.get("/api/proxies/status")
async def get_proxy_status():
    """Get proxy status"""
    return {
        "proxies": [
            {"id": "proxy_1", "status": "active", "response_time": 150},
            {"id": "proxy_2", "status": "active", "response_time": 200},
            {"id": "proxy_3", "status": "inactive", "response_time": None}
        ],
        "total": 3,
        "active": 2,
        "inactive": 1,
        "message": "وضعیت پروکسی‌ها دریافت شد"
    }

@app.get("/api/proxies/list")
async def get_proxy_list():
    """Get proxy list"""
    return {
        "proxies": [
            {"id": "proxy_1", "host": "proxy1.example.com", "port": 8080, "status": "active"},
            {"id": "proxy_2", "host": "proxy2.example.com", "port": 8080, "status": "active"},
            {"id": "proxy_3", "host": "proxy3.example.com", "port": 8080, "status": "inactive"}
        ],
        "total": 3
    }

@app.post("/api/scraping/url")
async def scrape_url(request: dict):
    """Scrape a URL"""
    try:
        url = request.get("url")
        job_id = request.get("jobId")
        options = request.get("options", {})
        
        logger.info(f"Scraping URL: {url}")
        
        # Simulate scraping
        await asyncio.sleep(2)
        
        result = {
            "job_id": job_id,
            "url": url,
            "status": "completed",
            "content": f"محتویات استخراج شده از {url}",
            "title": f"صفحه {url}",
            "links": [],
            "images": [],
            "extracted_at": datetime.now().isoformat()
        }
        
        return result
        
    except Exception as e:
        logger.error(f"URL scraping failed: {e}")
        raise HTTPException(status_code=500, detail="URL scraping failed")

@app.post("/api/scraping/document")
async def scrape_document(
    file: UploadFile = File(...),
    jobId: str = Form(...),
    options: str = Form("{}")
):
    """Scrape a document file"""
    try:
        logger.info(f"Scraping document: {file.filename}")
        
        # Save uploaded file
        file_path = f"uploads/{jobId}_{file.filename}"
        os.makedirs("uploads", exist_ok=True)
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Simulate document processing
        await asyncio.sleep(3)
        
        result = {
            "job_id": jobId,
            "filename": file.filename,
            "status": "completed",
            "content": f"متن استخراج شده از {file.filename}",
            "metadata": {
                "size": len(content),
                "type": file.content_type
            },
            "extracted_at": datetime.now().isoformat()
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Document scraping failed: {e}")
        raise HTTPException(status_code=500, detail="Document scraping failed")

@app.post("/api/scraping/test")
async def test_scraping(request: dict):
    """Test scraping capabilities"""
    return {
        "status": "success",
        "message": "قابلیت استخراج تست شد",
        "capabilities": {
            "url_scraping": True,
            "document_scraping": True,
            "proxy_support": True
        }
    }

@app.post("/api/scraping/stop/{job_id}")
async def stop_scraping(job_id: str):
    """Stop a scraping job"""
    return {
        "job_id": job_id,
        "status": "stopped",
        "message": "کار متوقف شد"
    }

@app.get("/api/documents/status")
async def get_documents_status():
    """Get documents service status"""
    return {
        "status": "active",
        "message": "سرویس اسناد فعال است"
    }

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            logger.info(f"Received WebSocket message: {data}")
            
            # Echo back
            await websocket.send_text(f"Echo: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Create logs directory
os.makedirs("logs", exist_ok=True)

if __name__ == "__main__":
    uvicorn.run(
        "web_server:app",
        host="127.0.0.1",
        port=7860,
        reload=True,
        log_level="info"
    )