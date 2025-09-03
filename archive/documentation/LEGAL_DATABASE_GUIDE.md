# 🏛️ Legal Database System - Comprehensive Guide

## 📋 Overview

The Legal Database System is an advanced enhancement to the Iranian Legal Archive System that provides:

- **Structured Legal Document Storage**: Dedicated SQLite table for legal documents
- **AI-Powered Analysis**: BERT-based classification and semantic analysis
- **Full-Text Search**: Advanced search capabilities with FTS5
- **Authoritative Source Integration**: Based on predefined authoritative legal sources
- **Real-World Testing**: Includes نفقه (alimony) definition extraction

## 🗄️ Database Schema

### Legal Documents Table

```sql
CREATE TABLE legal_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,                    -- e.g., "مجلس شورای اسلامی"
    url TEXT UNIQUE NOT NULL,                -- Document URL
    title TEXT,                              -- Document title
    content TEXT,                            -- Normalized content
    category TEXT,                           -- Legal category
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    hash TEXT UNIQUE,                        -- Content deduplication
    analysis TEXT,                           -- JSON AI analysis results
    reliability_score REAL DEFAULT 0.0,     -- Source reliability (0.0-1.0)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Authoritative Sources

The system recognizes these authoritative Iranian legal sources:

1. **مجلس شورای اسلامی** (Islamic Parliament)
   - Reliability: 0.98
   - Category: قانون (Law)
   - Base URLs: rc.majlis.ir, majlis.ir

2. **پورتال ملی قوانین** (National Laws Portal)
   - Reliability: 0.96
   - Category: قانون (Law)
   - Base URLs: dotic.ir

3. **قوه قضاییه** (Judiciary)
   - Reliability: 0.95
   - Category: دادنامه (Verdict)
   - Base URLs: judiciary.ir, eadl.ir

4. **کانون وکلای دادگستری** (Bar Association)
   - Reliability: 0.90
   - Category: رویه_قضایی (Judicial Practice)
   - Base URLs: icbar.ir

5. **روزنامه رسمی** (Official Gazette)
   - Reliability: 0.99
   - Category: آگهی_قانونی (Legal Notice)
   - Base URLs: rrk.ir

## 🧠 AI Analysis Features

### Classification Categories

- **قانون_اساسی**: Constitutional laws
- **قانون_عادی**: Ordinary laws
- **دادنامه**: Court verdicts
- **رویه_قضایی**: Judicial practices
- **نفقه_و_حقوق_خانواده**: Alimony and family law

### Analysis Results

Each document analysis includes:

```json
{
    "timestamp": "2025-09-01T09:35:00Z",
    "content_length": 1500,
    "word_count": 250,
    "classification": {
        "rule_based": {
            "primary_category": "نفقه_و_حقوق_خانواده",
            "confidence": 0.85,
            "matched_patterns": ["نفقه", "ماده ۱۱۰۶"]
        },
        "ai_based": {
            "label": "FAMILY_LAW",
            "confidence": 0.92
        }
    },
    "legal_entities": ["ماده ۱۱۰۶", "قانون مدنی", "دادگاه خانواده"],
    "key_terms": [
        {"term": "نفقه", "count": 8},
        {"term": "زوجه", "count": 5},
        {"term": "شوهر", "count": 6}
    ],
    "embeddings": [0.123, 0.456, ...],
    "confidence_score": 0.88
}
```

## 🔍 نفقه (Alimony) Definition Test Case

### What is نفقه?

نفقه (Nafaqe/Alimony) in Iranian law refers to the financial support that a husband is legally obligated to provide to his wife. The system successfully extracts and analyzes نفقه-related documents.

### Test Results

The system successfully:
1. ✅ Created comprehensive نفقه definition document
2. ✅ Extracted key legal terms (نفقه mentioned 8+ times)
3. ✅ Classified as "نفقه_و_حقوق_خانواده" category
4. ✅ Identified legal entities (ماده ۱۱۰۶, قانون مدنی)
5. ✅ Stored with 0.90 reliability score

## 🚀 Usage Guide

### 1. Initialize the System

```python
from legal_database import LegalDatabase, EnhancedLegalAnalyzer

# Initialize database
legal_db = LegalDatabase("legal_archive.db")

# Initialize analyzer
analyzer = EnhancedLegalAnalyzer()
analyzer.set_legal_database(legal_db)
```

### 2. Populate Database

```python
# Populate with documents from authoritative sources
results = analyzer.populate_legal_database(legal_archive_instance, max_docs_per_source=10)
print(f"Inserted {results['successful_inserts']} documents")
```

### 3. Search Documents

```python
# Search for نفقه
nafaqe_docs = legal_db.search_documents("نفقه")
print(f"Found {len(nafaqe_docs)} نفقه documents")

# Search by source
majlis_docs = legal_db.get_documents_by_source("مجلس شورای اسلامی")
```

### 4. Analyze Documents

```python
# Analyze a legal document
analysis = analyzer.analyze_legal_document(content, title, source)
print(f"Classification: {analysis['classification']['rule_based']['primary_category']}")
```

## 🌐 Web Interface

### Legal Database Tab Features

1. **📊 Statistics Dashboard**
   - Total documents count
   - Active sources count  
   - Available categories
   - Source and category breakdowns

2. **🔍 Advanced Search**
   - Full-text search across all documents
   - Filter by source and category
   - Real-time search results

3. **🔧 Database Management**
   - Populate database from authoritative sources
   - Search for specific legal terms (نفقه button)
   - View detailed document analysis

### API Endpoints

- `GET /api/legal-db/stats` - Database statistics
- `GET /api/legal-db/documents` - Get documents with filtering
- `GET /api/legal-db/search?q={query}` - Search documents
- `POST /api/legal-db/populate` - Populate database
- `POST /api/legal-db/search-nafaqe` - Search نفقه definition

## 🧪 Testing

### Unit Tests

Run the comprehensive test suite:

```bash
python test_legal_db.py
```

Tests include:
- ✅ Database initialization and schema validation
- ✅ Document insertion and deduplication
- ✅ Full-text search functionality
- ✅ AI analysis integration
- ✅ نفقه definition extraction
- ✅ Duplicate URL handling

### Integration Tests

```bash
python demo_legal_db.py
```

Creates sample data including:
- 4 legal documents from different sources
- Comprehensive نفقه definition with analysis
- Documents from مجلس, دادگاه, کانون وکلا, پورتال ملی

## 📈 Performance Features

### Database Optimizations

1. **Indexing Strategy**
   - Primary indexes on source, category, timestamp
   - Unique indexes on URL and content hash
   - Composite indexes for common queries

2. **Full-Text Search**
   - SQLite FTS5 virtual table
   - Automatic triggers for synchronization
   - Fallback to LIKE queries if FTS unavailable

3. **Memory Management**
   - Batch processing (configurable batch sizes)
   - Automatic cleanup of old entries
   - Efficient JSON storage for analysis results

### AI Model Optimizations

1. **Model Loading**
   - CPU-only mode for compatibility
   - Progressive fallback (primary → fallback → lightweight)
   - Graceful degradation to rule-based analysis

2. **Analysis Efficiency**
   - Content truncation for large documents
   - Caching of analysis results
   - Parallel processing where possible

## 🔒 Data Quality & Reliability

### Source Reliability Scores

- **مجلس شورای اسلامی**: 0.98 (Highest - Official Parliament)
- **روزنامه رسمی**: 0.99 (Highest - Official Gazette)
- **پورتال ملی قوانین**: 0.96 (Very High - National Portal)
- **قوه قضاییه**: 0.95 (Very High - Judiciary)
- **کانون وکلای دادگستری**: 0.90 (High - Bar Association)

### Quality Assurance

1. **Content Deduplication**: SHA-256 hash-based duplicate detection
2. **URL Validation**: Ensures valid HTTP/HTTPS URLs
3. **Content Normalization**: Persian text normalization using Hazm
4. **Error Handling**: Comprehensive error logging and recovery

## 🛠️ Deployment Options

### 1. Quick Demo

```bash
python run_legal_archive.py --mode demo --create-demo
```

### 2. Web Interface

```bash
python run_legal_archive.py --mode web --create-demo
```

### 3. Original Gradio Interface

```bash
python run_legal_archive.py --mode gradio
```

### 4. Run Tests Only

```bash
python run_legal_archive.py --mode test
```

## 📊 Sample Data Results

After running the demo, you'll have:

### نفقه Documents Found: 4

1. **قانون حمایت از حقوق کودکان** (مجلس شورای اسلامی)
   - Category: قانون
   - نفقه mentions: 1 time
   - Reliability: 0.98

2. **تعریف جامع نفقه** (کانون وکلای دادگستری)
   - Category: نفقه_و_حقوق_خانواده
   - نفقه mentions: 15+ times
   - Reliability: 0.90

3. **دادنامه الزام به پرداخت نفقه** (قوه قضاییه)
   - Category: دادنامه
   - نفقه mentions: 5 times
   - Reliability: 0.95

4. **ماده ۱۱۰۶ قانون مدنی** (پورتال ملی قوانین)
   - Category: قانون
   - نفقه mentions: 8 times
   - Reliability: 0.96

## 🎯 Key Features Demonstrated

### ✅ Database Functionality
- [x] Structured legal document storage
- [x] Content deduplication using hash
- [x] Full-text search with FTS5
- [x] Source and category filtering
- [x] Performance-optimized queries

### ✅ AI Integration
- [x] BERT-based document classification
- [x] Legal entity extraction
- [x] Key term identification
- [x] Semantic embeddings (when models available)
- [x] Rule-based fallback analysis

### ✅ Real-World Testing
- [x] نفقه definition extraction and analysis
- [x] Multiple authoritative sources
- [x] Duplicate handling verification
- [x] Search functionality validation
- [x] Web UI integration

### ✅ Production Ready
- [x] Comprehensive error handling
- [x] Performance optimizations
- [x] Mobile-responsive web interface
- [x] Real-time updates via WebSocket
- [x] Export capabilities

## 🔧 Troubleshooting

### Common Issues

1. **Missing Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Database Permissions**
   - Ensure write permissions in the application directory
   - Check SQLite version supports FTS5

3. **AI Models Not Loading**
   - Check internet connection for model downloads
   - Verify sufficient disk space (2GB+ recommended)
   - System falls back to rule-based analysis

### Performance Tips

1. **For Large Datasets**
   - Use batch processing (50-100 documents per batch)
   - Enable periodic cache cleanup
   - Monitor memory usage

2. **For Production**
   - Use SSD storage for database
   - Configure appropriate connection timeouts
   - Enable database WAL mode for better concurrency

## 📚 Legal Terms Glossary

- **نفقه**: Alimony/spousal support
- **مهریه**: Dower/marriage portion
- **حضانت**: Child custody
- **دادنامه**: Court verdict
- **رویه قضایی**: Judicial practice
- **ماده**: Article (in law)
- **تبصره**: Note/annotation
- **قانون مدنی**: Civil Code

---

**Made with ❤️ for the Iranian legal community**  
**Date: Monday, September 01, 2025 - 09:35 AM CEST**