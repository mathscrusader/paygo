-- Safe Migration for Existing Database
-- This script only adds missing elements without affecting existing data

-- ============================================
-- 1. SAFE PROFILES TABLE UPDATES
-- ============================================

-- Only add whatsapp_number if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'whatsapp_number'
    ) THEN
        ALTER TABLE profiles ADD COLUMN whatsapp_number VARCHAR(20);
        CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp_number);
        
        -- Only add constraint if column was added
        ALTER TABLE profiles 
        ADD CONSTRAINT check_whatsapp_format 
        CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^\+[1-9][0-9]{7,14}$');
    END IF;
END $$;

-- ============================================
-- 2. SAFE WALLET TABLE CREATION
-- ============================================

-- Only create wallet table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wallet'
    ) THEN
        CREATE TABLE wallet (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            userid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            balance DECIMAL(15,2) DEFAULT 0.00 CHECK (balance >= 0),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(userid)
        );
        CREATE INDEX IF NOT EXISTS idx_wallet_userid ON wallet(userid);
    END IF;
END $$;

-- ============================================
-- 3. SAFE TRANSACTIONS TABLE CREATION
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
    ) THEN
        CREATE TABLE transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'transfer', 'withdrawal')),
            amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
            description TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
            reference VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
    END IF;
END $$;

-- ============================================
-- 4. SAFE FUNCTION CREATION
-- ============================================

-- Create credit_user_wallet function only if it doesn't exist
CREATE OR REPLACE FUNCTION credit_user_wallet(user_id UUID, amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL;
    new_balance DECIMAL;
BEGIN
    IF amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM wallet WHERE userid = user_id) THEN
        INSERT INTO wallet (userid, balance) VALUES (user_id, 0.00);
    END IF;
    
    SELECT balance INTO current_balance FROM wallet WHERE userid = user_id;
    new_balance := current_balance + amount;
    
    UPDATE wallet 
    SET balance = new_balance, updated_at = NOW() 
    WHERE userid = user_id;
    
    INSERT INTO transactions (
        user_id, type, amount, description, status, created_at
    ) VALUES (
        user_id, 'credit', amount, 'Wallet credited via rewards', 'completed', NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. SAFE TRIGGER CREATION
-- ============================================

-- Create trigger function only if it doesn't exist
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM wallet WHERE userid = NEW.id) THEN
        INSERT INTO wallet (userid, balance) VALUES (NEW.id, 0.00);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_create_wallet'
    ) THEN
        CREATE TRIGGER trigger_create_wallet
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION create_wallet_for_new_user();
    END IF;
END $$;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Check what was added
SELECT 
    'profiles.whatsapp_number' as element,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'whatsapp_number'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'wallet table' as element,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'wallet'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'transactions table' as element,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transactions'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'credit_user_wallet function' as element,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'credit_user_wallet'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;