import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const applicationSchema = new Schema(
  {
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["project", "hackathon_team"], required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    hackathonTeam: { type: Schema.Types.ObjectId, ref: "HackathonTeam" },
    message: requiredString(1200),
    rolePreference: { type: String, trim: true, maxlength: 100 },
    status: { type: String, enum: ["pending", "accepted", "rejected", "withdrawn"], default: "pending", index: true },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date }
  },
  { timestamps: true }
);

applicationSchema.index({ applicant: 1, project: 1 }, { unique: true, sparse: true });
applicationSchema.index({ applicant: 1, hackathonTeam: 1 }, { unique: true, sparse: true });
applicationSchema.index({ project: 1, status: 1 });
applicationSchema.index({ hackathonTeam: 1, status: 1 });

applicationSchema.pre("validate", function validateTarget(next) {
  const hasProject = Boolean(this.project);
  const hasTeam = Boolean(this.hackathonTeam);

  if (this.targetType === "project" && (!hasProject || hasTeam)) {
    this.invalidate("project", "Project applications must reference exactly one project");
  }

  if (this.targetType === "hackathon_team" && (!hasTeam || hasProject)) {
    this.invalidate("hackathonTeam", "Hackathon team applications must reference exactly one team");
  }

  if ((this.status === "accepted" || this.status === "rejected") && !this.decidedAt) {
    this.decidedAt = new Date();
  }

  next();
});

export type ApplicationDocument = InferSchemaType<typeof applicationSchema>;
export const Application = model("Application", applicationSchema);
