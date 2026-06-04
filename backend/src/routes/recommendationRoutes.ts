import { Router } from "express";
import { getSkillRecommendations } from "../controllers/recommendationController.js";
import { requireAuth } from "../middleware/auth.js";

export const recommendationRoutes = Router();

recommendationRoutes.use(requireAuth);
recommendationRoutes.get("/skills-to-improve", getSkillRecommendations);
