export interface ReadinessBreakdown {
  technical: number;
  project: number;
  portfolio: number;
  communication: number;
  interview: number;
}

export interface CareerTimelineItem {
  stage: string;
  description: string;
  target: string;
  status: "current" | "next" | "future" | "completed";
}

export interface ProjectImpact {
  title: string;
  impactScore: number;
  complexityScore: number;
  resumeValue: number;
  industryRelevance: number;
  reason: string;
}

export interface CareerTwinProfile {
  _id: string;
  careerGoal: string;
  currentLevel: "Beginner" | "Intermediate" | "Advanced" | "Industry Ready";
  readinessScore: number;
  confidenceScore: number;
  estimatedTimeToGoal: string;
  growthTrend: "Improving" | "Stable" | "Needs Focus";
  readinessBreakdown: ReadinessBreakdown;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  missingProjects: string[];
  missingCertifications: string[];
  recommendedActionsThisWeek: string[];
  recommendedActionsThisMonth: string[];
  timeline: CareerTimelineItem[];
  projectImpact: ProjectImpact[];
  interviewReadiness: number;
  portfolioQuality: number;
  resumeQuality: number;
  industryReadiness: number;
  githubSummary: string;
  lastRefreshedAt: string;
}

export interface CareerReadinessSnapshot {
  _id: string;
  readinessScore: number;
  technicalReadiness: number;
  projectReadiness: number;
  portfolioReadiness: number;
  communicationReadiness: number;
  interviewReadiness: number;
  growthTrend: string;
  createdAt: string;
}

export interface SkillGapItem {
  skill: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
  currentEvidence: string;
}

export interface SkillGapAnalysis {
  goal: string;
  currentSkills: string[];
  missingSkills: SkillGapItem[];
}

export interface OpportunityItem {
  type: string;
  readiness: number;
  reason: string;
  nextAction: string;
}

export interface OpportunityPrediction {
  predictions: OpportunityItem[];
}

export interface CareerTwinResponse {
  success: boolean;
  twin: CareerTwinProfile;
  snapshots: CareerReadinessSnapshot[];
  skillGap: SkillGapAnalysis | null;
  opportunities: OpportunityPrediction | null;
}
