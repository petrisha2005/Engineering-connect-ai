import type { SkillSuggestion } from "./recommendation";
import type { Project } from "./project";

export interface WeeklyActivityPoint {
  day: string;
  profileUpdates: number;
  connections: number;
  applications: number;
  messages: number;
  roadmaps: number;
  total: number;
}

export interface DashboardAnalytics {
  success: boolean;
  profileCompletion: number;
  connectionsCount: number;
  acceptedConnectionsCount: number;
  projectApplicationsCount: number;
  projectApplicationsReceivedCount: number;
  messagesCount: number;
  roadmapsCount: number;
  weeklyActivity: WeeklyActivityPoint[];
  skillMatchChart: Array<{ skill: string; score: number; count: number }>;
  skillsToImprove: SkillSuggestion[];
}

export interface StatusCounts {
  pending: number;
  accepted: number;
  rejected: number;
}

export interface ActivityAnalytics {
  success: boolean;
  connectionRequestStatus: StatusCounts;
  projectApplicationStatus: StatusCounts;
  receivedApplicationStatus: StatusCounts;
  recentActivityTimeline: Array<{ id: string; type: string; title: string; body: string; createdAt: string }>;
}

export interface ProjectsAnalytics {
  success: boolean;
  userProjects: Project[];
  applicationStats: StatusCounts;
  teamCompletionStats: Array<{ projectId: string; title: string; currentMembers: number; maxMembers: number; percent: number; skills: string[] }>;
}

export interface RoadmapsAnalytics {
  success: boolean;
  roadmapProgress: Array<{ phase: string; duration: string; checklistItems: number; skills: number; projects: number; progress: number }>;
  skillPriorityBreakdown: Array<{ skill: string; priority: "High" | "Medium" | "Low"; value: number }>;
  roadmapDurationBreakdown: Array<{ name: string; weeks: number }>;
}

export interface MessageHealthAnalytics {
  success: boolean;
  messageHealth: { allowed: number; warned: number; blocked: number };
}
