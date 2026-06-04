import type { ActivitySummaryResponse } from "../types/activity";
import { apiRequest } from "./api";

export function getActivitySummary() {
  return apiRequest<ActivitySummaryResponse>("/activity/summary");
}
