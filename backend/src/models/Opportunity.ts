import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalString, optionalUrl, requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

const opportunitySchema = new Schema(
  {
    title: requiredString(180),
    provider: requiredString(140),
    type: {
      type: String,
      enum: ["Internship", "Hackathon", "Research Program", "Competition", "Scholarship", "Fellowship", "Open Source Program", "Startup Opportunity"],
      required: true,
      index: true
    },
    description: requiredString(2400),
    requiredSkills: stringList(40, 80),
    preferredSkills: stringList(40, 80),
    careerGoals: stringList(30, 120),
    eligibility: optionalString(1200),
    location: optionalString(160),
    applicationUrl: optionalUrl(),
    deadline: { type: Date, index: true },
    status: { type: String, enum: ["open", "rolling", "closed"], default: "open", index: true },
    source: { type: String, enum: ["manual", "external_api", "import"], default: "manual", index: true },
    sourceUrl: optionalUrl(),
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

opportunitySchema.index({ title: "text", provider: "text", description: "text", requiredSkills: "text", preferredSkills: "text", careerGoals: "text" });
opportunitySchema.index({ type: 1, status: 1, deadline: 1 });

opportunitySchema.pre("validate", function normalizeOpportunityArrays(next) {
  const opportunity = this as any;
  opportunity.requiredSkills = uniqueLowercase(opportunity.requiredSkills);
  opportunity.preferredSkills = uniqueLowercase(opportunity.preferredSkills);
  opportunity.careerGoals = uniqueLowercase(opportunity.careerGoals);
  next();
});

export type OpportunityDocument = InferSchemaType<typeof opportunitySchema>;
export const Opportunity = model("Opportunity", opportunitySchema);
