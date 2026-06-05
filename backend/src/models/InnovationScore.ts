import { Schema, model, type InferSchemaType } from "mongoose";
import { stringList } from "./schemaUtils.js";

const scoreBreakdownSchema = new Schema(
  {
    technical: { type: Number, min: 0, max: 100, default: 0 },
    innovation: { type: Number, min: 0, max: 100, default: 0 },
    collaboration: { type: Number, min: 0, max: 100, default: 0 },
    leadership: { type: Number, min: 0, max: 100, default: 0 },
    careerReadiness: { type: Number, min: 0, max: 100, default: 0 },
    startupReadiness: { type: Number, min: 0, max: 100, default: 0 },
    researchReadiness: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
);

const badgeSchema = new Schema(
  {
    key: { type: String, trim: true, required: true },
    label: { type: String, trim: true, required: true },
    reason: { type: String, trim: true, maxlength: 240, default: "" },
    earned: { type: Boolean, default: false }
  },
  { _id: false }
);

const activityMetricsSchema = new Schema(
  {
    skills: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
    hackathons: { type: Number, default: 0 },
    communityPosts: { type: Number, default: 0 },
    communityLikes: { type: Number, default: 0 },
    completedExchanges: { type: Number, default: 0 },
    acceptedMentorships: { type: Number, default: 0 },
    profileCompletion: { type: Number, min: 0, max: 100, default: 0 },
    teamParticipation: { type: Number, default: 0 },
    projectSuccessRate: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
);

const innovationScoreSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    profile: { type: Schema.Types.ObjectId, ref: "Profile", index: true },
    college: { type: String, trim: true, lowercase: true, index: true, default: "" },
    branch: { type: String, trim: true, lowercase: true, index: true, default: "" },
    overallScore: { type: Number, min: 0, max: 100, default: 0, index: true },
    scores: { type: scoreBreakdownSchema, default: () => ({}) },
    metrics: { type: activityMetricsSchema, default: () => ({}) },
    badges: { type: [badgeSchema], default: [] },
    strengths: stringList(20, 220),
    weaknesses: stringList(20, 220),
    improvementPlan: stringList(20, 260),
    explanation: { type: String, trim: true, maxlength: 1400, default: "" },
    model: { type: String, trim: true, default: "gemini" },
    calculatedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

innovationScoreSchema.index({ user: 1, calculatedAt: -1 });
innovationScoreSchema.index({ college: 1, overallScore: -1 });
innovationScoreSchema.index({ branch: 1, overallScore: -1 });

export type InnovationScoreDocument = InferSchemaType<typeof innovationScoreSchema>;
export const InnovationScore = model("InnovationScore", innovationScoreSchema);
