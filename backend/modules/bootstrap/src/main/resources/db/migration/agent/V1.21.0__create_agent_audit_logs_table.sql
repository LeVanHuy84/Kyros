CREATE SCHEMA IF NOT EXISTS agent;

CREATE TABLE IF NOT EXISTS agent.agent_audit_logs (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    user_id UUID,
    conversation_id UUID,
    provider VARCHAR(50),
    model_name VARCHAR(100),
    prompt_tokens INT,
    completion_tokens INT,
    total_latency_ms BIGINT,
    tools_invoked_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_logs_workspace_id ON agent.agent_audit_logs (workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_audit_logs_conversation_id ON agent.agent_audit_logs (conversation_id);
