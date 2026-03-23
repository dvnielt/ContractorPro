-- ============================================================
-- FieldFlow — Seed Data
-- Run AFTER schema.sql and AFTER creating users in Supabase Auth dashboard.
-- ============================================================
--
-- USERS TO CREATE IN SUPABASE DASHBOARD
-- (Authentication → Users → Add user, "Send confirmation email" = OFF)
--
-- ┌─────────────────────────────────────────────┬──────────────────┬─────────┐
-- │ Email                                       │ Password         │ Role    │
-- ├─────────────────────────────────────────────┼──────────────────┼─────────┤
-- │ danielthomasdev11@gmail.com                 │ (your choice)    │ admin   │
-- │ demo.marcus@fieldflow.app                   │ FieldFlow2025!   │ tech    │
-- │ demo.jordan@fieldflow.app                   │ FieldFlow2025!   │ tech    │
-- │ demo.riley@fieldflow.app                    │ FieldFlow2025!   │ tech    │
-- └─────────────────────────────────────────────┴──────────────────┴─────────┘
--
-- After creating all users, run this file in the SQL Editor.
-- Replace YOUR_PERSONAL_EMAIL@gmail.com with your actual email before running.
-- ============================================================

-- ============================================================
-- STEP 1: Set roles and display names
-- The trigger auto-creates a profile row on signup.
-- This updates each profile with the correct role and name.
-- ============================================================

-- Admin account
UPDATE profiles
  SET role = 'admin', full_name = 'Admin', color = '#7C3AED'
  WHERE email = 'danielthomasdev11@gmail.com';

-- Demo tech accounts
UPDATE profiles
  SET role = 'tech', full_name = 'Marcus T.', color = '#16A34A'
  WHERE email = 'demo.marcus@fieldflow.app';

UPDATE profiles
  SET role = 'tech', full_name = 'Jordan R.', color = '#EA580C'
  WHERE email = 'demo.jordan@fieldflow.app';

UPDATE profiles
  SET role = 'tech', full_name = 'Riley S.', color = '#0891B2'
  WHERE email = 'demo.riley@fieldflow.app';

-- ============================================================
-- STEP 2: Seed inventory items
-- ============================================================

INSERT INTO inventory_items (name, unit, main_quantity, low_stock_threshold) VALUES
  ('Mulch',               'bags',    50,  10),
  ('Topsoil',             'bags',    30,   5),
  ('Fertilizer',          'bags',    20,   5),
  ('PVC Pipe (1/2 in)',   'lengths', 40,   8),
  ('PVC Pipe (3/4 in)',   'lengths', 30,   8),
  ('Irrigation Valve',    'units',   15,   3),
  ('Sprinkler Head',      'units',   60,  10),
  ('St. Augustine Sod',   'pallets',  8,   2),
  ('Bermuda Sod',         'pallets',  6,   2),
  ('Zoysia Sod',          'pallets',  4,   2),
  ('Edging Stakes',       'bags',    25,   5),
  ('Landscape Fabric',    'rolls',   12,   3),
  ('Bark Chips',          'bags',    35,   8),
  ('Grass Seed',          'lbs',     40,  10),
  ('Weed Killer',         'gallons', 10,   2);

-- ============================================================
-- STEP 3: Assign some inventory to demo techs
-- (Optional — lets you test the tech job workflow immediately)
-- ============================================================

-- Assign items to Marcus
INSERT INTO tech_inventory (tech_id, item_id, quantity)
SELECT p.id, i.id, 10
FROM profiles p, inventory_items i
WHERE p.email = 'demo.marcus@fieldflow.app'
  AND i.name IN ('Mulch', 'Fertilizer', 'Sprinkler Head')
ON CONFLICT (tech_id, item_id) DO NOTHING;

-- Assign items to Jordan
INSERT INTO tech_inventory (tech_id, item_id, quantity)
SELECT p.id, i.id, 8
FROM profiles p, inventory_items i
WHERE p.email = 'demo.jordan@fieldflow.app'
  AND i.name IN ('Topsoil', 'PVC Pipe (1/2 in)', 'Irrigation Valve')
ON CONFLICT (tech_id, item_id) DO NOTHING;

-- Assign items to Riley
INSERT INTO tech_inventory (tech_id, item_id, quantity)
SELECT p.id, i.id, 5
FROM profiles p, inventory_items i
WHERE p.email = 'demo.riley@fieldflow.app'
  AND i.name IN ('St. Augustine Sod', 'Landscape Fabric', 'Bark Chips')
ON CONFLICT (tech_id, item_id) DO NOTHING;

-- Deduct assigned quantities from main stock
UPDATE inventory_items SET main_quantity = main_quantity - 10
  WHERE name IN ('Mulch', 'Fertilizer', 'Sprinkler Head');

UPDATE inventory_items SET main_quantity = main_quantity - 8
  WHERE name IN ('Topsoil', 'PVC Pipe (1/2 in)', 'Irrigation Valve');

UPDATE inventory_items SET main_quantity = main_quantity - 5
  WHERE name IN ('St. Augustine Sod', 'Landscape Fabric', 'Bark Chips');
