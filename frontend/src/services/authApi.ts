import type { AuthResponse } from "../types/auth";
import { API_URL, ApiError, apiRequest } from "./api";

async function parseAuthResponse(response: Response, url: string) {
  const text = await response.text().catch(() => "");
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text ? { raw: text } : null;
  }

  if (!response.ok) {
    const message = typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string" ? payload.message : "Authentication request failed.";
    throw new ApiError(`${response.status} ${message}`, payload, response.status, url);
  }

  return payload as AuthResponse;
}

export async function createBackendSession(firebaseIdToken: string) {
  if (!firebaseIdToken) {
    throw new Error("Firebase ID token was not available. Please sign in again.");
  }

  const url = `${API_URL}/auth/sync`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firebaseIdToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idToken: firebaseIdToken })
  });

  return parseAuthResponse(response, url);
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
