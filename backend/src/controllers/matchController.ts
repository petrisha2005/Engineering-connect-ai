import { StatusCodes } from "http-status-codes";
import type { Request } from "express";
import { generateMatchesForUser, getRecommendedMatches } from "../services/matchingService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUserId(req: Request) {
  if (!req.user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  }

  return req.user.id;
}

export const generateMatches = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const limit = Number(req.body.limit ?? 25);
  const result = await generateMatchesForUser(userId, limit);

  if (!result.sourceProfileFound) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "PROFILE_REQUIRED", "Create your profile before generating matches");
  }

  res.status(StatusCodes.OK).json({ matches: result.matches });
});

export const getRecommended = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const limit = Number(req.query.limit ?? 20);
  const matches = await getRecommendedMatches(userId, limit);

  res.json({ matches });
});

