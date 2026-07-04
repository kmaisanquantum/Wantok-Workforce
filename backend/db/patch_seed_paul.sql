-- Seed a test provider named Paul
INSERT INTO users (name, phone_number, email, password_hash, role, active_persona, primary_skill, location_name, is_available, is_verified, hourly_rate)
VALUES ('Paul the Sparky', '12345678', 'paul@example.com', '$2b2$5uLOpMJEX0ee4jPCfoxGEuLGEZE1SovR.MiBPZ6PUUyRzHYdusJn.', 'provider', 'provider', 'Electric', 'Port Moresby', true, true, 45.00)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  primary_skill = EXCLUDED.primary_skill,
  is_available = true,
  active_persona = 'provider';

-- Ensure role is mapped
INSERT INTO user_roles (user_id, role_name)
SELECT id, 'provider' FROM users WHERE email = 'paul@example.com'
ON CONFLICT DO NOTHING;

-- Ensure provider profile exists
INSERT INTO provider_profiles (user_id, business_name, verification_status)
SELECT id, 'Paul Electrical Services', 'verified' FROM users WHERE email = 'paul@example.com'
ON CONFLICT (user_id) DO NOTHING;
