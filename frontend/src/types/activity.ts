import type { ProjectApplication } from "./project";

export interface NotificationItem {
  _id: string;
  user: string;
  type:
    | "project_application"
    | "project_invite"
    | "application_decision"
    | "team_application"
    | "team_suggestion"
    | "roadmap_generated"
    | "connection_request"
    | "connection_accepted"
    | "mentor_request"
    | "mentor_request_accepted"
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
