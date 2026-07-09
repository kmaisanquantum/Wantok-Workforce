-- Add trust verification checklist fields to provider_profiles
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS background_verified BOOLEAN DEFAULT FALSE;
