-- Database initialization script for Persian Legal Archive System
-- This script creates the necessary tables and initial data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source_url VARCHAR(1000),
    document_type VARCHAR(100),
    jurisdiction VARCHAR(100),
    publication_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    embedding_vector VECTOR(768)  -- For BERT embeddings
);

CREATE TABLE IF NOT EXISTS legal_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES legal_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_categories (
    document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES legal_categories(id) ON DELETE CASCADE,
    confidence_score DECIMAL(3,2),
    PRIMARY KEY (document_id, category_id)
);

CREATE TABLE IF NOT EXISTS ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    result_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    model_version VARCHAR(100),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100),
    session_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_title ON legal_documents USING gin(to_tsvector('persian', title));
CREATE INDEX IF NOT EXISTS idx_legal_documents_content ON legal_documents USING gin(to_tsvector('persian', content));
CREATE INDEX IF NOT EXISTS idx_legal_documents_metadata ON legal_documents USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_legal_documents_embedding ON legal_documents USING ivfflat(embedding_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_legal_documents_publication_date ON legal_documents(publication_date);
CREATE INDEX IF NOT EXISTS idx_legal_documents_created_at ON legal_documents(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_document ON ai_analysis_results(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis_results(created_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Insert initial categories
INSERT INTO legal_categories (name, description) VALUES
('قانون اساسی', 'قوانین اساسی و بنیادین کشور'),
('قانون مدنی', 'قوانین مربوط به روابط مدنی و حقوق خصوصی'),
('قانون تجارت', 'قوانین مربوط به امور تجاری و بازرگانی'),
('قانون کار', 'قوانین مربوط به روابط کار و کارفرما'),
('قانون مالیات', 'قوانین مربوط به مالیات و عوارض'),
('قانون خانواده', 'قوانین مربوط به خانواده و ازدواج'),
('قانون کیفری', 'قوانین مربوط به جرایم و مجازات‌ها'),
('قانون آیین دادرسی', 'قوانین مربوط به نحوه رسیدگی به دعاوی'),
('قانون تامین اجتماعی', 'قوانین مربوط به بیمه و تامین اجتماعی'),
('قانون محیط زیست', 'قوانین مربوط به حفاظت از محیط زیست')
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_legal_documents_updated_at 
    BEFORE UPDATE ON legal_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for full-text search
CREATE OR REPLACE FUNCTION search_legal_documents(search_query TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    id UUID,
    title VARCHAR(500),
    content TEXT,
    relevance_score REAL,
    publication_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ld.id,
        ld.title,
        ld.content,
        ts_rank(to_tsvector('persian', ld.title || ' ' || ld.content), plainto_tsquery('persian', search_query)) as relevance_score,
        ld.publication_date
    FROM legal_documents ld
    WHERE to_tsvector('persian', ld.title || ' ' || ld.content) @@ plainto_tsquery('persian', search_query)
    ORDER BY relevance_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;