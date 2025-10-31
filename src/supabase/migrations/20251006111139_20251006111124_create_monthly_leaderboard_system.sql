/*
  # Monthly Leaderboard System

  1. New Tables
    - `monthly_scores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `month` (text, format: YYYY-MM)
      - `total_score` (integer)
      - `games_played` (integer)
      - `rank` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `monthly_rankings_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `month` (text, format: YYYY-MM)
      - `final_rank` (integer)
      - `final_score` (integer)
      - `recorded_at` (timestamptz)

  2. Changes to profiles table
    - Add `monthly_score` (integer) - Current month score
    - Add `monthly_games_played` (integer) - Games played this month
    - Add `top_10_count` (integer) - Number of times in top 10
    - Add `last_reset_month` (text) - Last month when points were reset

  3. Security
    - Enable RLS on new tables
    - Add policies for reading and tracking

  4. Purpose
    - Track monthly performance
    - Reset scores monthly
    - Award titles to top 10 players
    - Keep historical rankings
*/

-- Add columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_score'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_games_played'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_games_played integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'top_10_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN top_10_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_reset_month'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_reset_month text;
  END IF;
END $$;

-- Create monthly_rankings_history table
CREATE TABLE IF NOT EXISTS monthly_rankings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  month text NOT NULL,
  final_rank integer NOT NULL,
  final_score integer NOT NULL,
  recorded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE monthly_rankings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all rankings history"
  ON monthly_rankings_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert rankings"
  ON monthly_rankings_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_rankings_month ON monthly_rankings_history(month);
CREATE INDEX IF NOT EXISTS idx_monthly_rankings_user_month ON monthly_rankings_history(user_id, month);