import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, stringList, uniqueLowercase } from "./schemaUtils.js";

const skillExchangeProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    teachSkills: stringList(50, 80),
    learnSkills: stringList(50, 80),
    experienceLevel: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"], default: "beginner", index: true },
    availability: { type: String, enum: ["weekdays", "weekends", "flexible"], default: "flexible", index: true },
    preferredLearningMode: { type: String, enum: ["online", "in_person", "hybrid"], default: "online", index: true },
    completedExchanges: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reputationPoints: { type: Number, default: 0, min: 0 },
    headline: optionalString(180)
  },
  { timestamps: true }
);

skillExchangeProfileSchema.index({ teachSkills: "text", learnSkills: "text", experienceLevel: "text" });

skillExchangeProfileSchema.pre("validate", function normalizeSkillExchangeProfile(next) {
  const profile = this as any;
  profile.teachSkills = uniqueLowercase(profile.teachSkills);
  profile.learnSkills = uniqueLowercase(profile.learnSkills);
  next();
});

export type SkillExchangeProfileDocument = InferSchemaType<typeof skillExchangeProfileSchema>;
export const SkillExchangeProfile = model("SkillExchangeProfile", skillExchangeProfileSchema);
