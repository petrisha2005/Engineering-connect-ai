import { Router } from "express";
import {
  acceptRequest,
  cancelRequest,
  completeRequest,
  getDashboard,
  getMatches,
  getProfile,
  rejectRequest,
  sendRequest,
  upsertProfile
} from "../controllers/skillExchangeController.js";
import { requireAuth } from "../middleware/auth.js";

export const skillExchangeRoutes = Router();

skillExchangeRoutes.use(requireAuth);
skillExchangeRoutes.post("/profile", upsertProfile);
skillExchangeRoutes.get("/profile", getProfile);
skillExchangeRoutes.get("/matches", getMatches);
skillExchangeRoutes.post("/request", sendRequest);
skillExchangeRoutes.post("/accept", acceptRequest);
skillExchangeRoutes.post("/reject", rejectRequest);
skillExchangeRoutes.post("/cancel", cancelRequest);
skillExchangeRoutes.post("/complete", completeRequest);
skillExchangeRoutes.get("/dashboard", getDashboard);
