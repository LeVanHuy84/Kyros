-- Workspace-level tag catalog: allows managing tags independently of tasks
CREATE TABLE todo.workspace_tags (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID        NOT NULL,
    name         VARCHAR(100) NOT NULL,
    color        VARCHAR(20)  NULL,          -- optional hex color, e.g. '#6366f1'
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_workspace_tags_name CHECK (length(trim(name)) > 0),
    CONSTRAINT uq_workspace_tags_name  UNIQUE (workspace_id, name)
);

CREATE INDEX idx_workspace_tags_workspace ON todo.workspace_tags (workspace_id);
