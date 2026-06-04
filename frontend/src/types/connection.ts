import type { AppUser } from "./auth";

export type ConnectionState = "none" | "self" | "request_sent" | "request_received" | "connected";

export interface Connection {
  _id: string;
  requesterId: string | AppUser;
  recipientId: string | AppUser;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionStatusResponse {
  success: boolean;
  state: ConnectionState;
  connection?: Connection;
}

export interface ConnectionRequestsResponse {
  success: boolean;
  incoming: Connection[];
  outgoing: Connection[];
}
