import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, stringList } from "./schemaUtils.js";

const founderRequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requesterProfile: { type: Schema.Types.ObjectId, ref: "FounderProfile", required: true },
    recipientProfile: { type: Schema.Types.ObjectId, ref: "FounderProfile", required: true },
    startupIdea: { type: Schema.Types.ObjectId, ref: "StartupIdea" },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true },
    matchScore: { type: Number, min: 0, max: 100, default: 0 },
    compatibilityReason: optionalString(1200),
    suggestedRole: optionalString(160),
    risks: stringList(10, 220),
    strengths: stringList(10, 220),
    decidedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

founderRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });
founderRequestSchema.index({ requester: 1, status: 1, createdAt: -1 });
founderRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 });

export type FounderRequestDocument = InferSchemaType<typeof founderRequestSchema>;
export const FounderRequest = model("FounderRequest", founderRequestSchema);
