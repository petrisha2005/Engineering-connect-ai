import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { gemini } from "../config/gemini.js";
import { FounderProfile } from "../models/FounderProfile.js";
import { IdeaValidation } from "../models/IdeaValidation.js";
import { InnovationScore } from "../models/InnovationScore.js";
import { PitchDeck } from "../models/PitchDeck.js";
import { Profile } from "../models/Profile.js";
import { StartupMilestone } from "../models/StartupMilestone.js";
import { StartupProfile } from "../models/StartupProfile.js";
import { StartupReadiness } from "../models/StartupReadiness.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function objectId(value: unknown) {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_ID", "Invalid startup id");
  return new Types.ObjectId(value);
}

function list(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function getOwnedStartup(userId: any, startupId: unknown) {
  const startup = await StartupProfile.findOne({ _id: objectId(startupId), founderIds: userId });
  if (!startup) throw new HttpError(StatusCodes.NOT_FOUND, "STARTUP_NOT_FOUND", "Startup was not found.");
  return startup;
}

function fallbackValidation(startup: any) {
  const problemDepth = startup.problemStatement.length > 120 ? 18 : 8;
  const solutionDepth = startup.solution.length > 120 ? 16 : 8;
  const businessDepth = startup.businessModel.length > 80 ? 14 : 6;
  const stageBoost = { Idea: 5, Validation: 12, MVP: 22, Beta: 30, Launch: 38, Growth: 45 }[startup.stage as string] ?? 5;
  const marketPotential = clamp(42 + problemDepth + businessDepth + (startup.targetAudience.length > 60 ? 12 : 5));
  const innovationScore = clamp(40 + solutionDepth + list(startup.requiredSkills).filter((skill) => /ai|ml|data|iot|cloud|robot|blockchain/.test(skill)).length * 8);
  const technicalDifficulty = clamp(35 + list(startup.requiredSkills).length * 7 + (startup.stage === "Idea" ? 10 : 0));
  const validationScore = clamp((marketPotential + innovationScore + (100 - technicalDifficulty) + stageBoost) / 3);
  return {
    validationScore,
    marketPotential,
    innovationScore,
    technicalDifficulty,
    risks: ["Customer validation is still required.", "MVP scope may expand without strict milestones.", "Competitive positioning needs proof."],
    recommendations: ["Interview 10 target users.", "Build a small clickable prototype.", "Define one measurable MVP success metric."],
    competitors: [
      { name: "Existing manual/legacy alternatives", positioning: "Current users may already solve this with generic tools.", differentiator: "Differentiate with student-built speed, usability, and AI guidance." }
    ],
    opportunities: ["Focus on one niche user segment first.", "Use campus pilots for early validation."]
  };
}

async function generateValidation(startup: any) {
  const fallback = fallbackValidation(startup);
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.3 } });
    const result = await model.generateContent(`
You are EngineerConnect AI Startup Incubator.
Validate this student startup idea practically and realistically.
Return JSON:
{"validationScore":0,"marketPotential":0,"innovationScore":0,"technicalDifficulty":0,"risks":[],"recommendations":[],"competitors":[{"name":"","positioning":"","differentiator":""}],"opportunities":[]}
Startup: ${JSON.stringify(startup)}
`);
    return { ...fallback, ...(JSON.parse(result.response.text()) as Partial<typeof fallback>) };
  } catch {
    return fallback;
  }
}

function fallbackMilestones(startup: any) {
  return [
    { phase: "Research", title: "Validate problem and market", timeline: "1-2 weeks", tasks: ["Interview target users", "Map competitors", "Define MVP success metric"], requiredSkills: ["user research", "market analysis"], progress: startup.stage === "Idea" ? 20 : 100 },
    { phase: "Prototype", title: "Build clickable prototype", timeline: "2-3 weeks", tasks: ["Design user flow", "Create landing page", "Collect prototype feedback"], requiredSkills: ["ui/ux", "frontend"], progress: ["MVP", "Beta", "Launch", "Growth"].includes(startup.stage) ? 100 : 20 },
    { phase: "MVP", title: "Ship core MVP", timeline: "4-6 weeks", tasks: ["Build core feature", "Connect database", "Deploy beta"], requiredSkills: list(startup.requiredSkills).slice(0, 6), progress: ["Beta", "Launch", "Growth"].includes(startup.stage) ? 100 : startup.stage === "MVP" ? 50 : 0 },
    { phase: "Beta Testing", title: "Run pilot with real users", timeline: "2-4 weeks", tasks: ["Invite testers", "Track activation", "Fix onboarding issues"], requiredSkills: ["analytics", "testing"], progress: ["Launch", "Growth"].includes(startup.stage) ? 100 : startup.stage === "Beta" ? 55 : 0 },
    { phase: "Launch", title: "Launch and measure growth", timeline: "2-4 weeks", tasks: ["Prepare launch assets", "Set pricing experiment", "Measure retention"], requiredSkills: ["marketing", "growth"], progress: startup.stage === "Growth" ? 100 : startup.stage === "Launch" ? 60 : 0 }
  ];
}

async function ensureMilestones(startup: any) {
  const existing = await StartupMilestone.find({ startup: startup._id }).sort({ createdAt: 1 });
  if (existing.length) return existing;
  const created = await StartupMilestone.insertMany(fallbackMilestones(startup).map((milestone) => ({ startup: startup._id, ...milestone, completed: milestone.progress >= 100 })));
  await StartupProfile.findByIdAndUpdate(startup._id, { $push: { activityLog: { type: "startup_created", message: "MVP roadmap generated.", createdAt: new Date() } } });
  return created;
}

async function readiness(startup: any) {
  const [validation, milestones, founderProfiles, innovation] = await Promise.all([
    IdeaValidation.findOne({ startup: startup._id }),
    StartupMilestone.find({ startup: startup._id }),
    FounderProfile.find({ userId: { $in: startup.founderIds } }),
    InnovationScore.findOne({ user: startup.owner }).sort({ calculatedAt: -1 })
  ]);
  const completed = milestones.filter((milestone) => milestone.completed).length;
  const executionReadiness = clamp((completed / Math.max(milestones.length, 1)) * 100 + startup.currentProgress * 0.25);
  const marketReadiness = clamp((validation?.marketPotential ?? 45) * 0.8 + (["Validation", "MVP", "Beta", "Launch", "Growth"].includes(startup.stage) ? 18 : 5));
  const teamReadiness = clamp(founderProfiles.length * 22 + startup.founderIds.length * 8 + (innovation?.scores?.leadership ?? 0) * 0.2);
  const startupReadiness = clamp((validation?.validationScore ?? 45) * 0.45 + executionReadiness * 0.3 + teamReadiness * 0.25);
  const investorReadinessScore = clamp(startupReadiness * 0.4 + marketReadiness * 0.25 + executionReadiness * 0.2 + (validation?.innovationScore ?? 0) * 0.15);
  const overallStartupScore = clamp((startupReadiness + executionReadiness + marketReadiness + teamReadiness + investorReadinessScore) / 5);
  const validationRecommendations = list(validation?.recommendations);
  return StartupReadiness.create({
    startup: startup._id,
    startupReadiness,
    executionReadiness,
    marketReadiness,
    teamReadiness,
    investorReadinessScore,
    overallStartupScore,
    strengths: validationRecommendations.length ? ["Clear validation inputs available.", "MVP roadmap is connected to progress."] : ["Startup profile created."],
    weaknesses: teamReadiness < 55 ? ["Founder team is not balanced yet."] : ["More customer proof will improve investor readiness."],
    risks: list(validation?.risks).length ? list(validation?.risks) : ["Market and execution risk need validation."],
    nextSteps: validationRecommendations.length ? validationRecommendations : ["Interview users.", "Complete MVP roadmap.", "Find complementary co-founder."]
  });
}

async function recommendedFounders(startup: any) {
  const required = list(startup.requiredSkills);
  const founders = await FounderProfile.find({ userId: { $nin: startup.founderIds } }).populate("userId", "displayName email photoURL profile").limit(60);
  return founders
    .map((founder: any) => {
      const overlap = list(founder.skills).filter((skill) => required.includes(skill));
      const industry = list(founder.industries).includes(String(startup.industry).toLowerCase());
      const matchScore = clamp(35 + overlap.length * 14 + (industry ? 18 : 0) + (founder.commitmentLevel === "high" || founder.commitmentLevel === "full_time" ? 12 : 0));
      return { founder, matchScore, suggestedRole: founder.founderType, reason: overlap.length ? `Covers ${overlap.slice(0, 4).join(", ")}.` : "Complementary founder profile for team expansion." };
    })
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 8);
}

async function startupBundle(userId: any) {
  const startups = await StartupProfile.find({ founderIds: userId }).sort({ updatedAt: -1 });
  const details = await Promise.all(
    startups.map(async (startup) => {
      const [validation, milestones, latestReadiness, pitchDeck, founders] = await Promise.all([
        IdeaValidation.findOne({ startup: startup._id }),
        ensureMilestones(startup),
        StartupReadiness.findOne({ startup: startup._id }).sort({ calculatedAt: -1 }),
        PitchDeck.findOne({ startup: startup._id }),
        recommendedFounders(startup)
      ]);
      return { startup, validation, milestones, readiness: latestReadiness, pitchDeck, recommendedFounders: founders };
    })
  );
  return { startups, details };
}

export const createStartup = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const startup = await StartupProfile.create({
    owner: user.id,
    startupName: req.body.startupName,
    industry: req.body.industry,
    stage: req.body.stage || "Idea",
    problemStatement: req.body.problemStatement,
    solution: req.body.solution,
    targetAudience: req.body.targetAudience,
    businessModel: req.body.businessModel,
    founderIds: [user.id, ...(Array.isArray(req.body.founderIds) ? req.body.founderIds : [])],
    currentProgress: Number(req.body.currentProgress || 0),
    fundingStatus: req.body.fundingStatus || "Bootstrapped",
    requiredSkills: list(req.body.requiredSkills),
    missingRoles: list(req.body.missingRoles),
    activityLog: [{ type: "startup_created", message: "Startup created in AI Incubator.", createdAt: new Date() }]
  });
  await ensureMilestones(startup);
  res.status(StatusCodes.CREATED).json({ success: true, startup });
});

export const getStartups = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  res.json({ success: true, ...(await startupBundle(user.id)) });
});

export const getValidation = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const startup = await getOwnedStartup(user.id, req.params.id);
  const ai = await generateValidation(startup.toObject());
  const validation = await IdeaValidation.findOneAndUpdate({ startup: startup._id }, { startup: startup._id, ...ai, generatedAt: new Date() }, { new: true, upsert: true, runValidators: true });
  res.json({ success: true, validation });
});

export const getMvpRoadmap = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const startup = await getOwnedStartup(user.id, req.params.id);
  const milestones = await ensureMilestones(startup);
  res.json({ success: true, milestones });
});

export const getReadiness = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const startup = await getOwnedStartup(user.id, req.params.id);
  const score = await readiness(startup);
  res.json({ success: true, readiness: score });
});

export const completeMilestone = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const startup = await getOwnedStartup(user.id, req.params.id);
  const milestone = await StartupMilestone.findOneAndUpdate(
    { _id: objectId(req.body.milestoneId), startup: startup._id },
    { progress: 100, completed: true, completedAt: new Date() },
    { new: true }
  );
  if (!milestone) throw new HttpError(StatusCodes.NOT_FOUND, "MILESTONE_NOT_FOUND", "Milestone was not found.");
  await StartupProfile.findByIdAndUpdate(startup._id, { $push: { activityLog: { type: "milestone_completed", message: `${milestone.title} completed.`, createdAt: new Date() } } });
  res.json({ success: true, milestone });
});

export const getPitchDeck = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const startup = await getOwnedStartup(user.id, req.params.id);
  let pitchDeck = await PitchDeck.findOne({ startup: startup._id });
  if (!pitchDeck) {
    const startupName = String(startup.startupName);
    const problemStatement = String(startup.problemStatement);
    const solution = String(startup.solution);
    const targetAudience = String(startup.targetAudience);
    const industry = String(startup.industry);
    const businessModel = String(startup.businessModel);
    const slideEntries: Array<[string, string]> = [
      ["Problem", problemStatement],
      ["Solution", solution],
      ["Market", `Target audience: ${targetAudience}. Industry: ${industry}.`],
      ["Business Model", businessModel],
      ["Competition", "Position against current alternatives with faster execution and a focused niche."],
      ["Revenue Model", businessModel],
      ["Team", `Founders: ${startup.founderIds.length}. Missing roles: ${list(startup.missingRoles).join(", ") || "to be refined"}.`],
      ["Vision", `${startupName} aims to become a focused solution for ${targetAudience}.`]
    ];
    const slides = slideEntries.map(([title, content]) => ({ title, content, speakerNotes: `Explain ${title.toLowerCase()} with evidence and examples.` }));
    pitchDeck = await PitchDeck.create({ startup: startup._id, slides, exportText: slides.map((slide) => `${slide.title}\n${slide.content}`).join("\n\n") });
    await StartupProfile.findByIdAndUpdate(startup._id, { $push: { activityLog: { type: "pitch_generated", message: "Pitch deck generated.", createdAt: new Date() } } });
  }
  res.json({ success: true, pitchDeck });
});

export const askStartupAssistant = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const startup = await getOwnedStartup(user.id, req.params.id);
  const question = String(req.body.question || "").trim();
  if (!question) throw new HttpError(StatusCodes.BAD_REQUEST, "QUESTION_REQUIRED", "Ask a startup question.");
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.3 } });
    const result = await model.generateContent(`
You are EngineerConnect AI Startup Incubator assistant.
Answer using this real startup data.
Startup: ${JSON.stringify(startup)}
Question: ${question}
Give practical student-founder advice in 4-6 short sentences.
`);
    res.json({ success: true, answer: result.response.text() });
  } catch {
    res.json({ success: true, answer: "Validate the problem first, scope the smallest MVP, find a complementary co-founder, and measure one user behavior before expanding." });
  }
});
