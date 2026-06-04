import type { AppUser } from "./auth";

export interface Conversation {
  _id: string;
  participants: AppUser[];
  participantKey: string;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  read: boolean;
  createdAt: string;
}
