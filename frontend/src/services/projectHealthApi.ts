import type { ProjectHealthResponse } from "../types/projectHealth";
import { apiRequest } from "./api";

export function getProjectHealth(projectId: string) {
  return apiRequest<ProjectHealthResponse>(`/project-health/${projectId}`);
}

export function refreshProjectHealth(projectId: string) {
  return apiRequest<ProjectHealthResponse>(`/project-health/${projectId}/refresh`, { method: "POST" });
}
