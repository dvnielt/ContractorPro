-- ============================================================
-- FieldFlow — Seed Data
-- ============================================================

-- STEP 1: Set roles and names (All passwords are 'Fieldflow2026')
UPDATE profiles SET role = 'admin', full_name = 'Daniel Thomas', color = '#7C3AED'
  WHERE email = 'danielthomasdev11@gmail.com';

UPDATE profiles SET role = 'tech', full_name = 'Tech 1', color = '#16A34A'
  WHERE email = 'tech1@test.com';

UPDATE profiles SET role = 'tech', full_name = 'Tech 2', color = '#EA580C'
  WHERE email = 'tech2@test.com';

UPDATE profiles SET role = 'tech', full_name = 'Tech 3', color = '#0891B2'
  WHERE email = 'tech3@test.com';

-- STEP 2: Seed inventory items
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