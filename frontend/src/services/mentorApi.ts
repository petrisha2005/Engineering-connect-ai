import type { MentorCardData, MentorPayload, MentorProfile, MentorRequest, MentorState } from "../types/mentor";
import { apiRequest } from "./api";

export function getMyMentorProfile() {
  return apiRequest<{ success: boolean; mentor: MentorProfile | null }>("/mentors/me");
}

export function saveMyMentorProfile(payload: MentorPayload) {
  return apiRequest<{ success: boolean; mentor: MentorProfile }>("/mentors/me", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function browseMentors() {
  return apiRequest<{ success: boolean; mentors: MentorCardData[] }>("/mentors");
}

export function recommendedMentors() {
  return apiRequest<{ success: boolean; mentors: MentorCardData[] }>("/mentors/recommended");
}

export function getMentorRequestStatus(mentorUserId: string) {
  return apiRequest<{ success: boolean; state: MentorState; request?: MentorRequest }>(`/mentors/status/${mentorUserId}`);
}

export function requestMentor(mentorUserId: string, message?: string) {
  return apiRequest<{ success: boolean; state: MentorState; request: MentorRequest }>(`/mentors/request/${mentorUserId}`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
}

export function acceptMentorRequest(requestId: string) {
  return apiRequest<{ success: boolean; state: MentorState; request: MentorRequest }>(`/mentors/accept/${requestId}`, { method: "POST" });
}

export function rejectMentorRequest(requestId: string) {
  return apiRequest<{ success: boolean; state: MentorState; request: MentorRequest }>(`/mentors/reject/${requestId}`, { method: "POST" });
}

export function listSentMentorRequests() {
  return apiRequest<{ success: boolean; requests: MentorRequest[] }>("/mentors/requests/sent");
}

export function listReceivedMentorRequests() {
  return apiRequest<{ success: boolean; requests: MentorRequest[] }>("/mentors/requests/received");
}
