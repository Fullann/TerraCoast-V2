/*
  # Add statistics columns to game_sessions

  1. Changes
    - Add `correct_answers` column to track number of correct answers
    - Add `total_questions` column to track total number of questions

  2. Purpose
    - Enable detailed duel statistics display
    - Track player performance metrics per session
*/

ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS correct_answers integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 0;