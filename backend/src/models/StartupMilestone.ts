import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString, stringList } from "./schemaUtils.js";

const startupMilestoneSchema = new Schema(
  {
    startup: { type: Schema.Types.ObjectId, ref: "StartupProfile", required: true, index: true },
    phase: { type: String, enum: ["Research", "Prototype", "MVP", "Beta Testing", "Launch"], required: true, index: true },
    title: requiredString(160),
    tasks: stringList(20, 220),
    timeline: { type: String, trim: true, maxlength: 120, default: "2-4 weeks" },
    requiredSkills: stringList(30, 100),
    progress: { type: Number, min: 0, max: 100, default: 0 },
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

startupMilestoneSchema.index({ startup: 1, phase: 1 });

export type StartupMilestoneDocument = InferSchemaType<typeof startupMilestoneSchema>;
export const StartupMilestone = model("StartupMilestone", startupMilestoneSchema);
