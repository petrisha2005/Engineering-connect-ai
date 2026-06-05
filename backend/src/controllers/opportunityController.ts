import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { gemini } from "../config/gemini.js";
import { CareerTwinProfile } from "../models/CareerTwinProfile.js";
import { HackathonTeam } from "../models/HackathonTeam.js";
import { Opportunity } from "../models/Opportunity.js";
import { OpportunityApplication } from "../models/OpportunityApplication.js";
import { Profile } from "../models/Profile.js";
import { Project } from "../models/Project.js";
import { ResumeReport } from "../models/ResumeReport.js";
import { Roadmap } from "../models/Roadmap.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function objectId(value: unknown) {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_ID", "Invalid opportunity id");
  return new Types.ObjectId(value);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function list(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function overlap(left: string[] = [], right: string[] = []) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function opportunityStatusFilter(status?: unknown) {
  if (status === "closed" || status === "rolling" || status === "open") return { status };
  return { status: { $in: ["open", "rolling"] } };
}

async function collectStudentData(userId: any) {
  const [profile, twin, projects, roadmaps, resume, hackathons] = await Promise.all([
    Profile.findOne({ user: userId }),
    CareerTwinProfile.findOne({ user: userId }).sort({ updatedAt: -1 }),
    Project.find({ $or: [{ owner: userId }, { "members.user": userId }] }).sort({ updatedAt: -1 }).limit(20),
    Roadmap.find({ user: userId }).sort({ createdAt: -1 }).limit(5),
    ResumeReport.findOne({ user: userId }).sort({ createdAt: -1 }),
    HackathonTeam.find({ $or: [{ owner: userId }, { "members.user": userId }] }).sort({ updatedAt: -1 }).limit(10)
  ]);

  const profileProjects = Array.isArray(profile?.projects) ? profile.projects : [];
  const projectSkills = list([
    ...projects.flatMap((project: any) => [...(project.requiredSkills ?? []), ...(project.interests ?? [])]),
    ...profileProjects.flatMap((project: any) => project.skills ?? [])
  ]);
  const roadmapSkills = list(roadmaps.flatMap((roadmap: any) => roadmap.skills ?? []));
  const skills = list([...list(profile?.skills), ...projectSkills, ...roadmapSkills]);
  const certifications = list([...list(profile?.achievements), ...list(twin?.missingCertifications)]).filter((item) => /cert|course|badge|specialization/i.test(item));
  const careerGoals = list([...list(profile?.goals), twin?.careerGoal, ...roadmaps.map((roadmap: any) => roadmap.careerGoal ?? roadmap.desiredCareer)]);

  return {
    profile,
    twin,
    projects,
    roadmaps,
    resume,
    hackathons,
    skills,
    certifications,
    careerGoals,
    projectCount: projects.length + profileProjects.length,
    hackathonCount: hackathons.length
  };
}

function fallbackAnalysis(opportunity: any, data: Awaited<ReturnType<typeof collectStudentData>>) {
  const requiredSkills = list(opportunity.requiredSkills);
  const preferredSkills = list(opportunity.preferredSkills);
  const allOpportunitySkills = list([...requiredSkills, ...preferredSkills]);
  const coveredRequired = overlap(requiredSkills, data.skills);
  const coveredPreferred = overlap(preferredSkills, data.skills);
  const missingSkills = requiredSkills.filter((skill) => !data.skills.includes(skill));
  const goalMatches = overlap(list(opportunity.careerGoals), data.careerGoals);
  const skillCoverage = allOpportunitySkills.length ? ((coveredRequired.length * 1.2 + coveredPreferred.length * 0.8) / Math.max(requiredSkills.length * 1.2 + preferredSkills.length * 0.8, 1)) * 100 : 45;
  const evidenceScore = Math.min(data.projectCount * 10 + data.hackathonCount * 6 + (data.resume?.atsScore ? 12 : 0), 35);
  const twinScore = data.twin?.readinessScore ?? 45;
  const goalScore = goalMatches.length ? 15 : data.careerGoals.length ? 5 : 0;
  const matchScore = clamp(skillCoverage * 0.45 + twinScore * 0.25 + evidenceScore + goalScore);
  const readinessScore = clamp(skillCoverage * 0.5 + (data.resume?.atsScore ?? twinScore) * 0.25 + Math.min(data.projectCount * 8, 25));
  const successProbability = clamp(matchScore * 0.5 + readinessScore * 0.35 + (missingSkills.length ? 0 : 12));
  const readiness = readinessScore >= 75 ? "High" : readinessScore >= 50 ? "Medium" : "Low";

  return {
    matchScore,
    readinessScore,
    readiness,
    successProbability,
    missingSkills: missingSkills.slice(0, 8),
    missingKeywords: allOpportunitySkills.filter((skill) => !data.skills.includes(skill)).slice(0, 8),
    recommendedActions: [
      missingSkills[0] ? `Build evidence for ${missingSkills[0]} before applying.` : "Polish your application with measurable project outcomes.",
      data.resume?.atsScore ? "Tailor resume keywords to this opportunity." : "Run the Resume Analyzer before applying.",
      data.projectCount ? "Link your strongest related project in the application." : "Create one relevant portfolio project."
    ],
    explanation: missingSkills.length
      ? `You match parts of this opportunity, but ${missingSkills.slice(0, 3).join(", ")} need stronger evidence.`
      : "Your tracked skills and project evidence align well with this opportunity.",
    pipelineStage: "Recommended"
  };
}

async function aiAnalysis(opportunity: any, data: Awaited<ReturnType<typeof collectStudentData>>, fallback: ReturnType<typeof fallbackAnalysis>) {
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.25 } });
    const result = await model.generateContent(`
You are EngineerConnect AI Opportunity Engine.
Match this engineering student to the opportunity using only the stored data below.
Return compact JSON:
{"explanation":"","recommendedActions":[],"missingKeywords":[],"pipelineStage":""}
Student career goals: ${JSON.stringify(data.careerGoals)}
Student skills: ${JSON.stringify(data.skills)}
Projects count: ${data.projectCount}
Hackathons count: ${data.hackathonCount}
Career Twin readiness: ${data.twin?.readinessScore ?? 0}
Resume ATS score: ${data.resume?.atsScore ?? 0}
Opportunity: ${JSON.stringify({
  title: opportunity.title,
  provider: opportunity.provider,
  type: opportunity.type,
  requiredSkills: opportunity.requiredSkills,
  preferredSkills: opportunity.preferredSkills,
  careerGoals: opportunity.careerGoals,
  eligibility: opportunity.eligibility
})}
`);
    const parsed = JSON.parse(result.response.text()) as Partial<typeof fallback>;
    return {
      ...fallback,
      explanation: parsed.explanation || fallback.explanation,
      recommendedActions: Array.isArray(parsed.recommendedActions) && parsed.recommendedActions.length ? parsed.recommendedActions.slice(0, 6) : fallback.recommendedActions,
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 8) : fallback.missingKeywords,
      pipelineStage: parsed.pipelineStage || fallback.pipelineStage
    };
  } catch {
    return fallback;
  }
}

async function buildMatches(userId: any, options: { type?: unknown; status?: unknown } = {}) {
  const data = await collectStudentData(userId);
  const query: Record<string, unknown> = opportunityStatusFilter(options.status);
  if (typeof options.type === "string" && options.type.trim()) query.type = options.type.trim();

  const [opportunities, tracked] = await Promise.all([
    Opportunity.find(query).sort({ deadline: 1, updatedAt: -1 }).limit(80),
    OpportunityApplication.find({ user: userId })
  ]);
  const trackedByOpportunity = new Map(tracked.map((item) => [String(item.opportunity), item]));

  const scored = await Promise.all(
    opportunities.map(async (opportunity, index) => {
      const fallback = fallbackAnalysis(opportunity, data);
      const analysis = index < 8 ? await aiAnalysis(opportunity, data, fallback) : fallback;
      const tracking = trackedByOpportunity.get(String(opportunity._id));
      return { opportunity, analysis, tracking };
    })
  );

  return {
    matches: scored.sort((left, right) => right.analysis.matchScore - left.analysis.matchScore),
    summary: {
      total: scored.length,
      highReadiness: scored.filter((item) => item.analysis.readiness === "High").length,
      saved: tracked.filter((item) => item.saved).length,
      applied: tracked.filter((item) => item.status === "applied").length
    }
  };
}

export const getOpportunityMatches = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const bundle = await buildMatches(user.id, { type: req.query.type, status: req.query.status });
  res.json({ success: true, ...bundle });
});

export const refreshOpportunityMatches = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const bundle = await buildMatches(user.id, { type: req.query.type, status: req.query.status });
  res.json({ success: true, refreshed: true, ...bundle });
});

export const saveOpportunity = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const opportunityId = objectId(req.params.opportunityId);
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) throw new HttpError(StatusCodes.NOT_FOUND, "OPPORTUNITY_NOT_FOUND", "Opportunity was not found.");
  const data = await collectStudentData(user.id);
  const analysis = fallbackAnalysis(opportunity, data);
  const tracking = await OpportunityApplication.findOneAndUpdate(
    { user: user.id, opportunity: opportunityId },
    {
      user: user.id,
      opportunity: opportunityId,
      saved: true,
      status: req.body?.status || "saved",
      notes: typeof req.body?.notes === "string" ? req.body.notes.trim() : "",
      scoreSnapshot: analysis
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, tracking });
});

export const trackOpportunity = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const opportunityId = objectId(req.params.opportunityId);
  const status = typeof req.body?.status === "string" ? req.body.status : "planning";
  const allowed = ["saved", "planning", "applied", "interview", "offer", "rejected", "withdrawn"];
  if (!allowed.includes(status)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_STATUS", "Invalid application status.");
  const tracking = await OpportunityApplication.findOneAndUpdate(
    { user: user.id, opportunity: opportunityId },
    {
      user: user.id,
      opportunity: opportunityId,
      saved: status !== "withdrawn",
      status,
      notes: typeof req.body?.notes === "string" ? req.body.notes.trim() : undefined
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, tracking });
});

export const askOpportunityCoach = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const opportunity = await Opportunity.findById(objectId(req.params.opportunityId));
  if (!opportunity) throw new HttpError(StatusCodes.NOT_FOUND, "OPPORTUNITY_NOT_FOUND", "Opportunity was not found.");
  const data = await collectStudentData(user.id);
  const analysis = fallbackAnalysis(opportunity, data);
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.3 } });
    const result = await model.generateContent(`
You are an opportunity coach for engineering students.
Question: Am I ready for this opportunity?
Student skills: ${JSON.stringify(data.skills)}
Career goal: ${JSON.stringify(data.careerGoals)}
Career Twin readiness: ${data.twin?.readinessScore ?? 0}
Resume ATS score: ${data.resume?.atsScore ?? 0}
Opportunity: ${opportunity.title} by ${opportunity.provider}
Required skills: ${JSON.stringify(opportunity.requiredSkills)}
Missing skills: ${JSON.stringify(analysis.missingSkills)}
Give a practical answer in 4 short sentences.
`);
    res.json({ success: true, answer: result.response.text(), analysis });
  } catch {
    res.json({ success: true, answer: `${analysis.readiness} readiness. ${analysis.explanation} Next: ${analysis.recommendedActions[0]}`, analysis });
  }
});
