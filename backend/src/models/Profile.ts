import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, optionalUrl, requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

const profileProjectSchema = new Schema(
  {
    title: requiredString(120),
    description: requiredString(1200),
    links: {
      type: [{ ...optionalUrl() }],
      default: [],
      validate: {
        validator: (items: string[]) => items.length <= 8,
        message: "A profile project can contain at most 8 links"
      }
    },
    skills: stringList(20, 80)
  },
  { _id: false }
);

const profileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    name: requiredString(120),
    college: requiredString(180),
    branch: requiredString(120),
    year: { type: Number, required: true, min: 1, max: 6 },
    skills: stringList(50, 80),
    interests: stringList(50, 80),
    goals: stringList(30, 120),
    projects: {
      type: [profileProjectSchema],
      default: [],
      validate: {
        validator: (items: unknown[]) => items.length <= 20,
        message: "A profile can contain at most 20 projects"
      }
    },
    github: optionalUrl(),
    linkedin: optionalUrl(),
    achievements: stringList(50, 180),
    availability: { type: String, enum: ["open", "selective", "unavailable"], default: "open", index: true },
    headline: optionalString(160),
    bio: optionalString(1200),
    location: optionalString(120),
    embeddingText: { type: String, default: "", maxlength: 8000 }
  },
  { timestamps: true }
);

profileSchema.index({
  name: "text",
  college: "text",
  branch: "text",
  skills: "text",
  interests: "text",
  goals: "text"
});

profileSchema.pre("validate", function normalizeProfileArrays(next) {
  const profile = this as any;
  profile.skills = uniqueLowercase(profile.skills);
  profile.interests = uniqueLowercase(profile.interests);
  profile.goals = uniqueLowercase(profile.goals);
  profile.achievements = [...new Set((profile.achievements ?? []).map((value: string) => value.trim()).filter(Boolean))];
  profile.embeddingText = [
    profile.name,
    profile.college,
    profile.branch,
    ...profile.skills,
    ...profile.interests,
    ...profile.goals
  ].join(" ");
  next();
});

export type ProfileDocument = InferSchemaType<typeof profileSchema>;
export const Profile = model("Profile", profileSchema);
