import type { Conversation, DirectMessage } from "../types/message";
import { apiRequest } from "./api";

export function createOrGetConversation(userId: string) {
  return apiRequest<{ success: boolean; conversation: Conversation }>(`/messages/conversation/${userId}`, { method: "POST" });
}

export function listConversations() {
  return apiRequest<{ success: boolean; conversations: Conversation[] }>("/messages/conversations");
}

export function listMessages(conversationId: string) {
  return apiRequest<{ success: boolean; conversation: Conversation; messages: DirectMessage[] }>(`/messages/${conversationId}`);
}

export function sendMessage(conversationId: string, text: string) {
  return apiRequest<{ success: boolean; message: DirectMessage }>(`/messages/${conversationId}`, {
    method: "POST",
    body: JSON.stringify({ text })
  });
}

export function reportUser(userId: string, payload: { reason: string; description?: string; messageId?: string }) {
  return apiRequest<{ success: boolean }>(`/messages/report/${userId}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function blockUser(userId: string) {
  return apiRequest<{ success: boolean }>(`/messages/block/${userId}`, { method: "POST" });
}
