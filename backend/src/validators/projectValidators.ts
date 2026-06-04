import { z } from "zod";

const urlSchema = z.string().url().optional().or(z.literal(""));

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(140),
    description: z.string().trim().min(1).max(3000),
    requiredSkills: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
    interests: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    maxMembers: z.coerce.number().int().min(1).max(20).default(5),
    repositoryUrl: urlSchema,
    demoUrl: urlSchema
  })
});

export const listProjectsSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional(),
    skill: z.string().trim().max(80).optional(),
    interest: z.string().trim().max(80).optional(),
    status: z.enum(["open", "in_progress", "completed", "archived"]).optional(),
    mine: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});

export const projectIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid project id")
  })
});

export const applyProjectSchema = z.object({
  params: projectIdSchema.shape.params,
  body: z.object({
    message: z.string().trim().min(1).max(1200),
    rolePreference: z.string().trim().max(100).optional().or(z.literal(""))
  })
});

export const inviteProjectSchema = z.object({
  params: projectIdSchema.shape.params,
  body: z.object({
    userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user id")
  })
});

export const decisionProjectSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid project id"),
    applicationId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid application id")
  }),
  body: z.object({
    decision: z.enum(["accepted", "rejected"]),
    role: z.string().trim().min(1).max(80).default("Member")
  })
});

