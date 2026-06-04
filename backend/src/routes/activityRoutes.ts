import { Router } from "express";
import { getActivitySummary } from "../controllers/activityController.js";
import { requireAuth } from "../middleware/auth.js";

export const activityRoutes = Router();

activityRoutes.use(requireAuth);
activityRoutes.get("/summary", getActivitySummary);
