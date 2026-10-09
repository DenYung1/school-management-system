-- Run this once in the Supabase SQL Editor after replacing the email address.
-- Administrator roles must be assigned by a trusted operator, not by the browser.

UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'replace-with-admin-email@example.com'
);