import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, stringList, uniqueLowercase } from "./schemaUtils.js";

export const founderTypes = ["Technical Founder", "Business Founder", "Product Founder", "Marketing Founder", "Operations Founder"] as const;

const founderProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    startupInterests: stringList(40, 120),
    industries: stringList(30, 120),
    founderType: { type: String, enum: founderTypes, required: true, index: true },
    skills: stringList(60, 100),
    goals: stringList(30, 160),
    commitmentLevel: { type: String, enum: ["low", "medium", "high", "full_time"], default: "medium", index: true },
    startupStage: { type: String, enum: ["idea", "prototype", "mvp", "early_users", "revenue"], default: "idea", index: true },
    preferredLocation: optionalString(140),
    availability: { type: String, enum: ["weekdays", "weekends", "flexible"], default: "flexible", index: true },
    linkedProjects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    bio: optionalString(1200)
  },
  { timestamps: true }
);

founderProfileSchema.index({ startupInterests: "text", industries: "text", skills: "text", goals: "text", founderType: "text" });

founderProfileSchema.pre("validate", function normalizeFounderProfile(next) {
  const profile = this as any;
  profile.startupInterests = uniqueLowercase(profile.startupInterests);
  profile.industries = uniqueLowercase(profile.industries);
  profile.skills = uniqueLowercase(profile.skills);
  profile.goals = uniqueLowercase(profile.goals);
  next();
});

export type FounderProfileDocument = InferSchemaType<typeof founderProfileSchema>;
export const FounderProfile = model("FounderProfile", founderProfileSchema);
