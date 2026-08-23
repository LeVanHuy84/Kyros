CREATE SCHEMA IF NOT EXISTS notification;

CREATE TABLE notification.in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    urgency_level VARCHAR(50) NOT NULL DEFAULT 'Normal',
    status VARCHAR(50) NOT NULL DEFAULT 'Unread',
    read_at TIMESTAMPTZ NULL,
    dismissed_at TIMESTAMPTZ NULL,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notifications_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_notifications_urgency CHECK (urgency_level IN ('Low', 'Normal', 'Urgent', 'Critical')),
    CONSTRAINT chk_notifications_status CHECK (status IN ('Unread', 'Read', 'Dismissed'))
);

CREATE TABLE notification.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    urgency_channels_map JSONB NOT NULL DEFAULT '{"Low": ["InApp"], "Normal": ["InApp", "Email"], "Urgent": ["InApp", "Email", "Slack"], "Critical": ["InApp", "Email", "Slack"]}'::jsonb,
    email_address VARCHAR(255) NULL,
    slack_webhook_reference VARCHAR(255) NULL,
    consent_policy VARCHAR(50) NOT NULL DEFAULT 'All',
    digest_schedule VARCHAR(50) NULL,
    last_digest_sent_at TIMESTAMPTZ NULL,
    next_digest_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_profiles_consent CHECK (consent_policy IN ('All', 'TransactionalOnly', 'None')),
    CONSTRAINT chk_profiles_digest CHECK (digest_schedule IN ('Immediate', 'Daily', 'Weekly'))
);

CREATE INDEX idx_notifications_user_unread ON notification.in_app_notifications (user_id, status, created_at);
CREATE INDEX idx_notifications_inbox ON notification.in_app_notifications (user_id, created_at DESC);
CREATE UNIQUE INDEX uq_profiles_workspace_user ON notification.profiles (workspace_id, user_id);
CREATE INDEX idx_profiles_digest_due ON notification.profiles (next_digest_at) 
WHERE digest_schedule IS NOT NULL AND digest_schedule <> 'Immediate';
