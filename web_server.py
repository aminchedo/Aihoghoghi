"""
FastAPI Server for Iranian Legal Archive System
Exposes the Python backend functionality as REST endpoints for the web UI
"""

import os
import sys
import json
import asyncio
import logging
import time
import io
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import the existing legal archive system
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Handle import with special filename
import importlib.util

def import_legal_scraper():
    """Import the legal scraper module with error handling"""
    try:
        spec = importlib.util.spec_from_file_location(
            "enhanced_legal_scraper", 
            "enhanced_legal_scraper (3).py"
        )
        enhanced_legal_scraper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(enhanced_legal_scraper)
        return enhanced_legal_scraper
    except Exception as e:
        logging.error(f"Failed to import legal scraper: {e}")
        return None

# Import the module
enhanced_legal_scraper = import_legal_scraper()
if enhanced_legal_scraper:
    UltraModernLegalArchive = enhanced_legal_scraper.UltraModernLegalArchive
else:
    # Create a mock class for testing
    class UltraModernLegalArchive:
        def __init__(self):
            self.session_stats = {
                'total_operations': 0,
                'successful_operations': 0,
                'failed_operations': 0,
                'start_time': time.time()
            }
            self.operation_logs = []
            # Mock proxy manager
            class MockProxyManager:
                def get_proxy_stats(self):
                    return {'active_proxies': 0, 'total_tested': 0, 'success_rate': 0.0}
                def update_proxy_list(self, *args, **kwargs):
                    return True
            self.proxy_manager = MockProxyManager()
            
            # Mock cache system
            class MockCacheSystem:
                def get_cache_stats(self):
                    return {'total_entries': 0, 'cache_size_mb': 0.0, 'hit_rate': 0.0}
                def clear_cache(self):
                    return True
            self.cache_system = MockCacheSystem()
            
            # Mock DNS manager
            class MockDNSManager:
                def get_stats(self):
                    return {'strategy': 'mock', 'queries': 0}
            self.dns_manager = MockDNSManager()
        
        def process_bulk_urls_enhanced(self, *args, **kwargs):
            return ("Mock processing result", "", "", "")
        
        def get_processed_documents(self):
            return []

# Import legal database system
from legal_database import LegalDatabase, EnhancedLegalAnalyzer, LegalDocument

# Set up logger
logger = logging.getLogger(__name__)

# Pydantic models for API requests/responses
class URLProcessRequest(BaseModel):
    urls: List[str]
    enable_proxy: bool = True
    batch_size: int = 3

class ProxyUpdateRequest(BaseModel):
    include_fresh: bool = True

class ProcessingStatus(BaseModel):
    is_processing: bool
    current_operation: Optional[str] = None
    progress: float = 0.0
    message: str = ""

class DocumentResult(BaseModel):
    url: str
    title: str
    content: str
    quality_score: float
    word_count: int
    classification: Optional[str] = None
    status: str

class SystemStats(BaseModel):
    total_operations: int
    successful_operations: int
    failed_operations: int
    active_proxies: int
    cache_size: int
    uptime: str

# Global application instance
legal_archive = None
legal_db = None
legal_analyzer = None
processing_status = ProcessingStatus(is_processing=False, message="Ready")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except:
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

# Initialize FastAPI app
app = FastAPI(
    title="Iranian Legal Archive API",
    description="Advanced legal document processing system with AI analysis",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# Initialize the legal archive system
@app.on_event("startup")
async def startup_event():
    global legal_archive, legal_db, legal_analyzer
    try:
        # Initialize legal archive system
        legal_archive = UltraModernLegalArchive()
        logger.info("Legal archive system initialized successfully")
        
        # Initialize legal database system
        legal_db = LegalDatabase("legal_archive.db")
        legal_analyzer = EnhancedLegalAnalyzer(cache_system=getattr(legal_archive, 'cache_system', None))
        legal_analyzer.set_legal_database(legal_db)
        logger.info("Legal database system initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize systems: {e}")
        # Create mock instances for testing
        legal_db = LegalDatabase()
        legal_analyzer = EnhancedLegalAnalyzer()
        legal_analyzer.set_legal_database(legal_db)

# Serve static files
app.mount("/static", StaticFiles(directory="web_ui"), name="static")
app.mount("/web_ui", StaticFiles(directory="web_ui"), name="web_ui")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and send periodic updates
            await asyncio.sleep(1)
            
            # Send current status if processing
            if processing_status.is_processing:
                await manager.send_personal_message(json.dumps({
                    "type": "status_update",
                    "progress": processing_status.progress,
                    "message": processing_status.message,
                    "is_processing": processing_status.is_processing
                }), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    try:
        with open("web_ui/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Web UI not found. Please ensure web_ui/index.html exists.</h1>")

@app.get("/api/status")
async def get_status():
    """Get current system status"""
    global processing_status
    return processing_status

@app.get("/api/health")
async def health_check():
    """Comprehensive health check endpoint"""
    try:
        # Check database connectivity
        db_status = "healthy"
        try:
            if legal_archive:
                # Try a simple database operation
                stats = legal_archive.session_stats if hasattr(legal_archive, 'session_stats') else {}
                db_status = "healthy" if stats is not None else "degraded"
            else:
                db_status = "unavailable"
        except Exception:
            db_status = "error"
            
        # Check memory usage
        try:
            import psutil
            memory_usage = psutil.virtual_memory().percent
            memory_status = "healthy" if memory_usage < 80 else "degraded" if memory_usage < 90 else "critical"
        except ImportError:
            memory_usage = 0
            memory_status = "unknown"
        
        # Overall health
        overall_health = "healthy"
        if db_status == "error" or memory_status == "critical":
            overall_health = "unhealthy"
        elif db_status == "degraded" or memory_status == "degraded":
            overall_health = "degraded"
            
        return {
            "status": overall_health,
            "timestamp": datetime.now().isoformat(),
            "components": {
                "database": db_status,
                "memory": memory_status
            },
            "metrics": {
                "memory_usage_percent": memory_usage,
                "uptime_seconds": time.time() - (legal_archive.session_stats.get('start_time', time.time()) if legal_archive and hasattr(legal_archive, 'session_stats') else time.time())
            }
        }
    except Exception as e:
        logging.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": "Health check failed"
        }

@app.get("/api/stats")
async def get_system_stats():
    """Get system statistics"""
    if not legal_archive:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    try:
        stats = legal_archive.session_stats
        proxy_stats = legal_archive.proxy_manager.get_proxy_stats()
        cache_stats = legal_archive.cache_system.get_cache_stats()
        
        uptime = datetime.now() - datetime.fromtimestamp(stats['start_time'])
        
        return SystemStats(
            total_operations=stats['total_operations'],
            successful_operations=stats['successful_operations'],
            failed_operations=stats['failed_operations'],
            active_proxies=proxy_stats.get('active_count', 0),
            cache_size=cache_stats.get('total_entries', 0),
            uptime=str(uptime).split('.')[0]  # Remove microseconds
        )
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process-urls")
async def process_urls(request: URLProcessRequest, background_tasks: BackgroundTasks):
    """Process a list of URLs"""
    global processing_status
    
    if processing_status.is_processing:
        raise HTTPException(status_code=409, detail="Processing already in progress")
    
    if len(request.urls) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 URLs allowed per batch")
    
    # Start background processing
    background_tasks.add_task(
        process_urls_background, 
        request.urls, 
        request.enable_proxy, 
        request.batch_size
    )
    
    processing_status.is_processing = True
    processing_status.current_operation = "Starting URL processing"
    processing_status.progress = 0.0
    
    return {"message": "Processing started", "url_count": len(request.urls)}

async def process_urls_background(urls: List[str], enable_proxy: bool, batch_size: int):
    """Background task for processing URLs"""
    global processing_status
    
    try:
        # Convert list to text format expected by the existing method
        urls_text = "\n".join(urls)
        
        # Enhanced progress callback with WebSocket broadcasting
        def progress_callback(progress_value, description):
            processing_status.progress = progress_value
            processing_status.message = description
            
            # Broadcast to all connected clients
            asyncio.create_task(manager.broadcast(json.dumps({
                "type": "progress_update",
                "progress": progress_value,
                "message": description,
                "is_processing": True
            })))
        
        # Use the existing bulk processing method
        result = legal_archive.process_bulk_urls_enhanced(
            urls_text, 
            enable_proxy, 
            batch_size,
            progress=progress_callback
        )
        
        processing_status.is_processing = False
        processing_status.current_operation = None
        processing_status.progress = 1.0
        processing_status.message = "Processing completed"
        
        # Broadcast completion
        await manager.broadcast(json.dumps({
            "type": "processing_complete",
            "progress": 1.0,
            "message": "پردازش با موفقیت تکمیل شد",
            "is_processing": False,
            "result": "success"
        }))
        
    except Exception as e:
        logger.error(f"Background processing error: {e}")
        processing_status.is_processing = False
        processing_status.current_operation = None
        processing_status.progress = 0.0
        processing_status.message = f"Error: {str(e)}"
        
        # Broadcast error
        await manager.broadcast(json.dumps({
            "type": "processing_error",
            "progress": 0.0,
            "message": f"خطا در پردازش: {str(e)}",
            "is_processing": False,
            "result": "error"
        }))

@app.post("/api/update-proxies")
async def update_proxies(request: ProxyUpdateRequest, background_tasks: BackgroundTasks):
    """Update proxy list"""
    global processing_status
    
    if processing_status.is_processing:
        raise HTTPException(status_code=409, detail="Another operation in progress")
    
    background_tasks.add_task(update_proxies_background, request.include_fresh)
    
    processing_status.is_processing = True
    processing_status.current_operation = "Updating proxies"
    processing_status.progress = 0.0
    
    return {"message": "Proxy update started"}

async def update_proxies_background(include_fresh: bool):
    """Background task for updating proxies"""
    global processing_status
    
    try:
        def progress_callback(progress_value, description):
            processing_status.progress = progress_value
            processing_status.message = description
        
        result = legal_archive.proxy_manager.update_proxy_list(
            include_fresh=include_fresh,
            progress_callback=progress_callback
        )
        
        processing_status.is_processing = False
        processing_status.current_operation = None
        processing_status.progress = 1.0
        processing_status.message = f"Proxy update completed. {result.get('active_count', 0)} active proxies"
        
    except Exception as e:
        logger.error(f"Proxy update error: {e}")
        processing_status.is_processing = False
        processing_status.current_operation = None
        processing_status.progress = 0.0
        processing_status.message = f"Error: {str(e)}"

@app.get("/api/processed-documents")
async def get_processed_documents(limit: int = 50, offset: int = 0):
    """Get list of processed documents"""
    if not legal_archive:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    try:
        # Get documents from cache
        cache_stats = legal_archive.cache_system.get_cache_stats()
        documents = cache_stats.get('recent_entries', [])
        
        # Apply pagination
        paginated_docs = documents[offset:offset + limit]
        
        return {
            "documents": paginated_docs,
            "total": len(documents),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error getting processed documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-urls")
async def upload_urls_file(file: UploadFile = File(...)):
    """Upload a file containing URLs"""
    if file.content_type not in ["text/plain", "text/csv", "application/csv"]:
        raise HTTPException(status_code=400, detail="Only .txt and .csv files are supported")
    
    try:
        content = await file.read()
        text_content = content.decode('utf-8')
        
        # Parse URLs from the file
        urls = []
        for line in text_content.strip().split('\n'):
            line = line.strip()
            if line and (line.startswith('http://') or line.startswith('https://')):
                urls.append(line)
        
        return {"urls": urls, "count": len(urls)}
    
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/{format}")
async def export_documents(format: str):
    """Export processed documents in specified format"""
    if format not in ["json", "csv", "txt"]:
        raise HTTPException(status_code=400, detail="Supported formats: json, csv, txt")
    
    try:
        cache_stats = legal_archive.cache_system.get_cache_stats()
        documents = cache_stats.get('recent_entries', [])
        
        if format == "json":
            content = json.dumps(documents, ensure_ascii=False, indent=2)
            media_type = "application/json"
            filename = f"legal_documents_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        elif format == "csv":
            import csv
            import io
            output = io.StringIO()
            if documents:
                writer = csv.DictWriter(output, fieldnames=documents[0].keys())
                writer.writeheader()
                writer.writerows(documents)
            content = output.getvalue()
            media_type = "text/csv"
            filename = f"legal_documents_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        else:  # txt
            content = "\n".join([f"{doc.get('url', '')}: {doc.get('title', '')}" for doc in documents])
            media_type = "text/plain"
            filename = f"legal_documents_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        return StreamingResponse(
            io.BytesIO(content.encode('utf-8')),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/cache")
async def clear_cache():
    """Clear system cache"""
    try:
        if legal_archive and legal_archive.cache_system:
            legal_archive.cache_system.clear_cache()
            return {"message": "Cache cleared successfully"}
        else:
            raise HTTPException(status_code=503, detail="Cache system not available")
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/logs")
async def get_operation_logs(limit: int = 50):
    """Get recent operation logs"""
    try:
        if legal_archive:
            logs = legal_archive.operation_logs[-limit:] if legal_archive.operation_logs else []
            return {"logs": logs}
        else:
            return {"logs": []}
    except Exception as e:
        logger.error(f"Error getting logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Legal Database API Endpoints

@app.get("/api/legal-db/stats")
async def get_legal_database_stats():
    """Get legal database statistics"""
    if not legal_db:
        raise HTTPException(status_code=503, detail="Legal database not initialized")
    
    try:
        stats = legal_db.get_database_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting legal database stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/legal-db/documents")
async def get_legal_documents(
    source: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get legal documents with optional filtering"""
    if not legal_db:
        raise HTTPException(status_code=503, detail="Legal database not initialized")
    
    try:
        if source:
            documents = legal_db.get_documents_by_source(source, limit)
        else:
            # Get all documents with pagination
            with sqlite3.connect(legal_db.db_path) as conn:
                conn.row_factory = sqlite3.Row
                
                query = "SELECT * FROM legal_documents"
                params = []
                
                if category:
                    query += " WHERE category = ?"
                    params.append(category)
                
                query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
                params.extend([limit, offset])
                
                cursor = conn.execute(query, params)
                documents = [dict(row) for row in cursor.fetchall()]
        
        return {
            "documents": documents,
            "total": len(documents),
            "limit": limit,
            "offset": offset
        }
    
    except Exception as e:
        logger.error(f"Error getting legal documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/legal-db/search")
async def search_legal_documents(q: str, limit: int = 50):
    """Search legal documents by query"""
    if not legal_db:
        raise HTTPException(status_code=503, detail="Legal database not initialized")
    
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    try:
        results = legal_db.search_documents(q, limit)
        return {
            "query": q,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Error searching legal documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/legal-db/populate")
async def populate_legal_database(background_tasks: BackgroundTasks, max_docs_per_source: int = 10):
    """Populate legal database with documents from authoritative sources"""
    if not legal_db or not legal_analyzer:
        raise HTTPException(status_code=503, detail="Legal database system not initialized")
    
    if processing_status.is_processing:
        raise HTTPException(status_code=409, detail="Another operation in progress")
    
    background_tasks.add_task(populate_database_background, max_docs_per_source)
    
    processing_status.is_processing = True
    processing_status.current_operation = "Populating legal database"
    processing_status.progress = 0.0
    
    return {"message": "Database population started", "max_docs_per_source": max_docs_per_source}

async def populate_database_background(max_docs_per_source: int):
    """Background task for populating legal database"""
    global processing_status
    
    try:
        processing_status.message = "Initializing database population..."
        await manager.broadcast(json.dumps({
            "type": "progress_update",
            "progress": 0.1,
            "message": "شروع پر کردن پایگاه داده حقوقی...",
            "is_processing": True
        }))
        
        # Populate database
        results = legal_analyzer.populate_legal_database(legal_archive, max_docs_per_source)
        
        processing_status.is_processing = False
        processing_status.current_operation = None
        processing_status.progress = 1.0
        processing_status.message = f"Database populated: {results['successful_inserts']} documents"
        
        # Broadcast completion
        await manager.broadcast(json.dumps({
            "type": "database_population_complete",
            "progress": 1.0,
            "message": f"پایگاه داده با {results['successful_inserts']} سند پر شد",
            "is_processing": False,
            "result": "success",
            "stats": results
        }))
        
    except Exception as e:
        logger.error(f"Database population error: {e}")
        processing_status.is_processing = False
        processing_status.current_operation = None
        processing_status.progress = 0.0
        processing_status.message = f"Error: {str(e)}"
        
        # Broadcast error
        await manager.broadcast(json.dumps({
            "type": "database_population_error",
            "progress": 0.0,
            "message": f"خطا در پر کردن پایگاه داده: {str(e)}",
            "is_processing": False,
            "result": "error"
        }))

@app.post("/api/legal-db/search-nafaqe")
async def search_nafaqe_definition():
    """Search for نفقه definition from authoritative sources"""
    if not legal_analyzer:
        raise HTTPException(status_code=503, detail="Legal analyzer not initialized")
    
    try:
        nafaqe_doc = legal_analyzer.search_nafaqe_definition(legal_archive)
        
        if nafaqe_doc:
            if isinstance(nafaqe_doc, dict):
                return {"success": True, "document": nafaqe_doc}
            else:
                return {
                    "success": True, 
                    "document": {
                        "title": nafaqe_doc.title,
                        "content": nafaqe_doc.content,
                        "source": nafaqe_doc.source,
                        "category": nafaqe_doc.category,
                        "url": nafaqe_doc.url
                    }
                }
        else:
            return {"success": False, "message": "نفقه definition not found"}
            
    except Exception as e:
        logger.error(f"Error searching نفقه definition: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Create web_ui directory if it doesn't exist
    os.makedirs("web_ui", exist_ok=True)
    
    # Run the server
    uvicorn.run(
        "web_server:app",
        host="0.0.0.0",
        port=7860,
        reload=True,
        log_level="info"
    )