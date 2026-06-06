import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

const researchFacultyMentorSchema = new Schema(
  {
    name: requiredString(140),
    department: requiredString(160),
    expertise: requiredString(1200),
    researchAreas: stringList(50, 120),
    publications: stringList(50, 220),
    availability: { type: String, enum: ["open", "limited", "unavailable"], default: "open", index: true },
    contactInformation: optionalString(300),
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    followers: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] }
  },
  { timestamps: true }
);

researchFacultyMentorSchema.index({ name: "text", department: "text", expertise: "text", researchAreas: "text", publications: "text" });
researchFacultyMentorSchema.pre("validate", function normalizeFaculty(next) {
  const mentor = this as any;
  mentor.researchAreas = uniqueLowercase(mentor.researchAreas);
  next();
});

export type ResearchFacultyMentorDocument = InferSchemaType<typeof researchFacultyMentorSchema>;
export const ResearchFacultyMentor = model("ResearchFacultyMentor", researchFacultyMentorSchema);
