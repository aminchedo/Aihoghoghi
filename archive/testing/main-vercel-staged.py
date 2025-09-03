# main-vercel-staged.py - Staged loading FastAPI for Vercel
# VERCEL FIX METHOD B: Progressive enhancement with conditional ML loading

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import asyncio
from typing import List, Dict, Any, Optional
import importlib

app = FastAPI(
    title="Iranian Legal Archive API - Staged Loading",
    description="API with progressive ML feature loading",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for ML services
ml_services = {
    "initialized": False,
    "loading": False,
    "error": None,
    "analyzer": None
}

# Simple document store
documents = [
    {
        "id": 1,
        "title": "قانون مدنی - ماده 10",
        "content": "اشخاص حقیقی از زمان تولد تا هنگام مرگ دارای شخصیت حقوقی هستند.",
        "category": "civil",
        "confidence": 0.95
    },
    {
        "id": 2, 
        "title": "قانون جزا - ماده 1",
        "content": "هیچ عملی جرم محسوب نمی‌شود مگر به موجب قانون.",
        "category": "criminal",
        "confidence": 0.98
    }
]

class SimpleLegalAnalyzer:
    """Fallback analyzer without ML dependencies"""
    
    def __init__(self):
        self.keywords = {
            'civil': ['مدنی', 'قرارداد', 'تعهد', 'شخصیت حقوقی'],
            'criminal': ['جزا', 'جرم', 'مجازات', 'کیفر'],
            'administrative': ['اداری', 'دولت', 'مأمور'],
            'commercial': ['تجارت', 'بازرگانی', 'شرکت']
        }
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """Simple keyword-based analysis"""
        results = {
            'category': 'unknown',
            'confidence': 0.0,
            'keywords_found': [],
            'method': 'rule-based'
        }
        
        max_score = 0
        best_category = 'unknown'
        
        for category, keywords in self.keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > max_score:
                max_score = score
                best_category = category
                results['keywords_found'] = [kw for kw in keywords if kw in text]
        
        if max_score > 0:
            results['category'] = best_category
            results['confidence'] = min(max_score / 2.0, 1.0)
        
        return results

# Initialize simple analyzer
simple_analyzer = SimpleLegalAnalyzer()

async def load_ml_services_background():
    """Load ML services in background"""
    global ml_services
    
    if ml_services["loading"] or ml_services["initialized"]:
        return
    
    ml_services["loading"] = True
    
    try:
        # Try to import ML dependencies
        from transformers import pipeline
        from sentence_transformers import SentenceTransformer
        
        # Initialize models
        classifier = pipeline(
            "text-classification",
            model="HooshvareLab/bert-fa-base-uncased",
            device=-1  # CPU only for Vercel
        )
        
        ml_services["analyzer"] = classifier
        ml_services["initialized"] = True
        ml_services["loading"] = False
        
        print("✅ ML services loaded successfully")
        
    except Exception as e:
        ml_services["error"] = str(e)
        ml_services["loading"] = False
        print(f"❌ ML services failed to load: {e}")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Starting Iranian Legal Archive API")
    
    # Start ML loading in background (non-blocking)
    asyncio.create_task(load_ml_services_background())

@app.get("/")
async def root():
    return {
        "message": "سیستم آرشیو اسناد حقوقی ایران",
        "version": "2.0.0-staged",
        "ml_status": "loading" if ml_services["loading"] else ("ready" if ml_services["initialized"] else "fallback"),
        "features": ["Progressive loading", "Iranian optimized", "Persian support"]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "ml_services": {
            "initialized": ml_services["initialized"],
            "loading": ml_services["loading"],
            "error": ml_services["error"]
        }
    }

@app.post("/api/analyze")
async def analyze_text(request: Request, background_tasks: BackgroundTasks):
    """Analyze text with progressive enhancement"""
    try:
        data = await request.json()
        text = data.get('text', '')
        
        if not text:
            raise HTTPException(status_code=400, detail="متن ارسال نشده است")
        
        # Use ML analyzer if available, otherwise fallback
        if ml_services["initialized"] and ml_services["analyzer"]:
            try:
                # Use ML analysis
                result = ml_services["analyzer"](text)
                return {
                    "success": True,
                    "analysis": {
                        "category": result[0]['label'] if result else 'unknown',
                        "confidence": result[0]['score'] if result else 0.0,
                        "method": "ml-enhanced"
                    }
                }
            except Exception as e:
                print(f"ML analysis failed, using fallback: {e}")
        
        # Fallback to simple analysis
        analysis = simple_analyzer.analyze(text)
        
        # If ML not loaded yet, trigger background loading
        if not ml_services["initialized"] and not ml_services["loading"]:
            background_tasks.add_task(load_ml_services_background)
        
        return {
            "success": True,
            "analysis": analysis,
            "ml_status": "loading" if ml_services["loading"] else "fallback"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در تحلیل: {str(e)}")

@app.get("/api/documents")
async def get_documents(limit: int = 10, category: str = None):
    """Get documents"""
    docs = documents
    
    if category:
        docs = [doc for doc in docs if doc['category'] == category]
    
    return {
        "documents": docs[:limit],
        "total": len(docs)
    }

@app.post("/api/search")
async def search_documents(request: Request):
    """Search documents"""
    try:
        data = await request.json()
        query = data.get('query', '')
        
        results = []
        for doc in documents:
            if query in doc['title'] or query in doc['content']:
                results.append(doc)
        
        return {
            "documents": results,
            "total": len(results),
            "query": query
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در جستجو: {str(e)}")

@app.get("/api/ml-status")
async def get_ml_status():
    """Get ML services status"""
    return {
        "initialized": ml_services["initialized"],
        "loading": ml_services["loading"],
        "error": ml_services["error"],
        "available_features": [
            "Basic analysis" if not ml_services["initialized"] else "Advanced ML analysis"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)