import { Router } from "express";
import { askResearchAssistant, createFacultyMentor, createResearchProject, generateResearchTopics, getResearchHub, requestResearchCollaboration, upsertResearchProfile } from "../controllers/researchHubController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";

export const researchHubRoutes = Router();

researchHubRoutes.use(requireAuth);
researchHubRoutes.get("/", getResearchHub);
researchHubRoutes.post("/profile", upsertResearchProfile);
researchHubRoutes.post("/projects", createResearchProject);
researchHubRoutes.post("/faculty-mentors", createFacultyMentor);
researchHubRoutes.post("/requests", requestResearchCollaboration);
researchHubRoutes.post("/topics", aiRateLimit, generateResearchTopics);
researchHubRoutes.post("/assistant", aiRateLimit, askResearchAssistant);
