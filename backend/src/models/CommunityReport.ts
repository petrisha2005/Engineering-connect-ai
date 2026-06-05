import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString } from "./schemaUtils.js";

const communityReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    post: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true, index: true },
    reason: { type: String, enum: ["spam", "abusive", "harassment", "unprofessional", "promotional", "other"], default: "other", index: true },
    description: optionalString(1000),
    status: { type: String, enum: ["pending", "reviewed", "dismissed"], default: "pending", index: true }
  },
  { timestamps: true }
);

communityReportSchema.index({ reporter: 1, post: 1 }, { unique: true });
communityReportSchema.index({ post: 1, createdAt: -1 });

export type CommunityReportDocument = InferSchemaType<typeof communityReportSchema>;
export const CommunityReport = model("CommunityReport", communityReportSchema);
