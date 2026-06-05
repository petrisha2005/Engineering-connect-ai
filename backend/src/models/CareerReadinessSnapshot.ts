import { Schema, model, type InferSchemaType } from "mongoose";

const careerReadinessSnapshotSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    careerTwin: { type: Schema.Types.ObjectId, ref: "CareerTwinProfile", required: true, index: true },
    readinessScore: { type: Number, min: 0, max: 100, required: true },
    technicalReadiness: { type: Number, min: 0, max: 100, default: 0 },
    projectReadiness: { type: Number, min: 0, max: 100, default: 0 },
    portfolioReadiness: { type: Number, min: 0, max: 100, default: 0 },
    communicationReadiness: { type: Number, min: 0, max: 100, default: 0 },
    interviewReadiness: { type: Number, min: 0, max: 100, default: 0 },
    growthTrend: { type: String, enum: ["Improving", "Stable", "Needs Focus"], default: "Stable" }
  },
  { timestamps: true }
);

careerReadinessSnapshotSchema.index({ user: 1, createdAt: -1 });

export type CareerReadinessSnapshotDocument = InferSchemaType<typeof careerReadinessSnapshotSchema>;
export const CareerReadinessSnapshot = model("CareerReadinessSnapshot", careerReadinessSnapshotSchema);
