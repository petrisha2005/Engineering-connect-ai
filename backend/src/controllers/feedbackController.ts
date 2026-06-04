import { StatusCodes } from "http-status-codes";
import { Feedback } from "../models/Feedback.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const feedbackTypes = new Set(["Bug", "Suggestion", "UI Issue", "Feature Request", "Other"]);

export const submitFeedback = asyncHandler(async (req, res) => {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");

  const type = typeof req.body.type === "string" ? req.body.type.trim() : "";
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  const rating = req.body.rating === undefined || req.body.rating === null || req.body.rating === "" ? null : Number(req.body.rating);

  const errors: Record<string, string> = {};
  if (!feedbackTypes.has(type)) errors.type = "Please select a valid feedback type.";
  if (!message) errors.message = "Feedback message is required.";
  if (message.length > 2000) errors.message = "Feedback message must be 2000 characters or less.";
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) errors.rating = "Rating must be between 1 and 5.";

  if (Object.keys(errors).length) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Please fix the feedback form.", errors });
  }

  const feedback = await Feedback.create({
    userId: req.user.id,
    type,
    message,
    rating
  });

  res.status(StatusCodes.CREATED).json({ success: true, feedback });
});
