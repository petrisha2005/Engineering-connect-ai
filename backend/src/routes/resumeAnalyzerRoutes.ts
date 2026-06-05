import { Router } from "express";
import multer from "multer";
import { analyzeResume, listResumeReports } from "../controllers/resumeAnalyzerController.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new HttpError(400, "PDF_ONLY", "Only PDF resumes are supported."));
      return;
    }
    cb(null, true);
  }
});

export const resumeAnalyzerRoutes = Router();

resumeAnalyzerRoutes.use(requireAuth);
resumeAnalyzerRoutes.get("/reports", listResumeReports);
resumeAnalyzerRoutes.post("/analyze", upload.single("resume"), analyzeResume);
