import { Router } from "express";
import {
  acceptHackathonTeamApplication,
  applyToHackathonTeam,
  acceptHackathonInvite,
  createHackathonTeam,
  deleteHackathonTeam,
  decideHackathonTeamApplication,
  getHackathonAnalysis,
  getHackathonRecommendations,
  getHackathonTeamById,
  inviteHackathonTeammate,
  listHackathonTeams,
  rejectHackathonInvite,
  rejectHackathonTeamApplication,
  suggestHackathonTeamRoles,
  updateHackathonTeam
} from "../controllers/hackathonTeamController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";
import {
  applyHackathonTeamSchema,
  createHackathonTeamSchema,
  decisionHackathonTeamSchema,
  hackathonTeamIdSchema,
  inviteHackathonTeamSchema,
  listHackathonTeamsSchema,
  suggestionHackathonTeamSchema
} from "../validators/hackathonTeamValidators.js";

export const hackathonTeamRoutes = Router();

hackathonTeamRoutes.use(requireAuth);
hackathonTeamRoutes.post("/", validate(createHackathonTeamSchema), createHackathonTeam);
hackathonTeamRoutes.get("/", validate(listHackathonTeamsSchema), listHackathonTeams);
hackathonTeamRoutes.get("/:id", validate(hackathonTeamIdSchema), getHackathonTeamById);
hackathonTeamRoutes.put("/:id", validate(hackathonTeamIdSchema), updateHackathonTeam);
hackathonTeamRoutes.delete("/:id", validate(hackathonTeamIdSchema), deleteHackathonTeam);
hackathonTeamRoutes.get("/:id/recommendations", validate(hackathonTeamIdSchema), getHackathonRecommendations);
hackathonTeamRoutes.get("/:id/analysis", validate(hackathonTeamIdSchema), getHackathonAnalysis);
hackathonTeamRoutes.post("/:id/apply", validate(applyHackathonTeamSchema), applyToHackathonTeam);
hackathonTeamRoutes.post("/:id/invite/:userId", validate(inviteHackathonTeamSchema), inviteHackathonTeammate);
hackathonTeamRoutes.post("/:id/accept-invite", validate(hackathonTeamIdSchema), acceptHackathonInvite);
hackathonTeamRoutes.post("/:id/reject-invite", validate(hackathonTeamIdSchema), rejectHackathonInvite);
hackathonTeamRoutes.post("/:id/applications/:applicationId/decision", validate(decisionHackathonTeamSchema), decideHackathonTeamApplication);
hackathonTeamRoutes.post("/:id/accept-application/:applicationId", acceptHackathonTeamApplication);
hackathonTeamRoutes.post("/:id/reject-application/:applicationId", rejectHackathonTeamApplication);
hackathonTeamRoutes.post("/:id/suggestions", aiRateLimit, validate(suggestionHackathonTeamSchema), suggestHackathonTeamRoles);
