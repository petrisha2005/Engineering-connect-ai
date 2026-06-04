import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "../config/env.js";

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true
});

export const sanitizeMiddleware = mongoSanitize();

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
});

export const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
});

