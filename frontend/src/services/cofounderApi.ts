import type { CofounderMatch, FounderProfile, FounderProfilePayload, FounderRequest, StartupIdea, StartupIdeaPayload } from "../types/cofounder";
import { apiRequest } from "./api";

export function getCofounderHome() {
  return apiRequest<{ success: boolean; profile: FounderProfile | null; ideas: StartupIdea[]; requests: FounderRequest[]; readiness: Record<string, number> }>("/cofounders");
}

export function saveFounderProfile(payload: FounderProfilePayload) {
  return apiRequest<{ success: boolean; profile: FounderProfile }>("/cofounders/profile", { method: "POST", body: JSON.stringify(payload) });
}

export function createStartupIdea(payload: StartupIdeaPayload) {
  return apiRequest<{ success: boolean; idea: StartupIdea }>("/cofounders/ideas", { method: "POST", body: JSON.stringify(payload) });
}

export function getCofounderMatches() {
  return apiRequest<{ success: boolean; matches: CofounderMatch[] }>("/cofounders/matches");
}

export function sendFounderRequest(recipientProfileId: string, startupIdeaId?: string) {
  return apiRequest<{ success: boolean; request: FounderRequest; state: string }>("/cofounders/request", {
    method: "POST",
    body: JSON.stringify({ recipientProfileId, startupIdeaId })
  });
}

export function acceptFounderRequest(requestId: string) {
  return apiRequest<{ success: boolean; request: FounderRequest; state: string }>("/cofounders/accept", { method: "POST", body: JSON.stringify({ requestId }) });
}

export function rejectFounderRequest(requestId: string) {
  return apiRequest<{ success: boolean; request: FounderRequest; state: string }>("/cofounders/reject", { method: "POST", body: JSON.stringify({ requestId }) });
}
