import { Router } from "express";
import {
  applyToHackathonTeam,
  createHackathonTeam,
  decideHackathonTeamApplication,
  getHackathonTeamById,
  listHackathonTeams,
  suggestHackathonTeamRoles
} from "../controllers/hackathonTeamController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";
import {
  applyHackathonTeamSchema,
  createHackathonTeamSchema,
  decisionHackathonTeamSchema,
  hackathonTeamIdSchema,
  listHackathonTeamsSchema,
  suggestionHackathonTeamSchema
} from "../validators/hackathonTeamValidators.js";

export const hackathonTeamRoutes = Router();

hackathonTeamRoutes.use(requireAuth);
hackathonTeamRoutes.post("/", validate(createHackathonTeamSchema), createHackathonTeam);
hackathonTeamRoutes.get("/", validate(listHackathonTeamsSchema), listHackathonTeams);
hackathonTeamRoutes.get("/:id", validate(hackathonTeamIdSchema), getHackathonTeamById);
hackathonTeamRoutes.post("/:id/apply", validate(applyHackathonTeamSchema), applyToHackathonTeam);
hackathonTeamRoutes.post("/:id/applications/:applicationId/decision", validate(decisionHackathonTeamSchema), decideHackathonTeamApplication);
hackathonTeamRoutes.post("/:id/suggestions", aiRateLimit, validate(suggestionHackathonTeamSchema), suggestHackathonTeamRoles);

