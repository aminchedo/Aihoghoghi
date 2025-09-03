-- Production Database Schema for Iranian Legal Archive System
-- This schema supports real legal documents, AI analysis, and production workloads

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Legal Documents Table - Core storage for all legal documents
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_category VARCHAR(100),
    source_url TEXT,
    source_organization VARCHAR(200),
    publication_date DATE,
    effective_date DATE,
    jurisdiction VARCHAR(100) DEFAULT 'Iran',
    language VARCHAR(10) DEFAULT 'fa',
    
    -- AI Analysis Results
    ai_analysis JSONB,
    embedding_vector vector(768), -- For BERT embeddings
    confidence_score DECIMAL(3,2),
    legal_topics TEXT[],
    entities_extracted JSONB,
    
    -- Processing Metadata
    status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    
    -- Access Control
    access_level VARCHAR(20) DEFAULT 'public',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('persian', title), 'A') ||
        setweight(to_tsvector('persian', content), 'B') ||
        setweight(to_tsvector('english', title), 'C') ||
        setweight(to_tsvector('english', content), 'D')
    ) STORED
);

-- Legal Categories Table - Hierarchical categorization
CREATE TABLE IF NOT EXISTS legal_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    name_fa VARCHAR(200) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES legal_categories(id),
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Sources Table - Government and legal institutions
CREATE TABLE IF NOT EXISTS legal_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(300) NOT NULL,
    name_fa VARCHAR(300) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'government', 'court', 'parliament', 'ministry'
    jurisdiction VARCHAR(100) DEFAULT 'Iran',
    website_url TEXT,
    contact_info JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Models Table - Track deployed AI models
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- 'bert', 'gpt', 'custom'
    language VARCHAR(10) DEFAULT 'fa',
    file_path TEXT,
    model_size_mb INTEGER,
    accuracy_score DECIMAL(5,4),
    training_data_size INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB
);

-- Processing Jobs Table - Track document processing
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    job_type VARCHAR(100) NOT NULL, -- 'ocr', 'ai_analysis', 'categorization'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 5,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions Table - Track user activity
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search Queries Table - Track search analytics
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text TEXT NOT NULL,
    user_id UUID,
    ip_address INET,
    results_count INTEGER,
    execution_time_ms INTEGER,
    filters_applied JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Metrics Table - Store system performance data
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(50),
    tags JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Rate Limiting Table - Track API usage
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_request_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_category ON legal_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_legal_documents_publication_date ON legal_documents(publication_date);
CREATE INDEX IF NOT EXISTS idx_legal_documents_jurisdiction ON legal_documents(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_legal_documents_search_vector ON legal_documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_legal_documents_embedding ON legal_documents USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_legal_documents_created_at ON legal_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_categories_parent ON legal_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_legal_categories_level ON legal_categories(level);
CREATE INDEX IF NOT EXISTS idx_legal_categories_active ON legal_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_document ON processing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_priority ON processing_jobs(priority DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_search_queries_text ON search_queries USING GIN(to_tsvector('persian', query_text));
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded ON system_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip_endpoint ON api_rate_limits(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON api_rate_limits(window_start);

-- Create full-text search configuration for Persian
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS persian (COPY = simple);

-- Insert default legal categories
INSERT INTO legal_categories (name, name_fa, description, level, sort_order) VALUES
('Constitutional Law', 'قانون اساسی', 'Constitutional and fundamental laws', 1, 1),
('Civil Law', 'قانون مدنی', 'Civil and private law matters', 1, 2),
('Criminal Law', 'قانون کیفری', 'Criminal law and procedures', 1, 3),
('Commercial Law', 'قانون تجارت', 'Commercial and business law', 1, 4),
('Administrative Law', 'قانون اداری', 'Administrative and government law', 1, 5),
('Family Law', 'قانون خانواده', 'Family and personal status law', 1, 6),
('Labor Law', 'قانون کار', 'Employment and labor relations', 1, 7),
('Tax Law', 'قانون مالیات', 'Taxation and revenue law', 1, 8)
ON CONFLICT DO NOTHING;

-- Insert default legal sources
INSERT INTO legal_sources (name, name_fa, type, jurisdiction) VALUES
('Islamic Consultative Assembly', 'مجلس شورای اسلامی', 'parliament', 'Iran'),
('Judiciary of Iran', 'قوه قضاییه', 'court', 'Iran'),
('Ministry of Justice', 'وزارت دادگستری', 'ministry', 'Iran'),
('Supreme Court', 'دیوان عالی کشور', 'court', 'Iran'),
('Guardian Council', 'شورای نگهبان', 'government', 'Iran')
ON CONFLICT DO NOTHING;

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_legal_documents_updated_at 
    BEFORE UPDATE ON legal_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for document similarity search
CREATE OR REPLACE FUNCTION find_similar_documents(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.8,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ld.id,
        ld.title,
        1 - (ld.embedding_vector <=> query_embedding) AS similarity
    FROM legal_documents ld
    WHERE 1 - (ld.embedding_vector <=> query_embedding) > match_threshold
    ORDER BY ld.embedding_vector <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create function for legal document statistics
CREATE OR REPLACE FUNCTION get_legal_document_stats()
RETURNS TABLE (
    total_documents bigint,
    documents_by_type json,
    documents_by_category json,
    recent_uploads bigint,
    ai_processed bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM legal_documents) AS total_documents,
        (SELECT json_object_agg(document_type, count) 
         FROM (SELECT document_type, COUNT(*) as count 
               FROM legal_documents 
               GROUP BY document_type) t) AS documents_by_type,
        (SELECT json_object_agg(document_category, count) 
         FROM (SELECT document_category, COUNT(*) as count 
               FROM legal_documents 
               WHERE document_category IS NOT NULL
               GROUP BY document_category) t) AS documents_by_category,
        (SELECT COUNT(*) FROM legal_documents 
         WHERE created_at >= NOW() - INTERVAL '7 days') AS recent_uploads,
        (SELECT COUNT(*) FROM legal_documents 
         WHERE ai_analysis IS NOT NULL) AS ai_processed;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public documents are viewable by everyone" ON legal_documents
    FOR SELECT USING (access_level = 'public');

CREATE POLICY "Users can view their own search queries" ON search_queries
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Create view for public document access
CREATE VIEW public_legal_documents AS
SELECT 
    id, title, document_type, document_category, 
    publication_date, jurisdiction, language,
    legal_topics, entities_extracted,
    created_at, updated_at
FROM legal_documents 
WHERE access_level = 'public' AND status = 'processed';

-- Create materialized view for search optimization
CREATE MATERIALIZED VIEW search_optimization_view AS
SELECT 
    id,
    title,
    document_type,
    document_category,
    legal_topics,
    search_vector,
    embedding_vector,
    created_at
FROM legal_documents 
WHERE status = 'processed';

CREATE INDEX idx_search_optimization_search ON search_optimization_view USING GIN(search_vector);
CREATE INDEX idx_search_optimization_embedding ON search_optimization_view USING ivfflat (embedding_vector vector_cosine_ops);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_search_optimization_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY search_optimization_view;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to refresh materialized view (requires pg_cron extension)
-- SELECT cron.schedule('refresh-search-view', '0 2 * * *', 'SELECT refresh_search_optimization_view();');

COMMENT ON TABLE legal_documents IS 'Core table storing all legal documents with AI analysis results';
COMMENT ON TABLE legal_categories IS 'Hierarchical categorization system for legal documents';
COMMENT ON TABLE legal_sources IS 'Government and legal institutions that publish documents';
COMMENT ON TABLE ai_models IS 'Track deployed AI models and their performance';
COMMENT ON TABLE processing_jobs IS 'Queue and track document processing jobs';
COMMENT ON TABLE system_metrics IS 'Store system performance and monitoring data';