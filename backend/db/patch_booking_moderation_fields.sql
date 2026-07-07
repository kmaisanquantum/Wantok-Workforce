-- Add moderation support fields to bookings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='is_under_review') THEN
        ALTER TABLE bookings ADD COLUMN is_under_review BOOLEAN DEFAULT FALSE;
    END IF;
END$$;
