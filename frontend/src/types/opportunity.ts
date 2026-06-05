export type OpportunityType =
  | "Internship"
  | "Hackathon"
  | "Research Program"
  | "Competition"
  | "Scholarship"
  | "Fellowship"
  | "Open Source Program"
  | "Startup Opportunity";

export interface Opportunity {
  _id: string;
  title: string;
  provider: string;
  type: OpportunityType;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  careerGoals: string[];
  eligibility?: string;
  location?: string;
  applicationUrl?: string;
  deadline?: string;
  status: "open" | "rolling" | "closed";
  source: "manual" | "external_api" | "import";
}

export interface OpportunityAnalysis {
  matchScore: number;
  readinessScore: number;
  readiness: "Low" | "Medium" | "High";
  successProbability: number;
  missingSkills: string[];
  missingKeywords: string[];
  recommendedActions: string[];
  explanation: string;
  pipelineStage: string;
}

export interface OpportunityTracking {
  _id: string;
  opportunity: string;
  saved: boolean;
  status: "saved" | "planning" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
  notes?: string;
  updatedAt: string;
}

export interface OpportunityMatch {
  opportunity: Opportunity;
  analysis: OpportunityAnalysis;
  tracking?: OpportunityTracking | null;
}

export interface OpportunitySummary {
  total: number;
  highReadiness: number;
  saved: number;
  applied: number;
}

export interface OpportunityResponse {
  success: boolean;
  refreshed?: boolean;
  matches: OpportunityMatch[];
  summary: OpportunitySummary;
}
