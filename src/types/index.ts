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

export interface ScriptLine {
  memberId: string;
  memberName: string;
  line: string;
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
  script?: ScriptLine[];
  posted_by_member_id?: string;
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
  project_title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ShootAttendee {
  id: string;
  shoot_id: string;
  team_member_id: string;
  created_at: string;
}

export interface ShootWithAttendees extends Shoot {
  attendees?: TeamMember[];
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

export type VideoAnalysisStatus = 'uploading' | 'processing' | 'completed' | 'failed';

export interface ViralityEvaluation {
  overallVerdict: string;
  viralityScore: number;
  confidenceLevel: string;
  primaryRisk: string;
}

export interface HookEvaluation {
  hookPresentFirst2Seconds: boolean;
  hookStrength: 'weak' | 'medium' | 'strong';
  reasoning: string;
}

export interface BestPractice {
  practice: string;
  met: boolean;
  notes: string;
}

export interface RetentionAnalysis {
  earlyDropOffRisk: string;
  pacingQuality: string;
  structureIssues: string[];
}

export interface LoopabilityAnalysis {
  loopPresent: boolean;
  loopPotential: string;
  recommendation: string;
}

export interface TimestampedImprovement {
  timeRange: string;
  problem: string;
  suggestedChange: string;
  expectedImpact: string;
}

export interface SafeRewriteSuggestions {
  hookAlternatives: string[];
  ctaSuggestions: string[];
}

export interface AnalysisData {
  videoId: string;
  viralityEvaluation: ViralityEvaluation;
  hookEvaluation: HookEvaluation;
  bestPracticeComparison: BestPractice[];
  retentionAnalysis: RetentionAnalysis;
  loopabilityAnalysis: LoopabilityAnalysis;
  timestampedImprovements: TimestampedImprovement[];
  output: {
    topThreePriorityActions: string[];
  };
  safeRewriteSuggestions: SafeRewriteSuggestions;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface VideoAnalysis {
  id: string;
  user_id: string;
  video_url?: string;
  file_name: string;
  file_size?: number;
  duration?: number;
  uploaded_at: string;
  status: VideoAnalysisStatus;
  analysis_data?: AnalysisData;
  chat_history: ChatMessage[];
  error_message?: string;
  created_at: string;
  updated_at: string;
}
