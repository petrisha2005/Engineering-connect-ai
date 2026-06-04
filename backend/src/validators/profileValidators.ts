import { z } from "zod";

const urlSchema = z.string().url().optional().or(z.literal(""));
const githubProfileUrlSchema = z
  .string({ required_error: "GitHub Link is required" })
  .trim()
  .min(1, "GitHub Link is required")
  .regex(
    /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+\/?$/,
    "Please enter a valid GitHub profile URL. Example: https://github.com/username"
  );
const linkedinProfileUrlSchema = z
  .string({ required_error: "LinkedIn Link is required" })
  .trim()
  .min(1, "LinkedIn Link is required")
  .regex(
    /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?$/,
    "Please enter a valid LinkedIn profile URL. Example: https://www.linkedin.com/in/username"
  );

const profileProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1200),
  links: z.array(z.string().url()).max(8).default([]),
  skills: z.array(z.string().trim().min(1).max(80)).max(20).default([])
});

export const upsertProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    college: z.string().trim().min(1).max(180),
    branch: z.string().trim().min(1).max(120),
    year: z.coerce.number().int().min(1).max(6),
    skills: z.array(z.string().trim().min(1).max(80)).min(1).max(50),
    interests: z.array(z.string().trim().min(1).max(80)).min(1).max(50),
    goals: z.array(z.string().trim().min(1).max(120)).min(1).max(30),
    projects: z.array(profileProjectSchema).max(20).default([]),
    github: githubProfileUrlSchema,
    linkedin: linkedinProfileUrlSchema,
    achievements: z.array(z.string().trim().min(1).max(180)).max(50).default([]),
    availability: z.enum(["open", "selective", "unavailable"]).default("open"),
    headline: z.string().trim().max(160).optional().or(z.literal("")),
    bio: z.string().trim().max(1200).optional().or(z.literal("")),
    location: z.string().trim().max(120).optional().or(z.literal(""))
  })
});

export const listProfilesSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional(),
    skill: z.string().trim().max(80).optional(),
    interest: z.string().trim().max(80).optional(),
    goal: z.string().trim().max(120).optional(),
    college: z.string().trim().max(180).optional(),
    availability: z.enum(["open", "selective", "unavailable"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});

export const profileIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid profile id")
  })
});
