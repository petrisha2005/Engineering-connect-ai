import { StatusCodes } from "http-status-codes";
import type { Request } from "express";
import type { SortOrder } from "mongoose";
import { Application } from "../models/Application.js";
import { Notification } from "../models/Notification.js";
import { Project } from "../models/Project.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUserId(req: Request) {
  if (!req.user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  }

  return req.user.id;
}

function optionalUrl(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}

function paramValue(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function findProjectOrThrow(projectId: string) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new HttpError(StatusCodes.NOT_FOUND, "PROJECT_NOT_FOUND", "Project was not found");
  }
  return project;
}

function assertOwner(project: Awaited<ReturnType<typeof findProjectOrThrow>>, userId: unknown) {
  if (!project.owner.equals(userId as any)) {
    throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "Only the project owner can perform this action");
  }
}

export const createProject = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const project = await Project.create({
    ...req.body,
    owner: userId,
    repositoryUrl: optionalUrl(req.body.repositoryUrl),
    demoUrl: optionalUrl(req.body.demoUrl),
    members: [{ user: userId, role: "Owner" }]
  });

  await project.populate("owner", "displayName email photoURL profile");
  res.status(StatusCodes.CREATED).json({ project });
});

export const listProjects = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const { q, skill, interest, status, mine, page, limit } = req.query as Record<string, string>;
  const filters: Record<string, unknown> = {};

  if (mine === "true") {
    filters.$or = [{ owner: userId }, { "members.user": userId }];
  }
  if (q) {
    filters.$text = { $search: q };
  }
  if (skill) {
    filters.requiredSkills = skill.toLowerCase();
  }
  if (interest) {
    filters.interests = interest.toLowerCase();
  }
  if (status) {
    filters.status = status;
  }

  const pageNumber = Number(page ?? 1);
  const limitNumber = Number(limit ?? 20);
  const skip = (pageNumber - 1) * limitNumber;
  const sort: Record<string, SortOrder | { $meta: string }> = q ? { score: { $meta: "textScore" } } : { createdAt: -1 };

  const [projects, total] = await Promise.all([
    Project.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .populate("owner", "displayName email photoURL profile")
      .populate("members.user", "displayName email photoURL profile"),
    Project.countDocuments(filters)
  ]);

  res.json({
    projects,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: Math.ceil(total / limitNumber)
    }
  });
});

export const getProjectById = asyncHandler(async (req, res) => {
  ensureUserId(req);
  const project = await Project.findById(paramValue(req.params.id))
    .populate("owner", "displayName email photoURL profile")
    .populate("members.user", "displayName email photoURL profile")
    .populate("invites.user", "displayName email photoURL profile")
    .populate("invites.invitedBy", "displayName email photoURL profile");

  if (!project) {
    throw new HttpError(StatusCodes.NOT_FOUND, "PROJECT_NOT_FOUND", "Project was not found");
  }

  const applications = await Application.find({ project: project._id })
    .sort({ createdAt: -1 })
    .populate("applicant", "displayName email photoURL profile");

  res.json({ project, applications });
});

export const applyToProject = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const project = await findProjectOrThrow(paramValue(req.params.id));

  if (project.owner.equals(userId)) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "OWNER_CANNOT_APPLY", "Project owners cannot apply to their own projects");
  }

  if (project.status !== "open") {
    throw new HttpError(StatusCodes.BAD_REQUEST, "PROJECT_NOT_OPEN", "This project is not accepting applications");
  }

  if (project.members.some((member) => member.user.equals(userId))) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "ALREADY_MEMBER", "You are already a member of this project");
  }

  const application = await Application.findOneAndUpdate(
    { applicant: userId, project: project._id },
    {
      applicant: userId,
      targetType: "project",
      project: project._id,
      message: req.body.message,
      rolePreference: req.body.rolePreference || undefined,
      status: "pending"
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate("applicant", "displayName email photoURL profile");

  await Notification.create({
    user: project.owner,
    type: "project_application",
    title: "New project application",
    body: `${req.user?.displayName ?? "A student"} applied to ${project.title}`,
    metadata: { project: project._id, application: application._id },
    priority: "normal"
  });

  res.status(StatusCodes.CREATED).json({ application });
});

export const inviteToProject = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const project = await findProjectOrThrow(paramValue(req.params.id));
  assertOwner(project, userId);

  const invitedUserId = req.body.userId;
  if (project.members.some((member) => member.user.equals(invitedUserId))) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "ALREADY_MEMBER", "Student is already a project member");
  }
  if (project.invites.some((invite) => invite.user.equals(invitedUserId) && invite.status === "pending")) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "INVITE_EXISTS", "Student already has a pending invite");
  }

  project.invites.push({ user: invitedUserId, invitedBy: userId, status: "pending", invitedAt: new Date() });
  await project.save();

  await Notification.create({
    user: invitedUserId,
    type: "project_invite",
    title: "Project invite",
    body: `You were invited to join ${project.title}`,
    metadata: { project: project._id },
    priority: "normal"
  });

  res.status(StatusCodes.OK).json({ project });
});

export const decideProjectApplication = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const project = await findProjectOrThrow(paramValue(req.params.id));
  assertOwner(project, userId);

  const application = await Application.findOne({
    _id: paramValue(req.params.applicationId),
    project: project._id,
    targetType: "project"
  });

  if (!application) {
    throw new HttpError(StatusCodes.NOT_FOUND, "APPLICATION_NOT_FOUND", "Application was not found");
  }

  if (application.status !== "pending") {
    throw new HttpError(StatusCodes.BAD_REQUEST, "APPLICATION_CLOSED", "Application has already been decided");
  }

  application.status = req.body.decision;
  application.decidedBy = userId;
  application.decidedAt = new Date();
  await application.save();

  if (req.body.decision === "accepted" && !project.members.some((member) => member.user.equals(application.applicant))) {
    if (project.members.length >= project.maxMembers) {
      throw new HttpError(StatusCodes.BAD_REQUEST, "PROJECT_FULL", "Project has reached its member limit");
    }
    project.members.push({ user: application.applicant, role: req.body.role, joinedAt: new Date() });
    if (project.members.length >= project.maxMembers) {
      project.status = "in_progress";
    }
    await project.save();
  }

  await Notification.create({
    user: application.applicant,
    type: "application_decision",
    title: `Project application ${application.status}`,
    body: `Your application to ${project.title} was ${application.status}`,
    metadata: { project: project._id, application: application._id },
    priority: application.status === "accepted" ? "high" : "normal"
  });

  await application.populate("applicant", "displayName email photoURL profile");
  res.json({ application, project });
});
