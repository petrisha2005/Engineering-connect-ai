import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";
import { researchDomains } from "./ResearchProfile.js";

const publicationStageSchema = new Schema(
  {
    stage: {
      type: String,
      enum: ["Literature Review", "Problem Definition", "Dataset Collection", "Experimentation", "Results", "Paper Writing", "Submission", "Publication"],
      required: true
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ["pending", "active", "done"], default: "pending" }
  },
  { _id: false }
);

const researchMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, trim: true, maxlength: 100, default: "Research Collaborator" },
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const researchProjectSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: requiredString(180),
    abstract: requiredString(3000),
    domain: { type: String, enum: researchDomains, required: true, index: true },
    problemStatement: requiredString(2000),
    objectives: stringList(20, 240),
    requiredSkills: stringList(40, 100),
    teamSize: { type: Number, min: 1, max: 20, default: 4 },
    duration: { type: String, trim: true, maxlength: 120, default: "3-6 months" },
    publicationGoal: { type: String, trim: true, maxlength: 220, default: "Conference or journal submission" },
    facultyMentor: { type: Schema.Types.ObjectId, ref: "ResearchFacultyMentor" },
    status: { type: String, enum: ["Open", "Recruiting", "Active", "Publishing", "Completed"], default: "Open", index: true },
    members: { type: [researchMemberSchema], default: [] },
    publicationStages: { type: [publicationStageSchema], default: [] },
    missingSkills: stringList(30, 120),
    missingRoles: stringList(20, 140)
  },
  { timestamps: true }
);

researchProjectSchema.index({ title: "text", abstract: "text", problemStatement: "text", objectives: "text", requiredSkills: "text" });
researchProjectSchema.index({ domain: 1, status: 1, updatedAt: -1 });

researchProjectSchema.pre("validate", function normalizeResearchProject(next) {
  const project = this as any;
  project.objectives = uniqueLowercase(project.objectives);
  project.requiredSkills = uniqueLowercase(project.requiredSkills);
  if (!project.publicationStages?.length) {
    project.publicationStages = ["Literature Review", "Problem Definition", "Dataset Collection", "Experimentation", "Results", "Paper Writing", "Submission", "Publication"].map((stage, index) => ({
      stage,
      progress: index === 0 ? 10 : 0,
      status: index === 0 ? "active" : "pending"
    }));
  }
  next();
});

export type ResearchProjectDocument = InferSchemaType<typeof researchProjectSchema>;
export const ResearchProject = model("ResearchProject", researchProjectSchema);
