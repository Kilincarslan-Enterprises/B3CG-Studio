/*
  # Video Analysis Persistence Schema

  1. Changes
    - Create `video_analyses` table to persist video uploads, analysis results, and chat histories
    - This allows users to view previously uploaded videos and continue conversations after page refresh
    - Similar to chat tabs, each video becomes a persistent session

  2. New Tables
    - `video_analyses`
      - `id` (uuid, primary key) - unique video analysis session ID
      - `user_id` (uuid, foreign key) - references auth.users
      - `video_url` (text, optional) - Supabase storage URL after upload
      - `file_name` (text) - original filename
      - `file_size` (integer, optional) - size in bytes
      - `duration` (integer, optional) - video duration in seconds
      - `status` (text) - 'uploading' | 'processing' | 'completed' | 'failed'
      - `analysis_data` (jsonb, optional) - AI analysis results from n8n
      - `chat_history` (jsonb) - array of chat messages between user and AI
      - `error_message` (text, optional) - error details if analysis fails
      - `created_at` (timestamptz) - when video was uploaded
      - `updated_at` (timestamptz) - last update timestamp
      - `completed_at` (timestamptz, optional) - when analysis completed

  3. Security
    - Enable RLS on `video_analyses` table
    - Users can only access their own video analyses
    - Policies restrict all operations to authenticated users who own the data

  4. Important Notes
    - This table replaces client-side state with persistent database storage
    - Videos remain accessible across page refreshes and sessions
    - Analysis status can be polled or updated via webhook callbacks from n8n
*/

CREATE TABLE IF NOT EXISTS video_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url text,
  file_name text NOT NULL,
  file_size integer,
  duration integer,
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
  analysis_data jsonb,
  chat_history jsonb DEFAULT '[]'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_analysis_data CHECK (analysis_data IS NULL OR jsonb_typeof(analysis_data) = 'object'),
  CONSTRAINT valid_chat_history CHECK (chat_history IS NULL OR jsonb_typeof(chat_history) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_video_analyses_user_id ON video_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_video_analyses_status ON video_analyses(status);
CREATE INDEX IF NOT EXISTS idx_video_analyses_created_at ON video_analyses(created_at DESC);

ALTER TABLE video_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video analyses"
  ON video_analyses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own video analyses"
  ON video_analyses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own video analyses"
  ON video_analyses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own video analyses"
  ON video_analyses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
