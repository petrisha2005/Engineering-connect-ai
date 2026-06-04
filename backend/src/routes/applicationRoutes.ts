import { Router } from "express";
import { decideApplication, listMyApplications, listReceivedApplications } from "../controllers/applicationController.js";
import { requireAuth } from "../middleware/auth.js";

export const applicationRoutes = Router();

applicationRoutes.use(requireAuth);
applicationRoutes.get("/my-applications", listMyApplications);
applicationRoutes.get("/received", listReceivedApplications);
applicationRoutes.post("/:applicationId/accept", decideApplication);
applicationRoutes.post("/:applicationId/reject", decideApplication);
