import type { Project } from "./project";

export interface ProjectHealth {
  _id: string;
  project: string;
  healthScore: number;
  riskScore: number;
  successProbability: "Low" | "Medium" | "High";
  completionPrediction: string;
  progress: number;
  riskLevel: "Low" | "Medium" | "High";
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendations: string[];
  missingSkills: string[];
  coveredSkills: string[];
  missingRoles: string[];
  alerts: string[];
  timeline: Array<{ stage: string; progress: number; status: "pending" | "active" | "done" }>;
  lastRefreshedAt: string;
}

export interface ProjectRisk {
  _id: string;
  category: string;
  severity: "Low" | "Medium" | "High";
  reason: string;
  recommendedAction: string;
}

export interface ProjectMilestone {
  _id: string;
  title: string;
  status: "pending" | "active" | "done";
  progress: number;
}

export interface ProjectHealthResponse {
  success: boolean;
  project: Project;
  health: ProjectHealth;
  risks: ProjectRisk[];
  milestones: ProjectMilestone[];
}
