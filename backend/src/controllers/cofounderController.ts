import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { gemini } from "../config/gemini.js";
import { FounderProfile } from "../models/FounderProfile.js";
import { FounderRequest } from "../models/FounderRequest.js";
import { Notification } from "../models/Notification.js";
import { StartupIdea } from "../models/StartupIdea.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function normalizeList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function objectId(value: unknown) {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_ID", "Invalid id");
  return new Types.ObjectId(value);
}

function overlap(left: string[] = [], right: string[] = []) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function complementaryFounderType(myType: string, otherType: string) {
  if (myType === otherType) return 4;
  if (/Technical/.test(myType) && /Business|Marketing|Product/.test(otherType)) return 20;
  if (/Business|Marketing/.test(myType) && /Technical|Product/.test(otherType)) return 20;
  if (/Product/.test(myType) && /Technical|Business|Marketing/.test(otherType)) return 18;
  return 12;
}

async function aiCompatibility(myProfile: any, otherProfile: any, score: number) {
  const sharedIndustries = overlap(myProfile.industries, otherProfile.industries);
  const sharedInterests = overlap(myProfile.startupInterests, otherProfile.startupInterests);
  const fallback = {
    compatibilityReason: `Strong founder fit with ${sharedIndustries.length ? `${sharedIndustries.join(", ")} industry alignment` : "complementary founder strengths"}.`,
    suggestedRole: otherProfile.founderType,
    risks: myProfile.commitmentLevel !== otherProfile.commitmentLevel ? ["Commitment level needs alignment"] : ["Validate working style before committing"],
    strengths: [
      myProfile.founderType !== otherProfile.founderType ? "Complementary founder roles" : "Shared founder direction",
      sharedInterests.length ? `Shared interests: ${sharedInterests.slice(0, 3).join(", ")}` : "Potential startup collaboration fit"
    ]
  };
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.25 } });
    const result = await model.generateContent(`
You are an expert startup co-founder matching strategist.
Use only this real founder profile data. Do not invent experience.
Return JSON only: {"compatibilityReason":"","suggestedRole":"","risks":[],"strengths":[]}
Match score: ${score}
Founder A: ${JSON.stringify({ type: myProfile.founderType, skills: myProfile.skills, interests: myProfile.startupInterests, industries: myProfile.industries, commitment: myProfile.commitmentLevel, goals: myProfile.goals })}
Founder B: ${JSON.stringify({ type: otherProfile.founderType, skills: otherProfile.skills, interests: otherProfile.startupInterests, industries: otherProfile.industries, commitment: otherProfile.commitmentLevel, goals: otherProfile.goals })}
`);
    return { ...fallback, ...(JSON.parse(result.response.text()) as Partial<typeof fallback>) };
  } catch {
    return fallback;
  }
}

async function scoreMatch(myProfile: any, otherProfile: any) {
  const sharedIndustries = overlap(myProfile.industries, otherProfile.industries);
  const sharedInterests = overlap(myProfile.startupInterests, otherProfile.startupInterests);
  const sharedGoals = overlap(myProfile.goals, otherProfile.goals);
  const skillOverlap = overlap(myProfile.skills, otherProfile.skills);
  const roleScore = complementaryFounderType(myProfile.founderType, otherProfile.founderType);
  const commitmentScore = myProfile.commitmentLevel === otherProfile.commitmentLevel ? 15 : 6;
  const availabilityScore = myProfile.availability === otherProfile.availability ? 8 : 3;
  const stageScore = myProfile.startupStage === otherProfile.startupStage ? 8 : 4;
  const matchScore = Math.max(35, Math.min(98, Math.round(35 + roleScore + sharedIndustries.length * 8 + sharedInterests.length * 6 + sharedGoals.length * 4 + Math.min(skillOverlap.length * 2, 8) + commitmentScore + availabilityScore + stageScore)));
  const ai = await aiCompatibility(myProfile, otherProfile, matchScore);
  return {
    matchScore,
    visionAlignment: Math.min(100, 45 + sharedInterests.length * 12 + sharedGoals.length * 10 + sharedIndustries.length * 8),
    skillComplementarity: Math.min(100, 50 + roleScore * 2),
    commitmentCompatibility: myProfile.commitmentLevel === otherProfile.commitmentLevel ? 92 : 62,
    experienceMatch: Math.min(100, 55 + stageScore * 4),
    leadershipBalance: Math.min(100, 50 + roleScore * 2),
    ...ai
  };
}

async function populateProfile(query: any) {
  return query.populate("userId", "displayName email photoURL profile");
}

async function populateRequest(query: any) {
  return query.populate("requester", "displayName email photoURL profile").populate("recipient", "displayName email photoURL profile").populate("requesterProfile").populate("recipientProfile").populate("startupIdea");
}

function readiness(profile: any, ideas: any[]) {
  const startupReadiness = Math.min(100, 35 + ideas.length * 18 + (profile?.startupStage === "mvp" ? 20 : profile?.startupStage === "prototype" ? 12 : 0));
  const executionReadiness = Math.min(100, 30 + (profile?.skills?.length ?? 0) * 6 + (profile?.commitmentLevel === "full_time" ? 20 : profile?.commitmentLevel === "high" ? 14 : 6));
  const teamReadiness = Math.min(100, 35 + (profile?.founderType ? 20 : 0) + (profile?.goals?.length ?? 0) * 5);
  const marketReadiness = Math.min(100, 30 + (profile?.industries?.length ?? 0) * 12 + ideas.filter((idea) => idea.targetUsers).length * 10);
  return { startupReadiness, executionReadiness, teamReadiness, marketReadiness };
}

export const getCofounderHome = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const [profile, ideas, requests] = await Promise.all([
    populateProfile(FounderProfile.findOne({ userId: user.id })),
    StartupIdea.find({ owner: user.id }).sort({ createdAt: -1 }),
    populateRequest(FounderRequest.find({ $or: [{ requester: user.id }, { recipient: user.id }] }).sort({ updatedAt: -1 }))
  ]);
  res.json({ success: true, profile, ideas, requests, readiness: readiness(profile, ideas) });
});

export const upsertFounderProfile = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const payload = {
    userId: user.id,
    startupInterests: normalizeList(req.body.startupInterests),
    industries: normalizeList(req.body.industries),
    founderType: req.body.founderType,
    skills: normalizeList(req.body.skills),
    goals: normalizeList(req.body.goals),
    commitmentLevel: req.body.commitmentLevel ?? "medium",
    startupStage: req.body.startupStage ?? "idea",
    preferredLocation: typeof req.body.preferredLocation === "string" ? req.body.preferredLocation.trim() : "",
    availability: req.body.availability ?? "flexible",
    linkedProjects: Array.isArray(req.body.linkedProjects) ? req.body.linkedProjects.filter((id: string) => Types.ObjectId.isValid(id)) : [],
    bio: typeof req.body.bio === "string" ? req.body.bio.trim() : ""
  };
  if (!payload.founderType || !payload.skills.length || !payload.industries.length) throw new HttpError(StatusCodes.BAD_REQUEST, "PROFILE_REQUIRED", "Founder type, skills, and industries are required.");
  const profile = await populateProfile(FounderProfile.findOneAndUpdate({ userId: user.id }, payload, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }));
  res.json({ success: true, profile });
});

export const createStartupIdea = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const idea = await StartupIdea.create({
    owner: user.id,
    startupName: req.body.startupName,
    industry: req.body.industry,
    problemStatement: req.body.problemStatement,
    targetUsers: req.body.targetUsers,
    currentStage: req.body.currentStage ?? "idea",
    fundingStatus: req.body.fundingStatus ?? "bootstrapped",
    requiredRoles: normalizeList(req.body.requiredRoles),
    description: typeof req.body.description === "string" ? req.body.description.trim() : ""
  });
  res.status(StatusCodes.CREATED).json({ success: true, idea });
});

export const getMatches = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const myProfile = await FounderProfile.findOne({ userId: user.id });
  if (!myProfile) return res.json({ success: true, matches: [] });
  const [profiles, requests] = await Promise.all([
    populateProfile(FounderProfile.find({ userId: { $ne: user.id } }).sort({ updatedAt: -1 }).limit(80)),
    FounderRequest.find({ $or: [{ requester: user.id }, { recipient: user.id }] })
  ]);
  const requestByUser = new Map(requests.map((request) => [String(request.requester) === String(user.id) ? String(request.recipient) : String(request.requester), request]));
  const matches = await Promise.all(profiles.map(async (profile: any) => {
    const match = await scoreMatch(myProfile, profile);
    const request = requestByUser.get(String(profile.userId?._id ?? profile.userId));
    return { profile, request, state: request?.status ?? "none", ...match };
  }));
  res.json({ success: true, matches: matches.sort((a, b) => b.matchScore - a.matchScore) });
});

export const sendRequest = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const recipientProfileId = objectId(req.body.recipientProfileId);
  const [myProfile, recipientProfile, idea] = await Promise.all([
    FounderProfile.findOne({ userId: user.id }),
    FounderProfile.findById(recipientProfileId),
    req.body.startupIdeaId ? StartupIdea.findOne({ _id: objectId(req.body.startupIdeaId), owner: user.id }) : null
  ]);
  if (!myProfile) throw new HttpError(StatusCodes.BAD_REQUEST, "PROFILE_REQUIRED", "Create your founder profile first.");
  if (!recipientProfile) throw new HttpError(StatusCodes.NOT_FOUND, "FOUNDER_NOT_FOUND", "Founder profile was not found.");
  if (String(recipientProfile.userId) === String(user.id)) throw new HttpError(StatusCodes.BAD_REQUEST, "SELF_REQUEST", "You cannot request yourself.");
  const match = await scoreMatch(myProfile, recipientProfile);
  const request = await FounderRequest.findOneAndUpdate(
    { requester: user.id, recipient: recipientProfile.userId },
    { requester: user.id, recipient: recipientProfile.userId, requesterProfile: myProfile._id, recipientProfile: recipientProfile._id, startupIdea: idea?._id, status: "pending", ...match, decidedAt: null },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await Notification.create({ user: recipientProfile.userId, type: "founder_request", title: "New co-founder request", body: `${user.displayName} wants to connect as a potential co-founder.`, metadata: { founderRequestId: request._id, requesterId: user.id }, priority: "high" });
  res.status(StatusCodes.CREATED).json({ success: true, request, state: "pending" });
});

async function decide(req: any, status: "accepted" | "rejected") {
  const user = ensureUser(req);
  const request = await FounderRequest.findById(objectId(req.body.requestId));
  if (!request) throw new HttpError(StatusCodes.NOT_FOUND, "REQUEST_NOT_FOUND", "Founder request was not found.");
  if (String(request.recipient) !== String(user.id)) throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "Only the recipient can decide this request.");
  request.status = status;
  request.decidedAt = new Date();
  await request.save();
  await Notification.create({ user: request.requester, type: status === "accepted" ? "founder_request_accepted" : "founder_request_rejected", title: status === "accepted" ? "Co-founder request accepted" : "Co-founder request rejected", body: `${user.displayName} ${status === "accepted" ? "accepted" : "rejected"} your co-founder request.`, metadata: { founderRequestId: request._id, recipientId: user.id }, priority: "high" });
  return request;
}

export const acceptRequest = asyncHandler(async (req, res) => {
  res.json({ success: true, request: await decide(req, "accepted"), state: "accepted" });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  res.json({ success: true, request: await decide(req, "rejected"), state: "rejected" });
});
