import { Schema, model, type InferSchemaType } from "mongoose";

const scoreSnapshotSchema = new Schema(
  {
    matchScore: { type: Number, min: 0, max: 100, default: 0 },
    readinessScore: { type: Number, min: 0, max: 100, default: 0 },
    successProbability: { type: Number, min: 0, max: 100, default: 0 },
    missingSkills: { type: [String], default: [] },
    recommendedActions: { type: [String], default: [] }
  },
  { _id: false }
);

const opportunityApplicationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    opportunity: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
    saved: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ["saved", "planning", "applied", "interview", "offer", "rejected", "withdrawn"], default: "saved", index: true },
    notes: { type: String, trim: true, maxlength: 1200, default: "" },
    scoreSnapshot: { type: scoreSnapshotSchema, default: () => ({}) },
    appliedAt: { type: Date }
  },
  { timestamps: true }
);

opportunityApplicationSchema.index({ user: 1, opportunity: 1 }, { unique: true });
opportunityApplicationSchema.index({ user: 1, status: 1, updatedAt: -1 });

opportunityApplicationSchema.pre("validate", function syncSavedAndApplied(next) {
  if (this.status === "applied" && !this.appliedAt) this.appliedAt = new Date();
  if (this.status !== "withdrawn") this.saved = true;
  next();
});

export type OpportunityApplicationDocument = InferSchemaType<typeof opportunityApplicationSchema>;
export const OpportunityApplication = model("OpportunityApplication", opportunityApplicationSchema);
