import { firebaseAuth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  payload: unknown;

  constructor(message: string, payload: unknown) {
    super(message);
    this.payload = payload;
  }
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

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error(`Backend API is not reachable at ${API_URL}. Start the backend and add backend/.env.`);
  }

  if (response.status === 401 && firebaseAuth?.currentUser) {
    headers.set("Authorization", `Bearer ${await firebaseAuth.currentUser.getIdToken(true)}`);
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  }

  const backendToken = localStorage.getItem("engineerconnect-backend-token");
  if (response.status === 401 && backendToken) {
    headers.set("Authorization", `Bearer ${backendToken}`);
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message ?? payload?.error?.message ?? "Request failed";
    throw new ApiError(message, payload);
  }

  return response.json() as Promise<T>;
}
