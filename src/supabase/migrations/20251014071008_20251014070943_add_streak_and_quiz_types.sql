/*
  # Add Streak System and Quiz Types

  1. Changes to profiles table
    - Add `current_streak` (integer, default 0) - Current consecutive days
    - Add `longest_streak` (integer, default 0) - Best streak ever
    - Add `last_activity_date` (date, nullable) - Last day user played
  
  2. New Tables
    - `quiz_types`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Type name (QCM, Mixte, Texte, etc.)
      - `description` (text, nullable)
      - `color` (text, default '#gray') - Display color
      - `created_at` (timestamptz)
      - `is_active` (boolean, default true)
  
  3. Changes to quizzes table
    - Add `quiz_type_id` (uuid, nullable, foreign key to quiz_types)
  
  4. Security
    - Enable RLS on `quiz_types` table
    - Everyone can read quiz types
    - Only admins can create/update/delete quiz types
*/

-- Add streak columns to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_streak integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'longest_streak'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longest_streak integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_activity_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_activity_date date;
  END IF;
END $$;

-- Create quiz_types table
CREATE TABLE IF NOT EXISTS quiz_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#6B7280' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

ALTER TABLE quiz_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active quiz types"
  ON quiz_types FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all quiz types"
  ON quiz_types FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert quiz types"
  ON quiz_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update quiz types"
  ON quiz_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete quiz types"
  ON quiz_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add quiz_type_id to quizzes table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'quiz_type_id'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN quiz_type_id uuid REFERENCES quiz_types(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Insert default quiz types
INSERT INTO quiz_types (name, description, color) VALUES
  ('QCM', 'Questions à Choix Multiple', '#3B82F6'),
  ('Texte', 'Réponses en texte libre', '#10B981'),
  ('Mixte', 'Mélange de QCM et texte', '#8B5CF6'),
  ('Vrai/Faux', 'Questions Vrai ou Faux', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-- Create index on quiz_type_id
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type ON quizzes(quiz_type_id);

-- Create function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(user_id uuid)
RETURNS void AS $$
DECLARE
  today date := CURRENT_DATE;
  last_date date;
  current_streak_val integer;
  longest_streak_val integer;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO last_date, current_streak_val, longest_streak_val
  FROM profiles
  WHERE id = user_id;

  IF last_date IS NULL THEN
    -- First activity ever
    UPDATE profiles
    SET current_streak = 1,
        longest_streak = GREATEST(longest_streak_val, 1),
        last_activity_date = today
    WHERE id = user_id;
  ELSIF last_date = today THEN
    -- Already played today, do nothing
    RETURN;
  ELSIF last_date = today - INTERVAL '1 day' THEN
    -- Played yesterday, increment streak
    UPDATE profiles
    SET current_streak = current_streak_val + 1,
        longest_streak = GREATEST(longest_streak_val, current_streak_val + 1),
        last_activity_date = today
    WHERE id = user_id;
  ELSE
    -- Missed a day, reset streak
    UPDATE profiles
    SET current_streak = 1,
        last_activity_date = today
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE quiz_types IS 'Types of quizzes (QCM, Text, Mixed, etc.)';
COMMENT ON COLUMN profiles.current_streak IS 'Current consecutive days streak';
COMMENT ON COLUMN profiles.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN profiles.last_activity_date IS 'Last date user completed a quiz';
