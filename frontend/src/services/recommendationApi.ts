import type { SkillsToImproveResponse } from "../types/recommendation";
import { apiRequest } from "./api";

export function getSkillsToImprove() {
  return apiRequest<SkillsToImproveResponse>("/recommendations/skills-to-improve");
}
