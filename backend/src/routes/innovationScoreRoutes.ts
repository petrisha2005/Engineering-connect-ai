import { Router } from "express";
import { getInnovationScore, refreshInnovationScore } from "../controllers/innovationScoreController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";

export const innovationScoreRoutes = Router();

innovationScoreRoutes.use(requireAuth);
innovationScoreRoutes.get("/", getInnovationScore);
innovationScoreRoutes.post("/refresh", aiRateLimit, refreshInnovationScore);
