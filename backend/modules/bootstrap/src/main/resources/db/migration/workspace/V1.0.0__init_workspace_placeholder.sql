CREATE SCHEMA IF NOT EXISTS workspace;

CREATE TABLE workspace.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    owner_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_status CHECK (status IN ('Active', 'Suspended', 'Archived'))
);

CREATE TABLE workspace.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Member',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memberships_workspace FOREIGN KEY (workspace_id) REFERENCES workspace.workspaces(id) ON DELETE CASCADE,
    CONSTRAINT chk_role CHECK (role IN ('Owner', 'Admin', 'Member'))
);

CREATE INDEX idx_workspaces_owner ON workspace.workspaces (owner_id);
CREATE INDEX idx_memberships_user ON workspace.memberships (user_id);
CREATE UNIQUE INDEX uq_memberships_workspace_user ON workspace.memberships (workspace_id, user_id);
CREATE UNIQUE INDEX uq_memberships_user_primary ON workspace.memberships (user_id) WHERE is_primary = TRUE;
