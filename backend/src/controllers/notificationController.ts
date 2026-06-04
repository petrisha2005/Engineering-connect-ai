import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { StatusCodes } from "http-status-codes";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

export const listNotifications = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const notifications = await Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(80);
  res.json({ success: true, notifications });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const notification = await Notification.findOneAndUpdate({ _id: req.params.notificationId, user: user.id }, { readAt: new Date() }, { new: true });
  res.json({ success: true, notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  await Notification.updateMany({ user: user.id, readAt: null }, { readAt: new Date() });
  res.json({ success: true });
});
