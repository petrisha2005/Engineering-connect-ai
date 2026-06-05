import { firebaseAuth } from "./firebase";

const DEFAULT_API_URL = import.meta.env.PROD ? "https://engineering-connect-ai.onrender.com/api" : "http://localhost:8080/api/v1";
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

export class ApiError extends Error {
  payload: unknown;
  status: number;
  url: string;

  constructor(message: string, payload: unknown, status: number, url: string) {
    super(message);
    this.payload = payload;
    this.status = status;
    this.url = url;
  }
}

function isAuthPath(path: string) {
  return path.startsWith("/auth/");
}

async function parseResponseBody(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function errorMessageForStatus(status: number, payload: unknown, url: string) {
  const backendMessage =
    typeof payload === "object" && payload
      ? ((payload as { message?: string; error?: { message?: string } }).message ?? (payload as { error?: { message?: string } }).error?.message)
      : "";

  if (status === 401) return `401 Firebase token invalid. ${backendMessage || "Please sign in again."}`;
  if (status === 403) return `403 CORS issue or forbidden request. Check backend CLIENT_ORIGIN/CORS settings for ${window.location.origin}.`;
  if (status === 404) return `404 endpoint not found: ${url}. Check the frontend auth sync path and backend routes.`;
  if (status >= 500) return `${status} backend env/server issue. ${backendMessage || "Check Render environment variables and backend logs."}`;
  return `${status} request failed. ${backendMessage || `Backend returned an error for ${url}.`}`;
}

async function getToken() {
  if (!firebaseAuth) {
    return localStorage.getItem("engineerconnect-backend-token");
  }

  const currentUser = firebaseAuth.currentUser;
  return currentUser ? currentUser.getIdToken(false) : localStorage.getItem("engineerconnect-backend-token");
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  const url = `${API_URL}${path}`;

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    if (isAuthPath(path)) {
      console.info("api:auth-request", { url, method: options.method ?? "GET", apiUrl: API_URL });
    }

    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (error) {
    if (isAuthPath(path)) {
      console.error("api:auth-network-failed", { url, apiUrl: API_URL, error });
    }
    throw new ApiError(`Network/CORS issue while calling ${url}. Check VITE_API_URL and backend CORS settings.`, null, 0, url);
  }

  if (response.status === 401 && firebaseAuth?.currentUser) {
    headers.set("Authorization", `Bearer ${await firebaseAuth.currentUser.getIdToken(true)}`);
    response = await fetch(url, {
      ...options,
      headers
    });
  }

  const backendToken = localStorage.getItem("engineerconnect-backend-token");
  if (response.status === 401 && backendToken) {
    headers.set("Authorization", `Bearer ${backendToken}`);
    response = await fetch(url, {
      ...options,
      headers
    });
  }

  if (!response.ok) {
    const payload = await parseResponseBody(response);
    if (isAuthPath(path)) {
      console.error("api:auth-response-failed", { url, status: response.status, body: payload });
    }
    throw new ApiError(errorMessageForStatus(response.status, payload, url), payload, response.status, url);
  }

  const payload = (await parseResponseBody(response)) as T;
  if (isAuthPath(path)) {
    console.info("api:auth-response-ok", { url, status: response.status });
  }
  return payload;
}
