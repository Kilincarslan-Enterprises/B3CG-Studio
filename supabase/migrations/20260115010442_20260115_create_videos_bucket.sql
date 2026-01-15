/*
  # Create videos storage bucket

  1. New Storage
    - Create `videos` bucket for video file uploads
    - Set to private (RLS policies control access)

  2. Security
    - Bucket is private by default
    - Users can only access their own videos via RLS policies
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own videos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);