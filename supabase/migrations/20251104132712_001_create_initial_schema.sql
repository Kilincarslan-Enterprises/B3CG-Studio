/*
  # Create Bosroller Studio Tables

  1. New Tables
    - `team_members`: Store team member information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `role` ('admin'|'editor'|'member')
      - `avatar` (text, optional)
      - `created_at` (timestamptz)

    - `projects`: Store project information
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `status` ('Ideas'|'Planned'|'In Production'|'Finished'|'Posted')
      - `location` (text)
      - `shoot_date` (date)
      - `shoot_time` (time)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `project_team_members`: Join table for projects and team members
      - `project_id` (uuid, foreign key)
      - `team_member_id` (uuid, foreign key)
      - `assigned_at` (timestamptz)

    - `materials`: Store materials/checklist items
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `name` (text)
      - `checked` (boolean)
      - `created_at` (timestamptz)

    - `comments`: Store project comments
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `text` (text)
      - `created_at` (timestamptz)

    - `shoots`: Store shoot schedules
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `date` (date)
      - `time` (time)
      - `location` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `shoot_attendees`: Join table for shoots and attendees
      - `shoot_id` (uuid, foreign key)
      - `team_member_id` (uuid, foreign key)
      - `added_at` (timestamptz)

    - `content_posts`: Store content calendar posts
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `platform` ('TikTok'|'Instagram'|'YouTube')
      - `scheduled_date` (timestamptz)
      - `status` ('Edited'|'Scheduled'|'Published')
      - `thumbnail` (text, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'member')),
  avatar text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Ideas' CHECK (status IN ('Ideas', 'Planned', 'In Production', 'Finished', 'Posted')),
  location text,
  shoot_date date,
  shoot_time time,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(project_id, team_member_id)
);

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  checked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shoots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time,
  location text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shoot_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shoot_id uuid NOT NULL REFERENCES shoots(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(shoot_id, team_member_id)
);

CREATE TABLE IF NOT EXISTS content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('TikTok', 'Instagram', 'YouTube')),
  scheduled_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'Edited' CHECK (status IN ('Edited', 'Scheduled', 'Published')),
  thumbnail text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoots ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoot_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view project team members"
  ON project_team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_team_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage project team members"
  ON project_team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_team_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete project team members"
  ON project_team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_team_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view materials"
  ON materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = materials.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage materials"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = materials.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update materials"
  ON materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = materials.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = materials.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete materials"
  ON materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = materials.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = comments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = comments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view shoots"
  ON shoots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = shoots.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage shoots"
  ON shoots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = shoots.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update shoots"
  ON shoots FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = shoots.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = shoots.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shoots"
  ON shoots FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = shoots.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view shoot attendees"
  ON shoot_attendees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shoots
      JOIN projects ON projects.id = shoots.project_id
      WHERE shoots.id = shoot_attendees.shoot_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage shoot attendees"
  ON shoot_attendees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shoots
      JOIN projects ON projects.id = shoots.project_id
      WHERE shoots.id = shoot_attendees.shoot_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shoot attendees"
  ON shoot_attendees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shoots
      JOIN projects ON projects.id = shoots.project_id
      WHERE shoots.id = shoot_attendees.shoot_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view content posts"
  ON content_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_posts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage content posts"
  ON content_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_posts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content posts"
  ON content_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_posts.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_posts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete content posts"
  ON content_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_posts.project_id
      AND projects.user_id = auth.uid()
    )
  );
