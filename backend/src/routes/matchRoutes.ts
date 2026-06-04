import { Router } from "express";
import { generateMatches, getRecommended } from "../controllers/matchController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";
import { generateMatchesSchema, listMatchesSchema } from "../validators/matchValidators.js";

export const matchRoutes = Router();

matchRoutes.use(requireAuth);
matchRoutes.post("/generate", aiRateLimit, validate(generateMatchesSchema), generateMatches);
matchRoutes.get("/recommended", validate(listMatchesSchema), getRecommended);

