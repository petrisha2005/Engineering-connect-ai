import { Schema, model, type InferSchemaType } from "mongoose";
import { stringList } from "./schemaUtils.js";

const competitorSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 140, required: true },
    positioning: { type: String, trim: true, maxlength: 600, default: "" },
    differentiator: { type: String, trim: true, maxlength: 600, default: "" }
  },
  { _id: false }
);

const ideaValidationSchema = new Schema(
  {
    startup: { type: Schema.Types.ObjectId, ref: "StartupProfile", required: true, unique: true, index: true },
    validationScore: { type: Number, min: 0, max: 100, default: 0 },
    marketPotential: { type: Number, min: 0, max: 100, default: 0 },
    innovationScore: { type: Number, min: 0, max: 100, default: 0 },
    technicalDifficulty: { type: Number, min: 0, max: 100, default: 0 },
    risks: stringList(20, 220),
    recommendations: stringList(20, 260),
    competitors: { type: [competitorSchema], default: [] },
    opportunities: stringList(20, 240),
    generatedAt: { type: Date, default: Date.now },
    model: { type: String, trim: true, default: "gemini" }
  },
  { timestamps: true }
);

export type IdeaValidationDocument = InferSchemaType<typeof ideaValidationSchema>;
export const IdeaValidation = model("IdeaValidation", ideaValidationSchema);
