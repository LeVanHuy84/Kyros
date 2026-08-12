CREATE SCHEMA IF NOT EXISTS calendar;

CREATE TABLE IF NOT EXISTS calendar.calendar_events (
    id UUID NOT NULL PRIMARY KEY,
    workspace_id UUID NOT NULL,
    owner_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_calendar_events_end_after_start CHECK (end_time > start_time),
    CONSTRAINT chk_calendar_events_status CHECK (status IN ('Scheduled', 'Deleted'))
);

CREATE TABLE IF NOT EXISTS calendar.calendar_reminders (
    id UUID NOT NULL PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES calendar.calendar_events(id) ON DELETE CASCADE,
    lead_time_minutes INTEGER NOT NULL,
    trigger_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    snoozed_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_calendar_reminders_lead_positive CHECK (lead_time_minutes > 0),
    CONSTRAINT chk_calendar_reminders_status CHECK (status IN ('Scheduled', 'Triggered', 'Snoozed', 'Dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_events_workspace_range
    ON calendar.calendar_events (workspace_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_events_active_range
    ON calendar.calendar_events (workspace_id, start_time, end_time)
    WHERE status = 'Scheduled' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reminders_event
    ON calendar.calendar_reminders (event_id);

CREATE INDEX IF NOT EXISTS idx_reminders_polling
    ON calendar.calendar_reminders (trigger_time, status);
