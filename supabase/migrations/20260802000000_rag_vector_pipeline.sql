-- supabase/migrations/20260802000000_rag_vector_pipeline.sql
-- XAB Ceiling Loop C41 — Phase 7 RAG Enhancement — 2026-08-02
-- Implements QATask AI-005: Vector embeddings pipeline
-- Requires pgvector extension (already enabled on Supabase)

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- rag_documents table with 1536-dim embeddings (text-embedding-3-small)
CREATE TABLE IF NOT EXISTS rag_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id      TEXT NOT NULL,
  doc_name    TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general',
  source      TEXT NOT NULL DEFAULT 'manual',
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text  TEXT NOT NULL,
  embedding   VECTOR(1536),
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS rag_documents_embedding_idx
  ON rag_documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- GIN index for metadata search
CREATE INDEX IF NOT EXISTS rag_documents_metadata_idx
  ON rag_documents USING gin(metadata);

-- Index for doc_id filtering (re-embed support)
CREATE INDEX IF NOT EXISTS rag_documents_doc_id_idx ON rag_documents (doc_id);
CREATE INDEX IF NOT EXISTS rag_documents_category_idx ON rag_documents (category);

-- Similarity search RPC function
CREATE OR REPLACE FUNCTION match_rag_documents(
  query_embedding  VECTOR(1536),
  match_threshold  FLOAT   DEFAULT 0.7,
  match_count      INT     DEFAULT 5,
  filter_category  TEXT    DEFAULT NULL
)
RETURNS TABLE (
  id            UUID,
  doc_id        TEXT,
  doc_name      TEXT,
  chunk_text    TEXT,
  category      TEXT,
  chunk_index   INTEGER,
  similarity    FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rd.id,
    rd.doc_id,
    rd.doc_name,
    rd.chunk_text,
    rd.category,
    rd.chunk_index,
    1 - (rd.embedding <=> query_embedding) AS similarity
  FROM rag_documents rd
  WHERE
    (filter_category IS NULL OR rd.category = filter_category)
    AND 1 - (rd.embedding <=> query_embedding) > match_threshold
  ORDER BY rd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Row-level security (allow service role full access, anon read-only for public categories)
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role full access"
  ON rag_documents FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Anon read public categories"
  ON rag_documents FOR SELECT
  USING (category IN ('products', 'training', 'marketing'));
