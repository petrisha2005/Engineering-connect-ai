import type { ConnectionRequestsResponse, ConnectionStatusResponse, Connection } from "../types/connection";
import { apiRequest } from "./api";

export function getConnectionStatus(userId: string) {
  return apiRequest<ConnectionStatusResponse>(`/connections/status/${userId}`);
}

export function requestConnection(userId: string) {
  return apiRequest<ConnectionStatusResponse>(`/connections/request/${userId}`, { method: "POST" });
}

export function acceptConnection(connectionId: string) {
  return apiRequest<ConnectionStatusResponse>(`/connections/accept/${connectionId}`, { method: "POST" });
}

export function rejectConnection(connectionId: string) {
  return apiRequest<ConnectionStatusResponse>(`/connections/reject/${connectionId}`, { method: "POST" });
}

export function listConnectionRequests() {
  return apiRequest<ConnectionRequestsResponse>("/connections/requests");
}

export function listSentConnections() {
  return apiRequest<{ success: boolean; connections: Connection[] }>("/connections/sent");
}

export function listReceivedConnections() {
  return apiRequest<{ success: boolean; connections: Connection[] }>("/connections/received");
}
