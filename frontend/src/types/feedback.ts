export type FeedbackType = "Bug" | "Suggestion" | "UI Issue" | "Feature Request" | "Other";

export interface FeedbackPayload {
  type: FeedbackType;
  message: string;
  rating?: number | null;
}

export interface Feedback {
  _id: string;
  userId: string;
  type: FeedbackType;
  message: string;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
}
