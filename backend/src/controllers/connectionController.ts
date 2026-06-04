import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { Connection } from "../models/Connection.js";
import { Notification } from "../models/Notification.js";
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

function pairQuery(currentUserId: Types.ObjectId, otherUserId: Types.ObjectId) {
  return {
    $or: [
      { requesterId: currentUserId, recipientId: otherUserId },
      { requesterId: otherUserId, recipientId: currentUserId }
    ]
  };
}

function connectionState(connection: any, currentUserId: Types.ObjectId) {
  if (!connection) return { state: "none" as const };
  const isRequester = String(connection.requesterId?._id ?? connection.requesterId) === String(currentUserId);
  if (connection.status === "accepted") return { state: "connected" as const, connection };
  if (connection.status === "pending" && isRequester) return { state: "request_sent" as const, connection };
  if (connection.status === "pending") return { state: "request_received" as const, connection };
  return { state: "none" as const, connection };
}

export const requestConnection = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const recipientId = objectId(routeParam(req.params.userId));

  if (recipientId.equals(currentUser.id)) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "SELF_CONNECTION", "You cannot connect with yourself");
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) throw new HttpError(StatusCodes.NOT_FOUND, "USER_NOT_FOUND", "Student was not found");

  const existing = await Connection.findOne(pairQuery(currentUser.id, recipientId));
  if (existing && existing.status !== "rejected") {
    return res.status(StatusCodes.OK).json({ success: true, connection: existing, ...connectionState(existing, currentUser.id) });
  }

  const connection = existing
    ? await Connection.findByIdAndUpdate(existing._id, { requesterId: currentUser.id, recipientId, status: "pending" }, { new: true, runValidators: true })
    : await Connection.create({ requesterId: currentUser.id, recipientId, status: "pending" });

  await Notification.create({
    user: recipientId,
    type: "connection_request",
    title: "New connection request",
    body: `${currentUser.displayName} sent you a connection request.`,
    metadata: { connectionId: connection?._id, requesterId: currentUser.id }
  });

  res.status(StatusCodes.CREATED).json({ success: true, connection, state: "request_sent" });
});

export const acceptConnection = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const connection = await Connection.findById(routeParam(req.params.connectionId));

  if (!connection) throw new HttpError(StatusCodes.NOT_FOUND, "CONNECTION_NOT_FOUND", "Connection request was not found");
  if (String(connection.recipientId) !== String(currentUser.id)) {
    throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "You can only accept requests sent to you");
  }

  connection.status = "accepted";
  await connection.save();

  await Notification.create({
    user: connection.requesterId,
    type: "connection_accepted",
    title: "Connection accepted",
    body: `${currentUser.displayName} accepted your connection request.`,
    metadata: { connectionId: connection._id, recipientId: currentUser.id }
  });

  res.json({ success: true, connection, state: "connected" });
});

export const rejectConnection = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const connection = await Connection.findById(routeParam(req.params.connectionId));

  if (!connection) throw new HttpError(StatusCodes.NOT_FOUND, "CONNECTION_NOT_FOUND", "Connection request was not found");
  if (String(connection.recipientId) !== String(currentUser.id)) {
    throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "You can only reject requests sent to you");
  }

  connection.status = "rejected";
  await connection.save();

  res.json({ success: true, connection, state: "none" });
});

export const listMyConnections = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const connections = await Connection.find({
    status: "accepted",
    $or: [{ requesterId: currentUser.id }, { recipientId: currentUser.id }]
  })
    .sort({ updatedAt: -1 })
    .populate("requesterId recipientId", "displayName email photoURL profile");

  res.json({ success: true, connections });
});

export const listRequests = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const [incoming, outgoing] = await Promise.all([
    Connection.find({ recipientId: currentUser.id, status: "pending" }).sort({ createdAt: -1 }).populate("requesterId", "displayName email photoURL profile"),
    Connection.find({ requesterId: currentUser.id, status: "pending" }).sort({ createdAt: -1 }).populate("recipientId", "displayName email photoURL profile")
  ]);

  res.json({ success: true, incoming, outgoing });
});

export const listSentConnections = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const connections = await Connection.find({ requesterId: currentUser.id })
    .sort({ createdAt: -1 })
    .populate({ path: "recipientId", select: "displayName email photoURL profile", populate: { path: "profile" } });

  res.json({ success: true, connections });
});

export const listReceivedConnections = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const connections = await Connection.find({ recipientId: currentUser.id })
    .sort({ createdAt: -1 })
    .populate({ path: "requesterId", select: "displayName email photoURL profile", populate: { path: "profile" } });

  res.json({ success: true, connections });
});

export const getConnectionStatus = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const otherUserId = objectId(routeParam(req.params.userId));

  if (otherUserId.equals(currentUser.id)) {
    return res.json({ success: true, state: "self" });
  }

  const connection = await Connection.findOne(pairQuery(currentUser.id, otherUserId));
  res.json({ success: true, ...connectionState(connection, currentUser.id) });
});
