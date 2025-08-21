-- Create withdrawals table if it doesn't exist
-- This table stores all withdrawal requests (regular and reward)

CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    method VARCHAR(20) NOT NULL CHECK (method IN ('bank', 'wallet')),
    bank_name VARCHAR(100),
    account_name VARCHAR(100),
    account_number VARCHAR(20),
    withdrawal_type VARCHAR(20) DEFAULT 'regular' CHECK (withdrawal_type IN ('regular', 'reward')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_type ON withdrawals(withdrawal_type);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER trigger_update_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_withdrawals_updated_at();

-- Verification query
SELECT 
    'withdrawals table' as element,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'withdrawals'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;