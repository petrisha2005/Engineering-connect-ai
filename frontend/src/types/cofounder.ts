import type { AppUser } from "./auth";

export type FounderType = "Technical Founder" | "Business Founder" | "Product Founder" | "Marketing Founder" | "Operations Founder";
export type FounderRequestStatus = "pending" | "accepted" | "rejected";

export interface FounderProfile {
  _id: string;
  userId: string | AppUser;
  startupInterests: string[];
  industries: string[];
  founderType: FounderType;
  skills: string[];
  goals: string[];
  commitmentLevel: "low" | "medium" | "high" | "full_time";
  startupStage: "idea" | "prototype" | "mvp" | "early_users" | "revenue";
  preferredLocation?: string;
  availability: "weekdays" | "weekends" | "flexible";
  linkedProjects: string[];
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartupIdea {
  _id: string;
  startupName: string;
  industry: string;
  problemStatement: string;
  targetUsers: string;
  currentStage: string;
  fundingStatus: string;
  requiredRoles: string[];
  description?: string;
  createdAt: string;
}

export interface FounderRequest {
  _id: string;
  requester: string | AppUser;
  recipient: string | AppUser;
  requesterProfile: string | FounderProfile;
  recipientProfile: string | FounderProfile;
  startupIdea?: string | StartupIdea;
  status: FounderRequestStatus;
  matchScore: number;
  compatibilityReason: string;
  suggestedRole: string;
  risks: string[];
  strengths: string[];
  createdAt: string;
}

export interface CofounderMatch {
  profile: FounderProfile;
  request?: FounderRequest;
  state: FounderRequestStatus | "none";
  matchScore: number;
  compatibilityReason: string;
  suggestedRole: string;
  risks: string[];
  strengths: string[];
  visionAlignment: number;
  skillComplementarity: number;
  commitmentCompatibility: number;
  experienceMatch: number;
  leadershipBalance: number;
}

export interface FounderProfilePayload {
  startupInterests: string[];
  industries: string[];
  founderType: FounderType;
  skills: string[];
  goals: string[];
  commitmentLevel: string;
  startupStage: string;
  preferredLocation?: string;
  availability: string;
  bio?: string;
}

export interface StartupIdeaPayload {
  startupName: string;
  industry: string;
  problemStatement: string;
  targetUsers: string;
  currentStage: string;
  fundingStatus: string;
  requiredRoles: string[];
  description?: string;
}
