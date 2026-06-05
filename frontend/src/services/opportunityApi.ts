import type { OpportunityResponse, OpportunityTracking } from "../types/opportunity";
import { apiRequest } from "./api";

export function getOpportunities(type?: string) {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiRequest<OpportunityResponse>(`/opportunities${query}`);
}

export function refreshOpportunities(type?: string) {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiRequest<OpportunityResponse>(`/opportunities/refresh${query}`, { method: "POST" });
}

export function saveOpportunity(opportunityId: string) {
  return apiRequest<{ success: boolean; tracking: OpportunityTracking }>(`/opportunities/${opportunityId}/save`, { method: "POST", body: JSON.stringify({ status: "saved" }) });
}

export function trackOpportunity(opportunityId: string, status: OpportunityTracking["status"]) {
  return apiRequest<{ success: boolean; tracking: OpportunityTracking }>(`/opportunities/${opportunityId}/track`, { method: "POST", body: JSON.stringify({ status }) });
}

export function askOpportunityCoach(opportunityId: string) {
  return apiRequest<{ success: boolean; answer: string }>(`/opportunities/${opportunityId}/coach`, { method: "POST" });
}
