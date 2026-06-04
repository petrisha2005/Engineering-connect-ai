import { Router } from "express";
import { getMyProfile, getProfileById, listProfiles, upsertMyProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listProfilesSchema, profileIdSchema, upsertProfileSchema } from "../validators/profileValidators.js";

export const profileRoutes = Router();

profileRoutes.use(requireAuth);
profileRoutes.get("/me", getMyProfile);
profileRoutes.put("/me", validate(upsertProfileSchema), upsertMyProfile);
profileRoutes.get("/", validate(listProfilesSchema), listProfiles);
profileRoutes.get("/:id", validate(profileIdSchema), getProfileById);

