"""
FastAPI Application for Iranian Legal Archive System
Advanced web scraping platform with modern UI and comprehensive API
"""

import os
import sys
import asyncio
import logging
import json
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import uvicorn

# Import our modular components
from utils import UltraModernLegalArchive, AUTHORITATIVE_LEGAL_SOURCES

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Iranian Legal Archive System",
    description="Advanced web scraping platform for Iranian legal documents",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates and static files
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Global system orchestrator
legal_archive = UltraModernLegalArchive()

# WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Pydantic models
class ProcessURLsRequest(BaseModel):
    urls: List[str]
    use_proxy: bool = True
    batch_size: int = 5
    max_retries: int = 3

class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    source: Optional[str] = None
    limit: int = 50

class CacheRequest(BaseModel):
    category: Optional[str] = None
    older_than_hours: Optional[int] = None

# Processing state
processing_state = {
    "is_processing": False,
    "current_batch": 0,
    "total_batches": 0,
    "processed_count": 0,
    "failed_count": 0,
    "current_url": "",
    "start_time": None,
    "results": []
}

# Routes

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Main dashboard page"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "title": "Iranian Legal Archive System",
        "sources": AUTHORITATIVE_LEGAL_SOURCES
    })

@app.get("/api/status")
async def get_status():
    """Get current system status"""
    return {
        "processing": processing_state["is_processing"],
        "current_batch": processing_state["current_batch"],
        "total_batches": processing_state["total_batches"],
        "processed_count": processing_state["processed_count"],
        "failed_count": processing_state["failed_count"],
        "current_url": processing_state["current_url"],
        "uptime": time.time() - app.state.start_time if hasattr(app.state, 'start_time') else 0
    }

@app.get("/api/stats")
async def get_system_stats():
    """Get comprehensive system statistics"""
    try:
        system_health = legal_archive.get_system_health()
        document_stats = legal_archive.get_document_statistics()
        session_stats = legal_archive.get_session_statistics()
        
        return {
            "system_health": system_health,
            "documents": document_stats,
            "session": session_stats,
            "sources": {
                "total": len(AUTHORITATIVE_LEGAL_SOURCES),
                "categories": list(set(s["category"] for s in AUTHORITATIVE_LEGAL_SOURCES.values()))
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process-urls")
async def process_urls(request: ProcessURLsRequest, background_tasks: BackgroundTasks):
    """Start processing URLs in background"""
    if processing_state["is_processing"]:
        raise HTTPException(status_code=400, detail="Processing already in progress")
    
    background_tasks.add_task(
        process_urls_background,
        request.urls,
        request.use_proxy,
        request.batch_size,
        request.max_retries
    )
    
    return {"message": "Processing started", "total_urls": len(request.urls)}

async def process_urls_background(urls: List[str], use_proxy: bool, batch_size: int, max_retries: int):
    """Background task for processing URLs"""
    processing_state["is_processing"] = True
    processing_state["start_time"] = time.time()
    processing_state["total_batches"] = (len(urls) + batch_size - 1) // batch_size
    processing_state["processed_count"] = 0
    processing_state["failed_count"] = 0
    processing_state["results"] = []
    
    try:
        # Setup proxy if requested
        if use_proxy and not proxy_manager.active_proxies:
            await manager.broadcast(json.dumps({
                "type": "info",
                "message": "Testing proxies before processing..."
            }))
            proxy_manager.bulk_test_proxies(max_workers=5)
        
        # Process URLs in batches
        for batch_idx in range(0, len(urls), batch_size):
            processing_state["current_batch"] = (batch_idx // batch_size) + 1
            batch_urls = urls[batch_idx:batch_idx + batch_size]
            
            await manager.broadcast(json.dumps({
                "type": "progress",
                "batch": processing_state["current_batch"],
                "total_batches": processing_state["total_batches"],
                "message": f"Processing batch {processing_state['current_batch']}/{processing_state['total_batches']}"
            }))
            
            # Process each URL in the batch
            for url in batch_urls:
                processing_state["current_url"] = url
                
                try:
                    result = await process_single_url(url, use_proxy, max_retries)
                    processing_state["results"].append(result)
                    processing_state["processed_count"] += 1
                    
                    await manager.broadcast(json.dumps({
                        "type": "success",
                        "url": url,
                        "result": result
                    }))
                    
                except Exception as e:
                    processing_state["failed_count"] += 1
                    error_result = {
                        "url": url,
                        "status": "error",
                        "error": str(e),
                        "timestamp": datetime.now().isoformat()
                    }
                    processing_state["results"].append(error_result)
                    
                    await manager.broadcast(json.dumps({
                        "type": "error",
                        "url": url,
                        "error": str(e)
                    }))
                
                # Small delay between requests
                await asyncio.sleep(0.5)
        
        # Processing completed
        processing_time = time.time() - processing_state["start_time"]
        await manager.broadcast(json.dumps({
            "type": "completed",
            "total_processed": processing_state["processed_count"],
            "total_failed": processing_state["failed_count"],
            "processing_time": processing_time
        }))
        
    except Exception as e:
        await manager.broadcast(json.dumps({
            "type": "error",
            "message": f"Processing failed: {str(e)}"
        }))
    
    finally:
        processing_state["is_processing"] = False
        processing_state["current_url"] = ""

async def process_single_url(url: str, use_proxy: bool, max_retries: int) -> Dict[str, Any]:
    """Process a single URL using the orchestrator"""
    try:
        result = legal_archive.process_single_document(url, use_proxy, max_retries)
        return result
    except Exception as e:
        logger.error(f"Error processing URL {url}: {e}")
        return {
            "url": url,
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/update-proxies")
async def update_proxies(background_tasks: BackgroundTasks):
    """Update proxy list"""
    background_tasks.add_task(update_proxies_background)
    return {"message": "Proxy update started"}

async def update_proxies_background():
    """Background task for updating proxies"""
    try:
        await manager.broadcast(json.dumps({
            "type": "info",
            "message": "Starting proxy update..."
        }))
        
        def progress_callback(progress, message):
            asyncio.create_task(manager.broadcast(json.dumps({
                "type": "proxy_progress",
                "progress": progress,
                "message": message
            })))
        
        results = legal_archive.proxy_manager.update_proxy_list(
            include_fresh=True,
            progress_callback=progress_callback
        )
        
        await manager.broadcast(json.dumps({
            "type": "proxy_completed",
            "results": results
        }))
        
    except Exception as e:
        await manager.broadcast(json.dumps({
            "type": "error",
            "message": f"Proxy update failed: {str(e)}"
        }))

@app.post("/api/upload-urls")
async def upload_urls(file: UploadFile = File(...)):
    """Upload URLs from file"""
    if not file.filename.endswith(('.txt', '.csv')):
        raise HTTPException(status_code=400, detail="Only .txt and .csv files are supported")
    
    try:
        content = await file.read()
        text_content = content.decode('utf-8')
        
        # Extract URLs
        urls = []
        for line in text_content.split('\n'):
            line = line.strip()
            if line and (line.startswith('http://') or line.startswith('https://')):
                urls.append(line)
        
        return {"urls": urls, "count": len(urls)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/api/processed-documents")
async def get_processed_documents(
    limit: int = 50,
    category: Optional[str] = None,
    min_score: Optional[float] = None
):
    """Get processed documents with filtering"""
    try:
        # Filter results based on parameters
        results = processing_state["results"]
        
        if category:
            results = [r for r in results if r.get("classification") == category]
        
        if min_score is not None:
            results = [r for r in results if r.get("quality_score", 0) >= min_score]
        
        # Sort by quality score descending
        results = sorted(results, key=lambda x: x.get("quality_score", 0), reverse=True)
        
        return {
            "documents": results[:limit],
            "total": len(results),
            "filtered": len(results) != len(processing_state["results"])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/{format}")
async def export_documents(format: str):
    """Export processed documents"""
    if format not in ["json", "csv"]:
        raise HTTPException(status_code=400, detail="Supported formats: json, csv")
    
    try:
        results = processing_state["results"]
        
        if format == "json":
            return JSONResponse(content=results)
        
        elif format == "csv":
            import pandas as pd
            import io
            
            # Flatten results for CSV
            flattened_results = []
            for result in results:
                flat_result = {
                    "url": result.get("url", ""),
                    "title": result.get("title", ""),
                    "status": result.get("status", ""),
                    "classification": result.get("classification", ""),
                    "quality_score": result.get("quality_score", 0),
                    "quality_grade": result.get("quality_grade", ""),
                    "processing_time": result.get("processing_time", 0),
                    "timestamp": result.get("timestamp", "")
                }
                flattened_results.append(flat_result)
            
            df = pd.DataFrame(flattened_results)
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False, encoding='utf-8')
            csv_content = csv_buffer.getvalue()
            
            return StreamingResponse(
                io.StringIO(csv_content),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=legal_documents.csv"}
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/cache")
async def clear_cache(request: CacheRequest):
    """Clear cache"""
    try:
        legal_archive.cache_system.clear_cache(
            category=request.category,
            older_than_hours=request.older_than_hours
        )
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cache/stats")
async def get_cache_stats():
    """Get cache statistics"""
    try:
        stats = legal_archive.cache_system.get_stats()
        health = legal_archive.cache_system.get_cache_health()
        return {"stats": stats, "health": health}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
async def search_documents(request: SearchRequest):
    """Search processed documents"""
    try:
        results = legal_archive.search_documents(
            query=request.query,
            category=request.category,
            source=request.source,
            limit=request.limit
        )
        
        return {
            "results": results,
            "total_matches": len(results),
            "query": request.query
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for keep-alive
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    """Initialize application"""
    app.state.start_time = time.time()
    logger.info("🏛️ Iranian Legal Archive System started")
    
    # Initialize proxy testing in background
    import threading
    def init_proxies():
        try:
            legal_archive.proxy_manager.bulk_test_proxies(max_workers=5)
            logger.info(f"✅ Initialized with {len(legal_archive.proxy_manager.active_proxies)} active proxies")
        except Exception as e:
            logger.error(f"❌ Proxy initialization error: {e}")
    
    threading.Thread(target=init_proxies, daemon=True).start()
    
    # Run system cleanup and optimization
    def optimize_system():
        try:
            legal_archive.cleanup_and_optimize()
            logger.info("✅ System optimization completed")
        except Exception as e:
            logger.error(f"❌ System optimization error: {e}")
    
    threading.Thread(target=optimize_system, daemon=True).start()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Iranian Legal Archive System shutting down")

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )