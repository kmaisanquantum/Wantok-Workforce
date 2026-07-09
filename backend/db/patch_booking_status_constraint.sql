-- Database Hardening: Booking Status Constraints
-- Objective: Enforce the canonical state machine at the database level

BEGIN;

-- 1. Data Normalization: Migrate any legacy or inconsistent status strings
UPDATE bookings SET status = 'pending' WHERE status IS NULL OR status NOT IN ('pending', 'accepted', 'in_progress', 'completed_awaiting_approval', 'completed', 'cancelled', 'FLAGGED');

-- 2. Implement strict CHECK constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_booking_status;
ALTER TABLE bookings ADD CONSTRAINT check_booking_status CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed_awaiting_approval', 'completed', 'cancelled', 'FLAGGED'));

COMMIT;
