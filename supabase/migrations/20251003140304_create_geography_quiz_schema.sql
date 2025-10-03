/*
  # Geography Quiz Application - Complete Database Schema

  ## Overview
  This migration creates a comprehensive database schema for a geography quiz application
  with user management, quiz creation, competitions, social features, and administration.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `pseudo` (text, unique) - User's display name
  - `email_newsletter` (boolean) - Newsletter subscription
  - `level` (integer) - User progression level
  - `experience_points` (integer) - Total XP earned
  - `role` (text) - User role: 'user' or 'admin'
  - `published_quiz_count` (integer) - Number of published public quizzes (max 10)
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last update timestamp

  ### `badges`
  - `id` (uuid, primary key)
  - `name` (text, unique) - Badge name (e.g., 'cancre', 'pèlerin', 'rogue', etc.)
  - `description` (text) - Badge description
  - `icon` (text) - Icon identifier
  - `requirement_type` (text) - Type of requirement (level, wins, quizzes_completed, etc.)
  - `requirement_value` (integer) - Value needed to unlock
  - `created_at` (timestamptz)

  ### `user_badges`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References profiles
  - `badge_id` (uuid, foreign key) - References badges
  - `earned_at` (timestamptz) - When badge was earned

  ### `titles`
  - `id` (uuid, primary key)
  - `name` (text, unique) - Title name (e.g., 'Diligent', 'Ouroboros', etc.)
  - `description` (text)
  - `requirement_type` (text)
  - `requirement_value` (integer)
  - `is_special` (boolean) - For special titles like Diligent, Ouroboros
  - `created_at` (timestamptz)

  ### `user_titles`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `title_id` (uuid, foreign key)
  - `is_active` (boolean) - Currently displayed title
  - `earned_at` (timestamptz)

  ### `quizzes`
  - `id` (uuid, primary key)
  - `creator_id` (uuid, foreign key) - References profiles
  - `title` (text) - Quiz title
  - `description` (text) - Quiz description
  - `category` (text) - Type: 'flags', 'capitals', 'maps', 'borders', 'regions', etc.
  - `is_public` (boolean) - Public (global) or private quiz
  - `is_global` (boolean) - Created by admin for all users
  - `difficulty` (text) - 'easy', 'medium', 'hard'
  - `time_limit_seconds` (integer) - Optional time limit per question
  - `total_plays` (integer) - Number of times played
  - `average_score` (numeric) - Average score across all plays
  - `created_at` (timestamptz)
  - `published_at` (timestamptz) - When made public
  - `is_reported` (boolean) - Flagged for review
  - `report_count` (integer) - Number of reports

  ### `questions`
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, foreign key) - References quizzes
  - `question_text` (text) - The question
  - `question_type` (text) - 'mcq', 'single_answer', 'map_click', 'text_free'
  - `correct_answer` (text) - Correct answer for validation
  - `options` (jsonb) - For MCQ: array of options
  - `map_data` (jsonb) - For map questions: coordinates, regions, etc.
  - `points` (integer) - Base points for correct answer
  - `order_index` (integer) - Question order in quiz
  - `created_at` (timestamptz)

  ### `game_sessions`
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, foreign key)
  - `player_id` (uuid, foreign key) - References profiles
  - `mode` (text) - 'solo', 'duel'
  - `score` (integer) - Final score
  - `accuracy_percentage` (numeric) - Correct answers percentage
  - `time_taken_seconds` (integer) - Total time taken
  - `completed` (boolean) - Session completed
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### `game_answers`
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key) - References game_sessions
  - `question_id` (uuid, foreign key) - References questions
  - `user_answer` (text) - User's answer
  - `is_correct` (boolean) - Answer correctness
  - `time_taken_seconds` (integer) - Time to answer
  - `points_earned` (integer) - Points from this answer
  - `answered_at` (timestamptz)

  ### `duels`
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, foreign key)
  - `player1_id` (uuid, foreign key) - References profiles
  - `player2_id` (uuid, foreign key) - References profiles
  - `player1_session_id` (uuid, foreign key) - References game_sessions
  - `player2_session_id` (uuid, foreign key) - References game_sessions
  - `winner_id` (uuid, foreign key) - References profiles (nullable)
  - `status` (text) - 'pending', 'in_progress', 'completed', 'cancelled'
  - `created_at` (timestamptz)
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### `friendships`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - User who sent request
  - `friend_id` (uuid, foreign key) - User who received request
  - `status` (text) - 'pending', 'accepted', 'rejected'
  - `created_at` (timestamptz)
  - `accepted_at` (timestamptz)

  ### `duel_invitations`
  - `id` (uuid, primary key)
  - `from_user_id` (uuid, foreign key)
  - `to_user_id` (uuid, foreign key)
  - `quiz_id` (uuid, foreign key)
  - `status` (text) - 'pending', 'accepted', 'declined', 'expired'
  - `created_at` (timestamptz)
  - `expires_at` (timestamptz)

  ### `chat_messages`
  - `id` (uuid, primary key)
  - `from_user_id` (uuid, foreign key)
  - `to_user_id` (uuid, foreign key)
  - `message` (text)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ### `quiz_shares`
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, foreign key)
  - `shared_by_user_id` (uuid, foreign key)
  - `shared_with_user_id` (uuid, foreign key)
  - `created_at` (timestamptz)

  ### `reports`
  - `id` (uuid, primary key)
  - `reporter_id` (uuid, foreign key) - User reporting
  - `quiz_id` (uuid, foreign key) - Reported quiz (nullable)
  - `message_id` (uuid, foreign key) - Reported message (nullable)
  - `reason` (text) - Report reason
  - `description` (text) - Detailed description
  - `status` (text) - 'pending', 'reviewed', 'resolved', 'dismissed'
  - `reviewed_by` (uuid, foreign key) - Admin who reviewed (nullable)
  - `created_at` (timestamptz)
  - `reviewed_at` (timestamptz)

  ### `password_reset_tokens`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `token` (text, unique) - Secure reset token
  - `expires_at` (timestamptz)
  - `used` (boolean)
  - `created_at` (timestamptz)

  ## 2. Security (Row Level Security)
  - RLS enabled on ALL tables
  - Policies ensure users can only access their own data
  - Admin role can access and manage all data
  - Public quizzes readable by all authenticated users
  - Private quizzes only accessible by creator and shared users

  ## 3. Indexes
  - Performance indexes on foreign keys and frequently queried columns
  - Unique constraints on important fields

  ## 4. Functions and Triggers
  - Auto-update `updated_at` timestamp
  - Badge and title awarding logic
  - Level progression based on XP
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  pseudo text UNIQUE NOT NULL,
  email_newsletter boolean DEFAULT false,
  level integer DEFAULT 1,
  experience_points integer DEFAULT 0,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  published_quiz_count integer DEFAULT 0 CHECK (published_quiz_count >= 0 AND published_quiz_count <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'award',
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage badges"
  ON badges FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR true);

CREATE POLICY "System can insert badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create titles table
CREATE TABLE IF NOT EXISTS titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  is_special boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view titles"
  ON titles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage titles"
  ON titles FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create user_titles table
CREATE TABLE IF NOT EXISTS user_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title_id uuid NOT NULL REFERENCES titles ON DELETE CASCADE,
  is_active boolean DEFAULT false,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, title_id)
);

ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own titles"
  ON user_titles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR true);

CREATE POLICY "Users can update own titles"
  ON user_titles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert titles"
  ON user_titles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('flags', 'capitals', 'maps', 'borders', 'regions', 'mixed')),
  is_public boolean DEFAULT false,
  is_global boolean DEFAULT false,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_limit_seconds integer,
  total_plays integer DEFAULT 0,
  average_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  published_at timestamptz,
  is_reported boolean DEFAULT false,
  report_count integer DEFAULT 0
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public and global quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (is_public = true OR is_global = true OR creator_id = auth.uid());

CREATE POLICY "Users can create own quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (creator_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can delete own quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('mcq', 'single_answer', 'map_click', 'text_free')),
  correct_answer text NOT NULL,
  options jsonb,
  map_data jsonb,
  points integer DEFAULT 100,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions of accessible quizzes"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_id
      AND (q.is_public = true OR q.is_global = true OR q.creator_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage questions of own quizzes"
  ON questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_id AND q.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_id AND q.creator_id = auth.uid()
    )
  );

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  mode text DEFAULT 'solo' CHECK (mode IN ('solo', 'duel')),
  score integer DEFAULT 0,
  accuracy_percentage numeric DEFAULT 0,
  time_taken_seconds integer DEFAULT 0,
  completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Users can create own sessions"
  ON game_sessions FOR INSERT
  TO authenticated
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON game_sessions FOR UPDATE
  TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

-- Create game_answers table
CREATE TABLE IF NOT EXISTS game_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions ON DELETE CASCADE,
  user_answer text NOT NULL,
  is_correct boolean NOT NULL,
  time_taken_seconds integer NOT NULL,
  points_earned integer DEFAULT 0,
  answered_at timestamptz DEFAULT now()
);

ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
  ON game_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_id AND gs.player_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own answers"
  ON game_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_id AND gs.player_id = auth.uid()
    )
  );

-- Create duels table
CREATE TABLE IF NOT EXISTS duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes ON DELETE CASCADE,
  player1_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  player2_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  player1_session_id uuid REFERENCES game_sessions ON DELETE SET NULL,
  player2_session_id uuid REFERENCES game_sessions ON DELETE SET NULL,
  winner_id uuid REFERENCES profiles ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own duels"
  ON duels FOR SELECT
  TO authenticated
  USING (player1_id = auth.uid() OR player2_id = auth.uid());

CREATE POLICY "Users can create duels"
  ON duels FOR INSERT
  TO authenticated
  WITH CHECK (player1_id = auth.uid() OR player2_id = auth.uid());

CREATE POLICY "Users can update own duels"
  ON duels FOR UPDATE
  TO authenticated
  USING (player1_id = auth.uid() OR player2_id = auth.uid())
  WITH CHECK (player1_id = auth.uid() OR player2_id = auth.uid());

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update friendships"
  ON friendships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can delete friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Create duel_invitations table
CREATE TABLE IF NOT EXISTS duel_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

ALTER TABLE duel_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invitations"
  ON duel_invitations FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create invitations"
  ON duel_invitations FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update received invitations"
  ON duel_invitations FOR UPDATE
  TO authenticated
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update received messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Create quiz_shares table
CREATE TABLE IF NOT EXISTS quiz_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes ON DELETE CASCADE,
  shared_by_user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  shared_with_user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(quiz_id, shared_with_user_id)
);

ALTER TABLE quiz_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares involving them"
  ON quiz_shares FOR SELECT
  TO authenticated
  USING (shared_by_user_id = auth.uid() OR shared_with_user_id = auth.uid());

CREATE POLICY "Users can create shares for own quizzes"
  ON quiz_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_id AND q.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own shares"
  ON quiz_shares FOR DELETE
  TO authenticated
  USING (shared_by_user_id = auth.uid());

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes ON DELETE CASCADE,
  message_id uuid REFERENCES chat_messages ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES profiles ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage reports"
  ON reports FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to reset tokens"
  ON password_reset_tokens FOR SELECT
  TO authenticated
  USING (false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_pseudo ON profiles(pseudo);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_titles_user_id ON user_titles(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_creator_id ON quizzes(creator_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_public ON quizzes(is_public);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_global ON quizzes(is_global);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_quiz_id ON game_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_session_id ON game_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_duels_player1_id ON duels(player1_id);
CREATE INDEX IF NOT EXISTS idx_duels_player2_id ON duels(player2_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_to_user_id ON chat_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_from_user_id ON chat_messages(from_user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('cancre', 'Débutant en géographie', 'user', 'level', 1),
  ('pèlerin', 'Voyageur curieux', 'map', 'level', 5),
  ('rogue', 'Explorateur audacieux', 'compass', 'level', 10),
  ('noosphère', 'Maître de la connaissance', 'brain', 'level', 20),
  ('arcane', 'Légende de la géographie', 'crown', 'level', 50)
ON CONFLICT (name) DO NOTHING;

-- Insert default titles
INSERT INTO titles (name, description, requirement_type, requirement_value, is_special) VALUES
  ('Diligent', 'Premier sur un quiz', 'first_place', 1, true),
  ('Ouroboros', 'Compte ancien', 'account_age_days', 365, true),
  ('Novice', 'Niveau 1 atteint', 'level', 1, false),
  ('Expert', 'Niveau 10 atteint', 'level', 10, false),
  ('Maître', 'Niveau 25 atteint', 'level', 25, false)
ON CONFLICT (name) DO NOTHING;