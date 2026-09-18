CREATE SCHEMA IF NOT EXISTS agent;

CREATE TABLE agent.user_ai_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    base_url VARCHAR(500),
    model VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uk_agent_user_ai_config UNIQUE (workspace_id, user_id)
);

CREATE INDEX idx_user_ai_configs_workspace_user ON agent.user_ai_configs (workspace_id, user_id);
