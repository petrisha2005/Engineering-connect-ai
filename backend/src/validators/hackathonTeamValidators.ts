import { z } from "zod";

const requiredRoleSchema = z.object({
  role: z.string().trim().min(1).max(80).optional(),
  roleName: z.string().trim().min(1).max(80).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  requiredSkills: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  importance: z.enum(["Low", "Medium", "High"]).default("Medium"),
  status: z.enum(["open", "filled"]).optional()
}).refine((value) => value.role || value.roleName, {
  message: "Role name is required"
});

export const createHackathonTeamSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    hackathonName: z.string().trim().min(1).max(160),
    theme: z.string().trim().max(160).optional().or(z.literal("")),
    problemStatement: z.string().trim().max(1600).optional().or(z.literal("")),
    description: z.string().trim().min(1).max(3000),
    requiredRoles: z.array(requiredRoleSchema).max(10).default([]),
    skillsNeeded: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
    requiredSkills: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
    maxMembers: z.coerce.number().int().min(1).max(10).default(4),
    teamSize: z.coerce.number().int().min(1).max(10).optional(),
    lookingFor: z.string().trim().max(800).optional().or(z.literal("")),
    deadline: z.coerce.date().optional(),
    mode: z.enum(["online", "offline", "hybrid"]).default("online"),
    location: z.string().trim().max(180).optional().or(z.literal(""))
  })
});

export const listHackathonTeamsSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional(),
    skill: z.string().trim().max(80).optional(),
    status: z.enum(["forming", "ready", "competing", "archived", "open", "full", "completed", "closed"]).optional(),
    mine: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});

export const hackathonTeamIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid team id")
  })
});

export const applyHackathonTeamSchema = z.object({
  params: hackathonTeamIdSchema.shape.params,
  body: z.object({
    message: z.string().trim().min(1).max(1200),
    rolePreference: z.string().trim().max(100).optional().or(z.literal(""))
  })
});

export const decisionHackathonTeamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid team id"),
    applicationId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid application id")
  }),
  body: z.object({
    decision: z.enum(["accepted", "rejected"]),
    role: z.string().trim().min(1).max(80).default("Member")
  })
});

export const suggestionHackathonTeamSchema = z.object({
  params: hackathonTeamIdSchema.shape.params,
  body: z
    .object({
      limit: z.coerce.number().int().min(1).max(10).default(5)
    })
    .default({})
});

export const inviteHackathonTeamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid team id"),
    userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user id")
  }),
  body: z.object({
    role: z.string().trim().max(80).optional().or(z.literal(""))
  }).default({})
});
