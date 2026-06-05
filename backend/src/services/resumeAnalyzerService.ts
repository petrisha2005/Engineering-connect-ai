import { gemini } from "../config/gemini.js";

export interface ResumeAnalysisResult {
  atsScore: number;
  strengths: string[];
  weakSections: string[];
  missingSkills: string[];
  missingKeywords: string[];
  formatIssues: string[];
  suggestedProjects: Array<{ title: string; description: string; skills: string[] }>;
  careerRoleFit: Array<{ role: string; fitScore: number; reason: string }>;
  roleFit: string;
  improvementTips: string[];
  improvedResume: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    summary: string;
    skills: string[];
    projects: Array<{ title: string; description: string; bullets: string[] }>;
    education: string[];
    certifications: string[];
    achievements: string[];
    experience: string[];
    atsTips: string[];
  };
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 30) : [];
}

function safeScore(value: unknown, fallback = 60) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function safeString(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeImprovedResume(value: any): ResumeAnalysisResult["improvedResume"] {
  return {
    fullName: safeString(value?.fullName, 160),
    email: safeString(value?.email, 254),
    phone: safeString(value?.phone, 80),
    linkedin: safeString(value?.linkedin, 240),
    github: safeString(value?.github, 240),
    summary: safeString(value?.summary, 1600),
    skills: safeArray(value?.skills).slice(0, 80),
    projects: Array.isArray(value?.projects)
      ? value.projects
          .map((project: any) => ({
            title: safeString(project?.title, 180),
            description: safeString(project?.description, 1000),
            bullets: safeArray(project?.bullets).slice(0, 12)
          }))
          .filter((project: { title: string }) => project.title)
          .slice(0, 10)
      : [],
    education: safeArray(value?.education).slice(0, 20),
    certifications: safeArray(value?.certifications).slice(0, 30),
    achievements: safeArray(value?.achievements).slice(0, 30),
    experience: safeArray(value?.experience).slice(0, 30),
    atsTips: safeArray(value?.atsTips).slice(0, 30)
  };
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
  "formatIssues": [],
  "suggestedProjects": [{"title":"","description":"","skills":[]}],
  "careerRoleFit": [{"role":"","fitScore":0,"reason":""}],
  "roleFit": "",
  "improvementTips": [],
  "improvedResume": {
    "fullName": "",
    "email": "",
    "phone": "",
    "linkedin": "",
    "github": "",
    "summary": "",
    "skills": [],
    "projects": [{"title":"","description":"","bullets":[]}],
    "education": [],
    "certifications": [],
    "achievements": [],
    "experience": [],
    "atsTips": []
  }
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
- format issues that may reduce ATS parsing

Also generate an improved ATS-friendly resume version:
- simple headings
- no tables, columns, graphics, icons, or decorative formatting
- strong action verbs
- quantified bullet points where possible
- do not invent fake jobs, companies, education, certificates, or metrics
- if data is missing, keep the field empty or give ATS tips

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
    formatIssues: safeArray(parsed.formatIssues),
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
    roleFit: safeString(parsed.roleFit, 800),
    improvementTips: safeArray(parsed.improvementTips),
    improvedResume: safeImprovedResume((parsed as any).improvedResume)
  };
}
