import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { Mentor } from "../models/Mentor.js";
import { MentorRequest } from "../models/MentorRequest.js";
import { Notification } from "../models/Notification.js";
import { Profile } from "../models/Profile.js";
import { Roadmap } from "../models/Roadmap.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function objectId(value: string) {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_ID", "Invalid id");
  return new Types.ObjectId(value);
}

function routeParam(value: string | string[] | undefined) {
  if (typeof value !== "string") throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_ID", "Invalid id");
  return value;
}

function normalizeList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function overlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function textContainsAny(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.filter((term) => term.length > 2 && normalized.includes(term));
}

async function mentorRecommendation(mentor: any, userId: Types.ObjectId) {
  const [profile, roadmap] = await Promise.all([
    Profile.findOne({ user: userId }),
    Roadmap.findOne({ user: userId }).sort({ createdAt: -1 })
  ]);

  const profileSkills = normalizeList(profile?.skills);
  const interests = normalizeList(profile?.interests);
  const goals = normalizeList(profile?.goals);
  const roadmapSkills = normalizeList(roadmap?.skills);
  const roadmapGoal = normalizeText(roadmap?.careerGoal ?? roadmap?.desiredCareer).toLowerCase();
  const mentorSkills = normalizeList(mentor.skills);
  const mentorDomains = normalizeList(mentor.domains);
  const mentorText = [mentor.currentRole, mentor.organization, mentor.expertise, mentor.headline, ...mentorSkills, ...mentorDomains].join(" ").toLowerCase();

  const sharedSkills = overlap([...profileSkills, ...roadmapSkills], mentorSkills);
  const sharedDomains = overlap([...interests, ...goals], mentorDomains);
  const careerTerms = [...goals, roadmapGoal].filter(Boolean);
  const careerMatches = textContainsAny(mentorText, careerTerms);
  const branchMatches = textContainsAny(mentorText, [normalizeText(profile?.branch).toLowerCase()]);

  const rawScore =
    35 +
    Math.min(sharedSkills.length * 8, 28) +
    Math.min(sharedDomains.length * 7, 21) +
    Math.min(careerMatches.length * 7, 14) +
    Math.min(branchMatches.length * 6, 6) +
    Math.min(Number(mentor.yearsOfExperience ?? 0) * 1.5, 12);
  const score = Math.max(35, Math.min(98, Math.round(rawScore)));

  const reasons = [
    sharedSkills.length ? `Shares ${sharedSkills.slice(0, 3).join(", ")} skill focus` : "",
    sharedDomains.length ? `Aligned with ${sharedDomains.slice(0, 3).join(", ")} interests` : "",
    careerMatches.length ? "Mentor background matches your career direction" : "",
    branchMatches.length ? "Branch context is relevant to your profile" : "",
    mentor.yearsOfExperience ? `${mentor.yearsOfExperience} years of practical guidance experience` : ""
  ].filter(Boolean);

  return {
    compatibilityScore: score,
    matchingReasons: reasons.length ? reasons.slice(0, 5) : ["Relevant mentor profile for engineering career guidance"],
    sharedSkills: [...new Set(sharedSkills)].slice(0, 8),
    sharedDomains: [...new Set(sharedDomains)].slice(0, 8)
  };
}

function sanitizeMentorPayload(body: any) {
  return {
    name: normalizeText(body.name),
    currentRole: normalizeText(body.currentRole),
    organization: normalizeText(body.organization ?? body.collegeCompany),
    expertise: normalizeText(body.expertise),
    yearsOfExperience: Number(body.yearsOfExperience ?? 0),
    skills: normalizeList(body.skills),
    domains: normalizeList(body.domains),
    availableFor: normalizeList(body.availableFor),
    linkedin: normalizeText(body.linkedin),
    github: normalizeText(body.github),
    headline: normalizeText(body.headline),
    active: body.active !== false
  };
}

function validateMentorPayload(payload: ReturnType<typeof sanitizeMentorPayload>) {
  const errors: Record<string, string> = {};
  if (!payload.name) errors.name = "Name is required.";
  if (!payload.currentRole) errors.currentRole = "Current role is required.";
  if (!payload.organization) errors.organization = "College or company is required.";
  if (!payload.expertise) errors.expertise = "Expertise is required.";
  if (!Number.isFinite(payload.yearsOfExperience) || payload.yearsOfExperience < 0) errors.yearsOfExperience = "Years of experience must be 0 or more.";
  if (!payload.skills.length) errors.skills = "Add at least one skill.";
  if (!payload.domains.length) errors.domains = "Add at least one domain.";
  if (!payload.availableFor.length) errors.availableFor = "Choose at least one mentorship area.";
  if (Object.keys(errors).length) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "MENTOR_VALIDATION_FAILED", "Please fill all required mentor fields.", errors);
  }
}

async function mentorCards(userId: Types.ObjectId) {
  const mentors = await Mentor.find({ active: true, user: { $ne: userId } })
    .sort({ updatedAt: -1 })
    .populate("user", "displayName email photoURL profile")
    .limit(80);

  const requests = await MentorRequest.find({
    $or: [{ student: userId }, { mentor: userId }]
  }).select("student mentor status mentorProfile");

  const statusByMentor = new Map<string, any>();
  for (const request of requests) {
    statusByMentor.set(String(request.mentor), request);
  }

  const cards = await Promise.all(
    mentors.map(async (mentor) => {
      const recommendation = await mentorRecommendation(mentor, userId);
      const request = statusByMentor.get(String(mentor.user?._id ?? mentor.user));
      return {
        mentor,
        request,
        state: request?.status === "accepted" ? "accepted" : request?.status === "pending" ? "request_sent" : "none",
        ...recommendation
      };
    })
  );

  return cards.sort((left, right) => right.compatibilityScore - left.compatibilityScore);
}

export const getMyMentorProfile = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const mentor = await Mentor.findOne({ user: currentUser.id }).populate("user", "displayName email photoURL profile");
  res.json({ success: true, mentor });
});

export const upsertMyMentorProfile = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const payload = sanitizeMentorPayload(req.body);
  validateMentorPayload(payload);

  const mentor = await Mentor.findOneAndUpdate(
    { user: currentUser.id },
    { ...payload, user: currentUser.id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate("user", "displayName email photoURL profile");

  res.status(StatusCodes.OK).json({ success: true, mentor });
});

export const browseMentors = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const mentors = await mentorCards(currentUser.id);
  res.json({ success: true, mentors });
});

export const recommendedMentors = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const mentors = (await mentorCards(currentUser.id)).slice(0, 12);
  res.json({ success: true, mentors });
});

export const getMentorRequestStatus = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const mentorUserId = objectId(routeParam(req.params.mentorUserId));
  if (mentorUserId.equals(currentUser.id)) return res.json({ success: true, state: "self" });

  const request = await MentorRequest.findOne({
    $or: [
      { student: currentUser.id, mentor: mentorUserId },
      { student: mentorUserId, mentor: currentUser.id }
    ]
  });

  if (!request) return res.json({ success: true, state: "none" });
  const isStudent = String(request.student) === String(currentUser.id);
  const state = request.status === "accepted" ? "accepted" : request.status === "pending" && isStudent ? "request_sent" : "request_received";
  res.json({ success: true, state, request });
});

export const requestMentor = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const mentorUserId = objectId(routeParam(req.params.mentorUserId));
  if (mentorUserId.equals(currentUser.id)) throw new HttpError(StatusCodes.BAD_REQUEST, "SELF_MENTOR_REQUEST", "You cannot request yourself as a mentor.");

  const [mentorUser, mentorProfile] = await Promise.all([User.findById(mentorUserId), Mentor.findOne({ user: mentorUserId, active: true })]);
  if (!mentorUser || !mentorProfile) throw new HttpError(StatusCodes.NOT_FOUND, "MENTOR_NOT_FOUND", "Mentor profile was not found.");

  const recommendation = await mentorRecommendation(mentorProfile, currentUser.id);
  const message = normalizeText(req.body?.message);
  const existing = await MentorRequest.findOne({ student: currentUser.id, mentor: mentorUserId });

  if (existing && existing.status !== "rejected") {
    return res.status(StatusCodes.OK).json({ success: true, request: existing, state: existing.status === "accepted" ? "accepted" : "request_sent" });
  }

  const request = existing
    ? await MentorRequest.findByIdAndUpdate(
        existing._id,
        {
          mentorProfile: mentorProfile._id,
          status: "pending",
          message,
          compatibilityScore: recommendation.compatibilityScore,
          matchingReasons: recommendation.matchingReasons,
          decidedAt: null
        },
        { new: true, runValidators: true }
      )
    : await MentorRequest.create({
        student: currentUser.id,
        mentor: mentorUserId,
        mentorProfile: mentorProfile._id,
        message,
        compatibilityScore: recommendation.compatibilityScore,
        matchingReasons: recommendation.matchingReasons
      });

  await Notification.create({
    user: mentorUserId,
    type: "mentor_request",
    title: "New mentorship request",
    body: `${currentUser.displayName} requested your mentorship.`,
    metadata: { mentorRequestId: request?._id, studentId: currentUser.id, mentorProfileId: mentorProfile._id },
    priority: "high"
  });

  res.status(StatusCodes.CREATED).json({ success: true, request, state: "request_sent" });
});

export const acceptMentorRequest = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const request = await MentorRequest.findById(routeParam(req.params.requestId));
  if (!request) throw new HttpError(StatusCodes.NOT_FOUND, "MENTOR_REQUEST_NOT_FOUND", "Mentorship request was not found.");
  if (String(request.mentor) !== String(currentUser.id)) throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "You can only accept requests sent to you.");

  request.status = "accepted";
  request.decidedAt = new Date();
  await request.save();

  await Notification.create({
    user: request.student,
    type: "mentor_request_accepted",
    title: "Mentorship request accepted",
    body: `${currentUser.displayName} accepted your mentorship request. You can now message each other.`,
    metadata: { mentorRequestId: request._id, mentorId: currentUser.id },
    priority: "high"
  });

  res.json({ success: true, request, state: "accepted" });
});

export const rejectMentorRequest = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const request = await MentorRequest.findById(routeParam(req.params.requestId));
  if (!request) throw new HttpError(StatusCodes.NOT_FOUND, "MENTOR_REQUEST_NOT_FOUND", "Mentorship request was not found.");
  if (String(request.mentor) !== String(currentUser.id)) throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "You can only reject requests sent to you.");

  request.status = "rejected";
  request.decidedAt = new Date();
  await request.save();

  res.json({ success: true, request, state: "none" });
});

export const listSentMentorRequests = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const requests = await MentorRequest.find({ student: currentUser.id })
    .sort({ createdAt: -1 })
    .populate("mentor", "displayName email photoURL profile")
    .populate("mentorProfile");
  res.json({ success: true, requests });
});

export const listReceivedMentorRequests = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const requests = await MentorRequest.find({ mentor: currentUser.id })
    .sort({ createdAt: -1 })
    .populate("student", "displayName email photoURL profile")
    .populate("mentorProfile");
  res.json({ success: true, requests });
});
