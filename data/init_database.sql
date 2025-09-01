-- Iranian Legal Archive System Database Schema
-- Enhanced schema for comprehensive legal document management

-- Main documents table
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    title TEXT,
    source TEXT,
    content TEXT,
    quality_score REAL,
    classification TEXT,
    legal_entities TEXT,
    word_count INTEGER,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_category TEXT,
    reliability_score REAL DEFAULT 0.5,
    processing_time REAL,
    readability_score REAL,
    complexity_score REAL,
    content_hash TEXT,
    extraction_method TEXT,
    response_time REAL,
    status_code INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embeddings BLOB,
    metadata TEXT -- JSON string for additional metadata
);

-- Cache entries table
CREATE TABLE IF NOT EXISTS cache_entries (
    key TEXT PRIMARY KEY,
    value BLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    ttl_seconds INTEGER DEFAULT 3600,
    priority INTEGER DEFAULT 1,
    size_bytes INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    source_reliability REAL DEFAULT 0.5,
    compression_ratio REAL DEFAULT 1.0,
    quality_score REAL DEFAULT 0.0
);

-- Processing logs table
CREATE TABLE IF NOT EXISTS processing_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    url TEXT,
    status TEXT,
    error_message TEXT,
    processing_time REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    batch_id TEXT,
    retry_count INTEGER DEFAULT 0
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT,
    metric_value REAL,
    metric_unit TEXT,
    category TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal sources tracking
CREATE TABLE IF NOT EXISTS source_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name TEXT,
    base_url TEXT,
    last_accessed TIMESTAMP,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    average_response_time REAL DEFAULT 0.0,
    reliability_score REAL DEFAULT 0.5,
    last_error TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source);
CREATE INDEX IF NOT EXISTS idx_documents_quality ON documents(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(source_category);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_documents_word_count ON documents(word_count DESC);
CREATE INDEX IF NOT EXISTS idx_documents_classification ON documents(classification);

CREATE INDEX IF NOT EXISTS idx_cache_created_ttl ON cache_entries(created_at, ttl_seconds);
CREATE INDEX IF NOT EXISTS idx_cache_priority_quality ON cache_entries(priority DESC, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_cache_category ON cache_entries(category);
CREATE INDEX IF NOT EXISTS idx_cache_last_accessed ON cache_entries(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_cache_access_count ON cache_entries(access_count DESC);
CREATE INDEX IF NOT EXISTS idx_cache_reliability ON cache_entries(source_reliability DESC);

CREATE INDEX IF NOT EXISTS idx_logs_session ON processing_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_logs_status ON processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON processing_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_batch ON processing_logs(batch_id);

CREATE INDEX IF NOT EXISTS idx_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_category ON system_metrics(category);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON system_metrics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_source_tracking_name ON source_tracking(source_name);
CREATE INDEX IF NOT EXISTS idx_source_tracking_reliability ON source_tracking(reliability_score DESC);

-- Views for common queries
CREATE VIEW IF NOT EXISTS high_quality_documents AS
SELECT 
    id, url, title, source, classification, quality_score, 
    reliability_score, word_count, scraped_at
FROM documents 
WHERE quality_score >= 70 
ORDER BY quality_score DESC, reliability_score DESC;

CREATE VIEW IF NOT EXISTS recent_documents AS
SELECT 
    id, url, title, source, classification, quality_score,
    scraped_at, last_updated
FROM documents 
WHERE last_updated >= datetime('now', '-7 days')
ORDER BY last_updated DESC;

CREATE VIEW IF NOT EXISTS cache_statistics AS
SELECT 
    category,
    COUNT(*) as entry_count,
    AVG(quality_score) as avg_quality,
    AVG(access_count) as avg_access_count,
    SUM(size_bytes) as total_size_bytes,
    MIN(created_at) as oldest_entry,
    MAX(last_accessed) as newest_access
FROM cache_entries 
GROUP BY category;

-- Triggers for automatic maintenance
CREATE TRIGGER IF NOT EXISTS update_document_timestamp
    AFTER UPDATE ON documents
    BEGIN
        UPDATE documents SET last_updated = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS log_document_insert
    AFTER INSERT ON documents
    BEGIN
        INSERT INTO system_metrics (metric_name, metric_value, category)
        VALUES ('documents_processed', 1, 'processing');
    END;

-- Initial data for source tracking
INSERT OR IGNORE INTO source_tracking (source_name, base_url, reliability_score) VALUES
('مجلس شورای اسلامی', 'https://rc.majlis.ir', 0.98),
('پورتال ملی قوانین', 'https://dotic.ir', 0.96),
('قوه قضاییه', 'https://eadl.ir', 0.95),
('روزنامه رسمی', 'https://rrk.ir', 0.99),
('کانون وکلای دادگستری', 'https://icbar.ir', 0.90);