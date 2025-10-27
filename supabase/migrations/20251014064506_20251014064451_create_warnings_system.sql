/*
  # Create Warning/Report System

  1. New Tables
    - `warnings`
      - `id` (uuid, primary key)
      - `reported_user_id` (uuid, foreign key to profiles)
      - `reporter_user_id` (uuid, foreign key to profiles)
      - `reason` (text)
      - `status` (text: pending, reviewed, action_taken, dismissed)
      - `admin_notes` (text, nullable)
      - `action_taken` (text, nullable: none, warning, temporary_ban, permanent_ban)
      - `created_at` (timestamptz)
      - `reviewed_at` (timestamptz, nullable)
      - `reviewed_by` (uuid, nullable, foreign key to profiles)
      
  2. Security
    - Enable RLS on `warnings` table
    - Users can create warnings (report others)
    - Users can view their own reports
    - Admins can view and manage all warnings
    - Reported users cannot see who reported them
*/

CREATE TABLE IF NOT EXISTS warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reporter_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  admin_notes text,
  action_taken text DEFAULT 'none',
  created_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  CONSTRAINT valid_action CHECK (action_taken IN ('none', 'warning', 'temporary_ban', 'permanent_ban'))
);

ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report other users"
  ON warnings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reporter_user_id 
    AND auth.uid() != reported_user_id
  );

CREATE POLICY "Users can view their own reports"
  ON warnings FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can view all warnings"
  ON warnings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update warnings"
  ON warnings FOR UPDATE
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

CREATE INDEX IF NOT EXISTS idx_warnings_reported_user ON warnings(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_reporter_user ON warnings(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_status ON warnings(status);
CREATE INDEX IF NOT EXISTS idx_warnings_created_at ON warnings(created_at DESC);

COMMENT ON TABLE warnings IS 'User reports and warnings system';
COMMENT ON COLUMN warnings.status IS 'Status: pending, reviewed, action_taken, dismissed';
COMMENT ON COLUMN warnings.action_taken IS 'Action: none, warning, temporary_ban, permanent_ban';
