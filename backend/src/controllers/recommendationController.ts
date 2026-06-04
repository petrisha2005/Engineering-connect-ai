import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { getSkillsToImprove } from "../services/skillRecommendationService.js";

export const getSkillRecommendations = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  }

  const skillsToImprove = await getSkillsToImprove(req.user.id);

  res.status(StatusCodes.OK).json({
    success: true,
    skillsToImprove
  });
});
