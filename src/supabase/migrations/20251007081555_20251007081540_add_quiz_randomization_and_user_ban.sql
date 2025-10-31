/*
  # Add Quiz Randomization and User Ban Features

  ## Changes Made
  
  ### Quiz Randomization
  1. Add randomization columns to quizzes table:
     - `randomize_questions` (boolean) - Shuffle question order
     - `randomize_answers` (boolean) - Shuffle answer options for MCQ
  
  ### User Ban System
  1. Add ban columns to profiles table:
     - `is_banned` (boolean) - Ban status
     - `banned_at` (timestamptz) - When user was banned
     - `ban_reason` (text) - Reason for ban
  
  ### Multiple Correct Answers
  1. Add support for multiple correct answers in questions:
     - `correct_answers` (text array) - Array of correct answers
  
  ## Security
  - No RLS changes needed (existing policies apply)
  - Only admins can modify ban status (handled in app logic)
*/

-- Add randomization columns to quizzes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'randomize_questions'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN randomize_questions boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'randomize_answers'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN randomize_answers boolean DEFAULT false;
  END IF;
END $$;

-- Add correct_answers array to questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'correct_answers'
  ) THEN
    ALTER TABLE questions ADD COLUMN correct_answers text[];
  END IF;
END $$;

-- Add ban columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_banned boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN banned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ban_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ban_reason text;
  END IF;
END $$;

-- Create index for banned users query optimization
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = true;
