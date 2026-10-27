CREATE TABLE IF NOT EXISTS workspace.documents (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    user_id UUID,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT NOT NULL DEFAULT 0,
    chunk_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_documents_ws ON workspace.documents (workspace_id);
