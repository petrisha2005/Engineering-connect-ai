import { Router } from "express";
import { submitFeedback } from "../controllers/feedbackController.js";
import { requireAuth } from "../middleware/auth.js";

export const feedbackRoutes = Router();

feedbackRoutes.use(requireAuth);
feedbackRoutes.post("/", submitFeedback);
