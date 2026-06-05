import { StatusCodes } from "http-status-codes";
import { gemini } from "../config/gemini.js";
import { CareerReadinessSnapshot } from "../models/CareerReadinessSnapshot.js";
import { CareerTwinProfile } from "../models/CareerTwinProfile.js";
import { HackathonTeam } from "../models/HackathonTeam.js";
import { OpportunityPrediction } from "../models/OpportunityPrediction.js";
import { Profile } from "../models/Profile.js";
import { Project } from "../models/Project.js";
import { ResumeReport } from "../models/ResumeReport.js";
import { Roadmap } from "../models/Roadmap.js";
import { SkillExchangeProfile } from "../models/SkillExchangeProfile.js";
import { SkillGapAnalysis } from "../models/SkillGapAnalysis.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(values: string[] = []) {
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function asStringArray(values: unknown): string[] {
  return Array.isArray(values) ? values.map((value) => String(value)) : [];
}

function goalSkills(goal: string) {
  const normalized = goal.toLowerCase();
  if (/ai|machine learning|ml|data scientist|deep learning/.test(normalized)) return ["python", "machine learning", "deep learning", "tensorflow", "pytorch", "sql", "statistics", "mlops", "deployment"];
  if (/frontend|ui|react/.test(normalized)) return ["html", "css", "javascript", "typescript", "react", "ui/ux", "testing", "performance"];
  if (/backend|cloud|api/.test(normalized)) return ["node.js", "express", "mongodb", "sql", "api design", "docker", "cloud", "system design"];
  if (/cyber|security/.test(normalized)) return ["network security", "linux", "python", "web security", "cryptography", "cloud security"];
  return ["problem solving", "communication", "projects", "github", "interview preparation", "system design"];
}

async function collectCareerData(userId: any) {
  const [profile, roadmaps, ownedProjects, memberProjects, resumeReport, skillExchange, hackathons] = await Promise.all([
    Profile.findOne({ user: userId }),
    Roadmap.find({ user: userId }).sort({ createdAt: -1 }).limit(3),
    Project.find({ owner: userId }).sort({ updatedAt: -1 }),
    Project.find({ "members.user": userId }).sort({ updatedAt: -1 }),
    ResumeReport.findOne({ user: userId }).sort({ createdAt: -1 }),
    SkillExchangeProfile.findOne({ userId }),
    HackathonTeam.find({ $or: [{ owner: userId }, { "members.user": userId }] }).sort({ updatedAt: -1 })
  ]);
  return { profile, roadmaps, ownedProjects, memberProjects, resumeReport, skillExchange, hackathons };
}

function projectImpact(projects: any[]) {
  return projects.slice(0, 12).map((project) => {
    const skillCount = (project.requiredSkills ?? project.skills ?? []).length;
    const hasRepo = Boolean(project.repositoryUrl);
    const hasDemo = Boolean(project.demoUrl);
    const statusBoost = project.status === "completed" ? 18 : project.status === "in_progress" ? 10 : 4;
    return {
      title: project.title,
      impactScore: clamp(35 + skillCount * 6 + statusBoost + (hasDemo ? 12 : 0)),
      complexityScore: clamp(30 + skillCount * 8 + (hasRepo ? 10 : 0)),
      resumeValue: clamp(35 + statusBoost + (hasRepo ? 15 : 0) + (hasDemo ? 15 : 0)),
      industryRelevance: clamp(40 + skillCount * 5 + statusBoost),
      reason: hasRepo || hasDemo ? "Has stronger portfolio evidence through project links." : "Add repository or demo links to raise portfolio value."
    };
  });
}

async function buildCareerTwin(userId: any) {
  const data = await collectCareerData(userId);
  const profile = data.profile;
  const latestRoadmap = data.roadmaps[0];
  const profileGoals = asStringArray(profile?.goals);
  const careerGoal = profileGoals[0] || String(latestRoadmap?.careerGoal || latestRoadmap?.desiredCareer || "Engineering Career");
  const currentSkills = unique([...asStringArray(profile?.skills), ...asStringArray(data.skillExchange?.teachSkills)]);
  const roadmapSkills = unique(data.roadmaps.flatMap((roadmap) => asStringArray(roadmap.skills)));
  const expectedSkills = unique([...goalSkills(careerGoal), ...roadmapSkills.slice(0, 12)]);
  const missingSkills = expectedSkills.filter((skill) => !currentSkills.includes(skill));
  const allProjects = [...data.ownedProjects, ...data.memberProjects, ...(profile?.projects ?? [])];
  const projectCount = allProjects.length;
  const hackathonCount = data.hackathons.length;
  const resumeScore = data.resumeReport?.atsScore ?? 0;

  const technical = clamp((currentSkills.length / Math.max(expectedSkills.length, 1)) * 100);
  const project = clamp(Math.min(projectCount, 5) * 16 + hackathonCount * 5);
  const portfolio = clamp(project * 0.55 + (profile?.github ? 20 : 0) + (profile?.linkedin ? 10 : 0) + resumeScore * 0.15);
  const communication = clamp((profile?.bio ? 25 : 0) + (profile?.headline ? 20 : 0) + asStringArray(profile?.achievements).length * 8 + (data.skillExchange?.completedExchanges ?? 0) * 8);
  const interview = clamp(resumeScore * 0.55 + (latestRoadmap?.interviewPreparation ? 20 : 0) + Math.min(currentSkills.length, 10) * 2);
  const readinessScore = clamp(technical * 0.28 + project * 0.22 + portfolio * 0.18 + communication * 0.14 + interview * 0.18);
  const currentLevel = readinessScore >= 82 ? "Industry Ready" : readinessScore >= 62 ? "Advanced" : readinessScore >= 38 ? "Intermediate" : "Beginner";
  const estimatedTimeToGoal = readinessScore >= 80 ? "1-3 Months" : readinessScore >= 60 ? "3-6 Months" : readinessScore >= 40 ? "6-9 Months" : "9-12 Months";
  const projectScores = projectImpact(allProjects);

  const fallback = {
    strengths: [
      currentSkills.length ? `Core skills: ${currentSkills.slice(0, 5).join(", ")}` : "Profile foundation started",
      projectCount ? `${projectCount} project records available` : "Ready to build portfolio projects"
    ],
    weaknesses: missingSkills.slice(0, 4).map((skill) => `Needs more evidence for ${skill}`),
    missingProjects: [`Build a ${careerGoal} portfolio project with deployment`, "Add a measurable capstone project"],
    missingCertifications: ["Role-relevant certification or verified course"],
    recommendedActionsThisWeek: missingSkills.slice(0, 2).map((skill) => `Complete a focused ${skill} module`),
    recommendedActionsThisMonth: ["Build and deploy one portfolio project", "Update resume with measurable project outcomes"]
  };

  let ai = fallback;
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.25 } });
    const result = await model.generateContent(`
You are EngineerConnect AI Career Twin, a career intelligence engine for engineering students.
Use only the real data below. Do not invent fake projects, certifications, or GitHub activity.
Return JSON:
{"strengths":[],"weaknesses":[],"missingProjects":[],"missingCertifications":[],"recommendedActionsThisWeek":[],"recommendedActionsThisMonth":[]}
Career goal: ${careerGoal}
Current skills: ${JSON.stringify(currentSkills)}
Missing skills: ${JSON.stringify(missingSkills)}
Projects count: ${projectCount}
Hackathons count: ${hackathonCount}
Resume ATS score: ${resumeScore}
GitHub URL available: ${Boolean(profile?.github)}
`);
    ai = { ...fallback, ...(JSON.parse(result.response.text()) as Partial<typeof fallback>) };
  } catch {
    ai = fallback;
  }

  const twin = await CareerTwinProfile.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      careerGoal,
      currentLevel,
      readinessScore,
      confidenceScore: clamp(55 + (profile ? 15 : 0) + (latestRoadmap ? 10 : 0) + (resumeScore ? 10 : 0) + Math.min(projectCount * 2, 10)),
      estimatedTimeToGoal,
      growthTrend: readinessScore >= 55 ? "Improving" : "Needs Focus",
      readinessBreakdown: { technical, project, portfolio, communication, interview },
      strengths: ai.strengths ?? fallback.strengths,
      weaknesses: ai.weaknesses ?? fallback.weaknesses,
      missingSkills,
      missingProjects: ai.missingProjects ?? fallback.missingProjects,
      missingCertifications: ai.missingCertifications ?? fallback.missingCertifications,
      recommendedActionsThisWeek: ai.recommendedActionsThisWeek ?? fallback.recommendedActionsThisWeek,
      recommendedActionsThisMonth: ai.recommendedActionsThisMonth ?? fallback.recommendedActionsThisMonth,
      timeline: [
        { stage: "Current State", description: `${currentLevel} with ${currentSkills.length} tracked skills`, target: "Now", status: "current" },
        { stage: "Next Milestone", description: `Close ${missingSkills.slice(0, 2).join(", ") || "top"} gaps`, target: "This month", status: "next" },
        { stage: "Intermediate Level", description: "Complete role-aligned project and interview practice", target: "Next 3 months", status: readinessScore >= 50 ? "completed" : "future" },
        { stage: "Advanced Level", description: "Deploy portfolio and contribute externally", target: "3-6 months", status: readinessScore >= 70 ? "completed" : "future" },
        { stage: "Industry Ready", description: "Apply confidently for internships/jobs", target: estimatedTimeToGoal, status: readinessScore >= 82 ? "completed" : "future" }
      ],
      projectImpact: projectScores,
      interviewReadiness: interview,
      portfolioQuality: portfolio,
      resumeQuality: resumeScore,
      industryReadiness: readinessScore,
      githubSummary: profile?.github ? `GitHub profile connected: ${profile.github}. Repository activity can strengthen readiness evidence.` : "GitHub profile not connected.",
      lastRefreshedAt: new Date()
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  await Promise.all([
    CareerReadinessSnapshot.create({
      user: userId,
      careerTwin: twin._id,
      readinessScore,
      technicalReadiness: technical,
      projectReadiness: project,
      portfolioReadiness: portfolio,
      communicationReadiness: communication,
      interviewReadiness: interview,
      growthTrend: twin.growthTrend
    }),
    SkillGapAnalysis.create({
      user: userId,
      careerTwin: twin._id,
      goal: careerGoal,
      currentSkills,
      missingSkills: missingSkills.map((skill, index) => ({
        skill,
        priority: index < 4 ? "High" : index < 8 ? "Medium" : "Low",
        reason: `${skill} is relevant for ${careerGoal} and is not yet visible in your tracked profile data.`,
        currentEvidence: currentSkills.includes(skill) ? "Present" : "Missing"
      }))
    }),
    OpportunityPrediction.create({
      user: userId,
      careerTwin: twin._id,
      predictions: [
        { type: "Internships", readiness: clamp(readinessScore + 5), reason: "Based on skills, resume, and projects.", nextAction: "Apply after closing top skill gap." },
        { type: "Research Roles", readiness: clamp(project + technical * 0.5), reason: "Depends on project depth and academic alignment.", nextAction: "Add a research-style project or publication summary." },
        { type: "Open Source", readiness: clamp(portfolio + (profile?.github ? 12 : -10)), reason: "GitHub evidence matters strongly.", nextAction: "Contribute to one beginner-friendly repository." },
        { type: "Freelancing", readiness: clamp(project + communication * 0.5), reason: "Needs portfolio and client communication readiness.", nextAction: "Package one demo project as a service." },
        { type: "Startups", readiness: clamp(project + hackathonCount * 8), reason: "Hackathon and project execution improve startup readiness.", nextAction: "Validate one project idea with users." },
        { type: "Full-Time Jobs", readiness: clamp(readinessScore - 5), reason: "Requires stronger interview and portfolio readiness.", nextAction: "Complete mock interviews and deploy portfolio." }
      ]
    })
  ]);

  return twin;
}

async function latestBundle(userId: any) {
  let twin = await CareerTwinProfile.findOne({ user: userId }).sort({ updatedAt: -1 });
  if (!twin) twin = await buildCareerTwin(userId);
  const [snapshots, skillGap, opportunities] = await Promise.all([
    CareerReadinessSnapshot.find({ user: userId }).sort({ createdAt: -1 }).limit(8),
    SkillGapAnalysis.findOne({ user: userId }).sort({ createdAt: -1 }),
    OpportunityPrediction.findOne({ user: userId }).sort({ createdAt: -1 })
  ]);
  return { twin, snapshots, skillGap, opportunities };
}

export const getCareerTwin = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  res.json({ success: true, ...(await latestBundle(user.id)) });
});

export const refreshCareerTwin = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const twin = await buildCareerTwin(user.id);
  res.json({ success: true, ...(await latestBundle(user.id)), refreshed: true, twin });
});

export const getReadiness = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const { twin, snapshots } = await latestBundle(user.id);
  res.json({ success: true, readiness: twin.readinessBreakdown, overallScore: twin.readinessScore, snapshots });
});

export const getSkills = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const { skillGap } = await latestBundle(user.id);
  res.json({ success: true, skillGap });
});

export const getRecommendations = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const { twin } = await latestBundle(user.id);
  res.json({ success: true, thisWeek: twin.recommendedActionsThisWeek, thisMonth: twin.recommendedActionsThisMonth, timeline: twin.timeline });
});

export const getOpportunities = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const { opportunities } = await latestBundle(user.id);
  res.json({ success: true, opportunities });
});

export const askCareerTwinCoach = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!question) throw new HttpError(StatusCodes.BAD_REQUEST, "QUESTION_REQUIRED", "Ask a career question.");
  const { twin, skillGap } = await latestBundle(user.id);
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.3 } });
    const result = await model.generateContent(`
You are Career Twin Coach for EngineerConnect AI. Answer using only this user's stored career data.
Career goal: ${twin.careerGoal}
Readiness: ${twin.readinessScore}
Missing skills: ${JSON.stringify(skillGap?.missingSkills?.slice(0, 8) ?? [])}
Recommended this week: ${JSON.stringify(twin.recommendedActionsThisWeek)}
Question: ${question}
Give a concise actionable answer.
`);
    res.json({ success: true, answer: result.response.text() });
  } catch {
    const missing = asStringArray(twin.missingSkills).slice(0, 3).join(", ");
    res.json({ success: true, answer: `Focus next on ${missing || "one portfolio project"}, then update your profile evidence and resume.` });
  }
});
