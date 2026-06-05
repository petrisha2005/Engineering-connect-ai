import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const moderationLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    messageId: { type: Schema.Types.ObjectId, ref: "Message" },
    messageTextPreview: { type: String, trim: true, maxlength: 240, default: "" },
    spamScore: { type: Number, min: 0, default: 0, index: true },
    category: {
      type: String,
      enum: ["safe", "spam", "harassment", "abusive", "sexual", "promotional", "suspicious_link", "unprofessional", "rate_limit", "restricted"],
      required: true,
      index: true
    },
    severity: { type: String, enum: ["low", "medium", "high"], required: true, index: true },
    reason: requiredString(500),
    action: { type: String, enum: ["allowed", "warned", "blocked", "restricted"], required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

moderationLogSchema.index({ userId: 1, createdAt: -1 });
moderationLogSchema.index({ userId: 1, action: 1, createdAt: -1 });

export type ModerationLogDocument = InferSchemaType<typeof moderationLogSchema>;
export const ModerationLog = model("ModerationLog", moderationLogSchema);
