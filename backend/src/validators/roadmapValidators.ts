import { z } from "zod";

export const createRoadmapSchema = z.object({
  body: z.object({
    desiredCareer: z.string().trim().min(2).max(160).optional(),
    careerGoal: z.string().trim().min(2).max(160).optional()
  }).refine((body) => body.desiredCareer || body.careerGoal, {
    message: "Career goal is required",
    path: ["careerGoal"]
  })
});

export const generateRoadmapSchema = z.object({
  body: z.object({
    careerGoal: z.string().trim().min(2, "Career goal is required").max(160)
  })
});

export const listRoadmapsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});

export const roadmapIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid roadmap id")
  })
});
