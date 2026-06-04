import type { AppUser } from "./auth";
import type { StudentProfile } from "./profile";

export interface MatchTargetUser extends AppUser {
  profile?: StudentProfile;
}

export interface StudentMatch {
  _id: string;
  sourceUser: string;
  targetUser: string | MatchTargetUser;
  matchScore: number;
  compatibilityScore: number;
  reasons: string[];
  sharedSkills: string[];
  sharedInterests: string[];
  sharedGoals: string[];
  generatedBy: "algorithm" | "ai";
  createdAt: string;
  updatedAt: string;
}

