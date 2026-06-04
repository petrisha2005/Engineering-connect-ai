import { Router } from "express";
import { createRoadmap, getRoadmapById, listRoadmaps } from "../controllers/roadmapController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";
import { createRoadmapSchema, generateRoadmapSchema, listRoadmapsSchema, roadmapIdSchema } from "../validators/roadmapValidators.js";

export const roadmapRoutes = Router();

roadmapRoutes.use(requireAuth);
roadmapRoutes.post("/generate", aiRateLimit, validate(generateRoadmapSchema), createRoadmap);
roadmapRoutes.get("/my-roadmaps", validate(listRoadmapsSchema), listRoadmaps);
roadmapRoutes.post("/", aiRateLimit, validate(createRoadmapSchema), createRoadmap);
roadmapRoutes.get("/", validate(listRoadmapsSchema), listRoadmaps);
roadmapRoutes.get("/:id", validate(roadmapIdSchema), getRoadmapById);
