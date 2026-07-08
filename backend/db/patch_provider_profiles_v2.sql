-- Step 2: Refactor PostgreSQL Database Schemas
BEGIN;

CREATE TABLE IF NOT EXISTS provider_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),           -- Commercial or sole-trader trading name
    service_category VARCHAR(100),        -- Operating domain (e.g., Electrical, Plumbing, Logistics)
    bio TEXT,                             -- Promotional skills & qualification overview
    hourly_rate NUMERIC(10, 2),           -- Baseline pricing structure in PGK
    primary_phone VARCHAR(20),            -- Operational voice line
    whatsapp_business VARCHAR(20),        -- Media/Coordinate sharing channel
    operating_suburb VARCHAR(150),        -- Base coverage region (e.g., Waigani, Boroko, Gordons)
    bank_name VARCHAR(100),               -- Payout target entity (e.g., BSP, Kina Bank, Westpac)
    bank_account_name VARCHAR(255),       -- Registered name on bank statement
    bank_account_number VARCHAR(50),     -- EFT bank transfer number
    is_verified BOOLEAN DEFAULT false,    -- Internal admin KYC validation flag
    is_accepting_jobs BOOLEAN DEFAULT true,-- Live availability toggle switch
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_user_link ON provider_profiles(user_id);

-- Migration: Add missing columns to existing provider_profiles if needed
DO $$
BEGIN
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
END$$;

COMMIT;
