import type { ProjectApplication } from "./project";

export interface NotificationItem {
  _id: string;
  user: string;
  type:
    | "project_application"
    | "project_invite"
    | "application_decision"
    | "team_application"
    | "team_invite"
    | "team_invite_accepted"
    | "team_invite_rejected"
    | "team_suggestion"
    | "roadmap_generated"
    | "connection_request"
    | "connection_accepted"
    | "mentor_request"
    | "mentor_request_accepted"
    | "skill_exchange_request"
    | "skill_exchange_accepted"
    | "skill_exchange_rejected"
    | "skill_exchange_completed"
    | "founder_request"
    | "founder_request_accepted"
    | "founder_request_rejected"
    | "message"
    | "system";
  title: string;
  body: string;
  link?: string;
  readAt?: string | null;
  metadata?: Record<string, unknown>;
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface ActivitySummary {
  pendingConnections: number;
  pendingApplications: number;
  acceptedApplications: number;
  receivedApplications: number;
}

export interface ActivitySummaryResponse {
  success: boolean;
  summary: ActivitySummary;
  recentActivity: NotificationItem[];
}

export interface ProjectApplicationsResponse {
  success: boolean;
  applications: ProjectApplication[];
}
