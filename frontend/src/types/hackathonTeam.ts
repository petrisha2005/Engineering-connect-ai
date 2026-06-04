import type { AppUser } from "./auth";

export type HackathonTeamStatus = "forming" | "ready" | "competing" | "archived";

export interface RequiredRole {
  role: string;
  skills: string[];
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
  description: string;
  requiredRoles: RequiredRole[];
  members: HackathonMember[];
  skillsNeeded: string[];
  status: HackathonTeamStatus;
  maxMembers: number;
  lookingFor?: string;
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
  }>;
}

