import { StatusCodes } from "http-status-codes";
import type { Request } from "express";
import type { SortOrder } from "mongoose";
import { Profile } from "../models/Profile.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function normalizeOptionalUrl(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}

function normalizeOptionalString(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}

function ensureUserId(req: Request) {
  if (!req.user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  }

  return req.user.id;
}

export const getMyProfile = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const profile = await Profile.findOne({ user: userId }).populate("user", "displayName email photoURL");

  if (!profile) {
    throw new HttpError(StatusCodes.NOT_FOUND, "PROFILE_NOT_FOUND", "Profile has not been created yet");
  }

  res.json({ profile });
});

export const upsertMyProfile = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const body = req.body;

  const profile = await Profile.findOneAndUpdate(
    { user: userId },
    {
      ...body,
      github: normalizeOptionalUrl(body.github),
      linkedin: normalizeOptionalUrl(body.linkedin),
      headline: normalizeOptionalString(body.headline),
      bio: normalizeOptionalString(body.bio),
      location: normalizeOptionalString(body.location),
      user: userId
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate("user", "displayName email photoURL");

  await User.findByIdAndUpdate(userId, { profile: profile._id });

  res.status(StatusCodes.OK).json({ profile });
});

export const listProfiles = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const { q, skill, interest, goal, college, availability, page, limit } = req.query as Record<string, string>;

  const filters: Record<string, unknown> = {
    user: { $ne: userId }
  };

  if (q) {
    filters.$text = { $search: q };
  }
  if (skill) {
    filters.skills = skill.toLowerCase();
  }
  if (interest) {
    filters.interests = interest.toLowerCase();
  }
  if (goal) {
    filters.goals = goal.toLowerCase();
  }
  if (college) {
    filters.college = new RegExp(college, "i");
  }
  if (availability) {
    filters.availability = availability;
  }

  const pageNumber = Number(page ?? 1);
  const limitNumber = Number(limit ?? 20);
  const skip = (pageNumber - 1) * limitNumber;
  const sort: Record<string, SortOrder | { $meta: string }> = q ? { score: { $meta: "textScore" } } : { updatedAt: -1 };

  const [profiles, total] = await Promise.all([
    Profile.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .populate("user", "displayName email photoURL"),
    Profile.countDocuments(filters)
  ]);

  res.json({
    profiles,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: Math.ceil(total / limitNumber)
    }
  });
});

export const getProfileById = asyncHandler(async (req, res) => {
  ensureUserId(req);

  const profile = await Profile.findById(req.params.id).populate("user", "displayName email photoURL");

  if (!profile) {
    throw new HttpError(StatusCodes.NOT_FOUND, "PROFILE_NOT_FOUND", "Profile was not found");
  }

  res.json({ profile });
});
