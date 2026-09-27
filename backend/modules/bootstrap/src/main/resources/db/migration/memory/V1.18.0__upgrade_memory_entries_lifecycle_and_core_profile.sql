-- Upgrade memory_entries with lifecycle, superseding, access tracking, and validity fields
ALTER TABLE memory.memory_entries
    ADD COLUMN IF NOT EXISTS topic_cluster VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS superseded_by_id UUID NULL,
    ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 1;

-- Add check constraint for status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_memory_status'
    ) THEN
        ALTER TABLE memory.memory_entries
            ADD CONSTRAINT chk_memory_status CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'ARCHIVED', 'EXPIRED'));
    END IF;
END $$;

-- Add index on active status and topic cluster for fast retrieval
CREATE INDEX IF NOT EXISTS idx_memory_entries_active 
    ON memory.memory_entries (workspace_id, user_id, status) 
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_memory_entries_topic 
    ON memory.memory_entries (workspace_id, user_id, topic_cluster);

-- Create table for Tier 1: Core User Profiles (Working Memory / System Prompt)
CREATE TABLE IF NOT EXISTS memory.core_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    markdown_content TEXT NOT NULL,
    last_synthesized_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fact_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_core_profile_workspace_user UNIQUE (workspace_id, user_id)
);
