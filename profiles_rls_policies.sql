-- RLS Policies for profiles table to allow users to update their own reward_balance

-- First, enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy to allow users to update their own profile (including reward_balance)
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy to allow users to read other profiles (if needed for referrals)
CREATE POLICY "Users can view other profiles" ON profiles
    FOR SELECT
    USING (true);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- Verify policies are created
SELECT * FROM pg_policies WHERE tablename = 'profiles';