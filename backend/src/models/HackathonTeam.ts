import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

const roleSchema = new Schema(
  {
    role: requiredString(80),
    roleName: { type: String, trim: true, maxlength: 80 },
    skills: stringList(20, 80),
    requiredSkills: stringList(20, 80),
    importance: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String, enum: ["open", "filled"], default: "open", index: true },
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

const invitedUserSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, trim: true, maxlength: 80, default: "Member" },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true },
    invitedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date }
  },
  { _id: true }
);

const hackathonTeamSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: requiredString(120),
    hackathonName: requiredString(160),
    theme: { type: String, trim: true, maxlength: 160 },
    problemStatement: { type: String, trim: true, maxlength: 1600 },
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
    invitedUsers: {
      type: [invitedUserSchema],
      default: [],
      validate: {
        validator: (invites: unknown[]) => invites.length <= 50,
        message: "A hackathon team can contain at most 50 invites"
      }
    },
    skillsNeeded: stringList(40, 80),
    requiredSkills: stringList(40, 80),
    status: { type: String, enum: ["forming", "ready", "competing", "archived", "open", "full", "completed", "closed"], default: "forming", index: true },
    maxMembers: { type: Number, default: 4, min: 1, max: 10 },
    teamSize: { type: Number, default: 4, min: 1, max: 10 },
    lookingFor: { type: String, trim: true, maxlength: 800 },
    deadline: { type: Date },
    mode: { type: String, enum: ["online", "offline", "hybrid"], default: "online", index: true },
    location: { type: String, trim: true, maxlength: 180 }
  },
  { timestamps: true }
);

hackathonTeamSchema.index({ name: "text", hackathonName: "text", description: "text", skillsNeeded: "text" });
hackathonTeamSchema.index({ skillsNeeded: 1, status: 1 });
hackathonTeamSchema.index({ status: 1, createdAt: -1 });

hackathonTeamSchema.pre("validate", function normalizeTeamArrays(next) {
  const team = this as any;
  team.creatorId = team.creatorId ?? team.owner;
  team.maxMembers = team.maxMembers ?? team.teamSize;
  team.teamSize = team.teamSize ?? team.maxMembers;
  team.requiredSkills = uniqueLowercase([...(team.requiredSkills ?? []), ...(team.skillsNeeded ?? [])]);
  team.skillsNeeded = uniqueLowercase([...(team.skillsNeeded ?? []), ...(team.requiredSkills ?? [])]);
  team.skillsNeeded = uniqueLowercase(team.skillsNeeded);
  team.requiredRoles.forEach((role: { skills: string[] }) => {
    (role as any).role = (role as any).role || (role as any).roleName;
    (role as any).roleName = (role as any).roleName || (role as any).role;
    role.skills = uniqueLowercase([...(role.skills ?? []), ...((role as any).requiredSkills ?? [])]);
    (role as any).requiredSkills = uniqueLowercase([...(role.skills ?? []), ...((role as any).requiredSkills ?? [])]);
    (role as any).status = (role as any).filledBy ? "filled" : "open";
  });
  next();
});

export type HackathonTeamDocument = InferSchemaType<typeof hackathonTeamSchema>;
export const HackathonTeam = model("HackathonTeam", hackathonTeamSchema);
