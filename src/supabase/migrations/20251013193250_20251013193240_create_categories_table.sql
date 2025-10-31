/*
  # Create Categories Table

  ## Changes Made
  
  ### New Table
  1. Create `categories` table
     - `id` (uuid, primary key)
     - `name` (text, unique) - Internal name (e.g., "flags")
     - `label` (text) - Display label (e.g., "Drapeaux")
     - `icon` (text) - Icon name
     - `created_at` (timestamptz)
  
  ### Initial Data
  1. Insert default categories
     - flags, capitals, maps, borders, regions, mixed
  
  ## Security
  - Enable RLS
  - Public read access
  - Admin write access
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  label text NOT NULL,
  icon text DEFAULT 'tag',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert default categories
INSERT INTO categories (name, label, icon) VALUES
  ('flags', 'Drapeaux', 'flag'),
  ('capitals', 'Capitales', 'map-pin'),
  ('maps', 'Cartes', 'map'),
  ('borders', 'Frontières', 'move'),
  ('regions', 'Régions', 'layers'),
  ('mixed', 'Mixte', 'shuffle')
ON CONFLICT (name) DO NOTHING;
