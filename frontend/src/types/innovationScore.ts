export interface InnovationScores {
  technical: number;
  innovation: number;
  collaboration: number;
  leadership: number;
  careerReadiness: number;
  startupReadiness: number;
  researchReadiness: number;
}

export interface InnovationMetrics {
  skills: number;
  projects: number;
  completedProjects: number;
  hackathons: number;
  communityPosts: number;
  communityLikes: number;
  completedExchanges: number;
  acceptedMentorships: number;
  profileCompletion: number;
  teamParticipation: number;
  projectSuccessRate: number;
}

export interface InnovationBadge {
  key: string;
  label: string;
  reason: string;
  earned: boolean;
}

export interface InnovationScore {
  _id: string;
  overallScore: number;
  scores: InnovationScores;
  metrics: InnovationMetrics;
  badges: InnovationBadge[];
  strengths: string[];
  weaknesses: string[];
  improvementPlan: string[];
  explanation: string;
  calculatedAt: string;
}

export interface LeaderboardEntry {
  _id: string;
  overallScore: number;
  scores: InnovationScores;
  badges: InnovationBadge[];
  calculatedAt: string;
  profile?: {
    name?: string;
    college?: string;
    branch?: string;
    skills?: string[];
  };
}

export interface InnovationScoreResponse {
  success: boolean;
  refreshed?: boolean;
  score: InnovationScore;
  history: InnovationScore[];
  leaderboards?: {
    global: LeaderboardEntry[];
    college: LeaderboardEntry[];
    branch: LeaderboardEntry[];
  };
}
