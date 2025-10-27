-- Créer le bucket pour les images de quiz
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quiz-images',
  'quiz-images',
  true,
  5242880, -- 5 MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Politique SELECT (Read) - Accès public en lecture
CREATE POLICY "Allow public to read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quiz-images');

-- Politique INSERT (Upload) - Upload pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-images');

-- Politique DELETE (Delete) - Suppression pour utilisateurs authentifiés
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'quiz-images');

-- Politique UPDATE (optionnel) - Mise à jour pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'quiz-images')
WITH CHECK (bucket_id = 'quiz-images');
