import { z } from "zod";

const requiredRoleSchema = z.object({
  role: z.string().trim().min(1).max(80),
  skills: z.array(z.string().trim().min(1).max(80)).max(20).default([])
});

export const createHackathonTeamSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    hackathonName: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(3000),
    requiredRoles: z.array(requiredRoleSchema).max(10).default([]),
    skillsNeeded: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
    maxMembers: z.coerce.number().int().min(1).max(10).default(4),
    lookingFor: z.string().trim().max(800).optional().or(z.literal(""))
  })
});

export const listHackathonTeamsSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional(),
    skill: z.string().trim().max(80).optional(),
    status: z.enum(["forming", "ready", "competing", "archived"]).optional(),
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

