import { gemini } from "../config/gemini.js";

export interface ResumeAnalysisResult {
  atsScore: number;
  strengths: string[];
  weakSections: string[];
  missingSkills: string[];
  missingKeywords: string[];
  suggestedProjects: Array<{ title: string; description: string; skills: string[] }>;
  careerRoleFit: Array<{ role: string; fitScore: number; reason: string }>;
  improvementTips: string[];
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 30) : [];
}

function safeScore(value: unknown, fallback = 60) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function analyzeResumeText(resumeText: string): Promise<ResumeAnalysisResult> {
  const model = gemini.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
  });

  const result = await model.generateContent(`
You are an AI resume analyzer for engineering students.
Analyze the resume text and return only valid JSON.
Do not invent experience. Give practical, student-friendly advice.

Return this shape:
{
  "atsScore": 0,
  "strengths": [],
  "weakSections": [],
  "missingSkills": [],
  "missingKeywords": [],
  "suggestedProjects": [{"title":"","description":"","skills":[]}],
  "careerRoleFit": [{"role":"","fitScore":0,"reason":""}],
  "improvementTips": []
}

Evaluate:
- ATS score
- strengths
- weak sections
- missing skills
- missing keywords
- suggested projects
- career role fit
- resume improvement tips

Resume text:
${JSON.stringify(resumeText.slice(0, 24000))}
`);

  const parsed = JSON.parse(result.response.text()) as Partial<ResumeAnalysisResult>;
  return {
    atsScore: safeScore(parsed.atsScore),
    strengths: safeArray(parsed.strengths),
    weakSections: safeArray(parsed.weakSections),
    missingSkills: safeArray(parsed.missingSkills),
    missingKeywords: safeArray(parsed.missingKeywords),
    suggestedProjects: Array.isArray(parsed.suggestedProjects)
      ? parsed.suggestedProjects
          .map((project) => ({
            title: String(project?.title ?? "").trim(),
            description: String(project?.description ?? "").trim(),
            skills: safeArray(project?.skills)
          }))
          .filter((project) => project.title && project.description)
          .slice(0, 8)
      : [],
    careerRoleFit: Array.isArray(parsed.careerRoleFit)
      ? parsed.careerRoleFit
          .map((fit) => ({
            role: String(fit?.role ?? "").trim(),
            fitScore: safeScore(fit?.fitScore),
            reason: String(fit?.reason ?? "").trim()
          }))
          .filter((fit) => fit.role && fit.reason)
          .slice(0, 8)
      : [],
    improvementTips: safeArray(parsed.improvementTips)
  };
}
