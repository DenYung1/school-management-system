-- Deprecated: use supabase-schema-fixed.sql followed by db/fix-role-permissions.sql.
-- This file is retained for reference and must not be run because its policies
-- allow unsafe role changes and conflict with the canonical profiles schema.

/*

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('student', 'teacher', 'admin')),
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow users to view all profiles"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow admins to update any profile"
ON profiles FOR UPDATE
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Migrate existing users to profiles table
INSERT INTO profiles (id, email, role, created_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'role', 'student'),
    created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Make sure your user is an admin (replace with your email)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
*/
