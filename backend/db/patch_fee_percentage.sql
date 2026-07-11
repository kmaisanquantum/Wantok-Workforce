-- Seed global fee percentage setting
INSERT INTO system_settings (key, value, group_category)
VALUES ('global_fee_percent', '10', 'financial')
ON CONFLICT (key) DO NOTHING;
