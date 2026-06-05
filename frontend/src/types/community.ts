import type { AppUser } from "./auth";

export type CommunityPostType = "project_update" | "hackathon" | "learning_progress" | "question" | "collaboration_request" | "achievement";

export interface CommunityPost {
  _id: string;
  author: AppUser;
  type: CommunityPostType;
  content: string;
  tags: string[];
  likes: string[];
  bookmarks: string[];
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  connectionState: "self" | "connected" | "none";
  moderation?: { category?: string; severity?: string; reason?: string; suggestedRewrite?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CommunityComment {
  _id: string;
  post: string;
  author: AppUser;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostPayload {
  type: CommunityPostType;
  content: string;
  tags: string[];
}
