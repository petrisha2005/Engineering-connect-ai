import { Schema, model, type InferSchemaType } from "mongoose";
import { stringList } from "./schemaUtils.js";

const startupReadinessSchema = new Schema(
  {
    startup: { type: Schema.Types.ObjectId, ref: "StartupProfile", required: true, index: true },
    startupReadiness: { type: Number, min: 0, max: 100, default: 0 },
    executionReadiness: { type: Number, min: 0, max: 100, default: 0 },
    marketReadiness: { type: Number, min: 0, max: 100, default: 0 },
    teamReadiness: { type: Number, min: 0, max: 100, default: 0 },
    investorReadinessScore: { type: Number, min: 0, max: 100, default: 0 },
    overallStartupScore: { type: Number, min: 0, max: 100, default: 0 },
    strengths: stringList(20, 220),
    weaknesses: stringList(20, 220),
    risks: stringList(20, 220),
    nextSteps: stringList(20, 260),
    calculatedAt: { type: Date, default: Date.now, index: true },
    model: { type: String, trim: true, default: "gemini" }
  },
  { timestamps: true }
);

startupReadinessSchema.index({ startup: 1, calculatedAt: -1 });

export type StartupReadinessDocument = InferSchemaType<typeof startupReadinessSchema>;
export const StartupReadiness = model("StartupReadiness", startupReadinessSchema);
