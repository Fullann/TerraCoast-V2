/*
  # Remove Difficulty Check Constraint

  ## Changes
  - Drop the CHECK constraint on quizzes.difficulty column
  - Allows dynamic difficulties from the difficulties table
  
  ## Reason
  Admin can now create custom difficulties, so we need to remove
  the hardcoded constraint that only allowed 'easy', 'medium', 'hard'
*/

ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_difficulty_check;
