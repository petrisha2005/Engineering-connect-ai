import { Router } from "express";
import { acceptRequest, createStartupIdea, getCofounderHome, getMatches, rejectRequest, sendRequest, upsertFounderProfile } from "../controllers/cofounderController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";

export const cofounderRoutes = Router();

cofounderRoutes.use(requireAuth);
cofounderRoutes.get("/", getCofounderHome);
cofounderRoutes.post("/profile", upsertFounderProfile);
cofounderRoutes.post("/ideas", createStartupIdea);
cofounderRoutes.get("/matches", aiRateLimit, getMatches);
cofounderRoutes.post("/request", aiRateLimit, sendRequest);
cofounderRoutes.post("/accept", acceptRequest);
cofounderRoutes.post("/reject", rejectRequest);
