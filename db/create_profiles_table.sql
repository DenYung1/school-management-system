-- Deprecated: use ../supabase-schema-fixed.sql followed by db/fix-role-permissions.sql.
-- This file is retained for reference and must not be run because it drops data,
-- creates duplicate triggers, and contains recursive role policies.

/*
-- First, drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS profiles CASCADE;

-- Then create the table with all required columns
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('student', 'teacher', 'admin')),
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a secure policy that allows only administrators to update roles
CREATE POLICY "Allow administrators to update any profile"
ON profiles
FOR UPDATE
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Create a policy that allows users to read all profiles
CREATE POLICY "Allow users to view all profiles"
ON profiles
FOR SELECT
USING (true);

-- Create a policy that allows users to update their own profile (except role)
CREATE POLICY "Allow users to update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their own role
    (role IS NULL OR role = (SELECT role FROM profiles WHERE id = auth.uid()))
);

-- Create a trigger to sync user data from auth.users to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, created_at)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'student'),
        new.created_at
    );
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update the last_sign_in_at field
CREATE OR REPLACE FUNCTION public.handle_user_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET last_sign_in_at = now()
    WHERE id = new.id;
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in handle_user_sign_in trigger: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users for sign-ins
CREATE TRIGGER on_auth_user_signed_in
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.handle_user_sign_in();

-- Migrate existing users to profiles table
DO $$ 
BEGIN
    BEGIN
        INSERT INTO profiles (id, full_name, email, role, created_at)
        SELECT 
            id,
            raw_user_meta_data->>'full_name',
            email,
            COALESCE(raw_user_meta_data->>'role', 'student'),
            created_at
        FROM auth.users
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error migrating existing users: %', SQLERRM;
    END;
END $$;
*/
