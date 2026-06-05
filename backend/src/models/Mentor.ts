import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, optionalUrl, requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

export const mentorAvailabilityOptions = ["resume_review", "project_guidance", "interview_prep", "career_guidance", "hackathon_mentoring"] as const;

const mentorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    name: requiredString(120),
    currentRole: requiredString(160),
    organization: requiredString(180),
    expertise: requiredString(1200),
    yearsOfExperience: { type: Number, required: true, min: 0, max: 60 },
    skills: stringList(60, 100),
    domains: stringList(40, 120),
    availableFor: {
      type: [{ type: String, enum: mentorAvailabilityOptions }],
      default: [],
      validate: {
        validator: (items: string[]) => items.length > 0 && items.length <= mentorAvailabilityOptions.length,
        message: "Choose at least one mentorship area"
      }
    },
    linkedin: optionalUrl(),
    github: optionalUrl(),
    headline: optionalString(180),
    active: { type: Boolean, default: true, index: true },
    embeddingText: { type: String, default: "", maxlength: 8000 }
  },
  { timestamps: true }
);

mentorSchema.index({
  name: "text",
  currentRole: "text",
  organization: "text",
  expertise: "text",
  skills: "text",
  domains: "text"
});
mentorSchema.index({ active: 1, updatedAt: -1 });

mentorSchema.pre("validate", function normalizeMentor(next) {
  const mentor = this as any;
  mentor.skills = uniqueLowercase(mentor.skills);
  mentor.domains = uniqueLowercase(mentor.domains);
  mentor.availableFor = [...new Set((mentor.availableFor ?? []).map((value: string) => value.trim()).filter(Boolean))];
  mentor.embeddingText = [
    mentor.name,
    mentor.currentRole,
    mentor.organization,
    mentor.expertise,
    mentor.headline,
    ...mentor.skills,
    ...mentor.domains,
    ...mentor.availableFor
  ]
    .filter(Boolean)
    .join(" ");
  next();
});

export type MentorDocument = InferSchemaType<typeof mentorSchema>;
export const Mentor = model("Mentor", mentorSchema);
