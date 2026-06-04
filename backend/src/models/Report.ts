import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    messageId: { type: Schema.Types.ObjectId, ref: "Message" },
    reason: {
      type: String,
      enum: ["spam", "harassment", "abusive_language", "fake_profile", "promotional", "other"],
      required: true,
      index: true
    },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: ["pending", "reviewed", "dismissed"], default: "pending", index: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

reportSchema.index({ reportedUserId: 1, createdAt: -1 });

export type ReportDocument = InferSchemaType<typeof reportSchema>;
export const Report = model("Report", reportSchema);
