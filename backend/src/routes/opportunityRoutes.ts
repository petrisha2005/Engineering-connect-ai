import { Router } from "express";
import { askOpportunityCoach, getOpportunityMatches, refreshOpportunityMatches, saveOpportunity, trackOpportunity } from "../controllers/opportunityController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";

export const opportunityRoutes = Router();

opportunityRoutes.use(requireAuth);
opportunityRoutes.get("/", getOpportunityMatches);
opportunityRoutes.post("/refresh", aiRateLimit, refreshOpportunityMatches);
opportunityRoutes.post("/:opportunityId/save", saveOpportunity);
opportunityRoutes.post("/:opportunityId/track", trackOpportunity);
opportunityRoutes.post("/:opportunityId/coach", aiRateLimit, askOpportunityCoach);
