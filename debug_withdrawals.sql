-- Debug withdrawals to see current state
-- Check if withdrawals table exists and what data we have

-- First, let's see if the table exists
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE '%withdrawal%';

-- If table exists, check its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'withdrawals'
ORDER BY ordinal_position;

-- Now let's see all withdrawals with their types
SELECT 
    id,
    user_id,
    amount,
    status,
    method,
    withdrawal_type,
    created_at,
    updated_at
FROM withdrawals 
ORDER BY created_at DESC 
LIMIT 20;

-- Let's specifically check for reward withdrawals
SELECT 
    COUNT(*) as total_reward_withdrawals,
    SUM(amount) as total_reward_amount
FROM withdrawals 
WHERE withdrawal_type = 'reward';

-- Check regular withdrawals too
SELECT 
    COUNT(*) as total_regular_withdrawals,
    SUM(amount) as total_regular_amount
FROM withdrawals 
WHERE withdrawal_type = 'regular' OR withdrawal_type IS NULL;