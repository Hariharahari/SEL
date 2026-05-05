/**
 * SELAgentCard - Internal directory record for skills in the portal.
 * The UI now presents these as skills even though some internal keys
 * still use legacy agent naming for compatibility.
 */

export interface Task {
  name: string;
  description: string;
  input_schema?: string;
  output_schema?: string;
  async: boolean;
}

export interface Maintainer {
  name: string;
  contact: string;
}

export interface Origin {
  org: string;
  sub_org?: string;
  creator?: string;
}

export interface Rating {
  "Jast score": number;
  grade: string;
}

export interface Downloads {
  last_downloaded: string;
  total_download_7_days: number;
  total_download_30_days: number;
  total_download_overall: number;
}

export interface Specialization {
  primary: string;
  "domain specific"?: string[];
}

export interface SkillCardPayload {
  starterkit_id: string;
  name: string;
  description: string;
  origin: Origin;
  maintainers: Maintainer[];
  version: string;
  status: 'alpha' | 'beta' | 'rc' | 'stable' | 'deprecated' | 'verified';
  technology: string[];
  specialization: {
    primary: string;
    domain_specific?: string[];
  };
  tasks: Task[];
  documentation: Documentation;
  supported_harness: string[];
  github_url?: string;
  video_url?: string;
}

export interface SkillUploadEnvelope {
  skill_card: SkillCardPayload;
}

export interface Documentation {
  readme: string;
  howto: string;
  changelog?: string;
}

export interface AgentAnalysis {
  summary: string;
  strengths: string[];
  recommended_use_cases: string[];
  adoption_signals: string[];
  model?: string;
  generated_at: string;
}

export interface SubmissionAttachment {
  name: string;
  relativePath: string;
  absolutePath?: string;
  mimeType: string;
  size: number;
}

export interface SELAgentCard {
  "agent id": string;
  name: string;
  description: string;
  origin: Origin;
  maintainers: Maintainer[];
  version: string;
  status: 'alpha' | 'beta' | 'rc' | 'stable' | 'deprecated' | 'verified';
  technology: string[];
  specialization: Specialization;
  tasks: Task[];
  documentation: Documentation;
  rating?: Rating;
  "supported harness": string[];
  downloads?: Downloads;
  stars?: number;
  github_url?: string;
  video_url?: string;
  analysis?: AgentAnalysis;
  categoryOverride?: string;
  subcategoryOverride?: string;
  sourceFiles?: SubmissionAttachment[];
  ingestionSource?: 'manual-upload' | 'seed' | 'legacy';
  isActive?: boolean;
  inactiveAt?: string;
}

// ===== SKILL CARD TYPES =====

export interface SkillModule {
  title: string;
  duration_hours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  topics: string[];
}

export interface SkillAssessment {
  type: 'quiz' | 'project' | 'exam';
  name: string;
  passing_score?: number;
  duration_hours?: number;
}

export interface SkillOrganization {
  name: string;
  creator: string;
  license: string;
}

export interface SkillMetadata {
  created_date: string;
  updated_date: string;
  language: string;
  accessibility: string;
}

export interface SkillRatings {
  average_rating: number;
  total_reviews: number;
  completion_rate: string;
  student_satisfaction: string;
}

export interface SkillLearnerStats {
  total_enrolled: number;
  active_learners: number;
  completed: number;
}

export interface SELSkillCard {
  skill_id: string;
  name: string;
  description: string;
  version: string;
  status: 'alpha' | 'beta' | 'rc' | 'stable' | 'deprecated';
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_total_hours: number;
  organization: SkillOrganization;
  required_skills: string[];
  learning_objectives: string[];
  modules: SkillModule[];
  frameworks_and_tools: string[];
  best_practices: string[];
  prerequisites: string[];
  assessments: SkillAssessment[];
  metadata: SkillMetadata;
  ratings: SkillRatings;
  learner_stats: SkillLearnerStats;
}
