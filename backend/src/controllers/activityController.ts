import { Application } from "../models/Application.js";
import { Connection } from "../models/Connection.js";
import { Notification } from "../models/Notification.js";
import { Project } from "../models/Project.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { StatusCodes } from "http-status-codes";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

export const getActivitySummary = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const ownedProjects = await Project.find({ owner: user.id }).select("_id");
  const projectIds = ownedProjects.map((project) => project._id);
  const [pendingConnections, pendingApplications, acceptedApplications, receivedApplications, notifications] = await Promise.all([
    Connection.countDocuments({ recipientId: user.id, status: "pending" }),
    Application.countDocuments({ applicant: user.id, targetType: "project", status: "pending" }),
    Application.countDocuments({ applicant: user.id, targetType: "project", status: "accepted" }),
    Application.countDocuments({ project: { $in: projectIds }, targetType: "project", status: "pending" }),
    Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(5)
  ]);

  res.json({
    success: true,
    summary: { pendingConnections, pendingApplications, acceptedApplications, receivedApplications },
    recentActivity: notifications
  });
});
