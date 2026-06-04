import { StatusCodes } from "http-status-codes";
import { Application } from "../models/Application.js";
import { Notification } from "../models/Notification.js";
import { Project } from "../models/Project.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

export const listMyApplications = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const applications = await Application.find({ applicant: user.id, targetType: "project" })
    .sort({ createdAt: -1 })
    .populate({ path: "project", populate: { path: "owner", select: "displayName email photoURL profile" } });

  res.json({ success: true, applications });
});

export const listReceivedApplications = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const ownedProjects = await Project.find({ owner: user.id }).select("_id");
  const applications = await Application.find({ project: { $in: ownedProjects.map((project) => project._id) }, targetType: "project" })
    .sort({ createdAt: -1 })
    .populate({ path: "applicant", select: "displayName email photoURL profile", populate: { path: "profile" } })
    .populate("project");

  res.json({ success: true, applications });
});

export const decideApplication = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const decision = req.path.endsWith("/accept") ? "accepted" : "rejected";
  const application = await Application.findById(req.params.applicationId).populate("project");

  if (!application || !application.project) throw new HttpError(StatusCodes.NOT_FOUND, "APPLICATION_NOT_FOUND", "Application was not found");
  const project = application.project as any;
  if (String(project.owner) !== String(user.id)) throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "Only the project owner can decide this application");
  if (application.status !== "pending") throw new HttpError(StatusCodes.BAD_REQUEST, "APPLICATION_ALREADY_DECIDED", "This application has already been decided");

  application.status = decision;
  application.decidedBy = user.id;
  application.decidedAt = new Date();
  await application.save();

  if (decision === "accepted") {
    const memberExists = project.members.some((member: { user: unknown }) => String(member.user) === String(application.applicant));
    if (!memberExists && project.members.length < project.maxMembers) {
      project.members.push({ user: application.applicant, role: application.rolePreference || "Member", joinedAt: new Date() });
      await project.save();
    }
  }

  await Notification.create({
    user: application.applicant,
    type: "application_decision",
    title: `Project application ${decision}`,
    body: `Your application to ${project.title} was ${decision}.`,
    metadata: { project: project._id, application: application._id },
    priority: decision === "accepted" ? "high" : "normal"
  });

  res.json({ success: true, application });
});
