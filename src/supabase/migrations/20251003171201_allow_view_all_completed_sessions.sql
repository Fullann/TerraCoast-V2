/*
  # Allow viewing all completed game sessions for leaderboard

  1. Changes
    - Add new RLS policy to allow authenticated users to view all completed game sessions
    - This is needed for the leaderboard to display scores of all players

  2. Security
    - Users can still only INSERT/UPDATE their own sessions
    - All users can view completed sessions (for public leaderboard)
    - Incomplete sessions remain private to the player
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own sessions" ON game_sessions;

-- Create new policies: one for viewing own sessions, one for viewing all completed sessions
CREATE POLICY "Users can view own sessions"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Users can view all completed sessions"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (completed = true);
