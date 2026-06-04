import type { AuthResponse } from "../types/auth";
import { apiRequest } from "./api";

export function createBackendSession() {
  return apiRequest<AuthResponse>("/auth/session", { method: "POST" });
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
