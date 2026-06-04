import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalUrl, requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: requiredString(80),
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const inviteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invitedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: requiredString(140),
    description: requiredString(3000),
    requiredSkills: stringList(40, 80),
    interests: stringList(30, 80),
    status: { type: String, enum: ["open", "in_progress", "completed", "archived"], default: "open", index: true },
    members: {
      type: [memberSchema],
      default: [],
      validate: {
        validator: (members: unknown[]) => members.length <= 20,
        message: "A project can contain at most 20 members"
      }
    },
    invites: {
      type: [inviteSchema],
      default: [],
      validate: {
        validator: (invites: unknown[]) => invites.length <= 100,
        message: "A project can contain at most 100 invites"
      }
    },
    maxMembers: { type: Number, default: 5, min: 1, max: 20 },
    repositoryUrl: optionalUrl(),
    demoUrl: optionalUrl()
  },
  { timestamps: true }
);

projectSchema.index({ title: "text", description: "text", requiredSkills: "text", interests: "text" });
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ requiredSkills: 1, status: 1 });

projectSchema.pre("validate", function normalizeProjectArrays(next) {
  const project = this as any;
  project.requiredSkills = uniqueLowercase(project.requiredSkills);
  project.interests = uniqueLowercase(project.interests);
  next();
});

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export const Project = model("Project", projectSchema);
