import { Router } from "express";
import {
  addComment,
  createPost,
  deletePost,
  listComments,
  listFeed,
  listPersonalizedFeed,
  reportPost,
  suggestPostWording,
  toggleBookmark,
  toggleLike
} from "../controllers/communityController.js";
import { requireAuth } from "../middleware/auth.js";

export const communityRoutes = Router();

communityRoutes.use(requireAuth);
communityRoutes.get("/", listFeed);
communityRoutes.get("/personalized", listPersonalizedFeed);
communityRoutes.post("/", createPost);
communityRoutes.post("/suggest", suggestPostWording);
communityRoutes.delete("/:postId", deletePost);
communityRoutes.post("/:postId/like", toggleLike);
communityRoutes.post("/:postId/bookmark", toggleBookmark);
communityRoutes.get("/:postId/comments", listComments);
communityRoutes.post("/:postId/comments", addComment);
communityRoutes.post("/:postId/report", reportPost);
