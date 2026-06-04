import type { StudentMatch } from "../types/match";
import { apiRequest } from "./api";

export function generateMatches(limit = 25) {
  return apiRequest<{ matches: StudentMatch[] }>("/matches/generate", {
    method: "POST",
    body: JSON.stringify({ limit })
  });
}

export function getRecommendedMatches(limit = 20) {
  return apiRequest<{ matches: StudentMatch[] }>(`/matches/recommended?limit=${limit}`);
}

