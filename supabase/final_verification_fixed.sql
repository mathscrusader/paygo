-- Final Verification: Test Complete Setup (FIXED)
-- Run these queries to confirm everything works end-to-end

-- 1. Check all database elements are properly set up
SELECT '=== DATABASE VERIFICATION ===' as section;

SELECT 
    'profiles.whatsapp_number' as element,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'whatsapp_number'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'wallet table' as element,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'wallet'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'transactions table' as element,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transactions'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'credit_user_wallet function' as element,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'credit_user_wallet'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 2. Test the credit_user_wallet function with a sample user
SELECT '=== FUNCTION TEST ===' as section;

-- Get a test user ID (you can replace this with a real user ID)
SELECT id as test_user_id, email 
FROM auth.users 
LIMIT 1;

-- 3. Test wallet creation for existing user (if no wallet exists)
SELECT '=== WALLET TEST ===' as section;

-- Check if test user has wallet
SELECT 
    u.id as user_id,
    u.email,
    w.balance,
    w.createdat as wallet_created
FROM auth.users u
LEFT JOIN wallet w ON u.id = w.userid
LIMIT 5;

-- 4. Test credit function (uncomment and replace with real user ID)
-- SELECT credit_user_wallet('your-real-user-id-here', 100.00);

-- 5. Verify transaction logging
SELECT '=== TRANSACTION LOG TEST ===' as section;

-- Check recent transactions (after running credit function)
SELECT 
    t.id,
    t.user_id,
    t.type,
    t.amount,
    t.description,
    t.status,
    t.created_at
FROM transactions t
ORDER BY t.created_at DESC 
LIMIT 10;

-- 6. Check WhatsApp functionality
SELECT '=== WHATSAPP TEST ===' as section;

-- Check profiles with WhatsApp numbers
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.whatsapp_number,
    p.created_at
FROM profiles p
WHERE p.whatsapp_number IS NOT NULL
LIMIT 10;

-- 7. Final summary counts
SELECT '=== SUMMARY COUNTS ===' as section;

SELECT 
    'Total users' as metric, 
    (SELECT COUNT(*) FROM auth.users)::text as count
UNION ALL
SELECT 
    'Total wallets' as metric, 
    (SELECT COUNT(*) FROM wallet)::text as count
UNION ALL
SELECT 
    'Total transactions' as metric, 
    (SELECT COUNT(*) FROM transactions)::text as count
UNION ALL
SELECT 
    'Users with WhatsApp' as metric, 
    (SELECT COUNT(*) FROM profiles WHERE whatsapp_number IS NOT NULL)::text as count;

-- 8. Test instructions for user
SELECT '=== TEST INSTRUCTIONS ===' as section;
SELECT '1. Replace "your-real-user-id-here" with actual user ID from query #2' as instruction
UNION ALL
SELECT '2. Run: SELECT credit_user_wallet(''your-user-id'', 50.00);'
UNION ALL
SELECT '3. Check: SELECT * FROM wallet WHERE userid = ''your-user-id'';'
UNION ALL
SELECT '4. Check: SELECT * FROM transactions WHERE user_id = ''your-user-id'' ORDER BY created_at DESC LIMIT 1;';