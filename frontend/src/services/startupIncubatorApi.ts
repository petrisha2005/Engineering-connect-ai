import type { IdeaValidation, PitchDeck, StartupIncubatorResponse, StartupMilestone, StartupProfile, StartupReadiness } from "../types/startupIncubator";
import { apiRequest } from "./api";

export function getStartups() {
  return apiRequest<StartupIncubatorResponse>("/startups");
}

export function createStartup(payload: Partial<StartupProfile>) {
  return apiRequest<{ success: boolean; startup: StartupProfile }>("/startups", { method: "POST", body: JSON.stringify(payload) });
}

export function getStartupValidation(id: string) {
  return apiRequest<{ success: boolean; validation: IdeaValidation }>(`/startups/${id}/validation`);
}

export function getStartupReadiness(id: string) {
  return apiRequest<{ success: boolean; readiness: StartupReadiness }>(`/startups/${id}/readiness`);
}

export function getMvpRoadmap(id: string) {
  return apiRequest<{ success: boolean; milestones: StartupMilestone[] }>(`/startups/${id}/mvp-roadmap`);
}

export function completeStartupMilestone(id: string, milestoneId: string) {
  return apiRequest<{ success: boolean; milestone: StartupMilestone }>(`/startups/${id}/milestone`, { method: "POST", body: JSON.stringify({ milestoneId }) });
}

export function getPitchDeck(id: string) {
  return apiRequest<{ success: boolean; pitchDeck: PitchDeck }>(`/startups/${id}/pitch-deck`);
}

export function askStartupAssistant(id: string, question: string) {
  return apiRequest<{ success: boolean; answer: string }>(`/startups/${id}/assistant`, { method: "POST", body: JSON.stringify({ question }) });
}
