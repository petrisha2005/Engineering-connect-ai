import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, stringList } from "./schemaUtils.js";

const researchRequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", index: true },
    project: { type: Schema.Types.ObjectId, ref: "ResearchProject", index: true },
    facultyMentor: { type: Schema.Types.ObjectId, ref: "ResearchFacultyMentor", index: true },
    type: { type: String, enum: ["collaboration", "mentorship", "join_project"], required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true },
    message: optionalString(1200),
    matchScore: { type: Number, min: 0, max: 100, default: 0 },
    matchingReasons: stringList(10, 220),
    decidedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

researchRequestSchema.index({ requester: 1, project: 1, type: 1 });
researchRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 });

export type ResearchRequestDocument = InferSchemaType<typeof researchRequestSchema>;
export const ResearchRequest = model("ResearchRequest", researchRequestSchema);
