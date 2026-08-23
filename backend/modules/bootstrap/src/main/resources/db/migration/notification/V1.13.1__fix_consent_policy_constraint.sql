ALTER TABLE notification.profiles DROP CONSTRAINT chk_profiles_consent;
ALTER TABLE notification.profiles ADD CONSTRAINT chk_profiles_consent CHECK (consent_policy IN ('ENABLED', 'DISABLED'));
