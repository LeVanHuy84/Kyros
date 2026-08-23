ALTER TABLE notification.in_app_notifications ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
