import type { AppUser } from "./auth";

export type HackathonTeamStatus = "forming" | "ready" | "competing" | "archived" | "open" | "full" | "completed" | "closed";

export interface RequiredRole {
  role: string;
  roleName?: string;
  skills: string[];
  requiredSkills?: string[];
  importance?: "Low" | "Medium" | "High";
  status?: "open" | "filled";
  filledBy?: string | AppUser;
}

export interface HackathonMember {
  user: string | AppUser;
  role: string;
  joinedAt: string;
}

export interface HackathonTeam {
  _id: string;
  owner: string | AppUser;
  name: string;
  hackathonName: string;
  theme?: string;
  problemStatement?: string;
  description: string;
  requiredRoles: RequiredRole[];
  members: HackathonMember[];
  skillsNeeded: string[];
  requiredSkills?: string[];
  status: HackathonTeamStatus;
  maxMembers: number;
  teamSize?: number;
  lookingFor?: string;
  deadline?: string;
  mode?: "online" | "offline" | "hybrid";
  location?: string;
  invitedUsers?: HackathonInvite[];
  createdAt: string;
  updatedAt: string;
}

export interface HackathonTeamPayload {
  name: string;
  hackathonName: string;
  description: string;
  requiredRoles: RequiredRole[];
  skillsNeeded: string[];
  maxMembers: number;
  lookingFor?: string;
  theme?: string;
  problemStatement?: string;
  requiredSkills?: string[];
  teamSize?: number;
  deadline?: string;
  mode?: "online" | "offline" | "hybrid";
  location?: string;
}

export interface HackathonInvite {
  _id: string;
  user: string | AppUser;
  role: string;
  status: "pending" | "accepted" | "rejected";
  invitedAt: string;
  decidedAt?: string;
}

export interface HackathonApplication {
  _id: string;
  applicant: string | AppUser;
  targetType: "hackathon_team";
  hackathonTeam: string;
  message: string;
  rolePreference?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  createdAt: string;
  updatedAt: string;
}

export interface RoleSuggestion {
  role: string;
  candidates: Array<{
    profile: {
      _id: string;
      user: AppUser;
      name: string;
      college: string;
      branch: string;
      year: number;
      skills: string[];
      interests: string[];
      availability: string;
      headline?: string;
    };
    score: number;
    matchingSkills: string[];
    reasons: string[];
    missingSkills?: string[];
    recommendedRole?: string;
    collaborationFit?: "Low" | "Medium" | "High";
  }>;
}

export interface HackathonAnalysis {
  teamStrength: number;
  skillCoverage: number;
  roleCompletion: { filled: number; total: number };
  riskLevel: "Low" | "Medium" | "High";
  missingRoles: string[];
  missingSkills: string[];
  suggestedImprovements: string[];
  applicantScores: Array<{ applicationId: string; name: string; score: number }>;
  skillCoverageChart: Array<{ skill: string; covered: number; missing: number }>;
}
