import type { AuthResponse } from "../types/auth";
import { apiRequest } from "./api";

export function createBackendSession(firebaseIdToken?: string) {
  return apiRequest<AuthResponse>("/auth/sync", {
    method: "POST",
    headers: firebaseIdToken ? { Authorization: `Bearer ${firebaseIdToken}` } : undefined,
    body: JSON.stringify({ idToken: firebaseIdToken })
  });
}

export function createGoogleBackendSession(idToken: string) {
  return apiRequest<AuthResponse>("/auth/google-session", {
    method: "POST",
    body: JSON.stringify({ idToken })
  });
}

export function getCurrentUser() {
  return apiRequest<AuthResponse>("/auth/me");
}
