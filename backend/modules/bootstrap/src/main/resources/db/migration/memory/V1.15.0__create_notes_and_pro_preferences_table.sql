CREATE TABLE memory.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    task_id UUID,
    event_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE memory.user_preferences ADD COLUMN IF NOT EXISTS working_hours_start VARCHAR(10) DEFAULT '08:30';
ALTER TABLE memory.user_preferences ADD COLUMN IF NOT EXISTS working_hours_end VARCHAR(10) DEFAULT '17:30';
ALTER TABLE memory.user_preferences ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER DEFAULT 15;

CREATE INDEX idx_notes_workspace_user ON memory.notes (workspace_id, user_id);
