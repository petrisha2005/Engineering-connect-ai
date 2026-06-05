import compression from "compression";
import express from "express";
import morgan from "morgan";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRateLimit, corsMiddleware, helmetMiddleware, sanitizeMiddleware } from "./middleware/security.js";

export function createApp() {
  const app = express();

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(sanitizeMiddleware);
  app.use(apiRateLimit);
  app.use(morgan("combined"));

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "EngineerConnect AI backend running" });
  });

  app.use("/api", apiRoutes);
  app.use("/api/v1", apiRoutes);

  app.use(errorHandler);

  return app;
}
