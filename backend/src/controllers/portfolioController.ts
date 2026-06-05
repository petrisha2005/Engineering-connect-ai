import { StatusCodes } from "http-status-codes";
import { gemini } from "../config/gemini.js";
import { CareerTwinProfile } from "../models/CareerTwinProfile.js";
import { HackathonTeam } from "../models/HackathonTeam.js";
import { InnovationScore } from "../models/InnovationScore.js";
import { PortfolioAnalytics } from "../models/PortfolioAnalytics.js";
import { PortfolioProfile, portfolioThemes, portfolioTypes } from "../models/PortfolioProfile.js";
import { PortfolioTheme } from "../models/PortfolioTheme.js";
import { Profile } from "../models/Profile.js";
import { Project } from "../models/Project.js";
import { ProjectHealth } from "../models/ProjectHealth.js";
import { ResumeReport } from "../models/ResumeReport.js";
import { SkillExchangeRequest } from "../models/SkillExchangeRequest.js";
import { StartupIdea } from "../models/StartupIdea.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function list(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function lowerList(values: unknown): string[] {
  return list(values).map((value) => value.toLowerCase());
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || `student-${Date.now()}`;
}

async function uniqueUsername(base: string, userId: any) {
  const existing = await PortfolioProfile.findOne({ user: userId });
  if (existing) return existing.username;
  let username = base;
  let count = 1;
  while (await PortfolioProfile.exists({ username })) {
    count += 1;
    username = `${base}-${count}`;
  }
  return username;
}

async function collectPortfolioData(userId: any, email = "") {
  const [profile, projects, projectHealth, hackathons, careerTwin, innovationScore, resumeReport, exchanges, startupIdeas] = await Promise.all([
    Profile.findOne({ user: userId }),
    Project.find({ $or: [{ owner: userId }, { "members.user": userId }] }).sort({ updatedAt: -1 }).limit(18),
    ProjectHealth.find().populate({ path: "project", match: { $or: [{ owner: userId }, { "members.user": userId }] }, select: "_id title" }),
    HackathonTeam.find({ $or: [{ owner: userId }, { "members.user": userId }] }).sort({ updatedAt: -1 }).limit(12),
    CareerTwinProfile.findOne({ user: userId }).sort({ updatedAt: -1 }),
    InnovationScore.findOne({ user: userId }).sort({ calculatedAt: -1 }),
    ResumeReport.findOne({ user: userId }).sort({ createdAt: -1 }),
    SkillExchangeRequest.find({ status: "completed", $or: [{ requester: userId }, { recipient: userId }] }).limit(20),
    StartupIdea.find({ owner: userId }).sort({ updatedAt: -1 }).limit(8).catch(() => [])
  ]);

  if (!profile) throw new HttpError(StatusCodes.BAD_REQUEST, "PROFILE_REQUIRED", "Complete your profile before generating a portfolio.");

  const profileProjects = Array.isArray(profile.projects) ? profile.projects : [];
  const healthByProject = new Map(projectHealth.filter((health: any) => health.project).map((health: any) => [String(health.project._id), health]));
  const skills = lowerList([
    ...list(profile.skills),
    ...(careerTwin?.missingSkills ? [] : []),
    ...projects.flatMap((project: any) => list(project.requiredSkills)),
    ...profileProjects.flatMap((project: any) => list(project.skills)),
    ...list(resumeReport?.improvedResume?.skills)
  ]);
  const achievements = list([...list(profile.achievements), ...list((innovationScore?.badges ?? []).filter((badge: any) => badge.earned).map((badge: any) => badge.label))]);
  const portfolioProjects = [
    ...projects.map((project: any) => {
      const health = healthByProject.get(String(project._id));
      return {
        title: project.title,
        description: project.description,
        skills: list(project.requiredSkills),
        impactScore: clamp(health?.healthScore ?? (project.status === "completed" ? 80 : project.status === "in_progress" ? 62 : 48)),
        links: list([project.repositoryUrl, project.demoUrl])
      };
    }),
    ...profileProjects.map((project: any) => ({
      title: project.title,
      description: project.description,
      skills: list(project.skills),
      impactScore: 58,
      links: list(project.links)
    }))
  ].slice(0, 12);

  return {
    profile,
    email,
    skills,
    achievements,
    portfolioProjects,
    hackathons,
    careerTwin,
    innovationScore,
    resumeReport,
    exchanges,
    startupIdeas
  };
}

function fallbackSections(data: Awaited<ReturnType<typeof collectPortfolioData>>, type: string) {
  const name = data.profile.name;
  const goal = list(data.profile.goals)[0] || data.careerTwin?.careerGoal || "engineering innovation";
  const topSkills = data.skills.slice(0, 14);
  const projects = data.portfolioProjects.map((project) => ({
    ...project,
    description: `${project.description} Key technologies include ${project.skills.slice(0, 4).join(", ") || "engineering fundamentals"}.`
  }));
  const researchSignals = [...list(data.profile.interests), ...data.achievements].filter((item) => /research|paper|publication|patent|journal|conference/i.test(item));
  return {
    heroTitle: `${name} | ${goal}`,
    heroSubtitle: `${data.profile.branch} student at ${data.profile.college}, building projects across ${topSkills.slice(0, 4).join(", ") || "engineering"}.`,
    professionalSummary: `${name} is an engineering student focused on ${goal}. Their portfolio highlights practical projects, collaboration, career readiness, and measurable growth from EngineerConnect AI activity.`,
    aboutMe: `I am a ${data.profile.branch} student at ${data.profile.college}. I enjoy solving real problems through projects, teamwork, and continuous learning.`,
    recruiterSummary: `${type} generated from verified profile, projects, scores, and platform activity. Strongest signals include ${topSkills.slice(0, 5).join(", ") || "profile completion and project participation"}.`,
    skills: topSkills,
    projects,
    certifications: list(data.resumeReport?.improvedResume?.certifications).concat(data.achievements.filter((item) => /cert|course|badge/i.test(item))).slice(0, 12),
    achievements: data.achievements.slice(0, 16),
    hackathons: data.hackathons.map((team: any) => `${team.hackathonName}: ${team.name} (${team.status})`).slice(0, 12),
    research: researchSignals.slice(0, 10),
    experience: [
      data.exchanges.length ? `Completed ${data.exchanges.length} peer skill exchange partnership${data.exchanges.length === 1 ? "" : "s"}.` : "",
      data.startupIdeas.length ? `Explored ${data.startupIdeas.length} startup idea${data.startupIdeas.length === 1 ? "" : "s"}.` : ""
    ].filter(Boolean),
    careerGoals: list(data.profile.goals).slice(0, 8),
    contact: { email: data.email, github: data.profile.github, linkedin: data.profile.linkedin }
  };
}

function fallbackImprovements(data: Awaited<ReturnType<typeof collectPortfolioData>>) {
  return {
    missingSections: [
      data.portfolioProjects.length ? "" : "Add at least one detailed project.",
      data.hackathons.length ? "" : "Add hackathon participation or team experience.",
      data.resumeReport ? "" : "Run Resume Analyzer to improve recruiter mode."
    ].filter(Boolean),
    betterProjectDescriptions: data.portfolioProjects.slice(0, 4).map((project) => `Quantify impact for ${project.title} with users, metrics, or deployment outcomes.`),
    missingSkills: list(data.careerTwin?.missingSkills).slice(0, 8),
    missingCertifications: list(data.careerTwin?.missingCertifications).slice(0, 6),
    portfolioImprovements: ["Add deployed demo links for top projects.", "Keep GitHub and LinkedIn links updated.", "Refresh this portfolio after major profile changes."]
  };
}

async function aiPortfolioContent(data: Awaited<ReturnType<typeof collectPortfolioData>>, type: string, theme: string) {
  const fallback = { sections: fallbackSections(data, type), improvementEngine: fallbackImprovements(data) };
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.35 } });
    const result = await model.generateContent(`
You are EngineerConnect AI Portfolio Generator.
Create recruiter-friendly portfolio content using only this student's real stored platform data.
Do not invent jobs, certifications, awards, companies, or projects.
Return JSON:
{"sections":{"heroTitle":"","heroSubtitle":"","professionalSummary":"","aboutMe":"","recruiterSummary":"","skills":[],"projects":[{"title":"","description":"","skills":[],"impactScore":0,"links":[]}],"certifications":[],"achievements":[],"hackathons":[],"research":[],"experience":[],"careerGoals":[],"contact":{"email":"","github":"","linkedin":""}},"improvementEngine":{"missingSections":[],"betterProjectDescriptions":[],"missingSkills":[],"missingCertifications":[],"portfolioImprovements":[]}}
Portfolio type: ${type}
Theme: ${theme}
Profile: ${JSON.stringify({ name: data.profile.name, college: data.profile.college, branch: data.profile.branch, year: data.profile.year, goals: data.profile.goals, github: data.profile.github, linkedin: data.profile.linkedin })}
Skills: ${JSON.stringify(data.skills)}
Projects: ${JSON.stringify(data.portfolioProjects)}
Hackathons: ${JSON.stringify(data.hackathons.map((team: any) => ({ name: team.name, hackathonName: team.hackathonName, status: team.status, skillsNeeded: team.skillsNeeded })))}
Career Twin: ${JSON.stringify(data.careerTwin ? { careerGoal: data.careerTwin.careerGoal, readinessScore: data.careerTwin.readinessScore, missingSkills: data.careerTwin.missingSkills, missingCertifications: data.careerTwin.missingCertifications } : null)}
Innovation Score: ${JSON.stringify(data.innovationScore ? { overallScore: data.innovationScore.overallScore, scores: data.innovationScore.scores, badges: data.innovationScore.badges } : null)}
Achievements: ${JSON.stringify(data.achievements)}
`);
    const parsed = JSON.parse(result.response.text()) as Partial<typeof fallback>;
    return {
      sections: { ...fallback.sections, ...(parsed.sections ?? {}) },
      improvementEngine: { ...fallback.improvementEngine, ...(parsed.improvementEngine ?? {}) }
    };
  } catch {
    return fallback;
  }
}

async function ensureDefaultThemes() {
  const defaults = [
    ["modern-developer", "Modern Developer", "Clean green/teal developer portfolio for projects and skills."],
    ["ai-engineer", "AI Engineer", "Portfolio layout for AI, ML, data, and intelligent systems."],
    ["data-scientist", "Data Scientist", "Evidence-focused data and analytics portfolio theme."],
    ["startup-founder", "Startup Founder", "Founder-oriented portfolio with vision, leadership, and startup readiness."],
    ["researcher", "Researcher", "Academic and research-focused portfolio theme."]
  ];
  await Promise.all(defaults.map(([key, name, description]) => PortfolioTheme.updateOne({ key }, { key, name, description, active: true }, { upsert: true })));
}

async function generateForUser(user: { id: any; email: string; displayName: string }, body: any = {}) {
  const type = (portfolioTypes as readonly string[]).includes(body.type) ? body.type : "Student Portfolio";
  const theme = (portfolioThemes as readonly string[]).includes(body.theme) ? body.theme : "Modern Developer";
  const data = await collectPortfolioData(user.id, user.email);
  const username = await uniqueUsername(slugify(String(data.profile.name || user.displayName || user.email.split("@")[0])), user.id);
  const ai = await aiPortfolioContent(data, type, theme);
  const recruiterMode = {
    technicalScore: data.innovationScore?.scores?.technical ?? 0,
    innovationScore: data.innovationScore?.scores?.innovation ?? 0,
    leadershipScore: data.innovationScore?.scores?.leadership ?? 0,
    careerReadiness: data.innovationScore?.scores?.careerReadiness ?? data.careerTwin?.readinessScore ?? 0,
    overallScore: data.innovationScore?.overallScore ?? 0
  };
  const portfolio = await PortfolioProfile.findOneAndUpdate(
    { user: user.id },
    {
      user: user.id,
      username,
      publicPath: `/portfolio/${username}`,
      type,
      theme,
      published: body.published ?? true,
      sections: ai.sections,
      improvementEngine: ai.improvementEngine,
      recruiterMode,
      sourceSummary: {
        skillsCount: data.skills.length,
        projectsCount: data.portfolioProjects.length,
        hackathonsCount: data.hackathons.length,
        achievementsCount: data.achievements.length,
        lastGeneratedAt: new Date()
      }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await PortfolioAnalytics.updateOne({ portfolio: portfolio._id }, { $setOnInsert: { user: user.id, portfolio: portfolio._id } }, { upsert: true });
  return portfolio;
}

async function trackEvent(portfolio: any, type: "portfolio_view" | "recruiter_view" | "profile_click" | "resume_download" | "project_click", projectTitle = "") {
  const field = {
    portfolio_view: "portfolioViews",
    recruiter_view: "recruiterViews",
    profile_click: "profileClicks",
    resume_download: "resumeDownloads",
    project_click: "projectClicks"
  }[type];
  await PortfolioAnalytics.updateOne(
    { portfolio: portfolio._id },
    {
      $setOnInsert: { user: portfolio.user, portfolio: portfolio._id },
      $inc: { [field]: 1 },
      $push: { events: { $each: [{ type, projectTitle, occurredAt: new Date() }], $slice: -250 } }
    },
    { upsert: true }
  );
}

export const getMyPortfolio = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  await ensureDefaultThemes();
  const [portfolio, analytics, themes] = await Promise.all([
    PortfolioProfile.findOne({ user: user.id }),
    PortfolioAnalytics.findOne({ user: user.id }).sort({ updatedAt: -1 }),
    PortfolioTheme.find({ active: true }).sort({ name: 1 })
  ]);
  res.json({ success: true, portfolio, analytics, themes });
});

export const generatePortfolio = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  await ensureDefaultThemes();
  const portfolio = await generateForUser(user, req.body);
  const analytics = await PortfolioAnalytics.findOne({ portfolio: portfolio._id });
  res.status(StatusCodes.CREATED).json({ success: true, portfolio, analytics });
});

export const updatePortfolio = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const portfolio = await PortfolioProfile.findOne({ user: user.id });
  if (!portfolio) throw new HttpError(StatusCodes.NOT_FOUND, "PORTFOLIO_NOT_FOUND", "Generate a portfolio first.");
  if (portfolioTypes.includes(req.body?.type)) portfolio.type = req.body.type;
  if (portfolioThemes.includes(req.body?.theme)) portfolio.theme = req.body.theme;
  if (typeof req.body?.published === "boolean") portfolio.published = req.body.published;
  await portfolio.save();
  res.json({ success: true, portfolio });
});

export const getPublicPortfolio = asyncHandler(async (req, res) => {
  const username = String(req.params.username || "").toLowerCase();
  const portfolio = await PortfolioProfile.findOne({ username, published: true });
  if (!portfolio) throw new HttpError(StatusCodes.NOT_FOUND, "PORTFOLIO_NOT_FOUND", "Portfolio was not found.");
  const recruiterMode = req.query.mode === "recruiter";
  await trackEvent(portfolio, recruiterMode ? "recruiter_view" : "portfolio_view");
  res.json({ success: true, portfolio });
});

export const getPortfolioAnalytics = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const portfolio = await PortfolioProfile.findOne({ user: user.id });
  if (!portfolio) return res.json({ success: true, analytics: null });
  const analytics = await PortfolioAnalytics.findOne({ portfolio: portfolio._id });
  res.json({ success: true, analytics });
});

export const trackPortfolioEvent = asyncHandler(async (req, res) => {
  const portfolio = await PortfolioProfile.findOne({ username: String(req.params.username || "").toLowerCase(), published: true });
  if (!portfolio) throw new HttpError(StatusCodes.NOT_FOUND, "PORTFOLIO_NOT_FOUND", "Portfolio was not found.");
  const type = req.body?.type;
  if (!["profile_click", "resume_download", "project_click", "recruiter_view"].includes(type)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_EVENT", "Invalid portfolio event.");
  await trackEvent(portfolio, type, typeof req.body?.projectTitle === "string" ? req.body.projectTitle : "");
  res.json({ success: true });
});
