import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString, stringList } from "./schemaUtils.js";

const timelineItemSchema = new Schema(
  {
    stage: requiredString(80),
    progress: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ["pending", "active", "done"], default: "pending" }
  },
  { _id: false }
);

const projectHealthSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true, index: true },
    healthScore: { type: Number, min: 0, max: 100, default: 0 },
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    successProbability: { type: String, enum: ["Low", "Medium", "High"], default: "Medium", index: true },
    completionPrediction: { type: String, trim: true, maxlength: 120, default: "Needs review" },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    riskLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Medium", index: true },
    strengths: stringList(20, 220),
    weaknesses: stringList(20, 220),
    risks: stringList(20, 220),
    recommendations: stringList(20, 260),
    missingSkills: stringList(40, 120),
    coveredSkills: stringList(40, 120),
    missingRoles: stringList(20, 120),
    alerts: stringList(20, 220),
    timeline: { type: [timelineItemSchema], default: [] },
    model: { type: String, trim: true, default: "gemini" },
    lastRefreshedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

projectHealthSchema.index({ project: 1, updatedAt: -1 });

export type ProjectHealthDocument = InferSchemaType<typeof projectHealthSchema>;
export const ProjectHealth = model("ProjectHealth", projectHealthSchema);
