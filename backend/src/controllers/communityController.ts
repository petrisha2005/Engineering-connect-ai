import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { gemini } from "../config/gemini.js";
import { CommunityComment } from "../models/CommunityComment.js";
import { CommunityPost, communityPostTypes } from "../models/CommunityPost.js";
import { CommunityReport } from "../models/CommunityReport.js";
import { Profile } from "../models/Profile.js";
import { Connection } from "../models/Connection.js";
import { moderateMessage, sanitizeMessageText } from "../services/messageModerationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function routeParam(value: string | string[] | undefined) {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_ID", "Invalid id");
  return new Types.ObjectId(value);
}

function normalizeList(values: unknown) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function normalizePostType(value: unknown) {
  const type = typeof value === "string" ? value : "";
  if (!communityPostTypes.includes(type as any)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_POST_TYPE", "Choose a valid post type.");
  return type;
}

function overlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

async function populatePost(query: any) {
  return query.populate({ path: "author", select: "displayName email photoURL profile", populate: { path: "profile" } });
}

async function decoratePosts(posts: any[], userId: Types.ObjectId) {
  const postIds = posts.map((post) => post._id);
  const commentsByPost = await CommunityComment.aggregate([
    { $match: { post: { $in: postIds }, hidden: false } },
    { $group: { _id: "$post", count: { $sum: 1 } } }
  ]);
  const commentMap = new Map(commentsByPost.map((item) => [String(item._id), item.count]));
  const connections = await Connection.find({
    status: "accepted",
    $or: [{ requesterId: userId }, { recipientId: userId }]
  }).select("requesterId recipientId");
  const connectedUsers = new Set(
    connections.map((connection) => (String(connection.requesterId) === String(userId) ? String(connection.recipientId) : String(connection.requesterId)))
  );

  return posts.map((post) => {
    const authorId = String(post.author?._id ?? post.author);
    return {
      ...post.toObject(),
      likeCount: post.likes?.length ?? 0,
      bookmarkCount: post.bookmarks?.length ?? 0,
      commentCount: commentMap.get(String(post._id)) ?? 0,
      likedByMe: (post.likes ?? []).some((id: Types.ObjectId) => String(id) === String(userId)),
      bookmarkedByMe: (post.bookmarks ?? []).some((id: Types.ObjectId) => String(id) === String(userId)),
      connectionState: authorId === String(userId) ? "self" : connectedUsers.has(authorId) ? "connected" : "none"
    };
  });
}

async function personalizedSort(posts: any[], userId: Types.ObjectId) {
  const profile = await Profile.findOne({ user: userId });
  const signals = [...normalizeList(profile?.skills), ...normalizeList(profile?.interests), ...normalizeList(profile?.goals), String(profile?.branch ?? "").toLowerCase()].filter(Boolean);
  return posts
    .map((post) => {
      const tags = normalizeList(post.tags);
      const content = String(post.content ?? "").toLowerCase();
      const tagScore = overlap(signals, tags).length * 12;
      const textScore = signals.filter((signal) => signal.length > 2 && content.includes(signal)).length * 5;
      const freshScore = Math.max(0, 10 - Math.floor((Date.now() - new Date(post.createdAt).getTime()) / 86_400_000));
      return { post, score: tagScore + textScore + freshScore + (post.likes?.length ?? 0) };
    })
    .sort((left, right) => right.score - left.score)
    .map((item) => item.post);
}

export const listFeed = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const type = typeof req.query.type === "string" ? req.query.type : "";
  const filter: Record<string, unknown> = { hidden: false };
  if (type && communityPostTypes.includes(type as any)) filter.type = type;

  const posts = await populatePost(CommunityPost.find(filter).sort({ createdAt: -1 }).limit(80));
  res.json({ success: true, posts: await decoratePosts(posts, user.id) });
});

export const listPersonalizedFeed = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const posts = await populatePost(CommunityPost.find({ hidden: false }).sort({ createdAt: -1 }).limit(120));
  const personalized = await personalizedSort(posts, user.id);
  res.json({ success: true, posts: await decoratePosts(personalized.slice(0, 80), user.id) });
});

export const createPost = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const content = sanitizeMessageText(typeof req.body.content === "string" ? req.body.content : "");
  if (!content || content.length < 3) throw new HttpError(StatusCodes.BAD_REQUEST, "CONTENT_REQUIRED", "Post content is required.");
  const moderation = await moderateMessage(content, user.id);
  if (!moderation.isAllowed) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      blocked: true,
      message: "Post blocked because it may be spam or unprofessional.",
      moderation
    });
  }

  const post = await CommunityPost.create({
    author: user.id,
    type: normalizePostType(req.body.type),
    content,
    tags: normalizeList(req.body.tags),
    moderation: {
      category: moderation.category,
      severity: moderation.severity,
      reason: moderation.reason,
      suggestedRewrite: moderation.suggestedRewrite
    }
  });
  const populated = await populatePost(CommunityPost.findById(post._id));
  res.status(StatusCodes.CREATED).json({ success: true, post: (await decoratePosts([populated], user.id))[0], moderation });
});

export const deletePost = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const post = await CommunityPost.findById(routeParam(req.params.postId));
  if (!post) throw new HttpError(StatusCodes.NOT_FOUND, "POST_NOT_FOUND", "Post was not found.");
  if (String(post.author) !== String(user.id)) throw new HttpError(StatusCodes.FORBIDDEN, "FORBIDDEN", "You can delete only your own posts.");
  await Promise.all([CommunityPost.deleteOne({ _id: post._id }), CommunityComment.deleteMany({ post: post._id })]);
  res.json({ success: true });
});

export const toggleLike = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const post = await CommunityPost.findById(routeParam(req.params.postId));
  if (!post || post.hidden) throw new HttpError(StatusCodes.NOT_FOUND, "POST_NOT_FOUND", "Post was not found.");
  const hasLiked = post.likes.some((id: Types.ObjectId) => String(id) === String(user.id));
  post.likes = hasLiked ? post.likes.filter((id: Types.ObjectId) => String(id) !== String(user.id)) : [...post.likes, user.id];
  await post.save();
  res.json({ success: true, liked: !hasLiked, likeCount: post.likes.length });
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const post = await CommunityPost.findById(routeParam(req.params.postId));
  if (!post || post.hidden) throw new HttpError(StatusCodes.NOT_FOUND, "POST_NOT_FOUND", "Post was not found.");
  const hasSaved = post.bookmarks.some((id: Types.ObjectId) => String(id) === String(user.id));
  post.bookmarks = hasSaved ? post.bookmarks.filter((id: Types.ObjectId) => String(id) !== String(user.id)) : [...post.bookmarks, user.id];
  await post.save();
  res.json({ success: true, bookmarked: !hasSaved, bookmarkCount: post.bookmarks.length });
});

export const listComments = asyncHandler(async (req, res) => {
  ensureUser(req);
  const postId = routeParam(req.params.postId);
  const comments = await CommunityComment.find({ post: postId, hidden: false })
    .sort({ createdAt: 1 })
    .populate({ path: "author", select: "displayName email photoURL profile", populate: { path: "profile" } });
  res.json({ success: true, comments });
});

export const addComment = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const postId = routeParam(req.params.postId);
  const post = await CommunityPost.findById(postId);
  if (!post || post.hidden) throw new HttpError(StatusCodes.NOT_FOUND, "POST_NOT_FOUND", "Post was not found.");
  const content = sanitizeMessageText(typeof req.body.content === "string" ? req.body.content : "");
  if (!content) throw new HttpError(StatusCodes.BAD_REQUEST, "COMMENT_REQUIRED", "Comment is required.");
  const moderation = await moderateMessage(content, user.id);
  if (!moderation.isAllowed) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, blocked: true, message: "Comment blocked by moderation.", moderation });

  const comment = await CommunityComment.create({
    post: postId,
    author: user.id,
    content,
    moderation: { category: moderation.category, severity: moderation.severity, reason: moderation.reason, suggestedRewrite: moderation.suggestedRewrite }
  });
  const populated = await CommunityComment.findById(comment._id).populate({ path: "author", select: "displayName email photoURL profile", populate: { path: "profile" } });
  res.status(StatusCodes.CREATED).json({ success: true, comment: populated, moderation });
});

export const reportPost = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const postId = routeParam(req.params.postId);
  const reason = typeof req.body.reason === "string" ? req.body.reason : "other";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
  const report = await CommunityReport.findOneAndUpdate(
    { reporter: user.id, post: postId },
    { reporter: user.id, post: postId, reason, description },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  await CommunityPost.findByIdAndUpdate(postId, { $inc: { reportCount: 1 } });
  res.status(StatusCodes.CREATED).json({ success: true, report });
});

export const suggestPostWording = asyncHandler(async (req, res) => {
  ensureUser(req);
  const content = sanitizeMessageText(typeof req.body.content === "string" ? req.body.content : "");
  if (!content) throw new HttpError(StatusCodes.BAD_REQUEST, "CONTENT_REQUIRED", "Post content is required.");

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.25, responseMimeType: "application/json" } });
    const result = await model.generateContent(`
Rewrite this student community feed post to sound professional, clear, concise, and collaborative.
Keep the original meaning. Do not add fake achievements, fake metrics, or invented links.
Return JSON only: {"suggestedContent":"...","tips":["..."]}
Post: ${JSON.stringify(content)}
`);
    const parsed = JSON.parse(result.response.text()) as { suggestedContent?: string; tips?: string[] };
    res.json({ success: true, suggestedContent: parsed.suggestedContent || content, tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 5) : [] });
  } catch {
    res.json({ success: true, suggestedContent: content, tips: ["Keep posts specific, respectful, and focused on learning or collaboration."] });
  }
});
