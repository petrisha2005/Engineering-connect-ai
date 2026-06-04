import type { NotificationItem } from "../types/activity";
import { apiRequest } from "./api";

export function listNotifications() {
  return apiRequest<{ success: boolean; notifications: NotificationItem[] }>("/notifications");
}

export function markNotificationRead(notificationId: string) {
  return apiRequest<{ success: boolean; notification: NotificationItem }>(`/notifications/${notificationId}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return apiRequest<{ success: boolean }>("/notifications/read-all", { method: "POST" });
}
