import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString, stringList } from "./schemaUtils.js";

const careerRoleFitSchema = new Schema(
  {
    role: requiredString(120),
    fitScore: { type: Number, min: 0, max: 100, required: true },
    reason: requiredString(800)
  },
  { _id: false }
);

const suggestedProjectSchema = new Schema(
  {
    title: requiredString(160),
    description: requiredString(1000),
    skills: stringList(20, 100)
  },
  { _id: false }
);

const resumeReportSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: requiredString(240),
    atsScore: { type: Number, min: 0, max: 100, required: true },
    strengths: stringList(20, 240),
    weakSections: stringList(20, 240),
    missingSkills: stringList(30, 120),
    missingKeywords: stringList(40, 120),
    suggestedProjects: { type: [suggestedProjectSchema], default: [] },
    careerRoleFit: { type: [careerRoleFitSchema], default: [] },
    improvementTips: stringList(30, 280),
    resumeTextPreview: { type: String, trim: true, maxlength: 2000, default: "" },
    model: { type: String, trim: true, default: "gemini" }
  },
  { timestamps: true }
);

resumeReportSchema.index({ user: 1, createdAt: -1 });

export type ResumeReportDocument = InferSchemaType<typeof resumeReportSchema>;
export const ResumeReport = model("ResumeReport", resumeReportSchema);
