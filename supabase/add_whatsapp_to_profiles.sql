-- Add WhatsApp functionality to profiles table
-- Run this SQL directly in Supabase SQL editor

-- Add whatsapp_number column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- Add index for better performance when searching by WhatsApp number
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp_number);

-- Optional: Add a check constraint to ensure valid phone number format
-- This ensures the WhatsApp number follows basic international format
ALTER TABLE profiles 
ADD CONSTRAINT check_whatsapp_format 
CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^\+[1-9][0-9]{7,14}$');

-- Create a function to format WhatsApp numbers consistently
CREATE OR REPLACE FUNCTION format_whatsapp_number(phone VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    -- Remove all non-digit characters except +
    RETURN REGEXP_REPLACE(phone, '[^+0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-format WhatsApp numbers on insert/update
CREATE OR REPLACE FUNCTION format_whatsapp_on_save()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.whatsapp_number IS NOT NULL THEN
        NEW.whatsapp_number := format_whatsapp_number(NEW.whatsapp_number);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-formatting
DROP TRIGGER IF EXISTS trigger_format_whatsapp ON profiles;
CREATE TRIGGER trigger_format_whatsapp
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION format_whatsapp_on_save();

-- Test the setup
-- INSERT INTO profiles (id, full_name, whatsapp_number) VALUES ('test-user', 'Test User', '+234 801 234 5678');
-- SELECT * FROM profiles WHERE id = 'test-user'; -- Should show formatted number

-- Verify the table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'whatsapp_number';