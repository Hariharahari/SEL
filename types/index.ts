/**
 * SELAgentCard - The strict TypeScript interface for all agent data
 * This is the only source of truth for agent structure across the app
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

export interface Documentation {
  readme: string;
  howto: string;
  changelog?: string;
}

export interface SELAgentCard {
  "agent id": string;
  name: string;
  description: string;
  origin: Origin;
  maintainers: Maintainer[];
  version: string;
  status: 'alpha' | 'beta' | 'rc' | 'stable' | 'deprecated';
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
