CREATE TABLE IF NOT EXISTS todo.task_time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ NULL,
    duration_minutes BIGINT NOT NULL DEFAULT 0,
    notes TEXT NULL,
    CONSTRAINT fk_task_time_logs_task FOREIGN KEY (task_id) REFERENCES todo.tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_time_logs_ws_task ON todo.task_time_logs (workspace_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_ws_user_time ON todo.task_time_logs (workspace_id, user_id, start_time);
