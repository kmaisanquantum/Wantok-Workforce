-- Reconcile Base Schema vs Patch Columns
-- Objective: Ensure all tracking columns exist across all environments

DO $$
BEGIN
    -- 1. Ensure wallet_balance on users
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='wallet_balance') THEN
        ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(10, 2) DEFAULT 0.00;
    END IF;

    -- 2. Ensure bookings tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='payout_status') THEN
        ALTER TABLE bookings ADD COLUMN payout_status TEXT DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='platform_fee') THEN
        ALTER TABLE bookings ADD COLUMN platform_fee DECIMAL(10, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='feedback_rating') THEN
        ALTER TABLE bookings ADD COLUMN feedback_rating INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='feedback_text') THEN
        ALTER TABLE bookings ADD COLUMN feedback_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='completed_at') THEN
        ALTER TABLE bookings ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;

END$$;
