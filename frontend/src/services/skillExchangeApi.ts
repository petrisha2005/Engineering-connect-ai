import type { SkillExchangeDashboard, SkillExchangeMatch, SkillExchangePayload, SkillExchangeProfile, SkillExchangeRequest } from "../types/skillExchange";
import { apiRequest } from "./api";

export function getSkillExchangeProfile() {
  return apiRequest<{ success: boolean; profile: SkillExchangeProfile | null }>("/skill-exchange/profile");
}

export function saveSkillExchangeProfile(payload: SkillExchangePayload) {
  return apiRequest<{ success: boolean; profile: SkillExchangeProfile }>("/skill-exchange/profile", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getSkillExchangeMatches() {
  return apiRequest<{ success: boolean; matches: SkillExchangeMatch[] }>("/skill-exchange/matches");
}

export function sendSkillExchangeRequest(recipientProfileId: string) {
  return apiRequest<{ success: boolean; request: SkillExchangeRequest; state: string }>("/skill-exchange/request", {
    method: "POST",
    body: JSON.stringify({ recipientProfileId })
  });
}

export function acceptSkillExchangeRequest(requestId: string) {
  return apiRequest<{ success: boolean; request: SkillExchangeRequest; state: string }>("/skill-exchange/accept", {
    method: "POST",
    body: JSON.stringify({ requestId })
  });
}

export function rejectSkillExchangeRequest(requestId: string) {
  return apiRequest<{ success: boolean; request: SkillExchangeRequest; state: string }>("/skill-exchange/reject", {
    method: "POST",
    body: JSON.stringify({ requestId })
  });
}

export function cancelSkillExchangeRequest(requestId: string) {
  return apiRequest<{ success: boolean; request: SkillExchangeRequest; state: string }>("/skill-exchange/cancel", {
    method: "POST",
    body: JSON.stringify({ requestId })
  });
}

export function completeSkillExchangeRequest(requestId: string, rating: number, feedback = "") {
  return apiRequest<{ success: boolean; request: SkillExchangeRequest; state: string }>("/skill-exchange/complete", {
    method: "POST",
    body: JSON.stringify({ requestId, rating, feedback })
  });
}

export function getSkillExchangeDashboard() {
  return apiRequest<SkillExchangeDashboard & { success: boolean }>("/skill-exchange/dashboard");
}
