-- Add detailed profile fields for matching logic
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS skills_specialization TEXT;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS operating_location TEXT;
