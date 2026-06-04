import type { Feedback, FeedbackPayload } from "../types/feedback";
import { apiRequest } from "./api";

export function submitFeedback(payload: FeedbackPayload) {
  return apiRequest<{ success: boolean; feedback: Feedback }>("/feedback", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
