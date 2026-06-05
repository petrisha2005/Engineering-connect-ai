import type { AppUser } from "./auth";

export type MentorAvailability = "resume_review" | "project_guidance" | "interview_prep" | "career_guidance" | "hackathon_mentoring";
export type MentorRequestStatus = "pending" | "accepted" | "rejected";
export type MentorState = "none" | "self" | "request_sent" | "request_received" | "accepted";

export interface MentorProfile {
  _id: string;
  user: string | AppUser;
  name: string;
  currentRole: string;
  organization: string;
  expertise: string;
  yearsOfExperience: number;
  skills: string[];
  domains: string[];
  availableFor: MentorAvailability[];
  linkedin?: string;
  github?: string;
  headline?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MentorRequest {
  _id: string;
  student: string | AppUser;
  mentor: string | AppUser;
  mentorProfile: string | MentorProfile;
  status: MentorRequestStatus;
  message?: string;
  compatibilityScore: number;
  matchingReasons: string[];
  decidedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MentorCardData {
  mentor: MentorProfile;
  request?: MentorRequest;
  state: MentorState;
  compatibilityScore: number;
  matchingReasons: string[];
  sharedSkills: string[];
  sharedDomains: string[];
}

export interface MentorPayload {
  name: string;
  currentRole: string;
  organization: string;
  expertise: string;
  yearsOfExperience: number;
  skills: string[];
  domains: string[];
  availableFor: MentorAvailability[];
  linkedin?: string;
  github?: string;
  headline?: string;
  active?: boolean;
}
