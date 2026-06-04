import type { Types } from "mongoose";
import { Match } from "../models/Match.js";
import { Profile } from "../models/Profile.js";

interface ProfileLike {
  user: Types.ObjectId;
  name: string;
  college: string;
  branch: string;
  year: number;
  skills: string[];
  interests: string[];
  goals: string[];
  availability: "open" | "selective" | "unavailable";
}

interface ScoreResult {
  matchScore: number;
  compatibilityScore: number;
  reasons: string[];
  sharedSkills: string[];
  sharedInterests: string[];
  sharedGoals: string[];
}

function intersection(left: string[] = [], right: string[] = []) {
  const rightSet = new Set(right.map((value) => value.toLowerCase()));
  return [...new Set(left.map((value) => value.toLowerCase()).filter((value) => rightSet.has(value)))];
}

function ratio(shared: string[], left: string[], right: string[]) {
  const denominator = Math.max(new Set([...left, ...right]).size, 1);
  return shared.length / denominator;
}

function availabilityBonus(availability: ProfileLike["availability"]) {
  if (availability === "open") return 8;
  if (availability === "selective") return 4;
  return 0;
}

function buildReasons(source: ProfileLike, target: ProfileLike, sharedSkills: string[], sharedInterests: string[], sharedGoals: string[]) {
  const reasons: string[] = [];

  if (sharedSkills.length) {
    reasons.push(`Shared technical skills: ${sharedSkills.slice(0, 5).join(", ")}`);
  }
  if (sharedInterests.length) {
    reasons.push(`Common interests: ${sharedInterests.slice(0, 5).join(", ")}`);
  }
  if (sharedGoals.length) {
    reasons.push(`Aligned career goals: ${sharedGoals.slice(0, 4).join(", ")}`);
  }
  if (source.branch.toLowerCase() === target.branch.toLowerCase()) {
    reasons.push(`Both are in ${target.branch}`);
  }
  if (source.college.toLowerCase() === target.college.toLowerCase()) {
    reasons.push(`Same college network: ${target.college}`);
  }
  if (target.availability === "open") {
    reasons.push(`${target.name} is open to collaboration`);
  }

  return reasons.length ? reasons.slice(0, 10) : ["Profile has enough complementary context to explore a connection"];
}

export function scoreProfiles(source: ProfileLike, target: ProfileLike): ScoreResult {
  const sharedSkills = intersection(source.skills, target.skills);
  const sharedInterests = intersection(source.interests, target.interests);
  const sharedGoals = intersection(source.goals, target.goals);

  const skillScore = ratio(sharedSkills, source.skills, target.skills) * 42;
  const interestScore = ratio(sharedInterests, source.interests, target.interests) * 24;
  const goalScore = ratio(sharedGoals, source.goals, target.goals) * 22;
  const branchScore = source.branch.toLowerCase() === target.branch.toLowerCase() ? 4 : 0;
  const collegeScore = source.college.toLowerCase() === target.college.toLowerCase() ? 4 : 0;
  const yearScore = Math.max(0, 4 - Math.abs(source.year - target.year));
  const rawMatch = skillScore + interestScore + goalScore + branchScore + collegeScore + yearScore + availabilityBonus(target.availability);
  const matchScore = Math.min(100, Math.round(rawMatch));

  const compatibilityScore = Math.min(
    100,
    Math.round(matchScore * 0.72 + (sharedGoals.length > 0 ? 12 : 0) + (sharedInterests.length > 0 ? 8 : 0) + availabilityBonus(target.availability))
  );

  return {
    matchScore,
    compatibilityScore,
    reasons: buildReasons(source, target, sharedSkills, sharedInterests, sharedGoals),
    sharedSkills,
    sharedInterests,
    sharedGoals
  };
}

export async function generateMatchesForUser(userId: Types.ObjectId, limit = 25) {
  const source = await Profile.findOne({ user: userId }).lean<ProfileLike>();

  if (!source) {
    return { sourceProfileFound: false, matches: [] };
  }

  const candidates = await Profile.find({
    user: { $ne: userId },
    availability: { $ne: "unavailable" },
    $or: [
      { skills: { $in: source.skills } },
      { interests: { $in: source.interests } },
      { goals: { $in: source.goals } },
      { branch: source.branch },
      { college: source.college }
    ]
  })
    .limit(200)
    .lean<ProfileLike[]>();

  const scored = candidates
    .map((target) => ({
      target,
      score: scoreProfiles(source, target)
    }))
    .filter(({ score }) => score.matchScore > 0)
    .sort((a, b) => b.score.matchScore - a.score.matchScore)
    .slice(0, limit);

  const matches = await Promise.all(
    scored.map(({ target, score }) =>
      Match.findOneAndUpdate(
        { sourceUser: userId, targetUser: target.user },
        {
          sourceUser: userId,
          targetUser: target.user,
          ...score,
          generatedBy: "algorithm"
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).populate({
        path: "targetUser",
        select: "displayName email photoURL profile",
        populate: {
          path: "profile",
          select: "name college branch year skills interests goals availability headline location"
        }
      })
    )
  );

  return { sourceProfileFound: true, matches };
}

export async function getRecommendedMatches(userId: Types.ObjectId, limit = 20) {
  return Match.find({ sourceUser: userId })
    .sort({ matchScore: -1, compatibilityScore: -1, updatedAt: -1 })
    .limit(limit)
    .populate({
      path: "targetUser",
      select: "displayName email photoURL profile",
      populate: {
        path: "profile",
        select: "name college branch year skills interests goals availability headline location"
      }
    });
}

