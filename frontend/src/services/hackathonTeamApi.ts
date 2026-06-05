import type { HackathonAnalysis, HackathonApplication, HackathonTeam, HackathonTeamPayload, RoleSuggestion } from "../types/hackathonTeam";
import { apiRequest } from "./api";

export function createHackathonTeam(payload: HackathonTeamPayload) {
  return apiRequest<{ team: HackathonTeam }>("/hackathon-teams", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listHackathonTeams(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return apiRequest<{ teams: HackathonTeam[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
    `/hackathon-teams${query ? `?${query}` : ""}`
  );
}

export function getHackathonTeamById(id: string) {
  return apiRequest<{ team: HackathonTeam; applications: HackathonApplication[]; analysis?: HackathonAnalysis }>(`/hackathon-teams/${id}`);
}

export function applyToHackathonTeam(id: string, payload: { message: string; rolePreference?: string }) {
  return apiRequest<{ application: HackathonApplication }>(`/hackathon-teams/${id}/apply`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function decideHackathonApplication(id: string, applicationId: string, payload: { decision: "accepted" | "rejected"; role: string }) {
  return apiRequest<{ application: HackathonApplication; team: HackathonTeam }>(
    `/hackathon-teams/${id}/applications/${applicationId}/decision`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function getHackathonRoleSuggestions(id: string, limit = 5) {
  return apiRequest<{ suggestions: RoleSuggestion[]; recommendations?: RoleSuggestion[] }>(`/hackathon-teams/${id}/suggestions`, {
    method: "POST",
    body: JSON.stringify({ limit })
  });
}

export function getHackathonAnalysis(id: string) {
  return apiRequest<{ analysis: HackathonAnalysis }>(`/hackathon-teams/${id}/analysis`);
}

export function inviteHackathonTeammate(id: string, userId: string, role = "Member") {
  return apiRequest<{ team: HackathonTeam }>(`/hackathon-teams/${id}/invite/${userId}`, {
    method: "POST",
    body: JSON.stringify({ role })
  });
}

export function acceptHackathonInvite(id: string) {
  return apiRequest<{ team: HackathonTeam }>(`/hackathon-teams/${id}/accept-invite`, { method: "POST" });
}

export function rejectHackathonInvite(id: string) {
  return apiRequest<{ team: HackathonTeam }>(`/hackathon-teams/${id}/reject-invite`, { method: "POST" });
}
