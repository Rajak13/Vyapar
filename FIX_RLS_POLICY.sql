-- ============================================
-- FIX: "new row violates row-level security policy"
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- First, check if there are any existing policies
-- (This is just for information, you can skip this)
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop any existing policies on storage.objects for receipts bucket
-- (This prevents conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users full access to receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Create a comprehensive policy that allows authenticated users to do everything
CREATE POLICY "Allow authenticated users full access to receipts"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'receipts')
WITH CHECK (bucket_id = 'receipts');

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%receipts%';
