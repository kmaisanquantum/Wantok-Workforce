-- E-commerce Profile Extension for Customer Module
BEGIN;

-- Add core contact fields to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS physical_address TEXT;

-- Create a dedicated table to handle multiple saved e-commerce delivery/service locations
CREATE TABLE IF NOT EXISTS customer_saved_locations (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_label VARCHAR(50) NOT NULL, -- e.g., 'Home', 'Office', 'Boroko Office'
    address_line TEXT NOT NULL,
    coordinates GEOMETRY(Point, 4326),  -- Native PostGIS spatial pairing
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for geo-spatial searches
CREATE INDEX IF NOT EXISTS idx_customer_locations_spatial ON customer_saved_locations USING GIST(coordinates);

COMMIT;
