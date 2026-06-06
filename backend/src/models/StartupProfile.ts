import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

export const startupStages = ["Idea", "Validation", "MVP", "Beta", "Launch", "Growth"] as const;

const startupProfileSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupName: requiredString(160),
    industry: requiredString(120),
    stage: { type: String, enum: startupStages, default: "Idea", index: true },
    problemStatement: requiredString(1600),
    solution: requiredString(1600),
    targetAudience: requiredString(800),
    businessModel: requiredString(1000),
    founderIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    currentProgress: { type: Number, min: 0, max: 100, default: 0 },
    fundingStatus: { type: String, enum: ["Bootstrapped", "Seeking", "Funded", "Not Needed"], default: "Bootstrapped", index: true },
    requiredSkills: stringList(50, 100),
    missingRoles: stringList(20, 120),
    activityLog: {
      type: [
        {
          type: { type: String, trim: true, maxlength: 120 },
          message: { type: String, trim: true, maxlength: 300 },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

startupProfileSchema.index({ owner: 1, updatedAt: -1 });
startupProfileSchema.index({ startupName: "text", industry: "text", problemStatement: "text", solution: "text", requiredSkills: "text" });
startupProfileSchema.pre("validate", function normalizeStartupProfile(next) {
  const startup = this as any;
  startup.requiredSkills = uniqueLowercase(startup.requiredSkills);
  startup.missingRoles = uniqueLowercase(startup.missingRoles);
  startup.founderIds = [...new Set([String(startup.owner), ...(startup.founderIds ?? []).map(String)])];
  next();
});

export type StartupProfileDocument = InferSchemaType<typeof startupProfileSchema>;
export const StartupProfile = model("StartupProfile", startupProfileSchema);
