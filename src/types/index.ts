export type ProjectStatus = 'Ideas' | 'Planned' | 'In Production' | 'Finished' | 'Posted';
export type TeamRole = 'admin' | 'editor' | 'member';
export type Platform = 'TikTok' | 'Instagram' | 'YouTube';
export type PostStatus = 'Edited' | 'Scheduled' | 'Published';

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar?: string;
  created_at: string;
}

export interface Material {
  id: string;
  project_id: string;
  name: string;
  checked: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  location?: string;
  shoot_date?: string;
  shoot_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  team_members?: TeamMember[];
  materials?: Material[];
  comments?: Comment[];
}

export interface Shoot {
  id: string;
  project_id: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  created_at: string;
}

export interface ShootAttendee {
  id: string;
  shoot_id: string;
  team_member_id: string;
  added_at: string;
}

export interface ContentPost {
  id: string;
  project_id: string;
  platform: Platform;
  scheduled_date: string;
  status: PostStatus;
  thumbnail?: string;
  created_at: string;
}
