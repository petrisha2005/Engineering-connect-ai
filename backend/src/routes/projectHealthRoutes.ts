import { Router } from "express";
import { getProjectHealth, getProjectHealthAnalysis, getProjectHealthRecommendations, refreshProjectHealth } from "../controllers/projectHealthController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";

export const projectHealthRoutes = Router();

projectHealthRoutes.use(requireAuth);
projectHealthRoutes.get("/:projectId", getProjectHealth);
projectHealthRoutes.get("/:projectId/analysis", getProjectHealthAnalysis);
projectHealthRoutes.get("/:projectId/recommendations", getProjectHealthRecommendations);
projectHealthRoutes.post("/:projectId/refresh", aiRateLimit, refreshProjectHealth);
