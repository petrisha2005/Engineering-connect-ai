import { Router } from "express";
import { askStartupAssistant, completeMilestone, createStartup, getMvpRoadmap, getPitchDeck, getReadiness, getStartups, getValidation } from "../controllers/startupIncubatorController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";

export const startupIncubatorRoutes = Router();

startupIncubatorRoutes.use(requireAuth);
startupIncubatorRoutes.post("/", createStartup);
startupIncubatorRoutes.get("/", getStartups);
startupIncubatorRoutes.get("/:id/validation", aiRateLimit, getValidation);
startupIncubatorRoutes.get("/:id/readiness", getReadiness);
startupIncubatorRoutes.get("/:id/mvp-roadmap", getMvpRoadmap);
startupIncubatorRoutes.post("/:id/milestone", completeMilestone);
startupIncubatorRoutes.get("/:id/pitch-deck", aiRateLimit, getPitchDeck);
startupIncubatorRoutes.post("/:id/assistant", aiRateLimit, askStartupAssistant);
