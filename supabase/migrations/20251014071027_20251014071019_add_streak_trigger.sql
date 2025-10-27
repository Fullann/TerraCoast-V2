/*
  # Add Streak Update Trigger

  1. New Triggers
    - Automatically update streak when a game session is completed
    - Triggered on INSERT or UPDATE of game_sessions where completed = true
*/

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_update_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update streak if the session is completed
  IF NEW.completed = true AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.completed = false)) THEN
    PERFORM update_user_streak(NEW.player_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS update_streak_on_completion ON game_sessions;

CREATE TRIGGER update_streak_on_completion
  AFTER INSERT OR UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();

COMMENT ON FUNCTION trigger_update_streak IS 'Automatically updates user streak when completing a quiz';
