/*
  # Remove hardcoded question_type check constraint

  1. Changes
    - Drop the hardcoded check constraint on questions.question_type
    - Add support for new question types like 'true_false'
    - Allow flexible question types without requiring migrations
  
  2. Security
    - Question types are validated at the application level
    - Database remains flexible for future question types
*/

-- Drop the old hardcoded constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_question_type_check;

COMMENT ON COLUMN questions.question_type IS 'Type of question: mcq, single_answer, text_free, true_false, map_click - validated at application level';
