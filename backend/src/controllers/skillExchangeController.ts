import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { gemini } from "../config/gemini.js";
import { Notification } from "../models/Notification.js";
import { Profile } from "../models/Profile.js";
import { SkillExchangeProfile } from "../models/SkillExchangeProfile.js";
import { SkillExchangeRequest } from "../models/SkillExchangeRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function objectId(value: unknown) {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_ID", "Invalid id");
  return new Types.ObjectId(value);
}

function normalizeList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function overlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function reputationLevel(points: number) {
  if (points >= 500) return "Expert Mentor";
  if (points >= 250) return "Advanced Mentor";
  if (points >= 100) return "Contributor";
  return "Beginner Mentor";
}

function fallbackPlan(myTeach: string[], myLearn: string[], theirTeach: string[], theirLearn: string[]) {
  const learnFocus = overlap(myLearn, theirTeach)[0] ?? theirTeach[0] ?? "target skill";
  const teachFocus = overlap(myTeach, theirLearn)[0] ?? myTeach[0] ?? "your skill";
  return {
    compatibilityReason: `This is a strong exchange because you can learn ${learnFocus} while helping them with ${teachFocus}.`,
    suggestedExchangePlan: `Week 1: align goals and basics for ${learnFocus}. Week 2: guided practice and examples. Week 3: reverse session on ${teachFocus}. Week 4: build a mini project and review progress.`,
    planWeeks: [
      { week: 1, focus: `${learnFocus} fundamentals`, tasks: ["Set goals", "Share resources", "Complete first practice session"] },
      { week: 2, focus: `${learnFocus} guided practice`, tasks: ["Work through examples", "Ask questions", "Review progress"] },
      { week: 3, focus: `${teachFocus} knowledge exchange`, tasks: ["Teach core concepts", "Pair on exercises", "Document notes"] },
      { week: 4, focus: "Mini project and review", tasks: ["Build a small project", "Share feedback", "Plan next steps"] }
    ]
  };
}

async function aiPlan(myProfile: any, otherProfile: any, score: number) {
  const fallback = fallbackPlan(myProfile.teachSkills, myProfile.learnSkills, otherProfile.teachSkills, otherProfile.learnSkills);
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.25 } });
    const result = await model.generateContent(`
Create a concise professional skill exchange match explanation for engineering students.
Return only JSON:
{"compatibilityReason":"", "suggestedExchangePlan":"", "planWeeks":[{"week":1,"focus":"","tasks":[""]}]}
Score: ${score}
Student A can teach: ${JSON.stringify(myProfile.teachSkills)}
Student A wants to learn: ${JSON.stringify(myProfile.learnSkills)}
Student B can teach: ${JSON.stringify(otherProfile.teachSkills)}
Student B wants to learn: ${JSON.stringify(otherProfile.learnSkills)}
`);
    const parsed = JSON.parse(result.response.text()) as Partial<typeof fallback>;
    return {
      compatibilityReason: parsed.compatibilityReason || fallback.compatibilityReason,
      suggestedExchangePlan: parsed.suggestedExchangePlan || fallback.suggestedExchangePlan,
      planWeeks: Array.isArray(parsed.planWeeks) && parsed.planWeeks.length ? parsed.planWeeks.slice(0, 6) : fallback.planWeeks
    };
  } catch {
    return fallback;
  }
}

async function scoreMatch(myProfile: any, otherProfile: any) {
  const iLearnTheyTeach = overlap(myProfile.learnSkills, otherProfile.teachSkills);
  const iTeachTheyLearn = overlap(myProfile.teachSkills, otherProfile.learnSkills);
  const availabilityBonus = myProfile.availability === otherProfile.availability ? 8 : 0;
  const modeBonus = myProfile.preferredLearningMode === otherProfile.preferredLearningMode ? 6 : 0;
  const base = 35 + Math.min(iLearnTheyTeach.length * 18, 36) + Math.min(iTeachTheyLearn.length * 18, 36) + availabilityBonus + modeBonus;
  const score = Math.max(30, Math.min(98, Math.round(base)));
  const ai = await aiPlan(myProfile, otherProfile, score);
  return { matchScore: score, mutualTeach: iTeachTheyLearn, mutualLearn: iLearnTheyTeach, ...ai };
}

async function populateExchangeProfile(query: any) {
  return query.populate({ path: "userId", select: "displayName email photoURL profile", populate: { path: "profile" } });
}

async function populateRequest(query: any) {
  return query
    .populate("requester", "displayName email photoURL profile")
    .populate("recipient", "displayName email photoURL profile")
    .populate("requesterProfile")
    .populate("recipientProfile");
}

export const getProfile = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const profile = await populateExchangeProfile(SkillExchangeProfile.findOne({ userId: user.id }));
  res.json({ success: true, profile });
});

export const upsertProfile = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const payload = {
    userId: user.id,
    teachSkills: normalizeList(req.body.teachSkills),
    learnSkills: normalizeList(req.body.learnSkills),
    experienceLevel: req.body.experienceLevel || "beginner",
    availability: req.body.availability || "flexible",
    preferredLearningMode: req.body.preferredLearningMode || "online",
    headline: typeof req.body.headline === "string" ? req.body.headline.trim() : ""
  };
  if (!payload.teachSkills.length || !payload.learnSkills.length) throw new HttpError(StatusCodes.BAD_REQUEST, "SKILLS_REQUIRED", "Add skills you can teach and want to learn.");

  const profile = await populateExchangeProfile(
    SkillExchangeProfile.findOneAndUpdate({ userId: user.id }, payload, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true })
  );
  res.json({ success: true, profile });
});

export const getMatches = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const myProfile = await SkillExchangeProfile.findOne({ userId: user.id });
  if (!myProfile) return res.json({ success: true, matches: [] });

  const [others, requests] = await Promise.all([
    populateExchangeProfile(SkillExchangeProfile.find({ userId: { $ne: user.id } }).sort({ updatedAt: -1 }).limit(60)),
    SkillExchangeRequest.find({ $or: [{ requester: user.id }, { recipient: user.id }] })
  ]);
  const requestByUser = new Map(requests.map((request) => [String(request.requester) === String(user.id) ? String(request.recipient) : String(request.requester), request]));

  const matches = await Promise.all(
    others.map(async (profile: any) => {
      const score = await scoreMatch(myProfile, profile);
      const request = requestByUser.get(String(profile.userId?._id ?? profile.userId));
      return { profile, request, state: request?.status ?? "none", ...score };
    })
  );

  res.json({ success: true, matches: matches.sort((left, right) => right.matchScore - left.matchScore) });
});

export const sendRequest = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const recipientProfileId = objectId(req.body.recipientProfileId);
  const [myProfile, recipientProfile] = await Promise.all([
    SkillExchangeProfile.findOne({ userId: user.id }),
    SkillExchangeProfile.findById(recipientProfileId)
  ]);
  if (!myProfile) throw new HttpError(StatusCodes.BAD_REQUEST, "PROFILE_REQUIRED", "Create your skill exchange profile first.");
  if (!recipientProfile) throw new HttpError(StatusCodes.NOT_FOUND, "PROFILE_NOT_FOUND", "Skill exchange profile was not found.");
  if (String(recipientProfile.userId) === String(user.id)) throw new HttpError(StatusCodes.BAD_REQUEST, "SELF_REQUEST", "You cannot request yourself.");

  const match = await scoreMatch(myProfile, recipientProfile);
  const existing = await SkillExchangeRequest.findOne({ requester: user.id, recipient: recipientProfile.userId });
  if (existing && existing.status !== "rejected" && existing.status !== "cancelled") {
    return res.json({ success: true, request: existing, state: existing.status });
  }

  const request = existing
    ? await SkillExchangeRequest.findByIdAndUpdate(
        existing._id,
        { requesterProfile: myProfile._id, recipientProfile: recipientProfile._id, status: "pending", ...match, decidedAt: null },
        { new: true, runValidators: true }
      )
    : await SkillExchangeRequest.create({ requester: user.id, recipient: recipientProfile.userId, requesterProfile: myProfile._id, recipientProfile: recipientProfile._id, ...match });

  await Notification.create({
    user: recipientProfile.userId,
    type: "skill_exchange_request",
    title: "New skill exchange request",
    body: `${user.displayName} wants to exchange skills with you.`,
    metadata: { skillExchangeRequestId: request?._id, requesterId: user.id },
    priority: "high"
  });

  res.status(StatusCodes.CREATED).json({ success: true, request, state: "pending" });
});

async function decideRequest(req: any, status: "accepted" | "rejected") {
  const user = ensureUser(req);
  const request = await SkillExchangeRequest.findById(objectId(req.body.requestId));
  if (!request) throw new HttpError(StatusCodes.NOT_FOUND, "REQUEST_NOT_FOUND", "Skill exchange request was not found.");
  if (String(request.recipient) !== String(user.id)) throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "Only the recipient can decide this request.");
  request.status = status;
  request.decidedAt = new Date();
  await request.save();
  await Notification.create({
    user: request.requester,
    type: status === "accepted" ? "skill_exchange_accepted" : "skill_exchange_rejected",
    title: status === "accepted" ? "Skill exchange accepted" : "Skill exchange rejected",
    body: `${user.displayName} ${status === "accepted" ? "accepted" : "rejected"} your skill exchange request.`,
    metadata: { skillExchangeRequestId: request._id, recipientId: user.id },
    priority: "high"
  });
  return request;
}

export const acceptRequest = asyncHandler(async (req, res) => {
  res.json({ success: true, request: await decideRequest(req, "accepted"), state: "accepted" });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  res.json({ success: true, request: await decideRequest(req, "rejected"), state: "rejected" });
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const request = await SkillExchangeRequest.findById(objectId(req.body.requestId));
  if (!request) throw new HttpError(StatusCodes.NOT_FOUND, "REQUEST_NOT_FOUND", "Skill exchange request was not found.");
  if (String(request.requester) !== String(user.id)) throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "Only the requester can cancel this request.");
  request.status = "cancelled";
  await request.save();
  res.json({ success: true, request, state: "cancelled" });
});

export const completeRequest = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const request = await SkillExchangeRequest.findById(objectId(req.body.requestId));
  if (!request) throw new HttpError(StatusCodes.NOT_FOUND, "REQUEST_NOT_FOUND", "Skill exchange request was not found.");
  if (request.status !== "accepted") throw new HttpError(StatusCodes.BAD_REQUEST, "NOT_ACCEPTED", "Only accepted exchanges can be completed.");
  const isRequester = String(request.requester) === String(user.id);
  const isRecipient = String(request.recipient) === String(user.id);
  if (!isRequester && !isRecipient) throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not part of this exchange.");
  const rating = Math.max(1, Math.min(5, Number(req.body.rating || 5)));
  if (isRequester) {
    request.requesterRating = rating;
    request.requesterFeedback = typeof req.body.feedback === "string" ? req.body.feedback.trim() : "";
  } else {
    request.recipientRating = rating;
    request.recipientFeedback = typeof req.body.feedback === "string" ? req.body.feedback.trim() : "";
  }
  request.status = "completed";
  request.completedAt = new Date();
  await request.save();
  const participantIds = [request.requester, request.recipient];
  await SkillExchangeProfile.updateMany({ userId: { $in: participantIds } }, { $inc: { completedExchanges: 1, reputationPoints: 60 } });
  await Notification.create({
    user: isRequester ? request.recipient : request.requester,
    type: "skill_exchange_completed",
    title: "Skill exchange completed",
    body: `${user.displayName} marked your skill exchange as completed.`,
    metadata: { skillExchangeRequestId: request._id },
    priority: "normal"
  });
  res.json({ success: true, request, state: "completed" });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const [profile, requests, studentProfile] = await Promise.all([
    SkillExchangeProfile.findOne({ userId: user.id }),
    populateRequest(SkillExchangeRequest.find({ $or: [{ requester: user.id }, { recipient: user.id }] }).sort({ updatedAt: -1 })),
    Profile.findOne({ user: user.id })
  ]);
  const active = requests.filter((request: any) => request.status === "accepted");
  const pending = requests.filter((request: any) => request.status === "pending");
  const completed = requests.filter((request: any) => request.status === "completed");
  const skillsTaught = profile?.teachSkills ?? [];
  const skillsLearned = profile?.learnSkills ?? [];
  const points = profile?.reputationPoints ?? 0;
  res.json({
    success: true,
    profile,
    requests,
    summary: {
      activeExchanges: active.length,
      pendingRequests: pending.length,
      completedExchanges: completed.length,
      skillsLearned,
      skillsTaught,
      reputationPoints: points,
      reputationLevel: reputationLevel(points),
      profileSkills: studentProfile?.skills ?? []
    }
  });
});
