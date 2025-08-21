-- Check Current Database State Before Migration
-- Run this first to see what already exists

-- 1. Check all existing tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'wallet', 'transactions', 'users')
ORDER BY table_name;

-- 2. Check existing columns in profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if wallet table exists and its structure
SELECT 
    table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet') THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 4. Check existing functions
SELECT 
    proname as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'credit_user_wallet') THEN 'EXISTS' ELSE 'MISSING' END as status
FROM pg_proc 
WHERE proname IN ('credit_user_wallet', 'create_wallet_for_new_user', 'format_whatsapp_number');

-- 5. Check existing indexes
SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'wallet', 'transactions')
ORDER BY tablename, indexname;

-- 6. Sample data check (counts)
SELECT 
    'profiles' as table_name, 
    (SELECT COUNT(*) FROM profiles)::text as row_count
UNION ALL
SELECT 
    'wallet' as table_name, 
    (SELECT COUNT(*) FROM wallet)::text as row_count
UNION ALL
SELECT 
    'transactions' as table_name, 
    (SELECT COUNT(*) FROM transactions)::text as row_count
UNION ALL
SELECT 
    'auth.users' as table_name, 
    (SELECT COUNT(*) FROM auth.users)::text as row_count;

-- 7. Check for any existing whatsapp_number column
SELECT 
    'whatsapp_number column in profiles' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'whatsapp_number'
    ) THEN 'ALREADY EXISTS' ELSE 'NEEDS TO BE ADDED' END as status;

-- 8. Check existing constraints
SELECT 
    conname as constraint_name,
    contype,
    conrelid::regclass as table_name
FROM pg_constraint 
WHERE conname LIKE '%whatsapp%' OR conname LIKE '%wallet%' OR conname LIKE '%credit%'
ORDER BY conname;