/*
  # Difficulties Management and Quiz Validation System

  1. New Tables
    - `difficulties`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Technical name (e.g., 'easy', 'hard')
      - `label` (text) - Display label (e.g., 'Facile', 'Difficile')
      - `color` (text) - Color code for UI
      - `multiplier` (numeric) - Score multiplier
      - `created_at` (timestamptz)
    
    - `quiz_validations`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, references quizzes)
      - `validated_by` (uuid, references profiles)
      - `validated_at` (timestamptz)
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `rejection_reason` (text, nullable)

  2. Changes to quizzes table
    - Add `validation_status` (text) - 'pending', 'approved', 'rejected'
    - Add `pending_validation` (boolean) - True if waiting for admin review
    - Add `cover_image_url` (text) - Image for quiz presentation

  3. Changes to questions table
    - Add `correct_answers` (text[]) - Array for multiple correct answers
    - Add `randomize_options` (boolean) - Whether to randomize answer options

  4. Security
    - Enable RLS on new tables
    - Add policies for admin management
    - Add validation workflow policies

  5. Purpose
    - Manage custom difficulties
    - Validate public quizzes before publication
    - Support multiple correct answers
    - Add quiz cover images
*/

-- Create difficulties table
CREATE TABLE IF NOT EXISTS difficulties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  label text NOT NULL,
  color text NOT NULL DEFAULT 'gray',
  multiplier numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE difficulties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view difficulties"
  ON difficulties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage difficulties"
  ON difficulties FOR ALL
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

-- Insert default difficulties
INSERT INTO difficulties (name, label, color, multiplier) VALUES
  ('easy', 'Facile', 'green', 1.0),
  ('medium', 'Moyen', 'yellow', 1.5),
  ('hard', 'Difficile', 'red', 2.0)
ON CONFLICT (name) DO NOTHING;

-- Create quiz_validations table
CREATE TABLE IF NOT EXISTS quiz_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes ON DELETE CASCADE,
  validated_by uuid REFERENCES profiles ON DELETE SET NULL,
  validated_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text
);

ALTER TABLE quiz_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all validations"
  ON quiz_validations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage validations"
  ON quiz_validations FOR ALL
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

-- Add columns to quizzes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'validation_status'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'pending_validation'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN pending_validation boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'cover_image_url'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN cover_image_url text;
  END IF;
END $$;

-- Add columns to questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'correct_answers'
  ) THEN
    ALTER TABLE questions ADD COLUMN correct_answers text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'randomize_options'
  ) THEN
    ALTER TABLE questions ADD COLUMN randomize_options boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quiz_validations_quiz_id ON quiz_validations(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_validations_status ON quiz_validations(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_validation_status ON quizzes(validation_status);
CREATE INDEX IF NOT EXISTS idx_quizzes_pending_validation ON quizzes(pending_validation);