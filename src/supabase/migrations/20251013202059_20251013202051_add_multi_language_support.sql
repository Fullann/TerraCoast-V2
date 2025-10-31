/*
  # Add Multi-Language Support

  1. Changes to `profiles` table
    - Add `language` column (default 'fr')
    - Add `show_all_languages` column (default false)
    
  2. Changes to `quizzes` table
    - Add `language` column (default 'fr')
    - Add index on language for better performance
    
  3. Supported languages
    - fr: French
    - en: English
    - es: Spanish
    - de: German
    - it: Italian
    - pt: Portuguese
*/

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS show_all_languages boolean DEFAULT false;

ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS language text DEFAULT 'fr';

CREATE INDEX IF NOT EXISTS idx_quizzes_language ON quizzes(language);

COMMENT ON COLUMN profiles.language IS 'User preferred language (fr, en, es, de, it, pt)';
COMMENT ON COLUMN profiles.show_all_languages IS 'Whether to show quizzes in all languages or only user language';
COMMENT ON COLUMN quizzes.language IS 'Quiz language (fr, en, es, de, it, pt)';
