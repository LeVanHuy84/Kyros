CREATE SCHEMA IF NOT EXISTS todo;

CREATE TABLE todo.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    parent_task_id UUID NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    due_date TIMESTAMPTZ NULL,
    recurrence_rule VARCHAR(255) NULL,
    recurrence_status VARCHAR(50) NULL,
    last_generated_occurrence TIMESTAMPTZ NULL,
    title_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', title)) STORED,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NULL,
    updated_by UUID NULL,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_tasks_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_tasks_priority CHECK (priority IN ('High', 'Medium', 'Low')),
    CONSTRAINT chk_tasks_status CHECK (status IN ('Active', 'Completed')),
    CONSTRAINT chk_tasks_recurrence_status CHECK (recurrence_status IN ('Active', 'Paused', 'Stopped'))
);

CREATE TABLE todo.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT chk_tags_name CHECK (length(trim(name)) > 0),
    CONSTRAINT fk_tags_task FOREIGN KEY (task_id) REFERENCES todo.tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_workspace_status ON todo.tasks (workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_workspace_status_due ON todo.tasks (workspace_id, status, due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_workspace_status_priority ON todo.tasks (workspace_id, status, priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_parent ON todo.tasks (parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX idx_tasks_soft_deleted ON todo.tasks (workspace_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_tasks_deleted_at ON todo.tasks (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE UNIQUE INDEX uq_tasks_parent_due ON todo.tasks (parent_task_id, due_date) WHERE parent_task_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_tags_task_id ON todo.tags (task_id);
CREATE INDEX idx_tags_name_search ON todo.tags (name);
CREATE UNIQUE INDEX uq_tags_task_name ON todo.tags (task_id, name);
CREATE INDEX idx_tasks_fts_title ON todo.tasks USING gin (title_tsv);
