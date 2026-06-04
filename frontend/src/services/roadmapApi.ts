import type { Roadmap } from "../types/roadmap";
import { apiRequest } from "./api";

export function createRoadmap(desiredCareer: string) {
  return apiRequest<{ success: boolean; roadmap: Roadmap }>("/roadmaps/generate", {
    method: "POST",
    body: JSON.stringify({ careerGoal: desiredCareer })
  });
}

export function listRoadmaps(limit = 20) {
  return apiRequest<{ success: boolean; roadmaps: Roadmap[] }>(`/roadmaps/my-roadmaps?limit=${limit}`);
}

export function getRoadmapById(id: string) {
  return apiRequest<{ success: boolean; roadmap: Roadmap }>(`/roadmaps/${id}`);
}
