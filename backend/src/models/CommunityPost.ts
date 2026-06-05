import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

export const communityPostTypes = ["project_update", "hackathon", "learning_progress", "question", "collaboration_request", "achievement"] as const;

const communityPostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: communityPostTypes, required: true, index: true },
    content: requiredString(5000),
    tags: stringList(20, 60),
    likes: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    bookmarks: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    reportCount: { type: Number, default: 0, min: 0 },
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

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ type: 1, createdAt: -1 });
communityPostSchema.index({ content: "text", tags: "text" });

communityPostSchema.pre("validate", function normalizeCommunityPost(next) {
  const post = this as any;
  post.tags = uniqueLowercase(post.tags);
  next();
});

export type CommunityPostDocument = InferSchemaType<typeof communityPostSchema>;
export const CommunityPost = model("CommunityPost", communityPostSchema);
