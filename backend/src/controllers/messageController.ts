import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { Block } from "../models/Block.js";
import { Connection } from "../models/Connection.js";
import { Conversation } from "../models/Conversation.js";
import { MentorRequest } from "../models/MentorRequest.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { Report } from "../models/Report.js";
import { SkillExchangeRequest } from "../models/SkillExchangeRequest.js";
import { moderateMessage, sanitizeMessageText } from "../services/messageModerationService.js";
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

function conversationKey(left: Types.ObjectId, right: Types.ObjectId) {
  return [String(left), String(right)].sort().join(":");
}

async function ensureConnected(left: Types.ObjectId, right: Types.ObjectId) {
  const [connection, mentorRequest, skillExchangeRequest] = await Promise.all([
    Connection.findOne({
      status: "accepted",
      $or: [
        { requesterId: left, recipientId: right },
        { requesterId: right, recipientId: left }
      ]
    }),
    MentorRequest.findOne({
      status: "accepted",
      $or: [
        { student: left, mentor: right },
        { student: right, mentor: left }
      ]
    }),
    SkillExchangeRequest.findOne({
      status: { $in: ["accepted", "completed"] },
      $or: [
        { requester: left, recipient: right },
        { requester: right, recipient: left }
      ]
    })
  ]);

  if (!connection && !mentorRequest && !skillExchangeRequest) {
    throw new HttpError(StatusCodes.FORBIDDEN, "NOT_CONNECTED", "Connect first, accept mentorship, or accept a skill exchange before messaging.");
  }
}

async function ensureNotBlocked(left: Types.ObjectId, right: Types.ObjectId) {
  const block = await Block.findOne({
    $or: [
      { blockerId: left, blockedUserId: right },
      { blockerId: right, blockedUserId: left }
    ]
  });

  if (block) {
    throw new HttpError(StatusCodes.FORBIDDEN, "USER_BLOCKED", "You cannot message this user.");
  }
}

async function findOwnedConversation(conversationId: string, userId: Types.ObjectId) {
  const conversation = await Conversation.findOne({ _id: objectId(conversationId), participants: userId }).populate("participants", "displayName email photoURL profile");
  if (!conversation) throw new HttpError(StatusCodes.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation was not found");
  return conversation;
}

export const createOrGetConversation = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const otherUserId = objectId(routeParam(req.params.userId));

  if (otherUserId.equals(currentUser.id)) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "SELF_CONVERSATION", "You cannot message yourself");
  }

  await ensureConnected(currentUser.id, otherUserId);

  const key = conversationKey(currentUser.id, otherUserId);
  const conversation = await Conversation.findOneAndUpdate(
    { participantKey: key },
    { $setOnInsert: { participants: [currentUser.id, otherUserId], participantKey: key } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate("participants", "displayName email photoURL profile");

  res.status(StatusCodes.OK).json({ success: true, conversation });
});

export const listConversations = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const conversations = await Conversation.find({ participants: currentUser.id }).sort({ updatedAt: -1 }).populate("participants", "displayName email photoURL profile");
  res.json({ success: true, conversations });
});

export const listMessages = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const conversation = await findOwnedConversation(routeParam(req.params.conversationId), currentUser.id);
  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(100);
  res.json({ success: true, conversation, messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

  if (!text) throw new HttpError(StatusCodes.BAD_REQUEST, "MESSAGE_REQUIRED", "Message text is required");

  const conversation = await findOwnedConversation(routeParam(req.params.conversationId), currentUser.id);
  const recipientId = conversation.participants.find((participant: any) => String(participant._id ?? participant) !== String(currentUser.id));

  if (!recipientId) throw new HttpError(StatusCodes.BAD_REQUEST, "RECIPIENT_NOT_FOUND", "Conversation recipient was not found");
  const recipientObjectId = new Types.ObjectId(String((recipientId as any)._id ?? recipientId));
  await ensureConnected(currentUser.id, recipientObjectId);
  await ensureNotBlocked(currentUser.id, recipientObjectId);

  const cleanText = sanitizeMessageText(text);
  const moderation = await moderateMessage(cleanText, currentUser.id);
  if (!moderation.isAllowed) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      blocked: true,
      category: moderation.category,
      reason: "This message may violate platform guidelines. Please rewrite it.",
      moderationReason: moderation.reason,
      score: moderation.spamScore,
      suggestedRewrite: moderation.suggestedRewrite
    });
  }

  const message = await Message.create({ conversationId: conversation._id, senderId: currentUser.id, text: cleanText });
  conversation.lastMessage = text;
  await conversation.save();

  await Notification.create({
    user: recipientId,
    type: "message",
    title: "New message",
    body: `${currentUser.displayName} sent you a message.`,
    metadata: { conversationId: conversation._id, senderId: currentUser.id }
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message,
    moderation:
      moderation.action === "warned"
        ? {
            action: moderation.action,
            category: moderation.category,
            reason: moderation.reason,
            score: moderation.spamScore,
            suggestedRewrite: moderation.suggestedRewrite
          }
        : undefined
  });
});

export const reportUser = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const reportedUserId = objectId(routeParam(req.params.userId));
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "other";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  const messageId = typeof req.body?.messageId === "string" && Types.ObjectId.isValid(req.body.messageId) ? new Types.ObjectId(req.body.messageId) : undefined;

  if (reportedUserId.equals(currentUser.id)) throw new HttpError(StatusCodes.BAD_REQUEST, "SELF_REPORT", "You cannot report yourself");

  const report = await Report.create({ reporterId: currentUser.id, reportedUserId, reason, description, messageId });
  res.status(StatusCodes.CREATED).json({ success: true, report });
});

export const blockUser = asyncHandler(async (req, res) => {
  const currentUser = ensureUser(req);
  const blockedUserId = objectId(routeParam(req.params.userId));

  if (blockedUserId.equals(currentUser.id)) throw new HttpError(StatusCodes.BAD_REQUEST, "SELF_BLOCK", "You cannot block yourself");

  const block = await Block.findOneAndUpdate(
    { blockerId: currentUser.id, blockedUserId },
    { blockerId: currentUser.id, blockedUserId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(StatusCodes.OK).json({ success: true, block });
});
