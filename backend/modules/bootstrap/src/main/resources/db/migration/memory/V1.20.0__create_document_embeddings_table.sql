CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memory.document_embeddings (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    document_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_embeddings_workspace_id ON memory.document_embeddings (workspace_id);
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_doc_id ON memory.document_embeddings (document_id);

CREATE INDEX IF NOT EXISTS idx_doc_embeddings_hnsw 
ON memory.document_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
