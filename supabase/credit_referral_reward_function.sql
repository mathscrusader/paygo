-- Function to credit referral rewards to user profiles
-- This function adds to the reward_balance in profiles table for weekly rewards

CREATE OR REPLACE FUNCTION credit_referral_reward(
    target_user_id UUID,
    reward_amount NUMERIC
)
RETURNS TABLE (
    success BOOLEAN,
    new_balance NUMERIC,
    message TEXT
) AS $$
DECLARE
    current_balance NUMERIC;
    new_balance NUMERIC;
    reward_record RECORD;
BEGIN
    -- Get current reward balance
    SELECT reward_balance INTO current_balance
    FROM profiles 
    WHERE id = target_user_id;
    
    IF current_balance IS NULL THEN
        current_balance := 0;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance + reward_amount;
    
    -- Update the reward balance
    UPDATE profiles 
    SET reward_balance = new_balance,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Log the reward in ReferralRewards table
    INSERT INTO ReferralRewards (
        referrer_id,
        reward_amount,
        status,
        created_at
    ) VALUES (
        target_user_id,
        reward_amount,
        'pending',
        NOW()
    );
    
    -- Return success response
    RETURN QUERY SELECT TRUE, new_balance, 'Referral reward credited successfully'::TEXT;
    
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT FALSE, 0, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Test the function
-- SELECT * FROM credit_referral_reward('your-user-id-here', 20000);