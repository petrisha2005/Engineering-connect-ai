import type { ProfileListResponse, ProfilePayload, StudentProfile } from "../types/profile";
import { apiRequest } from "./api";

export function getMyProfile() {
  return apiRequest<{ profile: StudentProfile }>("/profiles/me");
}

export function saveMyProfile(payload: ProfilePayload) {
  return apiRequest<{ profile: StudentProfile }>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function listProfiles(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return apiRequest<ProfileListResponse>(`/profiles${query ? `?${query}` : ""}`);
}

export function getProfileById(id: string) {
  return apiRequest<{ profile: StudentProfile }>(`/profiles/${id}`);
}

