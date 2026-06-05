import { Router } from "express";
import { createGoogleSession, createSession, getCurrentUser, syncFirebaseSession } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/google-session", createGoogleSession);
authRoutes.post("/sync", syncFirebaseSession);
authRoutes.post("/session", requireAuth, createSession);
authRoutes.get("/me", requireAuth, getCurrentUser);
