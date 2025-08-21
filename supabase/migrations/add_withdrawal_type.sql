-- Add withdrawal_type column to distinguish between regular and reward withdrawals
-- This is a safe migration with backward compatibility

ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS withdrawal_type VARCHAR(20) DEFAULT 'regular' 
CHECK (withdrawal_type IN ('regular', 'reward'));

-- Create index for better performance when filtering by type
CREATE INDEX IF NOT EXISTS idx_withdrawals_type ON withdrawals(withdrawal_type);

-- Update existing reward withdrawals (if any) based on user context
-- This is optional since new reward withdrawals will set the type correctly
-- UPDATE withdrawals 
-- SET withdrawal_type = 'reward' 
-- WHERE method = 'bank' 
-- AND user_id IN (
--   SELECT referrer_id FROM ReferralRewards WHERE status = 'paid'
-- );

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'withdrawals' 
AND column_name = 'withdrawal_type';