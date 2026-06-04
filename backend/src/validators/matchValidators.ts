import { z } from "zod";

export const generateMatchesSchema = z.object({
  body: z
    .object({
      limit: z.coerce.number().int().min(1).max(50).default(25)
    })
    .default({})
});

export const listMatchesSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});

