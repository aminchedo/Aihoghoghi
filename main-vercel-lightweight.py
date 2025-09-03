# main-vercel-lightweight.py - Ultra-lightweight FastAPI for Vercel deployment
# VERCEL FIX METHOD A: Core functionality only, no ML dependencies

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import re
import os
from typing import List, Dict, Any
import asyncio

app = FastAPI(
    title="Iranian Legal Archive API - Lightweight",
    description="Lightweight API for Iranian Legal Document Archive",
    version="2.0.0"
)

# Configure CORS for Iranian access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aminchedo.github.io",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  # Allow all origins for Iranian access
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory data store (replaces database for lightweight deployment)
legal_documents = [
    {
        "id": 1,
        "title": "قانون مدنی - ماده 10",
        "content": "اشخاص حقیقی از زمان تولد تا هنگام مرگ دارای شخصیت حقوقی هستند.",
        "category": "civil",
        "type": "law",
        "date": "1397/01/01"
    },
    {
        "id": 2,
        "title": "قانون جزا - ماده 1",
        "content": "هیچ عملی جرم محسوب نمی‌شود مگر به موجب قانون.",
        "category": "criminal", 
        "type": "law",
        "date": "1392/01/01"
    },
    {
        "id": 3,
        "title": "رای دیوان عدالت اداری",
        "content": "تصمیمات اداری باید بر اساس قانون و مقررات باشد.",
        "category": "administrative",
        "type": "court_decision",
        "date": "1402/05/15"
    }
]

# Persian text analysis without ML dependencies
class SimplePersianAnalyzer:
    def __init__(self):
        self.legal_keywords = {
            'civil': ['مدنی', 'قرارداد', 'تعهد', 'اموال', 'شخصیت حقوقی'],
            'criminal': ['جزا', 'مجازات', 'جرم', 'کیفر', 'محکومیت'],
            'administrative': ['اداری', 'دولت', 'مأمور', 'خدمات عمومی'],
            'commercial': ['تجارت', 'بازرگانی', 'شرکت', 'تجاری'],
            'family': ['خانواده', 'ازدواج', 'طلاق', 'نفقه'],
            'constitutional': ['اساسی', 'قانون اساسی', 'اصول']
        }
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Simple rule-based analysis without ML"""
        results = {
            'category': 'unknown',
            'confidence': 0.0,
            'keywords_found': [],
            'text_length': len(text),
            'word_count': len(text.split()),
            'language': 'persian' if self.is_persian(text) else 'other'
        }
        
        # Find category based on keywords
        max_score = 0
        best_category = 'unknown'
        
        for category, keywords in self.legal_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > max_score:
                max_score = score
                best_category = category
                results['keywords_found'] = [kw for kw in keywords if kw in text]
        
        if max_score > 0:
            results['category'] = best_category
            results['confidence'] = min(max_score / 3.0, 1.0)  # Normalize to 0-1
        
        return results
    
    def is_persian(self, text: str) -> bool:
        """Check if text contains Persian characters"""
        persian_pattern = r'[\u0600-\u06FF]'
        return bool(re.search(persian_pattern, text))

# Initialize analyzer
analyzer = SimplePersianAnalyzer()

@app.get("/")
async def root():
    """Root endpoint with system info"""
    return {
        "message": "سیستم آرشیو اسناد حقوقی ایران",
        "version": "2.0.0-lightweight",
        "status": "active",
        "deployment": "vercel-optimized",
        "features": [
            "Persian text analysis",
            "Legal document search", 
            "Simple classification",
            "Iranian network optimized"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2025-01-02T00:00:00Z",
        "services": {
            "api": "operational",
            "analyzer": "operational",
            "database": "in-memory"
        }
    }

@app.get("/api/documents")
async def get_documents(limit: int = 10, category: str = None):
    """Get legal documents"""
    docs = legal_documents
    
    if category:
        docs = [doc for doc in docs if doc['category'] == category]
    
    return {
        "documents": docs[:limit],
        "total": len(docs),
        "categories": list(set(doc['category'] for doc in legal_documents))
    }

@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: int):
    """Get specific document"""
    doc = next((doc for doc in legal_documents if doc['id'] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="سند یافت نشد")
    return doc

@app.post("/api/analyze")
async def analyze_text(request: Request):
    """Analyze Persian legal text"""
    try:
        data = await request.json()
        text = data.get('text', '')
        
        if not text:
            raise HTTPException(status_code=400, detail="متن ارسال نشده است")
        
        # Perform simple analysis
        analysis = analyzer.analyze_text(text)
        
        return {
            "success": True,
            "analysis": analysis,
            "processed_at": "2025-01-02T00:00:00Z",
            "method": "rule-based"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در تحلیل متن: {str(e)}")

@app.post("/api/search")
async def search_documents(request: Request):
    """Search legal documents"""
    try:
        data = await request.json()
        query = data.get('query', '')
        
        if not query:
            return {"documents": legal_documents, "total": len(legal_documents)}
        
        # Simple text search
        results = []
        for doc in legal_documents:
            if (query in doc['title'] or 
                query in doc['content'] or
                query in doc['category']):
                results.append(doc)
        
        return {
            "documents": results,
            "total": len(results),
            "query": query
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در جستجو: {str(e)}")

@app.get("/api/categories")
async def get_categories():
    """Get available legal categories"""
    categories = [
        {"id": "civil", "name": "حقوق مدنی", "count": 1},
        {"id": "criminal", "name": "حقوق جزا", "count": 1},
        {"id": "administrative", "name": "حقوق اداری", "count": 1},
        {"id": "commercial", "name": "حقوق تجارت", "count": 0},
        {"id": "family", "name": "حقوق خانواده", "count": 0},
        {"id": "constitutional", "name": "حقوق قانون اساسی", "count": 0}
    ]
    
    return {"categories": categories}

@app.get("/api/stats")
async def get_stats():
    """Get system statistics"""
    return {
        "total_documents": len(legal_documents),
        "categories": len(set(doc['category'] for doc in legal_documents)),
        "last_updated": "2025-01-02T00:00:00Z",
        "deployment_type": "vercel-lightweight",
        "persian_support": True,
        "iranian_optimized": True
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"detail": "صفحه یا منبع مورد نظر یافت نشد"}
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=500,
        content={"detail": "خطای داخلی سرور"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)