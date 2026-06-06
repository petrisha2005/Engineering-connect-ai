import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, stringList, uniqueLowercase } from "./schemaUtils.js";

export const researchDomains = [
  "Artificial Intelligence",
  "Machine Learning",
  "Data Science",
  "Cybersecurity",
  "Blockchain",
  "IoT",
  "Robotics",
  "Cloud Computing",
  "Computer Vision",
  "NLP",
  "Software Engineering",
  "Sustainable Technology"
] as const;

const publicationSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 220, required: true },
    venue: optionalString(160),
    year: { type: Number, min: 1900, max: 2100 },
    url: optionalString(260)
  },
  { _id: false }
);

const researchProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    researchDomains: { type: [{ type: String, enum: researchDomains }], default: [], index: true },
    interests: stringList(50, 120),
    publications: { type: [publicationSchema], default: [] },
    researchExperience: { type: String, enum: ["beginner", "intermediate", "advanced", "published"], default: "beginner", index: true },
    preferredTopics: stringList(40, 160),
    researchGoals: stringList(30, 180),
    preferredCollaborationMode: { type: String, enum: ["remote", "in_person", "hybrid"], default: "remote", index: true },
    availability: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    skills: stringList(60, 100),
    bio: optionalString(1200)
  },
  { timestamps: true }
);

researchProfileSchema.index({ interests: "text", preferredTopics: "text", researchGoals: "text", skills: "text", bio: "text" });

researchProfileSchema.pre("validate", function normalizeResearchProfile(next) {
  const profile = this as any;
  profile.interests = uniqueLowercase(profile.interests);
  profile.preferredTopics = uniqueLowercase(profile.preferredTopics);
  profile.researchGoals = uniqueLowercase(profile.researchGoals);
  profile.skills = uniqueLowercase(profile.skills);
  next();
});

export type ResearchProfileDocument = InferSchemaType<typeof researchProfileSchema>;
export const ResearchProfile = model("ResearchProfile", researchProfileSchema);
