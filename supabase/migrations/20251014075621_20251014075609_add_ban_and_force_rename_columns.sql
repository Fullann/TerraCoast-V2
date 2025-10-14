/*
  # Add temporary ban and forced username change columns

  1. New Columns
    - Add `ban_until` to profiles for temporary ban expiration
    - Add `force_username_change` to profiles to require username change on next login
    - Add `ban_reason` to profiles to store the reason for the ban
    - Add `temp_ban_until` to warnings for tracking temporary ban duration

  2. Changes
    - Profiles can now have temporary bans with expiration dates
    - Admins can force users to change their username
    - Ban reasons are stored for transparency
*/

-- Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ban_until timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS force_username_change boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason text DEFAULT NULL;

-- Add column to warnings table for temporary ban tracking
ALTER TABLE warnings
ADD COLUMN IF NOT EXISTS temp_ban_until timestamptz DEFAULT NULL;

-- Create index for checking active bans
CREATE INDEX IF NOT EXISTS idx_profiles_ban_until ON profiles(ban_until) WHERE ban_until IS NOT NULL;

-- Create index for forced username changes
CREATE INDEX IF NOT EXISTS idx_profiles_force_rename ON profiles(force_username_change) WHERE force_username_change = true;

COMMENT ON COLUMN profiles.ban_until IS 'Timestamp until which the user is banned (NULL if not banned or permanently banned)';
COMMENT ON COLUMN profiles.force_username_change IS 'Whether the user must change their username on next login';
COMMENT ON COLUMN profiles.ban_reason IS 'Reason for the current ban (displayed to user)';
COMMENT ON COLUMN warnings.temp_ban_until IS 'If temporary ban action taken, the expiration date';
