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

const improvedProjectSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 180, default: "" },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    bullets: stringList(12, 260)
  },
  { _id: false }
);

const improvedResumeSchema = new Schema(
  {
    fullName: { type: String, trim: true, maxlength: 160, default: "" },
    email: { type: String, trim: true, maxlength: 254, default: "" },
    phone: { type: String, trim: true, maxlength: 80, default: "" },
    linkedin: { type: String, trim: true, maxlength: 240, default: "" },
    github: { type: String, trim: true, maxlength: 240, default: "" },
    summary: { type: String, trim: true, maxlength: 1600, default: "" },
    skills: stringList(80, 120),
    projects: { type: [improvedProjectSchema], default: [] },
    education: stringList(20, 240),
    certifications: stringList(30, 200),
    achievements: stringList(30, 240),
    experience: stringList(30, 280),
    atsTips: stringList(30, 240)
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
    formatIssues: stringList(30, 180),
    suggestedProjects: { type: [suggestedProjectSchema], default: [] },
    careerRoleFit: { type: [careerRoleFitSchema], default: [] },
    roleFit: { type: String, trim: true, maxlength: 800, default: "" },
    improvementTips: stringList(30, 280),
    improvedResume: { type: improvedResumeSchema, default: () => ({}) },
    resumeTextPreview: { type: String, trim: true, maxlength: 2000, default: "" },
    model: { type: String, trim: true, default: "gemini" }
  },
  { timestamps: true }
);

resumeReportSchema.index({ user: 1, createdAt: -1 });

export type ResumeReportDocument = InferSchemaType<typeof resumeReportSchema>;
export const ResumeReport = model("ResumeReport", resumeReportSchema);
