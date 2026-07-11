-- OAuth Identity Support Patch

DO $$
BEGIN
    -- Allow null passwords for OAuth users
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

    -- Allow null phone numbers for OAuth users (email remains mandatory for mapping)
    ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;

    -- Add auth_provider column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='auth_provider') THEN
        ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local';
    END IF;

    -- Add provider_user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='provider_user_id') THEN
        ALTER TABLE users ADD COLUMN provider_user_id TEXT;
    END IF;

    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;

END$$;

-- Create a unique index for OAuth provider identity
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_identity ON users (auth_provider, provider_user_id);
