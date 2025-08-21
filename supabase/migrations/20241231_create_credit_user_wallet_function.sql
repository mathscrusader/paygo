-- Create wallet table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  userid uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on userid for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_userid ON wallet(userid);

-- Create the credit_user_wallet function
CREATE OR REPLACE FUNCTION credit_user_wallet(uid uuid, amount integer)
RETURNS void AS $$
BEGIN
  -- Update the wallet balance for the given user
  UPDATE wallet 
  SET balance = balance + amount,
      updated_at = NOW()
  WHERE userid = uid;
  
  -- If no wallet exists for this user, create one with the credited amount
  IF NOT FOUND THEN
    INSERT INTO wallet (userid, balance, created_at, updated_at)
    VALUES (uid, amount, NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_wallet_updated_at
  BEFORE UPDATE ON wallet
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();