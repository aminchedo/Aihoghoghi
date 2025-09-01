-- Iranian Legal Archive System - Database Schema
-- Legal Documents Table with Full-Text Search Support
-- Created: September 01, 2025 - 09:35 AM CEST

-- Main legal documents table
CREATE TABLE IF NOT EXISTS legal_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,                    -- Authoritative source (e.g., "مجلس شورای اسلامی")
    url TEXT UNIQUE NOT NULL,                -- Document URL
    title TEXT,                              -- Document title
    content TEXT,                            -- Normalized document content
    category TEXT,                           -- Legal category (e.g., "قانون", "دادنامه")
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Extraction timestamp
    hash TEXT UNIQUE,                        -- Content hash for deduplication
    analysis TEXT,                           -- JSON-encoded AI analysis results
    reliability_score REAL DEFAULT 0.0,     -- Source reliability score (0.0-1.0)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_legal_source ON legal_documents(source);
CREATE INDEX IF NOT EXISTS idx_legal_url ON legal_documents(url);
CREATE INDEX IF NOT EXISTS idx_legal_hash ON legal_documents(hash);
CREATE INDEX IF NOT EXISTS idx_legal_category ON legal_documents(category);
CREATE INDEX IF NOT EXISTS idx_legal_timestamp ON legal_documents(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_legal_reliability ON legal_documents(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_legal_content_search ON legal_documents(title, content);

-- Full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS legal_documents_fts USING fts5(
    title, 
    content, 
    category, 
    source,
    content='legal_documents',
    content_rowid='id'
);

-- Triggers to maintain FTS table
CREATE TRIGGER IF NOT EXISTS legal_documents_fts_insert AFTER INSERT ON legal_documents BEGIN
    INSERT INTO legal_documents_fts(rowid, title, content, category, source) 
    VALUES (new.id, new.title, new.content, new.category, new.source);
END;

CREATE TRIGGER IF NOT EXISTS legal_documents_fts_delete AFTER DELETE ON legal_documents BEGIN
    DELETE FROM legal_documents_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS legal_documents_fts_update AFTER UPDATE ON legal_documents BEGIN
    DELETE FROM legal_documents_fts WHERE rowid = old.id;
    INSERT INTO legal_documents_fts(rowid, title, content, category, source) 
    VALUES (new.id, new.title, new.content, new.category, new.source);
END;

-- Sample queries for testing

-- 1. Search for نفقه documents
-- SELECT * FROM legal_documents WHERE content LIKE '%نفقه%' ORDER BY reliability_score DESC;

-- 2. Full-text search using FTS
-- SELECT ld.* FROM legal_documents ld 
-- JOIN legal_documents_fts fts ON ld.id = fts.rowid 
-- WHERE legal_documents_fts MATCH 'نفقه' 
-- ORDER BY ld.reliability_score DESC;

-- 3. Get documents by source
-- SELECT * FROM legal_documents WHERE source = 'مجلس شورای اسلامی' ORDER BY timestamp DESC;

-- 4. Get documents by category
-- SELECT * FROM legal_documents WHERE category = 'نفقه_و_حقوق_خانواده' ORDER BY timestamp DESC;

-- 5. Get database statistics
-- SELECT 
--     COUNT(*) as total_documents,
--     COUNT(DISTINCT source) as total_sources,
--     COUNT(DISTINCT category) as total_categories,
--     AVG(reliability_score) as avg_reliability
-- FROM legal_documents;

-- 6. Source breakdown
-- SELECT source, COUNT(*) as document_count 
-- FROM legal_documents 
-- GROUP BY source 
-- ORDER BY document_count DESC;

-- 7. Category breakdown
-- SELECT category, COUNT(*) as document_count 
-- FROM legal_documents 
-- GROUP BY category 
-- ORDER BY document_count DESC;

-- 8. Recent documents
-- SELECT title, source, category, timestamp 
-- FROM legal_documents 
-- ORDER BY timestamp DESC 
-- LIMIT 10;

-- 9. High reliability documents
-- SELECT title, source, reliability_score 
-- FROM legal_documents 
-- WHERE reliability_score > 0.9 
-- ORDER BY reliability_score DESC;

-- 10. Documents with AI analysis
-- SELECT title, source, 
--        json_extract(analysis, '$.classification.primary_category') as ai_category,
--        json_extract(analysis, '$.confidence_score') as ai_confidence
-- FROM legal_documents 
-- WHERE analysis IS NOT NULL AND analysis != ''
-- ORDER BY json_extract(analysis, '$.confidence_score') DESC;