-- Track admin actions over active matches
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_action_enum') THEN
        CREATE TYPE review_action_enum AS ENUM ('FLAGGED', 'CLEARED', 'FORCE_TERMINATED', 'FORCE_COMPLETED');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS match_review_logs (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    admin_id INTEGER,
    action review_action_enum NOT NULL,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups on the admin queue dashboard
CREATE INDEX IF NOT EXISTS idx_match_review_logs_match ON match_review_logs(match_id);
