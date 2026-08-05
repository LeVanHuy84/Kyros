CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    global_roles VARCHAR(255) NOT NULL DEFAULT 'EndUser',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_email CHECK (length(trim(email)) > 0),
    CONSTRAINT chk_status CHECK (status IN ('Active', 'Locked', 'Suspended')),
    CONSTRAINT chk_failed_attempts CHECK (failed_login_attempts >= 0)
);

CREATE TABLE auth.session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identity_id UUID NOT NULL,
    jti VARCHAR(64) NULL,
    event_type VARCHAR(50) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NULL,
    CONSTRAINT chk_event_type CHECK (event_type IN ('Logout', 'TokenRevoked', 'PasswordChanged', 'AccountSuspended'))
);

CREATE INDEX idx_session_events_user ON auth.session_events (user_identity_id, occurred_at DESC);
CREATE INDEX idx_session_events_jti ON auth.session_events (jti);
