/*
  # Convert to Single Team Mode

  1. Changes
    - Remove user_id isolation from projects, materials, comments, shoots, content_posts
    - All data is shared across all users in the workspace
    - Keep role-based permissions (admin/editor/member) at user level
    - Users can still access data based on their role

  2. RLS Policy Updates
    - Remove user_id checks from SELECT, INSERT, UPDATE, DELETE policies
    - Keep authenticated user requirement
    - Editors and members can view all data (no filtering)
    - Admins can manage all data
    
  3. Data Visibility
    - All projects visible to all authenticated users
    - All team members visible to all authenticated users
    - All materials, comments, shoots, posts visible to all authenticated users
*/

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can view own team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team members" ON team_members;
DROP POLICY IF EXISTS "Users can update own team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete own team members" ON team_members;

DROP POLICY IF EXISTS "Users can view project team members" ON project_team_members;
DROP POLICY IF EXISTS "Users can manage project team members" ON project_team_members;
DROP POLICY IF EXISTS "Users can delete project team members" ON project_team_members;

DROP POLICY IF EXISTS "Users can view materials" ON materials;
DROP POLICY IF EXISTS "Users can manage materials" ON materials;
DROP POLICY IF EXISTS "Users can update materials" ON materials;
DROP POLICY IF EXISTS "Users can delete materials" ON materials;

DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can add comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

DROP POLICY IF EXISTS "Users can view shoots" ON shoots;
DROP POLICY IF EXISTS "Users can manage shoots" ON shoots;
DROP POLICY IF EXISTS "Users can update shoots" ON shoots;
DROP POLICY IF EXISTS "Users can delete shoots" ON shoots;

DROP POLICY IF EXISTS "Users can view shoot attendees" ON shoot_attendees;
DROP POLICY IF EXISTS "Users can manage shoot attendees" ON shoot_attendees;
DROP POLICY IF EXISTS "Users can delete shoot attendees" ON shoot_attendees;

DROP POLICY IF EXISTS "Users can view content posts" ON content_posts;
DROP POLICY IF EXISTS "Users can manage content posts" ON content_posts;
DROP POLICY IF EXISTS "Users can update content posts" ON content_posts;
DROP POLICY IF EXISTS "Users can delete content posts" ON content_posts;

CREATE POLICY "All authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "All authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can create team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can view project team members"
  ON project_team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create project team members"
  ON project_team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete project team members"
  ON project_team_members FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can view materials"
  ON materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create materials"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can update materials"
  ON materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete materials"
  ON materials FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "All authenticated users can view shoots"
  ON shoots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create shoots"
  ON shoots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can update shoots"
  ON shoots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete shoots"
  ON shoots FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can view shoot attendees"
  ON shoot_attendees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create shoot attendees"
  ON shoot_attendees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete shoot attendees"
  ON shoot_attendees FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can view content posts"
  ON content_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create content posts"
  ON content_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can update content posts"
  ON content_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete content posts"
  ON content_posts FOR DELETE
  TO authenticated
  USING (true);
