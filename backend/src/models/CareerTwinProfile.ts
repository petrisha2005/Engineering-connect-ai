import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString, stringList } from "./schemaUtils.js";

const readinessBreakdownSchema = new Schema(
  {
    technical: { type: Number, min: 0, max: 100, default: 0 },
    project: { type: Number, min: 0, max: 100, default: 0 },
    portfolio: { type: Number, min: 0, max: 100, default: 0 },
    communication: { type: Number, min: 0, max: 100, default: 0 },
    interview: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
);

const timelineItemSchema = new Schema(
  {
    stage: requiredString(120),
    description: requiredString(800),
    target: requiredString(120),
    status: { type: String, enum: ["current", "next", "future", "completed"], default: "future" }
  },
  { _id: false }
);

const projectImpactSchema = new Schema(
  {
    title: requiredString(180),
    impactScore: { type: Number, min: 0, max: 100, default: 0 },
    complexityScore: { type: Number, min: 0, max: 100, default: 0 },
    resumeValue: { type: Number, min: 0, max: 100, default: 0 },
    industryRelevance: { type: Number, min: 0, max: 100, default: 0 },
    reason: { type: String, trim: true, maxlength: 800, default: "" }
  },
  { _id: false }
);

const careerTwinProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    careerGoal: requiredString(160),
    currentLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "Industry Ready"], default: "Beginner", index: true },
    readinessScore: { type: Number, min: 0, max: 100, default: 0 },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
    estimatedTimeToGoal: { type: String, trim: true, maxlength: 80, default: "6-12 Months" },
    growthTrend: { type: String, enum: ["Improving", "Stable", "Needs Focus"], default: "Improving", index: true },
    readinessBreakdown: { type: readinessBreakdownSchema, default: () => ({}) },
    strengths: stringList(30, 220),
    weaknesses: stringList(30, 220),
    missingSkills: stringList(60, 120),
    missingProjects: stringList(30, 220),
    missingCertifications: stringList(30, 220),
    recommendedActionsThisWeek: stringList(20, 240),
    recommendedActionsThisMonth: stringList(20, 240),
    timeline: { type: [timelineItemSchema], default: [] },
    projectImpact: { type: [projectImpactSchema], default: [] },
    interviewReadiness: { type: Number, min: 0, max: 100, default: 0 },
    portfolioQuality: { type: Number, min: 0, max: 100, default: 0 },
    resumeQuality: { type: Number, min: 0, max: 100, default: 0 },
    industryReadiness: { type: Number, min: 0, max: 100, default: 0 },
    githubSummary: { type: String, trim: true, maxlength: 1200, default: "" },
    model: { type: String, trim: true, default: "gemini" },
    lastRefreshedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

careerTwinProfileSchema.index({ user: 1, updatedAt: -1 });

export type CareerTwinProfileDocument = InferSchemaType<typeof careerTwinProfileSchema>;
export const CareerTwinProfile = model("CareerTwinProfile", careerTwinProfileSchema);
