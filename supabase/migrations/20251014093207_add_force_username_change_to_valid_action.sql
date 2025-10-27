/*
  # Add force_username_change to valid_action constraint

  1. Changes
    - Drop existing valid_action constraint on warnings table
    - Recreate constraint with force_username_change included
  
  2. Security
    - No changes to RLS policies
*/

ALTER TABLE warnings DROP CONSTRAINT IF EXISTS valid_action;

ALTER TABLE warnings ADD CONSTRAINT valid_action 
  CHECK (action_taken IN ('none', 'warning', 'temporary_ban', 'permanent_ban', 'force_username_change'));

