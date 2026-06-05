import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { gemini } from "../config/gemini.js";
import { Application } from "../models/Application.js";
import { Project } from "../models/Project.js";
import { ProjectHealth } from "../models/ProjectHealth.js";
import { ProjectMilestone } from "../models/ProjectMilestone.js";
import { ProjectRisk } from "../models/ProjectRisk.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function projectId(value: unknown) {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_PROJECT_ID", "Invalid project id");
  return new Types.ObjectId(value);
}

function unique(values: string[] = []) {
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function shared(left: string[], right: string[]) {
  const set = new Set(right);
  return left.filter((item) => set.has(item));
}

async function loadProject(id: Types.ObjectId) {
  const project = await Project.findById(id)
    .populate({ path: "owner", select: "displayName email photoURL profile", populate: { path: "profile" } })
    .populate({ path: "members.user", select: "displayName email photoURL profile", populate: { path: "profile" } });
  if (!project) throw new HttpError(StatusCodes.NOT_FOUND, "PROJECT_NOT_FOUND", "Project was not found");
  return project as any;
}

async function ensureMilestones(project: any) {
  const existing = await ProjectMilestone.find({ project: project._id }).sort({ createdAt: 1 });
  if (existing.length) return existing;
  const statusIndex = project.status === "completed" ? 4 : project.status === "in_progress" ? 1 : 0;
  const stages = ["Planning", "Development", "Testing", "Deployment", "Completed"];
  await ProjectMilestone.insertMany(stages.map((stage, index) => ({
    project: project._id,
    title: stage,
    status: index < statusIndex ? "done" : index === statusIndex ? "active" : "pending",
    progress: index < statusIndex ? 100 : index === statusIndex ? (project.status === "completed" ? 100 : 45) : 0
  })));
  return ProjectMilestone.find({ project: project._id }).sort({ createdAt: 1 });
}

function roleGaps(requiredSkills: string[], teamSkills: string[]) {
  const lowerSkills = unique([...requiredSkills, ...teamSkills]);
  const checks = [
    { role: "Frontend Developer", keys: ["react", "frontend", "javascript", "typescript", "html", "css"] },
    { role: "Backend Developer", keys: ["backend", "node.js", "express", "api", "django", "spring"] },
    { role: "Database Engineer", keys: ["mongodb", "sql", "database", "postgres"] },
    { role: "AI/ML Engineer", keys: ["ai", "ml", "machine learning", "python", "tensorflow", "pytorch"] },
    { role: "UI/UX Designer", keys: ["ui/ux", "figma", "design", "ux"] },
    { role: "Testing", keys: ["testing", "jest", "qa", "unit testing"] },
    { role: "Deployment", keys: ["deployment", "docker", "cloud", "devops", "vercel", "render"] }
  ];
  return checks.filter((check) => check.keys.some((key) => lowerSkills.includes(key) || requiredSkills.includes(key)) && !check.keys.some((key) => teamSkills.includes(key))).map((check) => check.role);
}

async function analyze(project: any) {
  const applications = await Application.find({ project: project._id });
  const milestones = await ensureMilestones(project);
  const requiredSkills = unique(project.requiredSkills ?? []);
  const teamSkills = unique((project.members ?? []).flatMap((member: any) => {
    const profile = member.user?.profile && typeof member.user.profile === "object" ? member.user.profile : null;
    return profile?.skills ?? [];
  }));
  const coveredSkills = shared(requiredSkills, teamSkills);
  const missingSkills = requiredSkills.filter((skill) => !coveredSkills.includes(skill));
  const missingRoles = roleGaps(requiredSkills, teamSkills);
  const teamRatio = Math.min((project.members?.length ?? 0) / Math.max(project.maxMembers ?? 1, 1), 1);
  const skillCoverage = requiredSkills.length ? coveredSkills.length / requiredSkills.length : 1;
  const milestoneProgress = milestones.length ? milestones.reduce((sum, item) => sum + item.progress, 0) / milestones.length : 0;
  const linkScore = (project.repositoryUrl ? 8 : 0) + (project.demoUrl ? 8 : 0);
  const activityScore = Math.max(0, 12 - Math.floor((Date.now() - new Date(project.updatedAt).getTime()) / 86_400_000));
  const healthScore = Math.max(10, Math.min(100, Math.round(teamRatio * 25 + skillCoverage * 35 + milestoneProgress * 0.25 + linkScore + activityScore)));
  const riskScore = 100 - healthScore;
  const riskLevel = healthScore >= 75 ? "Low" : healthScore >= 50 ? "Medium" : "High";
  const successProbability = healthScore >= 75 ? "High" : healthScore >= 50 ? "Medium" : "Low";
  const progress = Math.round(milestoneProgress);
  const alerts = [
    missingRoles.length ? `Missing critical role: ${missingRoles[0]}` : "",
    missingSkills.length ? `Skill gap detected: ${missingSkills.slice(0, 3).join(", ")}` : "",
    project.members.length < Math.ceil((project.maxMembers ?? 1) / 2) ? "Team size is below recommended capacity" : "",
    !project.demoUrl && project.status !== "open" ? "Deployment milestone may be at risk" : ""
  ].filter(Boolean);
  const fallback = {
    strengths: [coveredSkills.length ? `Covered skills: ${coveredSkills.slice(0, 5).join(", ")}` : "Project is defined and trackable", project.members.length > 1 ? "Team collaboration has started" : "Owner is ready to recruit"],
    weaknesses: [missingSkills.length ? `Missing skills: ${missingSkills.slice(0, 5).join(", ")}` : "", missingRoles.length ? `Missing roles: ${missingRoles.join(", ")}` : ""].filter(Boolean),
    risks: alerts.length ? alerts : ["Keep milestones updated to reduce delivery risk"],
    recommendations: [missingRoles.length ? `Recruit ${missingRoles[0]} support.` : "Keep weekly milestone reviews.", missingSkills.length ? `Add ${missingSkills[0]} capability before testing.` : "Prepare deployment and demo evidence."]
  };
  let ai = fallback;
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.25 } });
    const result = await model.generateContent(`
You are an expert project manager.
Analyze project progress, team composition, skills, milestones, risks, and activity.
Predict project health, identify risks, and recommend actions.
Be practical and realistic.
Return JSON only: {"strengths":[],"weaknesses":[],"risks":[],"recommendations":[]}
Project: ${project.title}
Status: ${project.status}
Required skills: ${JSON.stringify(requiredSkills)}
Team skills: ${JSON.stringify(teamSkills)}
Members: ${project.members.length}/${project.maxMembers}
Applications: ${applications.length}
Missing skills: ${JSON.stringify(missingSkills)}
Missing roles: ${JSON.stringify(missingRoles)}
`);
    ai = { ...fallback, ...(JSON.parse(result.response.text()) as Partial<typeof fallback>) };
  } catch {
    ai = fallback;
  }
  const health = await ProjectHealth.findOneAndUpdate(
    { project: project._id },
    {
      project: project._id,
      healthScore,
      riskScore,
      successProbability,
      completionPrediction: progress >= 85 ? "Near completion" : progress >= 55 ? "Likely with focused execution" : "Needs stronger team and milestone progress",
      progress,
      riskLevel,
      coveredSkills,
      missingSkills,
      missingRoles,
      alerts,
      timeline: milestones.map((m) => ({ stage: m.title, progress: m.progress, status: m.status })),
      strengths: ai.strengths,
      weaknesses: ai.weaknesses,
      risks: ai.risks,
      recommendations: ai.recommendations,
      lastRefreshedAt: new Date()
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await ProjectRisk.deleteMany({ project: project._id, status: "open" });
  await ProjectRisk.insertMany((ai.risks ?? []).slice(0, 8).map((risk) => ({
    project: project._id,
    category: risk.includes("skill") ? "Skill gap" : risk.includes("role") ? "Role gap" : "Project risk",
    severity: riskLevel,
    reason: risk,
    recommendedAction: ai.recommendations?.[0] ?? "Review project plan"
  })));
  return { health, project, risks: await ProjectRisk.find({ project: project._id }).sort({ createdAt: -1 }), milestones };
}

async function bundle(id: Types.ObjectId) {
  const project = await loadProject(id);
  const existing = await ProjectHealth.findOne({ project: id });
  if (!existing) return analyze(project);
  const [risks, milestones] = await Promise.all([ProjectRisk.find({ project: id }).sort({ createdAt: -1 }), ensureMilestones(project)]);
  return { health: existing, project, risks, milestones };
}

export const getProjectHealth = asyncHandler(async (req, res) => {
  ensureUser(req);
  res.json({ success: true, ...(await bundle(projectId(req.params.projectId))) });
});

export const getProjectHealthAnalysis = asyncHandler(async (req, res) => {
  ensureUser(req);
  const result = await bundle(projectId(req.params.projectId));
  res.json({ success: true, analysis: result.health, risks: result.risks, milestones: result.milestones });
});

export const getProjectHealthRecommendations = asyncHandler(async (req, res) => {
  ensureUser(req);
  const result = await bundle(projectId(req.params.projectId));
  res.json({ success: true, recommendations: result.health.recommendations, alerts: result.health.alerts });
});

export const refreshProjectHealth = asyncHandler(async (req, res) => {
  ensureUser(req);
  res.json({ success: true, ...(await analyze(await loadProject(projectId(req.params.projectId)))) });
});
