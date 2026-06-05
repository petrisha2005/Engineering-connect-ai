import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, requiredString } from "./schemaUtils.js";

const communityCommentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: requiredString(2000),
    hidden: { type: Boolean, default: false, index: true },
    moderation: {
      category: optionalString(60),
      severity: optionalString(20),
      reason: optionalString(500),
      suggestedRewrite: optionalString(1000)
    }
  },
  { timestamps: true }
);

communityCommentSchema.index({ post: 1, createdAt: 1 });

export type CommunityCommentDocument = InferSchemaType<typeof communityCommentSchema>;
export const CommunityComment = model("CommunityComment", communityCommentSchema);
