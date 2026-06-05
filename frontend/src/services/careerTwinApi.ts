import type { CareerTwinResponse } from "../types/careerTwin";
import { apiRequest } from "./api";

export function getCareerTwin() {
  return apiRequest<CareerTwinResponse>("/career-twin");
}

export function refreshCareerTwin() {
  return apiRequest<CareerTwinResponse & { refreshed: boolean }>("/career-twin/refresh", { method: "POST" });
}

export function askCareerTwinCoach(question: string) {
  return apiRequest<{ success: boolean; answer: string }>("/career-twin/coach", {
    method: "POST",
    body: JSON.stringify({ question })
  });
}
