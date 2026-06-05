import { Router } from "express";
import {
  acceptMentorRequest,
  browseMentors,
  getMentorRequestStatus,
  getMyMentorProfile,
  listReceivedMentorRequests,
  listSentMentorRequests,
  recommendedMentors,
  rejectMentorRequest,
  requestMentor,
  upsertMyMentorProfile
} from "../controllers/mentorController.js";
import { requireAuth } from "../middleware/auth.js";

export const mentorRoutes = Router();

mentorRoutes.use(requireAuth);
mentorRoutes.get("/me", getMyMentorProfile);
mentorRoutes.put("/me", upsertMyMentorProfile);
mentorRoutes.get("/", browseMentors);
mentorRoutes.get("/recommended", recommendedMentors);
mentorRoutes.get("/requests/sent", listSentMentorRequests);
mentorRoutes.get("/requests/received", listReceivedMentorRequests);
mentorRoutes.get("/status/:mentorUserId", getMentorRequestStatus);
mentorRoutes.post("/request/:mentorUserId", requestMentor);
mentorRoutes.post("/accept/:requestId", acceptMentorRequest);
mentorRoutes.post("/reject/:requestId", rejectMentorRequest);
