-- Add oauth_provider column to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='oauth_provider') THEN
        ALTER TABLE users ADD COLUMN oauth_provider TEXT;
    END IF;
END$$;

-- Make password_hash nullable for OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Make phone_number nullable for OAuth users
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
