/*
  # Add image support for answer options

  1. Changes
    - Add `option_images` column to questions table as JSONB
    - This allows storing image URLs for each answer option
    - Format: {"option_text": "image_url", ...}

  2. Purpose
    - Enable visual quiz questions like flag identification
    - Support image-based answer choices
    - Enhance quiz interactivity with visual elements

  3. Example Usage
    Question: "Quel est le drapeau du Chili?"
    Options: ["Chile", "Argentina", "Peru", "Colombia"]
    Option Images: {
      "Chile": "https://example.com/chile-flag.png",
      "Argentina": "https://example.com/argentina-flag.png",
      "Peru": "https://example.com/peru-flag.png",
      "Colombia": "https://example.com/colombia-flag.png"
    }
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'option_images'
  ) THEN
    ALTER TABLE questions ADD COLUMN option_images jsonb;
  END IF;
END $$;