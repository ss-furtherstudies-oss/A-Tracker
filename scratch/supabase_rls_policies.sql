-- Phase 1: Security & Stability - Supabase RLS Policies
-- Instructions: Run this SQL in your Supabase SQL Editor to enforce backend security.

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE qs_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a helper function to check if the current user is an ADMIN
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role from the profiles table for the authenticated user
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Policies for 'students' table
-- ==========================================
-- Everyone authenticated can read students
CREATE POLICY "Allow authenticated read access on students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert, update, or delete students
CREATE POLICY "Allow admin insert on students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Allow admin update on students"
  ON students FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete on students"
  ON students FOR DELETE
  TO authenticated
  USING (is_admin());

-- ==========================================
-- Policies for 'applications' table
-- ==========================================
CREATE POLICY "Allow authenticated read access on applications"
  ON applications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin insert on applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Allow admin update on applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete on applications"
  ON applications FOR DELETE
  TO authenticated
  USING (is_admin());

-- ==========================================
-- Policies for 'qs_rankings' and 'university_mappings'
-- ==========================================
CREATE POLICY "Allow authenticated read access on qs_rankings"
  ON qs_rankings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin insert/update on qs_rankings"
  ON qs_rankings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow authenticated read access on university_mappings"
  ON university_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin insert/update on university_mappings"
  ON university_mappings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
