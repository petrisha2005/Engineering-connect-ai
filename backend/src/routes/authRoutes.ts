import { Router } from "express";
import { createGoogleSession, createSession, getCurrentUser } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/google-session", createGoogleSession);
authRoutes.post("/session", requireAuth, createSession);
authRoutes.get("/me", requireAuth, getCurrentUser);
