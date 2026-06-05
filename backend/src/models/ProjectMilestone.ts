import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const projectMilestoneSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: requiredString(120),
    status: { type: String, enum: ["pending", "active", "done"], default: "pending", index: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    dueDate: { type: Date }
  },
  { timestamps: true }
);

projectMilestoneSchema.index({ project: 1, createdAt: 1 });

export type ProjectMilestoneDocument = InferSchemaType<typeof projectMilestoneSchema>;
export const ProjectMilestone = model("ProjectMilestone", projectMilestoneSchema);
