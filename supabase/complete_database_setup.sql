-- Complete Database Setup for PayGo
-- Run these SQL commands directly in Supabase SQL editor

-- ============================================
-- 1. PROFILES TABLE UPDATES
-- ============================================

-- Add whatsapp_number column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- Add index for better performance on WhatsApp lookups
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp_number);

-- Add check constraint for WhatsApp number format
ALTER TABLE profiles 
ADD CONSTRAINT check_whatsapp_format 
CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^\+[1-9][0-9]{7,14}$');

-- ============================================
-- 2. WALLET TABLE CREATION
-- ============================================

-- Create wallet table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) DEFAULT 0.00 CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(userid)
);

-- Create index on userid for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_userid ON wallet(userid);

-- ============================================
-- 3. DATABASE FUNCTIONS
-- ============================================

-- Function to credit user wallet
CREATE OR REPLACE FUNCTION credit_user_wallet(user_id UUID, amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL;
    new_balance DECIMAL;
BEGIN
    -- Ensure amount is positive
    IF amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;
    
    -- Check if wallet exists, create if not
    IF NOT EXISTS (SELECT 1 FROM wallet WHERE userid = user_id) THEN
        INSERT INTO wallet (userid, balance) VALUES (user_id, 0.00);
    END IF;
    
    -- Get current balance
    SELECT balance INTO current_balance FROM wallet WHERE userid = user_id;
    
    -- Calculate new balance
    new_balance := current_balance + amount;
    
    -- Update wallet
    UPDATE wallet 
    SET balance = new_balance, updated_at = NOW() 
    WHERE userid = user_id;
    
    -- Log the transaction
    INSERT INTO transactions (
        user_id, 
        type, 
        amount, 
        description, 
        status, 
        created_at
    ) VALUES (
        user_id,
        'credit',
        amount,
        'Wallet credited via rewards',
        'completed',
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create wallet for new users
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallet (userid, balance) VALUES (NEW.id, 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create wallet when new user signs up
DROP TRIGGER IF EXISTS trigger_create_wallet ON auth.users;
CREATE TRIGGER trigger_create_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_new_user();

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update wallet updated_at
DROP TRIGGER IF EXISTS trigger_update_wallet_updated_at ON wallet;
CREATE TRIGGER trigger_update_wallet_updated_at
    BEFORE UPDATE ON wallet
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to format WhatsApp numbers consistently
CREATE OR REPLACE FUNCTION format_whatsapp_number(phone VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN REGEXP_REPLACE(phone, '[^+0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-format WhatsApp numbers
CREATE OR REPLACE FUNCTION format_whatsapp_on_save()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.whatsapp_number IS NOT NULL THEN
        NEW.whatsapp_number := format_whatsapp_number(NEW.whatsapp_number);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_format_whatsapp ON profiles;
CREATE TRIGGER trigger_format_whatsapp
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION format_whatsapp_on_save();

-- ============================================
-- 4. TRANSACTIONS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
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

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Check all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check profiles structure
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- Check wallet structure
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'wallet' ORDER BY ordinal_position;

-- Test the credit function
-- SELECT credit_user_wallet('your-user-id-here', 100.00);

-- Check wallet balance
-- SELECT * FROM wallet WHERE userid = 'your-user-id-here';