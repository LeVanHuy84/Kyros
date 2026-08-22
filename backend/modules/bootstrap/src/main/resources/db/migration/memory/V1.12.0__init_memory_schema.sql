CREATE SCHEMA IF NOT EXISTS memory;

CREATE TABLE memory.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    session_id UUID NULL,
    title VARCHAR(150) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    last_turn_timestamp TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_conversations_status CHECK (status IN ('Active', 'Cleared', 'Archived'))
);

CREATE TABLE memory.conversation_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    turn_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_turns_sender_role CHECK (sender_role IN ('User', 'Agent')),
    CONSTRAINT chk_turns_content CHECK (length(trim(content)) > 0),
    CONSTRAINT fk_turns_conversation FOREIGN KEY (conversation_id) REFERENCES memory.conversations(id) ON DELETE CASCADE
);

CREATE TABLE memory.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    default_task_priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    prevent_calendar_overlap BOOLEAN NOT NULL DEFAULT FALSE,
    preferred_notification_channels VARCHAR(255) NOT NULL DEFAULT 'InApp,Email',
    default_reminder_lead_time_minutes INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_preferences_priority CHECK (default_task_priority IN ('High', 'Medium', 'Low')),
    CONSTRAINT chk_preferences_lead_time CHECK (default_reminder_lead_time_minutes > 0)
);

CREATE TABLE memory.memory_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    confidence_score REAL NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_memory_confidence CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)
);

CREATE INDEX idx_turns_chronological ON memory.conversation_turns (conversation_id, turn_timestamp ASC);
CREATE INDEX idx_conversations_workspace ON memory.conversations (workspace_id, last_turn_timestamp DESC);
CREATE UNIQUE INDEX uq_preferences_workspace_user ON memory.user_preferences (workspace_id, user_id);
CREATE INDEX idx_memory_entries_workspace ON memory.memory_entries (workspace_id, user_id);
