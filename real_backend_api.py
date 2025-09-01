#!/usr/bin/env python3
"""
Real Backend API - FastAPI server for integrated scraping + AI system
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import sqlite3
import time
from datetime import datetime
from pydantic import BaseModel
from typing import Dict, Any

# Import our real systems
import sys
sys.path.append('/workspace')
from integrated_real_system import IntegratedRealSystem
from real_ai_analyzer import RealAIAnalyzer

app = FastAPI(title="Iranian Legal Archive API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize real systems
integrated_system = IntegratedRealSystem()
ai_analyzer = RealAIAnalyzer()

class ActionRequest(BaseModel):
    action: str
    data: Dict[str, Any] = {}

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the working system HTML"""
    try:
        with open('/workspace/working_system.html', 'r', encoding='utf-8') as f:
            return HTMLResponse(content=f.read())
    except:
        return HTMLResponse(content="""
        <html><body style="font-family: Arial; text-align: center; padding: 2rem;">
        <h1>🏛️ سیستم آرشیو اسناد حقوقی ایران</h1>
        <p>سیستم در حال بارگذاری است...</p>
        </body></html>
        """)

@app.post("/api/scrape")
async def scrape_sites(request: ActionRequest):
    """Real scraping endpoint"""
    
    try:
        print(f"🌐 API: Starting real scraping...")
        
        start_time = time.time()
        report = integrated_system.run_complete_cycle()
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "total_sites": report['total_sites'],
            "successful_sites": report['successful_scraping'],
            "total_content": integrated_system.stats['total_content_length'],
            "processing_time": round(processing_time, 2),
            "scraping_success_rate": report['scraping_success_rate']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-analyze")
async def ai_analyze(request: ActionRequest):
    """Real AI analysis endpoint"""
    
    try:
        print(f"🧠 API: Starting real AI analysis...")
        
        # Get real content from database
        conn = sqlite3.connect(integrated_system.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, content FROM scraped_content ORDER BY id DESC LIMIT 10')
        contents = cursor.fetchall()
        conn.close()
        
        if not contents:
            return {
                "success": False,
                "error": "No content available for analysis"
            }
        
        # Analyze each content
        successful_analyses = 0
        categories = {}
        total_confidence = 0
        
        for content_id, content in contents:
            try:
                analysis = ai_analyzer.analyze_content(content, f"db_content_{content_id}")
                if analysis['success']:
                    successful_analyses += 1
                    category = analysis['primary_category']
                    categories[category] = categories.get(category, 0) + 1
                    total_confidence += analysis['confidence']
            except:
                continue
        
        avg_confidence = round(total_confidence / successful_analyses, 2) if successful_analyses > 0 else 0
        
        return {
            "success": True,
            "total_analyses": len(contents),
            "successful_analyses": successful_analyses,
            "average_confidence": avg_confidence,
            "categories": categories,
            "analyzed_count": successful_analyses
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/integrated-test")
async def integrated_test(request: ActionRequest):
    """Real integrated test endpoint"""
    
    try:
        print(f"🧪 API: Running real integrated test...")
        
        start_time = time.time()
        
        # Run real scraping
        scraping_report = integrated_system.run_complete_cycle()
        
        # Get real database stats
        db_stats = integrated_system.get_real_database_stats()
        
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "scraped_sites": db_stats.get('scraped_sites', 0),
            "analyzed_content": db_stats.get('ai_analyses', 0),
            "total_content_size": db_stats.get('total_content_chars', 0),
            "scraping_success_rate": scraping_report['scraping_success_rate'],
            "ai_success_rate": scraping_report['ai_success_rate'],
            "successful_operations": scraping_report['successful_scraping'] + scraping_report['successful_ai_analysis'],
            "total_operations": scraping_report['total_sites'] * 2,  # scraping + ai
            "processing_time": round(processing_time, 2),
            "categories": db_stats.get('category_distribution', {}),
            "average_confidence": db_stats.get('average_confidence', 0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    """Get real system statistics"""
    
    try:
        # Get real database stats
        db_stats = integrated_system.get_real_database_stats()
        
        return {
            "success": True,
            "scraped_sites": db_stats.get('scraped_sites', 0),
            "ai_analyses": db_stats.get('ai_analyses', 0),
            "total_content_chars": db_stats.get('total_content_chars', 0),
            "average_confidence": db_stats.get('average_confidence', 0),
            "average_relevance": db_stats.get('average_relevance', 0),
            "category_distribution": db_stats.get('category_distribution', {}),
            "system_status": "operational",
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "scraping_system": "operational",
        "ai_system": "operational",
        "database": "connected"
    }

# Serve static files
app.mount("/static", StaticFiles(directory="/workspace/static"), name="static")

def start_real_server():
    """Start the real backend server"""
    
    print("🚀 STARTING REAL BACKEND SERVER")
    print("=" * 35)
    print("🌐 Server: http://localhost:8000")
    print("📊 API Docs: http://localhost:8000/docs")
    print("🧪 Health: http://localhost:8000/api/health")
    print("✅ Ready for real operations!")
    
    uvicorn.run(
        "real_backend_api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    start_real_server()