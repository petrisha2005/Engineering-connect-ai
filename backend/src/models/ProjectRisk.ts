import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const projectRiskSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    category: requiredString(120),
    severity: { type: String, enum: ["Low", "Medium", "High"], default: "Medium", index: true },
    reason: requiredString(800),
    recommendedAction: { type: String, trim: true, maxlength: 400, default: "" },
    status: { type: String, enum: ["open", "resolved"], default: "open", index: true }
  },
  { timestamps: true }
);

projectRiskSchema.index({ project: 1, createdAt: -1 });

export type ProjectRiskDocument = InferSchemaType<typeof projectRiskSchema>;
export const ProjectRisk = model("ProjectRisk", projectRiskSchema);
