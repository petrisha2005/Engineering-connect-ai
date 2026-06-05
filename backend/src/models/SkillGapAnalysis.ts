import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const skillGapItemSchema = new Schema(
  {
    skill: requiredString(120),
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    reason: { type: String, trim: true, maxlength: 800, default: "" },
    currentEvidence: { type: String, trim: true, maxlength: 400, default: "" }
  },
  { _id: false }
);

const skillGapAnalysisSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    careerTwin: { type: Schema.Types.ObjectId, ref: "CareerTwinProfile", required: true, index: true },
    goal: requiredString(160),
    currentSkills: { type: [String], default: [] },
    missingSkills: { type: [skillGapItemSchema], default: [] }
  },
  { timestamps: true }
);

skillGapAnalysisSchema.index({ user: 1, createdAt: -1 });

export type SkillGapAnalysisDocument = InferSchemaType<typeof skillGapAnalysisSchema>;
export const SkillGapAnalysis = model("SkillGapAnalysis", skillGapAnalysisSchema);
