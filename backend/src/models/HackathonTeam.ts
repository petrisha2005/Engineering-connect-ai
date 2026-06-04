import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

const roleSchema = new Schema(
  {
    role: requiredString(80),
    skills: stringList(20, 80),
    filledBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { _id: false }
);

const teamMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: requiredString(80),
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const hackathonTeamSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: requiredString(120),
    hackathonName: requiredString(160),
    description: requiredString(3000),
    requiredRoles: {
      type: [roleSchema],
      default: [],
      validate: {
        validator: (roles: unknown[]) => roles.length <= 10,
        message: "A hackathon team can contain at most 10 required roles"
      }
    },
    members: {
      type: [teamMemberSchema],
      default: [],
      validate: {
        validator: (members: unknown[]) => members.length <= 10,
        message: "A hackathon team can contain at most 10 members"
      }
    },
    skillsNeeded: stringList(40, 80),
    status: { type: String, enum: ["forming", "ready", "competing", "archived"], default: "forming", index: true },
    maxMembers: { type: Number, default: 4, min: 1, max: 10 },
    lookingFor: { type: String, trim: true, maxlength: 800 }
  },
  { timestamps: true }
);

hackathonTeamSchema.index({ name: "text", hackathonName: "text", description: "text", skillsNeeded: "text" });
hackathonTeamSchema.index({ skillsNeeded: 1, status: 1 });
hackathonTeamSchema.index({ status: 1, createdAt: -1 });

hackathonTeamSchema.pre("validate", function normalizeTeamArrays(next) {
  const team = this as any;
  team.skillsNeeded = uniqueLowercase(team.skillsNeeded);
  team.requiredRoles.forEach((role: { skills: string[] }) => {
    role.skills = uniqueLowercase(role.skills);
  });
  next();
});

export type HackathonTeamDocument = InferSchemaType<typeof hackathonTeamSchema>;
export const HackathonTeam = model("HackathonTeam", hackathonTeamSchema);
