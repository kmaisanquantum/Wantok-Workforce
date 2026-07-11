-- PostgreSQL / PostGIS Schema for Wantok Workforce Auth System

BEGIN;

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create role enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_role') THEN
        CREATE TYPE account_role AS ENUM ('customer', 'provider', 'admin', 'mixed');
    END IF;
END$$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    role account_role NOT NULL DEFAULT 'customer',
    active_persona account_role,

    -- Availability for providers
    is_available BOOLEAN DEFAULT TRUE,

    -- Location handling via PostGIS
    location_coords GEOGRAPHY(POINT, 4326),
    location_name TEXT,

    -- Provider-specific nullable fields
    primary_skill TEXT,
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    is_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrations for existing tables
DO $$
BEGIN
    -- Check for 'role' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role account_role NOT NULL DEFAULT 'customer';
    END IF;

    -- Check for 'active_persona' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='active_persona') THEN
        ALTER TABLE users ADD COLUMN active_persona account_role;
    END IF;

    -- Check for 'is_available' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_available') THEN
        ALTER TABLE users ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
    END IF;
END$$;

-- Establish a multi-role mapping table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_name account_role NOT NULL,
    PRIMARY KEY (user_id, role_name)
);

-- Index for geo-spatial searches
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location_coords);

COMMIT;

-- Create bookings table for matching metrics
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    price DECIMAL(10, 2),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed some mock data for stats if needed (optional, but good for testing)
-- INSERT INTO bookings (customer_id, provider_id, service_type, status) VALUES (1, 2, 'Electrical', 'completed');

-- Migration: add is_flagged column to users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_flagged') THEN
        ALTER TABLE users ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
    END IF;
END$$;
