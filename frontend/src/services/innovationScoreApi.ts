import type { InnovationScoreResponse } from "../types/innovationScore";
import { apiRequest } from "./api";

export function getInnovationScore(filter?: string) {
  const query = filter ? `?filter=${encodeURIComponent(filter)}` : "";
  return apiRequest<InnovationScoreResponse>(`/innovation-score${query}`);
}

export function refreshInnovationScore() {
  return apiRequest<InnovationScoreResponse>("/innovation-score/refresh", { method: "POST" });
}
