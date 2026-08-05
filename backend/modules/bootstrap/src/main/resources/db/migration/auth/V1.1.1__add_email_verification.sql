-- Drop old status check constraint if it exists
ALTER TABLE auth.user_identities DROP CONSTRAINT IF EXISTS chk_status;

-- Add 'PendingVerification' to AccountStatus constraint
ALTER TABLE auth.user_identities ADD CONSTRAINT chk_status CHECK (
    status IN ('Active', 'Locked', 'Suspended', 'PendingVerification')
);

-- Set Default Status for future registrations to PendingVerification
ALTER TABLE auth.user_identities ALTER COLUMN status SET DEFAULT 'PendingVerification';

-- Create email_verifications table to store secure tokens
CREATE TABLE auth.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identity_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_identity_id) 
        REFERENCES auth.user_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verifications_token ON auth.email_verifications(token);
