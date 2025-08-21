-- Test Database Setup
-- Run these queries to verify everything is working

-- 1. Check if all required tables exist
SELECT 
    'profiles' as table_name, 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'wallet' as table_name, 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'transactions' as table_name, 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 2. Check profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND column_name IN ('id', 'full_name', 'email', 'whatsapp_number', 'reward_balance')
ORDER BY ordinal_position;

-- 3. Check if credit_user_wallet function exists
SELECT 
    'credit_user_wallet' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'credit_user_wallet'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 4. Test the setup with sample data (optional)
-- First, get a user ID to test with
SELECT id, email FROM auth.users LIMIT 1;

-- 5. If you have a user ID, test the credit function:
-- Replace 'your-actual-user-id' with a real user ID from above query
-- SELECT credit_user_wallet('your-actual-user-id', 50.00);

-- 6. Verify wallet was created and balance updated
-- SELECT * FROM wallet WHERE userid = 'your-actual-user-id';

-- 7. Verify transaction was logged
-- SELECT * FROM transactions WHERE user_id = 'your-actual-user-id' ORDER BY created_at DESC LIMIT 1;

-- 8. Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('profiles', 'wallet', 'transactions');

-- 9. Quick summary
SELECT 
    'Total users' as metric, (SELECT COUNT(*) FROM auth.users)::text as value
UNION ALL
SELECT 
    'Total wallets' as metric, (SELECT COUNT(*) FROM wallet)::text as value
UNION ALL
SELECT 
    'Total transactions' as metric, (SELECT COUNT(*) FROM transactions)::text as value
UNION ALL
SELECT 
    'Users with WhatsApp' as metric, (SELECT COUNT(*) FROM profiles WHERE whatsapp_number IS NOT NULL)::text as value;