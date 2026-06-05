import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

const startupIdeaSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupName: requiredString(160),
    industry: requiredString(120),
    problemStatement: requiredString(1600),
    targetUsers: requiredString(800),
    currentStage: { type: String, enum: ["idea", "prototype", "mvp", "early_users", "revenue"], default: "idea", index: true },
    fundingStatus: { type: String, enum: ["bootstrapped", "seeking", "funded", "not_needed"], default: "bootstrapped", index: true },
    requiredRoles: stringList(12, 100),
    description: optionalString(2000)
  },
  { timestamps: true }
);

startupIdeaSchema.index({ owner: 1, createdAt: -1 });
startupIdeaSchema.index({ startupName: "text", industry: "text", problemStatement: "text", requiredRoles: "text" });
startupIdeaSchema.pre("validate", function normalizeStartupIdea(next) {
  const idea = this as any;
  idea.requiredRoles = uniqueLowercase(idea.requiredRoles);
  next();
});

export type StartupIdeaDocument = InferSchemaType<typeof startupIdeaSchema>;
export const StartupIdea = model("StartupIdea", startupIdeaSchema);
