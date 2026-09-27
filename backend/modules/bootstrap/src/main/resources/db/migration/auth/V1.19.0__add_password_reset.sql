-- Create password_resets table to store secure password reset tokens
CREATE TABLE auth.password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identity_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_resets_user FOREIGN KEY (user_identity_id) 
        REFERENCES auth.user_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_resets_token ON auth.password_resets(token);
CREATE INDEX idx_password_resets_user ON auth.password_resets(user_identity_id);
