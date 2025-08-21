# PayGo Database Testing Guide

## Understanding the Balance System

PayGo has **two separate balance systems**:

1. **"Your Balance"** - This is the wallet balance stored in the `wallet` table
2. **"Weekly Rewards"** - This is the referral reward balance stored in `profiles.reward_balance`

## Testing Referral Rewards (Weekly Rewards)

### Step 1: Create the Referral Reward Function
Run the SQL in `supabase/credit_referral_reward_function.sql` to create the function that credits referral rewards.

### Step 2: Test with Real User Data
Use the provided test script `test_referral_reward.sql` which contains:

```sql
-- Check current user details
SELECT id, full_name, reward_balance FROM profiles WHERE id = '8c4d3e2a-1b9c-4f7e-9a8d-123456789abc';

-- Credit referral reward (₦20,000)
SELECT * FROM credit_referral_reward('8c4d3e2a-1b9c-4f7e-9a8d-123456789abc', 20000);

-- Verify the reward appears in Weekly Rewards
SELECT COALESCE(SUM(reward_amount), 0) as total_pending_rewards
FROM ReferralRewards 
WHERE referrer_id = '8c4d3e2a-1b9c-4f7e-9a8d-123456789abc'
AND status = 'pending';
```

### Step 3: Verify on Dashboard
After running the test:
1. Navigate to the user dashboard
2. Check that "Weekly Rewards" shows the credited amount (₦20,000)
3. Click "Weekly Rewards" to go to `/rewards` page
4. Verify the withdrawal functionality works from there

## Database Schema Summary

### Tables Involved:
- **profiles**: Contains `reward_balance` for referral rewards
- **wallet**: Contains `balance` for main wallet funds
- **ReferralRewards**: Tracks individual referral reward transactions

### Functions:
- `credit_user_wallet()`: Credits wallet balance (Your Balance)
- `credit_referral_reward()`: Credits referral rewards (Weekly Rewards)

## Testing Commands

### 1. Test Referral Rewards (Correct for Withdrawals)
```bash
# Run this in Supabase SQL editor
c:\Users\UK USED\Desktop\DAVID\Projects\PayGo_New\paygo\test_referral_reward.sql
```

### 2. Check Current Balances
```sql
-- Check wallet balance (Your Balance)
SELECT balance FROM wallet WHERE userid = '8c4d3e2a-1b9c-4f7e-9a8d-123456789abc';

-- Check referral rewards (Weekly Rewards)
SELECT reward_balance FROM profiles WHERE id = '8c4d3e2a-1b9c-4f7e-9a8d-123456789abc';
```

## Important Notes

- **Withdrawals should come from referral rewards** (Weekly Rewards)
- **Wallet balance** is for regular transactions, not withdrawals
- **Referral rewards** accumulate in `profiles.reward_balance`
- The `/rewards` page shows pending rewards and allows withdrawal
- Each referral creates a record in `ReferralRewards` with status 'pending'

## Verification Steps

1. **Before testing**: Check current Weekly Rewards on dashboard
2. **Run credit**: Execute referral reward credit function
3. **Verify**: Check Weekly Rewards increased by credited amount
4. **Test withdrawal**: Use `/rewards` page to withdraw to bank account
5. **Confirm**: Verify reward balance decreased after withdrawal

## Error Handling

If you encounter errors:
- Ensure the `credit_referral_reward` function exists
- Verify the user ID exists in both `profiles` and `auth.users`
- Check that `ReferralRewards` table has proper permissions
- Confirm the reward amount is positive and valid