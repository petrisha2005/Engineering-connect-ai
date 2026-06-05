import type { AppUser } from "./auth";

export type SkillExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type SkillAvailability = "weekdays" | "weekends" | "flexible";
export type SkillLearningMode = "online" | "in_person" | "hybrid";
export type SkillExchangeStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";

export interface SkillExchangeProfile {
  _id: string;
  userId: string | AppUser;
  teachSkills: string[];
  learnSkills: string[];
  experienceLevel: SkillExperienceLevel;
  availability: SkillAvailability;
  preferredLearningMode: SkillLearningMode;
  completedExchanges: number;
  rating: number;
  reputationPoints: number;
  headline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillPlanWeek {
  week: number;
  focus: string;
  tasks: string[];
}

export interface SkillExchangeRequest {
  _id: string;
  requester: string | AppUser;
  recipient: string | AppUser;
  requesterProfile: string | SkillExchangeProfile;
  recipientProfile: string | SkillExchangeProfile;
  status: SkillExchangeStatus;
  matchScore: number;
  compatibilityReason: string;
  suggestedExchangePlan: string;
  planWeeks: SkillPlanWeek[];
  requesterRating?: number;
  recipientRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillExchangeMatch {
  profile: SkillExchangeProfile;
  request?: SkillExchangeRequest;
  state: SkillExchangeStatus | "none";
  matchScore: number;
  compatibilityReason: string;
  suggestedExchangePlan: string;
  planWeeks: SkillPlanWeek[];
  mutualTeach: string[];
  mutualLearn: string[];
}

export interface SkillExchangePayload {
  teachSkills: string[];
  learnSkills: string[];
  experienceLevel: SkillExperienceLevel;
  availability: SkillAvailability;
  preferredLearningMode: SkillLearningMode;
  headline?: string;
}

export interface SkillExchangeDashboard {
  profile: SkillExchangeProfile | null;
  requests: SkillExchangeRequest[];
  summary: {
    activeExchanges: number;
    pendingRequests: number;
    completedExchanges: number;
    skillsLearned: string[];
    skillsTaught: string[];
    reputationPoints: number;
    reputationLevel: string;
    profileSkills: string[];
  };
}
