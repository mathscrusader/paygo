-- Debug withdrawals - corrected version
-- Check actual table structure first

-- Step 1: Check if withdrawals table exists and its exact structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'withdrawals'
ORDER BY ordinal_position;

-- Step 2: Get all data from withdrawals (only selecting existing columns)
SELECT 
    id,
    user_id,
    amount,
    status,
    method,
    bank_name,
    account_name,
    account_number,
    withdrawal_type,
    created_at
FROM withdrawals 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 3: Check for reward withdrawals specifically
SELECT 
    COUNT(*) as reward_withdrawal_count,
    SUM(amount) as total_reward_amount
FROM withdrawals 
WHERE withdrawal_type = 'reward';

-- Step 4: Check regular withdrawals
SELECT 
    COUNT(*) as regular_withdrawal_count,
    SUM(amount) as total_regular_amount
FROM withdrawals 
WHERE withdrawal_type = 'regular' OR withdrawal_type IS NULL;

-- Step 5: Check all distinct withdrawal types
SELECT 
    withdrawal_type,
    COUNT(*) as count
FROM withdrawals 
GROUP BY withdrawal_type
ORDER BY count DESC;