-- ============================================================
-- FieldFlow — Full Database Schema
-- Run these blocks in the Supabase SQL editor IN THIS ORDER.
-- ============================================================

-- ============================================================
-- STEP 1: TABLES
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'tech')),
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  main_quantity INTEGER NOT NULL DEFAULT 0 CHECK (main_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tech_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tech_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tech_id, item_id)
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT UNIQUE,
  client_name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  job_type TEXT NOT NULL DEFAULT 'other' CHECK (job_type IN ('tree', 'irrigation', 'sod', 'other')),
  assigned_tech_id UUID REFERENCES profiles(id),
  color TEXT DEFAULT '#6B7280',
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'on_the_way', 'in_progress', 'pending_review', 'complete')),
  bid_status TEXT DEFAULT NULL CHECK (bid_status IN ('needs_bid', 'pending_approval', 'approved', NULL)),
  bid_amount DECIMAL(10,2) DEFAULT NULL,
  notes TEXT,
  change_request_notes TEXT,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  is_locked BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
  tree_size TEXT CHECK (tree_size IN ('small', 'medium', 'large')),
  tree_height_ft INTEGER,
  valve_count INTEGER,
  has_irrigation BOOLEAN,
  sod_type TEXT,
  custom_notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'during')),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
  logged_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add_to_main', 'assign_to_tech', 'job_usage')),
  quantity INTEGER NOT NULL,
  from_entity TEXT,
  to_entity TEXT,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  job_id UUID REFERENCES jobs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 2: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, color)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tech'),
    COALESCE(NEW.raw_user_meta_data->>'color', '#6B7280')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STEP 3: AUTO-GENERATE JOB NUMBER
-- ============================================================

CREATE SEQUENCE job_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.job_number := 'JOB-' || LPAD(nextval('job_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_number
  BEFORE INSERT ON jobs
  FOR EACH ROW EXECUTE FUNCTION generate_job_number();

-- ============================================================
-- STEP 4: UPDATED_AT AUTO-UPDATE
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tech_inventory_updated_at BEFORE UPDATE ON tech_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STEP 5: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can view profiles"
  ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can view inventory items"
  ON inventory_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update inventory items"
  ON inventory_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE tech_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Techs see own inventory, admins see all"
  ON tech_inventory FOR SELECT
  USING (tech_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage tech inventory"
  ON tech_inventory FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Techs can update own inventory quantity"
  ON tech_inventory FOR UPDATE USING (tech_id = auth.uid());

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Techs see assigned jobs, admins see all"
  ON jobs FOR SELECT
  USING (assigned_tech_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Techs and admins can update jobs"
  ON jobs FOR UPDATE
  USING (assigned_tech_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE job_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job access controls checklist access"
  ON job_checklists FOR SELECT
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND (jobs.assigned_tech_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))));
CREATE POLICY "Techs can insert checklist on their jobs"
  ON job_checklists FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.assigned_tech_id = auth.uid()));
CREATE POLICY "Techs can update checklist on their active jobs"
  ON job_checklists FOR UPDATE
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.assigned_tech_id = auth.uid() AND jobs.is_locked = FALSE));

ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job access controls photo access"
  ON job_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND (jobs.assigned_tech_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))));
CREATE POLICY "Techs can upload photos to active jobs"
  ON job_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.assigned_tech_id = auth.uid() AND jobs.is_locked = FALSE));

ALTER TABLE job_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job access controls inventory log access"
  ON job_inventory FOR SELECT
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND (jobs.assigned_tech_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))));
CREATE POLICY "Techs can log inventory on active jobs"
  ON job_inventory FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.assigned_tech_id = auth.uid() AND jobs.is_locked = FALSE));

ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can view status history"
  ON job_status_history FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert status history"
  ON job_status_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all transactions"
  ON inventory_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Authenticated users can insert transactions"
  ON inventory_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- STEP 6: STORAGE BUCKET (run in Supabase dashboard or via CLI)
-- ============================================================
-- Dashboard: Storage → New bucket
--   Name: job-photos
--   Public: OFF
--   File size limit: 5242880 (5MB)
--   Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Then add these storage policies in SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('job-photos', 'job-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload job photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view job photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete own job photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'job-photos' AND auth.uid() IS NOT NULL);

-- ============================================================
-- STEP 7: job_photos DELETE RLS
-- ============================================================

CREATE POLICY "Techs can delete own photos on non-locked jobs"
  ON job_photos FOR DELETE
  USING (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_id AND jobs.is_locked = FALSE
    )
  );
