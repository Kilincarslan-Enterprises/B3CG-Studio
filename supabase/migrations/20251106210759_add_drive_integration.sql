/*
  # Add Google Drive Integration Fields

  1. Changes
    - Add drive_folder_id to projects table for main project folder
    - Add drive_subfolders JSONB field for raw, edited, and thumbnails folder IDs
    - These fields are optional and can be populated when Drive integration is set up

  2. Structure
    - drive_folder_id: UUID of the main project folder in Google Drive
    - drive_subfolders: JSON object with keys: raw, edited, thumbnails
      Example: {"raw": "folder_id_1", "edited": "folder_id_2", "thumbnails": "folder_id_3"}
*/

-- Add Google Drive integration fields to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS drive_subfolders JSONB DEFAULT NULL;

-- Add index for faster lookups by drive_folder_id
CREATE INDEX IF NOT EXISTS idx_projects_drive_folder_id ON projects(drive_folder_id);

-- Add comment for documentation
COMMENT ON COLUMN projects.drive_folder_id IS 'Google Drive folder ID for the main project folder';
COMMENT ON COLUMN projects.drive_subfolders IS 'JSON object containing subfolder IDs for raw, edited, and thumbnails';
