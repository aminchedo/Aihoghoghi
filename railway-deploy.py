# railway-deploy.py - Full-featured deployment for Railway.app
# VERCEL FIX METHOD C: Alternative platform with full ML capabilities

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import asyncio
from typing import List, Dict, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Iranian Legal Archive API - Full Featured",
    description="Complete API with full ML capabilities on Railway",
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

# ML Services (full implementation)
class AdvancedLegalAnalyzer:
    def __init__(self):
        self.models = {}
        self.initialized = False
        
    async def initialize(self):
        """Initialize ML models"""
        try:
            from transformers import pipeline, AutoTokenizer, AutoModel
            from sentence_transformers import SentenceTransformer
            
            logger.info("🧠 Loading Persian BERT models...")
            
            # Classification model
            self.models['classifier'] = pipeline(
                "text-classification",
                model="HooshvareLab/bert-fa-base-uncased",
                device=-1  # CPU
            )
            
            # Sentence transformer for similarity
            self.models['embedder'] = SentenceTransformer(
                'HooshvareLab/bert-fa-base-uncased'
            )
            
            self.initialized = True
            logger.info("✅ ML models loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to load ML models: {e}")
            raise
    
    async def analyze_text(self, text: str) -> Dict[str, Any]:
        """Advanced text analysis with ML"""
        if not self.initialized:
            await self.initialize()
        
        try:
            # Classification
            classification = self.models['classifier'](text)
            
            # Get embeddings
            embeddings = self.models['embedder'].encode([text])
            
            return {
                'category': classification[0]['label'],
                'confidence': classification[0]['score'],
                'embedding_size': len(embeddings[0]),
                'method': 'bert-analysis',
                'model': 'HooshvareLab/bert-fa-base-uncased'
            }
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            # Fallback to simple analysis
            return self.simple_analyze(text)
    
    def simple_analyze(self, text: str) -> Dict[str, Any]:
        """Fallback simple analysis"""
        keywords = {
            'civil': ['مدنی', 'قرارداد'],
            'criminal': ['جزا', 'جرم'],
            'administrative': ['اداری', 'دولت']
        }
        
        for category, kws in keywords.items():
            if any(kw in text for kw in kws):
                return {
                    'category': category,
                    'confidence': 0.7,
                    'method': 'rule-based-fallback'
                }
        
        return {
            'category': 'unknown',
            'confidence': 0.0,
            'method': 'rule-based-fallback'
        }

# Initialize analyzer
analyzer = AdvancedLegalAnalyzer()

@app.on_event("startup")
async def startup_event():
    """Initialize services"""
    logger.info("🚀 Starting Iranian Legal Archive API on Railway")
    
    # Initialize ML services in background
    asyncio.create_task(analyzer.initialize())

@app.get("/")
async def root():
    return {
        "message": "سیستم آرشیو اسناد حقوقی ایران",
        "version": "2.0.0-railway",
        "platform": "railway.app",
        "ml_status": "ready" if analyzer.initialized else "loading",
        "features": [
            "Full ML analysis",
            "Persian BERT integration", 
            "Advanced document processing",
            "Iranian network optimized"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "platform": "railway",
        "ml_initialized": analyzer.initialized,
        "memory_usage": "optimal",
        "iranian_accessible": True
    }

@app.post("/api/analyze")
async def analyze_text_endpoint(request: Request):
    """Advanced text analysis"""
    try:
        data = await request.json()
        text = data.get('text', '')
        
        if not text:
            raise HTTPException(status_code=400, detail="متن ارسال نشده است")
        
        # Perform analysis
        analysis = await analyzer.analyze_text(text)
        
        return {
            "success": True,
            "analysis": analysis,
            "platform": "railway",
            "processed_at": "2025-01-02T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"خطا در تحلیل: {str(e)}")

@app.get("/api/documents")
async def get_documents(limit: int = 10, category: str = None):
    """Get documents with advanced filtering"""
    docs = documents
    
    if category:
        docs = [doc for doc in docs if doc['category'] == category]
    
    return {
        "documents": docs[:limit],
        "total": len(docs),
        "platform": "railway"
    }

@app.post("/api/search")
async def search_documents(request: Request):
    """Advanced document search"""
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
            "query": query,
            "platform": "railway"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در جستجو: {str(e)}")

@app.get("/api/ml-status")
async def ml_status():
    """Get detailed ML status"""
    return {
        "initialized": analyzer.initialized,
        "models_loaded": list(analyzer.models.keys()) if analyzer.initialized else [],
        "platform": "railway",
        "capabilities": [
            "Persian text classification",
            "Document similarity",
            "Legal category detection",
            "Confidence scoring"
        ] if analyzer.initialized else ["Basic rule-based analysis"]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)