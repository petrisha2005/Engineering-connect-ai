import type { Project, ProjectApplication, ProjectListResponse, ProjectPayload } from "../types/project";
import { apiRequest } from "./api";

export function createProject(payload: ProjectPayload) {
  return apiRequest<{ project: Project }>("/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listProjects(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return apiRequest<ProjectListResponse>(`/projects${query ? `?${query}` : ""}`);
}

export function getProjectById(id: string) {
  return apiRequest<{ project: Project; applications: ProjectApplication[] }>(`/projects/${id}`);
}

export function applyToProject(id: string, payload: { message: string; rolePreference?: string }) {
  return apiRequest<{ application: ProjectApplication }>(`/projects/${id}/apply`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function decideProjectApplication(id: string, applicationId: string, payload: { decision: "accepted" | "rejected"; role: string }) {
  return apiRequest<{ application: ProjectApplication; project: Project }>(`/projects/${id}/applications/${applicationId}/decision`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

