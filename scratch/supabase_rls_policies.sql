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
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==========================================
-- Policies for 'profiles' table
-- ==========================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Only admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (is_admin());

-- Only admins can update profiles
CREATE POLICY "Admins can update profiles" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==========================================
-- Auto-create profile on signup
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'VIEWER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
