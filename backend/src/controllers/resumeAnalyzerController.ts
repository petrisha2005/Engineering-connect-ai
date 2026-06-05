import { StatusCodes } from "http-status-codes";
import { PDFParse } from "pdf-parse";
import { ResumeReport } from "../models/ResumeReport.js";
import { analyzeResumeText } from "../services/resumeAnalyzerService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

export const analyzeResume = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const file = req.file;

  if (!file) throw new HttpError(StatusCodes.BAD_REQUEST, "RESUME_REQUIRED", "Please upload a PDF resume.");
  if (file.mimetype !== "application/pdf") throw new HttpError(StatusCodes.BAD_REQUEST, "PDF_ONLY", "Only PDF resumes are supported.");

  const parser = new PDFParse({ data: file.buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  const resumeText = parsed.text.replace(/\s+/g, " ").trim();

  if (resumeText.length < 200) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "RESUME_TEXT_TOO_SHORT", "Could not extract enough text from this PDF. Please upload a text-based resume PDF.");
  }

  const analysis = await analyzeResumeText(resumeText);
  const report = await ResumeReport.create({
    user: user.id,
    fileName: file.originalname,
    resumeTextPreview: resumeText.slice(0, 2000),
    ...analysis
  });

  res.status(StatusCodes.CREATED).json({ success: true, report });
});

export const listResumeReports = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const reports = await ResumeReport.find({ user: user.id }).sort({ createdAt: -1 }).limit(20);
  res.json({ success: true, reports });
});
