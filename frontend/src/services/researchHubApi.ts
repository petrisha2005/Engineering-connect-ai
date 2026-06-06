import type { ResearchDomain, ResearchHubResponse, ResearchProfile, ResearchProject } from "../types/researchHub";
import { apiRequest } from "./api";

export function getResearchHub() {
  return apiRequest<ResearchHubResponse>("/research-hub");
}

export function saveResearchProfile(payload: Partial<ResearchProfile>) {
  return apiRequest<{ success: boolean; profile: ResearchProfile }>("/research-hub/profile", { method: "POST", body: JSON.stringify(payload) });
}

export function createResearchProject(payload: Partial<ResearchProject>) {
  return apiRequest<{ success: boolean; project: ResearchProject }>("/research-hub/projects", { method: "POST", body: JSON.stringify(payload) });
}

export function generateResearchTopics(domain: ResearchDomain, interests: string[]) {
  return apiRequest<{ success: boolean; topics: Array<{ title: string; difficulty: string; impactScore: number; whyItMatters: string; suggestedDataset: string }> }>("/research-hub/topics", {
    method: "POST",
    body: JSON.stringify({ domain, interests })
  });
}

export function askResearchAssistant(question: string) {
  return apiRequest<{ success: boolean; answer: string }>("/research-hub/assistant", { method: "POST", body: JSON.stringify({ question }) });
}

export function sendResearchRequest(payload: { recipient?: string; project?: string; facultyMentor?: string; type: "collaboration" | "mentorship" | "join_project"; message?: string; matchScore?: number; matchingReasons?: string[] }) {
  return apiRequest<{ success: boolean }>("/research-hub/requests", { method: "POST", body: JSON.stringify(payload) });
}
