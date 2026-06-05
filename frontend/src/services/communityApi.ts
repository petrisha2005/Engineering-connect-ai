import type { CommunityComment, CommunityPost, CommunityPostPayload } from "../types/community";
import { apiRequest } from "./api";

export function listCommunityFeed(personalized = true) {
  return apiRequest<{ success: boolean; posts: CommunityPost[] }>(personalized ? "/community/personalized" : "/community");
}

export function createCommunityPost(payload: CommunityPostPayload) {
  return apiRequest<{ success: boolean; post: CommunityPost; moderation?: unknown }>("/community", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deleteCommunityPost(postId: string) {
  return apiRequest<{ success: boolean }>(`/community/${postId}`, { method: "DELETE" });
}

export function toggleCommunityLike(postId: string) {
  return apiRequest<{ success: boolean; liked: boolean; likeCount: number }>(`/community/${postId}/like`, { method: "POST" });
}

export function toggleCommunityBookmark(postId: string) {
  return apiRequest<{ success: boolean; bookmarked: boolean; bookmarkCount: number }>(`/community/${postId}/bookmark`, { method: "POST" });
}

export function listCommunityComments(postId: string) {
  return apiRequest<{ success: boolean; comments: CommunityComment[] }>(`/community/${postId}/comments`);
}

export function addCommunityComment(postId: string, content: string) {
  return apiRequest<{ success: boolean; comment: CommunityComment }>(`/community/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content })
  });
}

export function reportCommunityPost(postId: string, reason = "other", description = "") {
  return apiRequest<{ success: boolean }>(`/community/${postId}/report`, {
    method: "POST",
    body: JSON.stringify({ reason, description })
  });
}

export function suggestCommunityPost(content: string) {
  return apiRequest<{ success: boolean; suggestedContent: string; tips: string[] }>("/community/suggest", {
    method: "POST",
    body: JSON.stringify({ content })
  });
}
