import { Router } from "express";
import { generatePortfolio, getMyPortfolio, getPortfolioAnalytics, getPublicPortfolio, trackPortfolioEvent, updatePortfolio } from "../controllers/portfolioController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";

export const portfolioRoutes = Router();

portfolioRoutes.get("/", requireAuth, getMyPortfolio);
portfolioRoutes.post("/generate", requireAuth, aiRateLimit, generatePortfolio);
portfolioRoutes.put("/update", requireAuth, updatePortfolio);
portfolioRoutes.get("/analytics", requireAuth, getPortfolioAnalytics);
portfolioRoutes.get("/:username", getPublicPortfolio);
portfolioRoutes.post("/:username/track", trackPortfolioEvent);
