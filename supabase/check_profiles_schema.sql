-- Check profiles table structure in Supabase
-- Run this SQL directly in Supabase SQL editor

-- 1. First, let's see the current structure of profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if whatsapp_number column already exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'whatsapp_number';

-- 3. If whatsapp_number doesn't exist, add it
-- Uncomment the following line to add the column:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- 4. Optional: Add index for better performance on whatsapp lookups
-- CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp_number);

-- 5. Sample data to test (run after adding column)
-- UPDATE profiles SET whatsapp_number = '+2348012345678' WHERE id = 'your-user-id';