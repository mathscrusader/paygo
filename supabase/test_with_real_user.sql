-- Test PayGo Wallet Functionality with Real User
-- User: Check Nassa 6 (ID: 4b57dcbf-6f3f-40cb-ac3b-755e73d6aa90)
-- WhatsApp: +2348173217526

-- 1. Check current user details
SELECT '=== USER DETAILS ===' as section;
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.whatsapp_number,
    p.created_at
FROM profiles p
WHERE p.id = '4b57dcbf-6f3f-40cb-ac3b-755e73d6aa90';

-- 2. Check current wallet status
SELECT '=== CURRENT WALLET STATUS ===' as section;
SELECT 
    w.userid,
    w.balance,
    w.createdat
FROM wallet w
WHERE w.userid = '4b57dcbf-6f3f-40cb-ac3b-755e73d6aa90';

-- 3. Test credit function with ₦20000
SELECT '=== TESTING CREDIT FUNCTION ===' as section;
SELECT credit_user_wallet('4b57dcbf-6f3f-40cb-ac3b-755e73d6aa90', 20000);

-- 4. Verify wallet was updated
SELECT '=== WALLET AFTER CREDIT ===' as section;
SELECT 
    w.userid,
    w.balance,
    w.createdat
FROM wallet w
WHERE w.userid = '4b57dcbf-6f3f-40cb-ac3b-755e73d6aa90';

-- 5. Verify transaction was logged
SELECT '=== TRANSACTION LOG ===' as section;
SELECT 
    t.id,
    t.user_id,
    t.type,
    t.amount,
    t.description,
    t.status,
    t.created_at
FROM transactions t
WHERE t.user_id = '4b57dcbf-6f3f-40cb-ac3b-755e73d6aa90'
ORDER BY t.created_at DESC 
LIMIT 5;