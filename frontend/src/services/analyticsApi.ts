import type { ActivityAnalytics, DashboardAnalytics, MessageHealthAnalytics, ProjectsAnalytics, RoadmapsAnalytics } from "../types/analytics";
import { apiRequest } from "./api";

export function getDashboardAnalytics() {
  return apiRequest<DashboardAnalytics>("/dashboard/analytics");
}

export function getActivityAnalytics() {
  return apiRequest<ActivityAnalytics>("/activity/analytics");
}

export function getProjectsAnalytics() {
  return apiRequest<ProjectsAnalytics>("/projects/analytics");
}

export function getRoadmapsAnalytics() {
  return apiRequest<RoadmapsAnalytics>("/roadmaps/analytics");
}

export function getMessageHealthAnalytics() {
  return apiRequest<MessageHealthAnalytics>("/messages/analytics");
}
