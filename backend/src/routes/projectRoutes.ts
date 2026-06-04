import { Router } from "express";
import {
  applyToProject,
  createProject,
  decideProjectApplication,
  getProjectById,
  inviteToProject,
  listProjects
} from "../controllers/projectController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  applyProjectSchema,
  createProjectSchema,
  decisionProjectSchema,
  inviteProjectSchema,
  listProjectsSchema,
  projectIdSchema
} from "../validators/projectValidators.js";

export const projectRoutes = Router();

projectRoutes.use(requireAuth);
projectRoutes.post("/", validate(createProjectSchema), createProject);
projectRoutes.get("/", validate(listProjectsSchema), listProjects);
projectRoutes.get("/:id", validate(projectIdSchema), getProjectById);
projectRoutes.post("/:id/apply", validate(applyProjectSchema), applyToProject);
projectRoutes.post("/:id/invite", validate(inviteProjectSchema), inviteToProject);
projectRoutes.post("/:id/applications/:applicationId/decision", validate(decisionProjectSchema), decideProjectApplication);

