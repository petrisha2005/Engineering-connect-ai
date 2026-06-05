import { Router } from "express";
import { askCareerTwinCoach, getCareerTwin, getOpportunities, getReadiness, getRecommendations, getSkills, refreshCareerTwin } from "../controllers/careerTwinController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";

export const careerTwinRoutes = Router();

careerTwinRoutes.use(requireAuth);
careerTwinRoutes.get("/", getCareerTwin);
careerTwinRoutes.get("/readiness", getReadiness);
careerTwinRoutes.get("/skills", getSkills);
careerTwinRoutes.get("/recommendations", getRecommendations);
careerTwinRoutes.get("/opportunities", getOpportunities);
careerTwinRoutes.post("/refresh", aiRateLimit, refreshCareerTwin);
careerTwinRoutes.post("/coach", aiRateLimit, askCareerTwinCoach);
