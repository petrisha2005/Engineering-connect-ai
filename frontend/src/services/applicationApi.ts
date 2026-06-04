import type { ProjectApplicationsResponse } from "../types/activity";
import type { ProjectApplication } from "../types/project";
import { apiRequest } from "./api";

export function listMyApplications() {
  return apiRequest<ProjectApplicationsResponse>("/applications/my-applications");
}

export function listReceivedApplications() {
  return apiRequest<ProjectApplicationsResponse>("/applications/received");
}

export function acceptApplication(applicationId: string) {
  return apiRequest<{ success: boolean; application: ProjectApplication }>(`/applications/${applicationId}/accept`, { method: "POST" });
}

export function rejectApplication(applicationId: string) {
  return apiRequest<{ success: boolean; application: ProjectApplication }>(`/applications/${applicationId}/reject`, { method: "POST" });
}
