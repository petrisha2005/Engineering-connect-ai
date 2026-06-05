import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, stringList } from "./schemaUtils.js";

const mentorRequestSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentorProfile: { type: Schema.Types.ObjectId, ref: "Mentor", required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true },
    message: optionalString(1200),
    compatibilityScore: { type: Number, min: 0, max: 100, default: 0 },
    matchingReasons: stringList(10, 220),
    decidedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

mentorRequestSchema.index({ student: 1, mentor: 1 }, { unique: true });
mentorRequestSchema.index({ mentor: 1, status: 1, createdAt: -1 });
mentorRequestSchema.index({ student: 1, status: 1, createdAt: -1 });

mentorRequestSchema.pre("validate", function preventSelfRequest(next) {
  const request = this as any;
  if (request.student && request.mentor && String(request.student) === String(request.mentor)) {
    next(new Error("Students cannot request themselves as mentors"));
    return;
  }
  next();
});

export type MentorRequestDocument = InferSchemaType<typeof mentorRequestSchema>;
export const MentorRequest = model("MentorRequest", mentorRequestSchema);
