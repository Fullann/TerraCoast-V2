/*
  # Add Image Support and Training Mode

  ## Changes
  1. Add image_url column to questions table for question images
  2. Update game_sessions to support training mode
  3. Add settings for training mode (question count selection)

  ## Details
  - Questions can now have an optional image URL
  - Game sessions have a training_mode flag
  - Training mode sessions don't award XP and have no time limits
*/

-- Add image URL support to questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE questions ADD COLUMN image_url text;
  END IF;
END $$;

-- Add training mode flag to game_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'training_mode'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN training_mode boolean DEFAULT false;
  END IF;
END $$;

-- Add question count for training mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'question_count'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN question_count integer;
  END IF;
END $$;
