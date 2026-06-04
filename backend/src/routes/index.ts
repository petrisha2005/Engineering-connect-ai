import { Router } from "express";
import { authRoutes } from "./authRoutes.js";
import { activityRoutes } from "./activityRoutes.js";
import { applicationRoutes } from "./applicationRoutes.js";
import { connectionRoutes } from "./connectionRoutes.js";
import { feedbackRoutes } from "./feedbackRoutes.js";
import { hackathonTeamRoutes } from "./hackathonTeamRoutes.js";
import { matchRoutes } from "./matchRoutes.js";
import { messageRoutes } from "./messageRoutes.js";
import { notificationRoutes } from "./notificationRoutes.js";
import { profileRoutes } from "./profileRoutes.js";
import { projectRoutes } from "./projectRoutes.js";
import { recommendationRoutes } from "./recommendationRoutes.js";
import { roadmapRoutes } from "./roadmapRoutes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "engineerconnect-ai-api" });
});

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/activity", activityRoutes);
apiRoutes.use("/applications", applicationRoutes);
apiRoutes.use("/connections", connectionRoutes);
apiRoutes.use("/feedback", feedbackRoutes);
apiRoutes.use("/profiles", profileRoutes);
apiRoutes.use("/matches", matchRoutes);
apiRoutes.use("/messages", messageRoutes);
apiRoutes.use("/notifications", notificationRoutes);
apiRoutes.use("/projects", projectRoutes);
apiRoutes.use("/hackathon-teams", hackathonTeamRoutes);
apiRoutes.use("/roadmaps", roadmapRoutes);
apiRoutes.use("/recommendations", recommendationRoutes);
