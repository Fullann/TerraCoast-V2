/*
  # Update Quiz Access Policy for Shared Quizzes

  ## Changes
  - Update the RLS policy on quizzes table to allow users to view quizzes shared with them
  - Users can now see:
    1. Public quizzes (is_public = true)
    2. Global quizzes (is_global = true)
    3. Their own quizzes (creator_id = auth.uid())
    4. Quizzes shared with them via quiz_shares table

  ## Security
  - Maintains existing security restrictions
  - Only adds access for explicitly shared quizzes
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view public and global quizzes" ON quizzes;

-- Create new policy that includes shared quizzes
CREATE POLICY "Users can view accessible quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (
    is_public = true 
    OR is_global = true 
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM quiz_shares
      WHERE quiz_shares.quiz_id = quizzes.id
      AND quiz_shares.shared_with_user_id = auth.uid()
    )
  );
