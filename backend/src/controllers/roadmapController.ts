import { StatusCodes } from "http-status-codes";
import type { Request } from "express";
import { Notification } from "../models/Notification.js";
import { Roadmap } from "../models/Roadmap.js";
import { generateAndSaveRoadmap } from "../services/roadmapService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUserId(req: Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user.id;
}

function paramValue(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export const createRoadmap = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const careerGoal = req.body.careerGoal ?? req.body.desiredCareer;

  if (!careerGoal?.trim()) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "CAREER_GOAL_REQUIRED", "Career goal is required");
  }

  const roadmap = await generateAndSaveRoadmap(userId, careerGoal);

  await Notification.create({
    user: userId,
    type: "roadmap_generated",
    title: "Career roadmap generated",
    body: `Your ${roadmap.careerGoal} roadmap is ready`,
    metadata: { roadmap: roadmap._id },
    priority: "normal"
  });

  res.status(StatusCodes.CREATED).json({ success: true, roadmap });
});

export const listRoadmaps = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const limit = Number(req.query.limit ?? 20);
  const roadmaps = await Roadmap.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);

  res.json({ success: true, roadmaps });
});

export const getRoadmapById = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const roadmap = await Roadmap.findOne({ _id: paramValue(req.params.id), user: userId });

  if (!roadmap) throw new HttpError(StatusCodes.NOT_FOUND, "ROADMAP_NOT_FOUND", "Roadmap was not found");

  res.json({ success: true, roadmap });
});
