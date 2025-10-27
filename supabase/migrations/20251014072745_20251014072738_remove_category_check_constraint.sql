/*
  # Remove hardcoded category check constraint

  1. Changes
    - Drop the hardcoded check constraint on quizzes.category
    - Now categories are managed dynamically through the categories table
    - This allows admins to add/remove categories without migrations
*/

-- Drop the old hardcoded constraint
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_category_check;

COMMENT ON COLUMN quizzes.category IS 'Category from categories table - dynamically managed by admins';
