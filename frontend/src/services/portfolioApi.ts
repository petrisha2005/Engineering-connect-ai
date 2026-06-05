import type { PortfolioResponse, PortfolioThemeName, PortfolioType } from "../types/portfolio";
import { apiRequest } from "./api";

export function getMyPortfolio() {
  return apiRequest<PortfolioResponse>("/portfolio");
}

export function generatePortfolio(type: PortfolioType, theme: PortfolioThemeName) {
  return apiRequest<PortfolioResponse>("/portfolio/generate", {
    method: "POST",
    body: JSON.stringify({ type, theme })
  });
}

export function updatePortfolio(payload: Partial<{ type: PortfolioType; theme: PortfolioThemeName; published: boolean }>) {
  return apiRequest<PortfolioResponse>("/portfolio/update", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getPublicPortfolio(username: string, recruiterMode = false) {
  return apiRequest<PortfolioResponse>(`/portfolio/${encodeURIComponent(username)}${recruiterMode ? "?mode=recruiter" : ""}`);
}

export function trackPortfolioEvent(username: string, type: "profile_click" | "resume_download" | "project_click" | "recruiter_view", projectTitle?: string) {
  return apiRequest<{ success: boolean }>(`/portfolio/${encodeURIComponent(username)}/track`, {
    method: "POST",
    body: JSON.stringify({ type, projectTitle })
  });
}
