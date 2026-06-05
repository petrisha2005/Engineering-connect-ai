import { Router } from "express";
import {
  getActivityAnalytics,
  getDashboardAnalytics,
  getMessageHealthAnalytics,
  getProjectsAnalytics,
  getRoadmapsAnalytics
} from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/auth.js";

export const analyticsRoutes = Router();

analyticsRoutes.use(requireAuth);
analyticsRoutes.get("/dashboard/analytics", getDashboardAnalytics);
analyticsRoutes.get("/activity/analytics", getActivityAnalytics);
analyticsRoutes.get("/projects/analytics", getProjectsAnalytics);
analyticsRoutes.get("/roadmaps/analytics", getRoadmapsAnalytics);
analyticsRoutes.get("/messages/analytics", getMessageHealthAnalytics);
