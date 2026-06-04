import type { AppUser } from "./auth";

export type ProjectStatus = "open" | "in_progress" | "completed" | "archived";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface ProjectMember {
  user: string | AppUser;
  role: string;
  joinedAt: string;
}

export interface ProjectInvite {
  user: string | AppUser;
  invitedBy: string | AppUser;
  status: "pending" | "accepted" | "declined";
  invitedAt: string;
}

export interface Project {
  _id: string;
  owner: string | AppUser;
  title: string;
  description: string;
  requiredSkills: string[];
  interests: string[];
  status: ProjectStatus;
  members: ProjectMember[];
  invites: ProjectInvite[];
  maxMembers: number;
  repositoryUrl?: string;
  demoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPayload {
  title: string;
  description: string;
  requiredSkills: string[];
  interests: string[];
  maxMembers: number;
  repositoryUrl?: string;
  demoUrl?: string;
}

export interface ProjectApplication {
  _id: string;
  applicant: string | AppUser;
  targetType: "project";
  project: string | Project;
  message: string;
  rolePreference?: string;
  status: ApplicationStatus;
  decidedBy?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
