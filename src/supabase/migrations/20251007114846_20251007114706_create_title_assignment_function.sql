/*
  # Create Title Assignment System

  ## Changes Made
  
  ### Function for Automatic Title Assignment
  1. Create function `assign_earned_titles(user_id uuid)`
     - Checks all title requirements
     - Assigns titles to users who meet requirements
     - Returns list of newly assigned titles
  
  ### Function for Checking Title Requirements
  1. Create function `check_title_requirement(user_id uuid, requirement_type text, requirement_value int)`
     - Evaluates different requirement types (level, wins, etc.)
     - Returns true if requirement is met
  
  ### Trigger for Auto Assignment
  1. Create trigger on profiles table
     - Runs after UPDATE on profiles
     - Automatically assigns earned titles when stats change
  
  ## Security
  - Functions use SECURITY DEFINER to bypass RLS
  - Only checks and assigns, doesn't modify title requirements
*/

-- Function to check if a user meets a specific title requirement
CREATE OR REPLACE FUNCTION check_title_requirement(
  p_user_id uuid,
  p_requirement_type text,
  p_requirement_value int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_count int;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  CASE p_requirement_type
    WHEN 'level' THEN
      RETURN v_profile.level >= p_requirement_value;
      
    WHEN 'wins' THEN
      SELECT COUNT(*) INTO v_count
      FROM duels
      WHERE winner_id = p_user_id;
      RETURN v_count >= p_requirement_value;
      
    WHEN 'quizzes_completed' THEN
      SELECT COUNT(*) INTO v_count
      FROM game_sessions
      WHERE player_id = p_user_id AND completed = true;
      RETURN v_count >= p_requirement_value;
      
    WHEN 'perfect_scores' THEN
      SELECT COUNT(*) INTO v_count
      FROM game_sessions
      WHERE player_id = p_user_id AND completed = true AND correct_answers = total_questions;
      RETURN v_count >= p_requirement_value;
      
    WHEN 'published_quizzes' THEN
      RETURN v_profile.published_quiz_count >= p_requirement_value;
      
    WHEN 'total_score' THEN
      SELECT COALESCE(SUM(score), 0) INTO v_count
      FROM game_sessions
      WHERE player_id = p_user_id;
      RETURN v_count >= p_requirement_value;
      
    WHEN 'account_age_days' THEN
      RETURN EXTRACT(EPOCH FROM (NOW() - v_profile.created_at)) / 86400 >= p_requirement_value;
      
    WHEN 'first_place' THEN
      SELECT COUNT(*) INTO v_count
      FROM monthly_rankings_history
      WHERE user_id = p_user_id AND final_rank = 1;
      RETURN v_count >= p_requirement_value;
      
    WHEN 'monthly_rank' THEN
      SELECT COUNT(*) INTO v_count
      FROM monthly_rankings_history
      WHERE user_id = p_user_id AND final_rank <= p_requirement_value;
      RETURN v_count > 0;
      
    WHEN 'badges_earned' THEN
      SELECT COUNT(*) INTO v_count
      FROM user_badges
      WHERE user_id = p_user_id;
      RETURN v_count >= p_requirement_value;
      
    WHEN 'friends_count' THEN
      SELECT COUNT(*) INTO v_count
      FROM friendships
      WHERE (user_id = p_user_id OR friend_id = p_user_id) AND status = 'accepted';
      RETURN v_count >= p_requirement_value;
      
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Function to assign all earned titles to a user
CREATE OR REPLACE FUNCTION assign_earned_titles(p_user_id uuid)
RETURNS TABLE(title_id uuid, title_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO user_titles (user_id, title_id, earned_at)
  SELECT 
    p_user_id,
    t.id,
    NOW()
  FROM titles t
  WHERE NOT EXISTS (
    SELECT 1 FROM user_titles ut
    WHERE ut.user_id = p_user_id AND ut.title_id = t.id
  )
  AND check_title_requirement(p_user_id, t.requirement_type, t.requirement_value)
  RETURNING title_id, (SELECT name FROM titles WHERE id = title_id);
END;
$$;

-- Trigger function to auto-assign titles when profile changes
CREATE OR REPLACE FUNCTION trigger_assign_titles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM assign_earned_titles(NEW.id);
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS auto_assign_titles_on_profile_update ON profiles;
CREATE TRIGGER auto_assign_titles_on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (
    OLD.level IS DISTINCT FROM NEW.level OR
    OLD.experience_points IS DISTINCT FROM NEW.experience_points OR
    OLD.published_quiz_count IS DISTINCT FROM NEW.published_quiz_count OR
    OLD.monthly_score IS DISTINCT FROM NEW.monthly_score
  )
  EXECUTE FUNCTION trigger_assign_titles();

-- Trigger on game_sessions for titles based on quizzes completed
DROP TRIGGER IF EXISTS auto_assign_titles_on_quiz_complete ON game_sessions;
CREATE TRIGGER auto_assign_titles_on_quiz_complete
  AFTER INSERT OR UPDATE ON game_sessions
  FOR EACH ROW
  WHEN (NEW.completed = true)
  EXECUTE FUNCTION trigger_assign_titles();

-- Trigger on duels for win-based titles
CREATE OR REPLACE FUNCTION trigger_assign_titles_on_duel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.winner_id IS NOT NULL THEN
    PERFORM assign_earned_titles(NEW.winner_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_assign_titles_on_duel_complete ON duels;
CREATE TRIGGER auto_assign_titles_on_duel_complete
  AFTER UPDATE ON duels
  FOR EACH ROW
  WHEN (OLD.winner_id IS NULL AND NEW.winner_id IS NOT NULL)
  EXECUTE FUNCTION trigger_assign_titles_on_duel();

-- Function to manually check and assign titles for all users (admin use)
CREATE OR REPLACE FUNCTION assign_titles_to_all_users()
RETURNS TABLE(user_id uuid, assigned_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_count bigint;
BEGIN
  FOR v_user_id IN SELECT id FROM profiles LOOP
    SELECT COUNT(*) INTO v_count FROM assign_earned_titles(v_user_id);
    
    RETURN QUERY SELECT v_user_id, v_count;
  END LOOP;
END;
$$;
