-- Step 2: Final Provider Profiles Schema
BEGIN;

CREATE TABLE IF NOT EXISTS provider_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    service_category VARCHAR(100),
    bio TEXT,
    hourly_rate NUMERIC(10, 2),
    primary_phone VARCHAR(20),
    whatsapp_business VARCHAR(20),
    operating_suburb VARCHAR(150),
    bank_name VARCHAR(100),
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    is_verified BOOLEAN DEFAULT false,
    is_accepting_jobs BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_user_link_final ON provider_profiles(user_id);

-- Migration logic to ensure all columns exist
DO $$
BEGIN
    -- Columns from the spec
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='business_name') THEN
        ALTER TABLE provider_profiles ADD COLUMN business_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='service_category') THEN
        ALTER TABLE provider_profiles ADD COLUMN service_category VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='primary_phone') THEN
        ALTER TABLE provider_profiles ADD COLUMN primary_phone VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='whatsapp_business') THEN
        ALTER TABLE provider_profiles ADD COLUMN whatsapp_business VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='operating_suburb') THEN
        ALTER TABLE provider_profiles ADD COLUMN operating_suburb VARCHAR(150);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='bank_name') THEN
        ALTER TABLE provider_profiles ADD COLUMN bank_name VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='bank_account_name') THEN
        ALTER TABLE provider_profiles ADD COLUMN bank_account_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='bank_account_number') THEN
        ALTER TABLE provider_profiles ADD COLUMN bank_account_number VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='is_accepting_jobs') THEN
        ALTER TABLE provider_profiles ADD COLUMN is_accepting_jobs BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='bio') THEN
        ALTER TABLE provider_profiles ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='provider_profiles' AND column_name='hourly_rate') THEN
        ALTER TABLE provider_profiles ADD COLUMN hourly_rate NUMERIC(10, 2);
    END IF;
END$$;

COMMIT;
