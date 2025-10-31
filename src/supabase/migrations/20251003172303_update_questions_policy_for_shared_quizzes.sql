/*
  # Update questions access policy to include shared quizzes

  1. Changes
    - Update the "Users can view questions of accessible quizzes" policy
    - Add support for questions from quizzes shared via quiz_shares table

  2. Security
    - Users can view questions from:
      - Public quizzes (is_public = true)
      - Global quizzes (is_global = true)
      - Their own quizzes (creator_id = auth.uid())
      - Quizzes shared with them via quiz_shares
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view questions of accessible quizzes" ON questions;

-- Create updated policy that includes shared quizzes
CREATE POLICY "Users can view questions of accessible quizzes"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_id
      AND (
        q.is_public = true
        OR q.is_global = true
        OR q.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM quiz_shares
          WHERE quiz_shares.quiz_id = q.id
          AND quiz_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );
