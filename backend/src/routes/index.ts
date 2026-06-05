import { Router } from "express";
import { authRoutes } from "./authRoutes.js";
import { activityRoutes } from "./activityRoutes.js";
import { applicationRoutes } from "./applicationRoutes.js";
import { analyticsRoutes } from "./analyticsRoutes.js";
import { connectionRoutes } from "./connectionRoutes.js";
import { communityRoutes } from "./communityRoutes.js";
import { feedbackRoutes } from "./feedbackRoutes.js";
import { hackathonTeamRoutes } from "./hackathonTeamRoutes.js";
import { matchRoutes } from "./matchRoutes.js";
import { mentorRoutes } from "./mentorRoutes.js";
import { messageRoutes } from "./messageRoutes.js";
import { notificationRoutes } from "./notificationRoutes.js";
import { profileRoutes } from "./profileRoutes.js";
import { projectRoutes } from "./projectRoutes.js";
import { recommendationRoutes } from "./recommendationRoutes.js";
import { roadmapRoutes } from "./roadmapRoutes.js";
import { resumeAnalyzerRoutes } from "./resumeAnalyzerRoutes.js";
import { skillExchangeRoutes } from "./skillExchangeRoutes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => {
  res.json({ success: true, message: "EngineerConnect AI backend running" });
});

apiRoutes.use("/", analyticsRoutes);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/activity", activityRoutes);
apiRoutes.use("/applications", applicationRoutes);
apiRoutes.use("/connections", connectionRoutes);
apiRoutes.use("/community", communityRoutes);
apiRoutes.use("/feedback", feedbackRoutes);
apiRoutes.use("/profiles", profileRoutes);
apiRoutes.use("/matches", matchRoutes);
apiRoutes.use("/mentors", mentorRoutes);
apiRoutes.use("/messages", messageRoutes);
apiRoutes.use("/notifications", notificationRoutes);
apiRoutes.use("/projects", projectRoutes);
apiRoutes.use("/hackathon-teams", hackathonTeamRoutes);
apiRoutes.use("/roadmaps", roadmapRoutes);
apiRoutes.use("/resume-analyzer", resumeAnalyzerRoutes);
apiRoutes.use("/recommendations", recommendationRoutes);
apiRoutes.use("/skill-exchange", skillExchangeRoutes);
