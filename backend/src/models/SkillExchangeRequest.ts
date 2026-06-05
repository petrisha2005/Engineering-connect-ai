import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, stringList } from "./schemaUtils.js";

const exchangePlanWeekSchema = new Schema(
  {
    week: { type: Number, min: 1, max: 12, required: true },
    focus: { type: String, trim: true, maxlength: 180, required: true },
    tasks: stringList(8, 220)
  },
  { _id: false }
);

const skillExchangeRequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requesterProfile: { type: Schema.Types.ObjectId, ref: "SkillExchangeProfile", required: true },
    recipientProfile: { type: Schema.Types.ObjectId, ref: "SkillExchangeProfile", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected", "cancelled", "completed"], default: "pending", index: true },
    matchScore: { type: Number, min: 0, max: 100, default: 0 },
    compatibilityReason: optionalString(1000),
    suggestedExchangePlan: optionalString(2000),
    planWeeks: { type: [exchangePlanWeekSchema], default: [] },
    requesterRating: { type: Number, min: 1, max: 5 },
    recipientRating: { type: Number, min: 1, max: 5 },
    requesterFeedback: optionalString(1000),
    recipientFeedback: optionalString(1000),
    completedAt: { type: Date, default: null },
    decidedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

skillExchangeRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });
skillExchangeRequestSchema.index({ requester: 1, status: 1, createdAt: -1 });
skillExchangeRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 });

skillExchangeRequestSchema.pre("validate", function preventSelfExchange(next) {
  const request = this as any;
  if (request.requester && request.recipient && String(request.requester) === String(request.recipient)) {
    next(new Error("Users cannot exchange skills with themselves"));
    return;
  }
  next();
});

export type SkillExchangeRequestDocument = InferSchemaType<typeof skillExchangeRequestSchema>;
export const SkillExchangeRequest = model("SkillExchangeRequest", skillExchangeRequestSchema);
