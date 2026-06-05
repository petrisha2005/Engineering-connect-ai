import { StatusCodes } from "http-status-codes";
import type { Request } from "express";
import { Types, type SortOrder } from "mongoose";
import { Application } from "../models/Application.js";
import { HackathonTeam } from "../models/HackathonTeam.js";
import { Notification } from "../models/Notification.js";
import { Profile } from "../models/Profile.js";
import { suggestHackathonRoles } from "../services/hackathonSuggestionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUserId(req: Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user.id;
}

function paramValue(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function findTeamOrThrow(teamId: string) {
  const team = await HackathonTeam.findById(teamId);
  if (!team) throw new HttpError(StatusCodes.NOT_FOUND, "TEAM_NOT_FOUND", "Hackathon team was not found");
  return team;
}

function assertOwner(team: Awaited<ReturnType<typeof findTeamOrThrow>>, userId: unknown) {
  if (!team.owner.equals(userId as any)) {
    throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "Only the team owner can perform this action");
  }
}

function memberUserIds(team: any) {
  return new Set((team.members ?? []).map((member: any) => String(member.user?._id ?? member.user)));
}

function shared(left: string[] = [], right: string[] = []) {
  const rightSet = new Set(right.map((value) => value.toLowerCase()));
  return [...new Set(left.map((value) => value.toLowerCase()).filter((value) => rightSet.has(value)))];
}

function analyzeTeam(team: any, applications: any[] = []) {
  const requiredRoles = team.requiredRoles ?? [];
  const roleCompletion = requiredRoles.length ? requiredRoles.filter((role: any) => role.filledBy || role.status === "filled").length / requiredRoles.length : 1;
  const memberSkills = (team.members ?? []).flatMap((member: any) => {
    const profile = member.user?.profile && typeof member.user.profile === "object" ? member.user.profile : null;
    return profile?.skills ?? [];
  });
  const requiredSkills = [...new Set([...(team.skillsNeeded ?? []), ...(team.requiredSkills ?? []), ...requiredRoles.flatMap((role: any) => role.skills ?? role.requiredSkills ?? [])])];
  const coveredSkills = shared(memberSkills, requiredSkills);
  const missingSkills = requiredSkills.filter((skill) => !coveredSkills.includes(skill));
  const missingRoles = requiredRoles.filter((role: any) => !role.filledBy && role.status !== "filled").map((role: any) => role.roleName || role.role);
  const skillCoverage = requiredSkills.length ? coveredSkills.length / requiredSkills.length : 1;
  const capacityScore = Math.min((team.members?.length ?? 0) / Math.max(team.maxMembers ?? team.teamSize ?? 1, 1), 1);
  const teamStrength = Math.round((roleCompletion * 0.4 + skillCoverage * 0.45 + capacityScore * 0.15) * 100);
  const riskLevel = teamStrength >= 75 ? "Low" : teamStrength >= 45 ? "Medium" : "High";
  const suggestion = missingRoles.length
    ? `Invite students for ${missingRoles.slice(0, 3).join(", ")}.`
    : missingSkills.length
      ? `Invite students with ${missingSkills.slice(0, 4).join(", ")} experience.`
      : "Team coverage looks strong. Focus on execution plan and pitch practice.";

  return {
    teamStrength,
    skillCoverage: Math.round(skillCoverage * 100),
    roleCompletion: {
      filled: requiredRoles.filter((role: any) => role.filledBy || role.status === "filled").length,
      total: requiredRoles.length
    },
    riskLevel,
    missingRoles,
    missingSkills,
    suggestedImprovements: [suggestion],
    applicantScores: applications.map((application: any) => ({
      applicationId: application._id,
      name: application.applicant?.displayName ?? "Applicant",
      score: application.rolePreference ? Math.min(100, 40 + shared([application.rolePreference], missingRoles).length * 35) : 50
    })),
    skillCoverageChart: requiredSkills.map((skill) => ({ skill, covered: coveredSkills.includes(skill) ? 1 : 0, missing: coveredSkills.includes(skill) ? 0 : 1 }))
  };
}

export const createHackathonTeam = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const requiredRoles = (req.body.requiredRoles ?? []).map((role: any) => ({
    role: role.role ?? role.roleName,
    roleName: role.roleName ?? role.role,
    skills: role.skills ?? role.requiredSkills ?? [],
    requiredSkills: role.requiredSkills ?? role.skills ?? [],
    importance: role.importance ?? "Medium"
  }));
  const team = await HackathonTeam.create({
    ...req.body,
    requiredRoles,
    name: req.body.name || req.body.hackathonName,
    skillsNeeded: req.body.skillsNeeded ?? req.body.requiredSkills ?? [],
    requiredSkills: req.body.requiredSkills ?? req.body.skillsNeeded ?? [],
    maxMembers: req.body.maxMembers ?? req.body.teamSize,
    teamSize: req.body.teamSize ?? req.body.maxMembers,
    lookingFor: req.body.lookingFor || undefined,
    owner: userId,
    creatorId: userId,
    members: [{ user: userId, role: "Captain" }]
  });

  await team.populate("owner", "displayName email photoURL profile");
  res.status(StatusCodes.CREATED).json({ team });
});

export const updateHackathonTeam = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const team = await findTeamOrThrow(paramValue(req.params.id));
  assertOwner(team, userId);
  Object.assign(team, req.body, {
    name: req.body.name ?? team.name,
    skillsNeeded: req.body.skillsNeeded ?? req.body.requiredSkills ?? team.skillsNeeded,
    requiredSkills: req.body.requiredSkills ?? req.body.skillsNeeded ?? (team as any).requiredSkills,
    maxMembers: req.body.maxMembers ?? req.body.teamSize ?? team.maxMembers,
    teamSize: req.body.teamSize ?? req.body.maxMembers ?? (team as any).teamSize
  });
  await team.save();
  await team.populate("owner", "displayName email photoURL profile");
  await team.populate("members.user", "displayName email photoURL profile");
  res.json({ team });
});

export const deleteHackathonTeam = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const team = await findTeamOrThrow(paramValue(req.params.id));
  assertOwner(team, userId);
  await Promise.all([HackathonTeam.deleteOne({ _id: team._id }), Application.deleteMany({ hackathonTeam: team._id })]);
  res.json({ success: true });
});

export const listHackathonTeams = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const { q, skill, status, mine, page, limit } = req.query as Record<string, string>;
  const filters: Record<string, unknown> = {};

  if (mine === "true") filters.$or = [{ owner: userId }, { "members.user": userId }];
  if (q) filters.$text = { $search: q };
  if (skill) filters.skillsNeeded = skill.toLowerCase();
  if (status) filters.status = status;

  const pageNumber = Number(page ?? 1);
  const limitNumber = Number(limit ?? 20);
  const skip = (pageNumber - 1) * limitNumber;
  const sort: Record<string, SortOrder | { $meta: string }> = q ? { score: { $meta: "textScore" } } : { createdAt: -1 };

  const [teams, total] = await Promise.all([
    HackathonTeam.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .populate("owner", "displayName email photoURL profile")
      .populate("members.user", "displayName email photoURL profile"),
    HackathonTeam.countDocuments(filters)
  ]);

  res.json({ teams, pagination: { page: pageNumber, limit: limitNumber, total, pages: Math.ceil(total / limitNumber) } });
});

export const getHackathonTeamById = asyncHandler(async (req, res) => {
  ensureUserId(req);
  const team = await HackathonTeam.findById(paramValue(req.params.id))
    .populate("owner", "displayName email photoURL profile")
    .populate("members.user", "displayName email photoURL profile")
    .populate("requiredRoles.filledBy", "displayName email photoURL profile");

  if (!team) throw new HttpError(StatusCodes.NOT_FOUND, "TEAM_NOT_FOUND", "Hackathon team was not found");

  const applications = await Application.find({ hackathonTeam: team._id })
    .sort({ createdAt: -1 })
    .populate("applicant", "displayName email photoURL profile");

  res.json({ team, applications, analysis: analyzeTeam(team, applications) });
});

export const applyToHackathonTeam = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const team = await findTeamOrThrow(paramValue(req.params.id));

  if (team.owner.equals(userId)) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "OWNER_CANNOT_APPLY", "Team captains cannot apply to their own team");
  }
  if (team.status !== "forming") {
    throw new HttpError(StatusCodes.BAD_REQUEST, "TEAM_NOT_FORMING", "This team is not accepting applications");
  }
  if (team.members.some((member) => member.user.equals(userId))) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "ALREADY_MEMBER", "You are already a member of this team");
  }

  const application = await Application.findOneAndUpdate(
    { applicant: userId, hackathonTeam: team._id },
    {
      applicant: userId,
      targetType: "hackathon_team",
      hackathonTeam: team._id,
      message: req.body.message,
      rolePreference: req.body.rolePreference || undefined,
      status: "pending"
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate("applicant", "displayName email photoURL profile");

  await Notification.create({
    user: team.owner,
    type: "team_application",
    title: "New hackathon team application",
    body: `${req.user?.displayName ?? "A student"} applied to ${team.name}`,
    metadata: { hackathonTeam: team._id, application: application._id },
    priority: "normal"
  });

  res.status(StatusCodes.CREATED).json({ application });
});

export const decideHackathonTeamApplication = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const team = await findTeamOrThrow(paramValue(req.params.id));
  assertOwner(team, userId);

  const application = await Application.findOne({
    _id: paramValue(req.params.applicationId),
    hackathonTeam: team._id,
    targetType: "hackathon_team"
  });

  if (!application) throw new HttpError(StatusCodes.NOT_FOUND, "APPLICATION_NOT_FOUND", "Application was not found");
  if (application.status !== "pending") {
    throw new HttpError(StatusCodes.BAD_REQUEST, "APPLICATION_CLOSED", "Application has already been decided");
  }

  application.status = req.body.decision;
  application.decidedBy = userId;
  application.decidedAt = new Date();
  await application.save();

  if (req.body.decision === "accepted" && !team.members.some((member) => member.user.equals(application.applicant))) {
    if (team.members.length >= team.maxMembers) {
      throw new HttpError(StatusCodes.BAD_REQUEST, "TEAM_FULL", "Team has reached its member limit");
    }
    team.members.push({ user: application.applicant, role: req.body.role, joinedAt: new Date() });
    const role = (team.requiredRoles as any[]).find(
      (requiredRole) => String(requiredRole.role).toLowerCase() === req.body.role.toLowerCase() && !requiredRole.filledBy
    );
    if (role) role.filledBy = application.applicant;
    if (team.members.length >= team.maxMembers) team.status = "ready";
    await team.save();
  }

  await Notification.create({
    user: application.applicant,
    type: "application_decision",
    title: `Hackathon application ${application.status}`,
    body: `Your application to ${team.name} was ${application.status}`,
    metadata: { hackathonTeam: team._id, application: application._id },
    priority: application.status === "accepted" ? "high" : "normal"
  });

  await application.populate("applicant", "displayName email photoURL profile");
  res.json({ application, team });
});

export const acceptHackathonTeamApplication = asyncHandler(async (req, res, next) => {
  req.body.decision = "accepted";
  req.body.role = req.body.role || "Member";
  return decideHackathonTeamApplication(req, res, next);
});

export const rejectHackathonTeamApplication = asyncHandler(async (req, res, next) => {
  req.body.decision = "rejected";
  req.body.role = req.body.role || "Member";
  return decideHackathonTeamApplication(req, res, next);
});

export const suggestHackathonTeamRoles = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const result = await suggestHackathonRoles(paramValue(req.params.id), userId, Number(req.body.limit ?? 5));

  if (!result) throw new HttpError(StatusCodes.NOT_FOUND, "TEAM_NOT_FOUND", "Hackathon team was not found");

  await Notification.create({
    user: userId,
    type: "team_suggestion",
    title: "Team suggestions generated",
    body: `Role suggestions were generated for ${result.team.name}`,
    metadata: { hackathonTeam: result.team._id },
    priority: "low"
  });

  res.json({ suggestions: result.suggestions, recommendations: result.suggestions });
});

export const getHackathonRecommendations = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const result = await suggestHackathonRoles(paramValue(req.params.id), userId, Number(req.query.limit ?? 8));
  if (!result) throw new HttpError(StatusCodes.NOT_FOUND, "TEAM_NOT_FOUND", "Hackathon team was not found");
  res.json({ recommendations: result.suggestions, suggestions: result.suggestions });
});

export const getHackathonAnalysis = asyncHandler(async (req, res) => {
  ensureUserId(req);
  const team = await HackathonTeam.findById(paramValue(req.params.id))
    .populate({ path: "members.user", select: "displayName email photoURL profile", populate: { path: "profile" } })
    .populate("requiredRoles.filledBy", "displayName email photoURL profile");
  if (!team) throw new HttpError(StatusCodes.NOT_FOUND, "TEAM_NOT_FOUND", "Hackathon team was not found");
  const applications = await Application.find({ hackathonTeam: team._id }).populate("applicant", "displayName email photoURL profile");
  res.json({ analysis: analyzeTeam(team, applications) });
});

export const inviteHackathonTeammate = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const team = await findTeamOrThrow(paramValue(req.params.id));
  assertOwner(team, userId);
  const invitedUserId = new Types.ObjectId(paramValue(req.params.userId));
  if (team.owner.equals(invitedUserId)) throw new HttpError(StatusCodes.BAD_REQUEST, "OWNER_INVITE", "You cannot invite yourself.");
  if (team.members.some((member) => member.user.equals(invitedUserId))) throw new HttpError(StatusCodes.BAD_REQUEST, "ALREADY_MEMBER", "User is already a team member.");
  if ((team.invitedUsers as any[]).some((invite) => String(invite.user) === String(invitedUserId) && invite.status === "pending")) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "INVITE_EXISTS", "This user already has a pending invite.");
  }
  (team.invitedUsers as any[]).push({ user: invitedUserId, role: req.body.role || "Member", status: "pending", invitedAt: new Date() });
  await team.save();
  await Notification.create({
    user: invitedUserId,
    type: "team_invite",
    title: "Hackathon team invite",
    body: `${req.user?.displayName ?? "A student"} invited you to ${team.name}`,
    metadata: { hackathonTeam: team._id },
    priority: "high"
  });
  res.status(StatusCodes.CREATED).json({ team });
});

async function decideInvite(req: Request, decision: "accepted" | "rejected") {
  const userId = ensureUserId(req);
  const team = await findTeamOrThrow(paramValue(req.params.id));
  const invite = (team.invitedUsers as any[]).find((item) => String(item.user) === String(userId) && item.status === "pending");
  if (!invite) throw new HttpError(StatusCodes.NOT_FOUND, "INVITE_NOT_FOUND", "Pending invite was not found.");
  invite.status = decision;
  invite.decidedAt = new Date();
  if (decision === "accepted") {
    if (team.members.length >= team.maxMembers) throw new HttpError(StatusCodes.BAD_REQUEST, "TEAM_FULL", "Team has reached its member limit");
    team.members.push({ user: userId, role: invite.role || "Member", joinedAt: new Date() });
    const role = (team.requiredRoles as any[]).find((requiredRole) => String(requiredRole.role).toLowerCase() === String(invite.role).toLowerCase() && !requiredRole.filledBy);
    if (role) role.filledBy = userId;
    if (team.members.length >= team.maxMembers) team.status = "ready";
  }
  await team.save();
  await Notification.create({
    user: team.owner,
    type: decision === "accepted" ? "team_invite_accepted" : "team_invite_rejected",
    title: `Hackathon invite ${decision}`,
    body: `${req.user?.displayName ?? "A student"} ${decision} your invite to ${team.name}`,
    metadata: { hackathonTeam: team._id },
    priority: "normal"
  });
  return team;
}

export const acceptHackathonInvite = asyncHandler(async (req, res) => {
  res.json({ team: await decideInvite(req, "accepted") });
});

export const rejectHackathonInvite = asyncHandler(async (req, res) => {
  res.json({ team: await decideInvite(req, "rejected") });
});
