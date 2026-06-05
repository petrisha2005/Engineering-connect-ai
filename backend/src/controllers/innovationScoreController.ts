import { StatusCodes } from "http-status-codes";
import { gemini } from "../config/gemini.js";
import { CareerTwinProfile } from "../models/CareerTwinProfile.js";
import { CommunityPost } from "../models/CommunityPost.js";
import { FounderProfile } from "../models/FounderProfile.js";
import { HackathonTeam } from "../models/HackathonTeam.js";
import { InnovationScore } from "../models/InnovationScore.js";
import { Mentor } from "../models/Mentor.js";
import { MentorRequest } from "../models/MentorRequest.js";
import { Profile } from "../models/Profile.js";
import { Project } from "../models/Project.js";
import { ProjectHealth } from "../models/ProjectHealth.js";
import { ResumeReport } from "../models/ResumeReport.js";
import { SkillExchangeProfile } from "../models/SkillExchangeProfile.js";
import { SkillExchangeRequest } from "../models/SkillExchangeRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const BADGES = [
  { key: "hackathon_hero", label: "Hackathon Hero" },
  { key: "top_collaborator", label: "Top Collaborator" },
  { key: "research_explorer", label: "Research Explorer" },
  { key: "startup_builder", label: "Startup Builder" },
  { key: "ai_innovator", label: "AI Innovator" },
  { key: "community_mentor", label: "Community Mentor" }
];

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function list(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function countProfileCompletion(profile: any) {
  if (!profile) return 0;
  const fields = [
    profile.name,
    profile.college,
    profile.branch,
    profile.year,
    list(profile.skills).length,
    list(profile.interests).length,
    list(profile.goals).length,
    profile.github,
    profile.linkedin,
    profile.bio,
    profile.headline,
    list(profile.achievements).length
  ];
  return clamp((fields.filter(Boolean).length / fields.length) * 100);
}

async function collectMetrics(userId: any) {
  const [
    profile,
    careerTwin,
    resume,
    projects,
    ownedProjects,
    projectHealth,
    hackathons,
    communityPosts,
    skillExchangeProfile,
    completedExchanges,
    acceptedMentorships,
    mentorProfile,
    founderProfile
  ] = await Promise.all([
    Profile.findOne({ user: userId }),
    CareerTwinProfile.findOne({ user: userId }).sort({ updatedAt: -1 }),
    ResumeReport.findOne({ user: userId }).sort({ createdAt: -1 }),
    Project.find({ $or: [{ owner: userId }, { "members.user": userId }] }).sort({ updatedAt: -1 }),
    Project.find({ owner: userId }).sort({ updatedAt: -1 }),
    ProjectHealth.find().populate({ path: "project", match: { $or: [{ owner: userId }, { "members.user": userId }] }, select: "_id owner members status" }),
    HackathonTeam.find({ $or: [{ owner: userId }, { "members.user": userId }] }).sort({ updatedAt: -1 }),
    CommunityPost.find({ author: userId, hidden: false }),
    SkillExchangeProfile.findOne({ userId }),
    SkillExchangeRequest.countDocuments({ status: "completed", $or: [{ requester: userId }, { recipient: userId }] }),
    MentorRequest.countDocuments({ status: "accepted", $or: [{ student: userId }, { mentor: userId }] }),
    Mentor.findOne({ user: userId, active: true }),
    FounderProfile.findOne({ userId })
  ]);

  const visibleProjectHealth = projectHealth.filter((health: any) => health.project);
  const profileProjects = Array.isArray(profile?.projects) ? profile.projects : [];
  const skills = list([...list(profile?.skills), ...list(skillExchangeProfile?.teachSkills), ...list(founderProfile?.skills), ...list(mentorProfile?.skills)]);
  const achievements = list(profile?.achievements);
  const aiSkills = skills.filter((skill) => /ai|ml|machine learning|deep learning|data|python|tensorflow|pytorch|nlp|computer vision/.test(skill));
  const researchSignals = [...achievements, ...list(profile?.interests), ...list(profile?.goals)].filter((item) => /research|paper|publication|journal|patent|conference|scholar/.test(item));
  const communityLikes = communityPosts.reduce((total: number, post: any) => total + (Array.isArray(post.likes) ? post.likes.length : 0), 0);
  const completedProjects = projects.filter((project: any) => project.status === "completed").length + visibleProjectHealth.filter((health: any) => health.healthScore >= 75).length;
  const projectCount = projects.length + profileProjects.length;
  const teamParticipation = projects.reduce((total: number, project: any) => total + (Array.isArray(project.members) ? project.members.length : 0), 0) + hackathons.reduce((total: number, team: any) => total + (Array.isArray(team.members) ? team.members.length : 0), 0);
  const projectSuccessRate = projectCount ? clamp((completedProjects / projectCount) * 100) : 0;
  const profileCompletion = countProfileCompletion(profile);

  const metrics = {
    skills: skills.length,
    projects: projectCount,
    completedProjects,
    hackathons: hackathons.length,
    communityPosts: communityPosts.length,
    communityLikes,
    completedExchanges,
    acceptedMentorships,
    profileCompletion,
    teamParticipation,
    projectSuccessRate
  };

  const technical = clamp(skills.length * 5 + projectCount * 8 + (resume?.atsScore ?? 0) * 0.12 + (careerTwin?.readinessBreakdown?.technical ?? 0) * 0.35);
  const innovation = clamp(projectCount * 10 + hackathons.length * 8 + aiSkills.length * 8 + (founderProfile ? 12 : 0) + visibleProjectHealth.filter((health: any) => health.healthScore >= 80).length * 6);
  const collaboration = clamp(teamParticipation * 8 + completedExchanges * 16 + acceptedMentorships * 12 + communityPosts.length * 3 + communityLikes * 2);
  const leadership = clamp(ownedProjects.length * 12 + hackathons.filter((team: any) => String(team.owner) === String(userId)).length * 14 + (mentorProfile ? 18 : 0) + acceptedMentorships * 8);
  const careerReadiness = clamp((careerTwin?.readinessScore ?? 0) * 0.65 + profileCompletion * 0.2 + (resume?.atsScore ?? 0) * 0.15);
  const startupReadiness = clamp((founderProfile ? 35 : 0) + projectCount * 7 + hackathons.length * 6 + (founderProfile?.startupStage === "mvp" || founderProfile?.startupStage === "early_users" || founderProfile?.startupStage === "revenue" ? 18 : 0));
  const researchReadiness = clamp(researchSignals.length * 12 + projectCount * 4 + aiSkills.length * 4 + (careerTwin?.portfolioQuality ?? 0) * 0.18);
  const scores = { technical, innovation, collaboration, leadership, careerReadiness, startupReadiness, researchReadiness };
  const overallScore = clamp(Object.values(scores).reduce((total, score) => total + score, 0) / 7);

  const badgeChecks = {
    hackathon_hero: hackathons.length >= 2 || hackathons.some((team: any) => ["ready", "competing", "completed"].includes(team.status)),
    top_collaborator: completedExchanges >= 2 || teamParticipation >= 5,
    research_explorer: researchReadiness >= 60 || researchSignals.length >= 2,
    startup_builder: Boolean(founderProfile) || startupReadiness >= 65,
    ai_innovator: aiSkills.length >= 3 || innovation >= 75,
    community_mentor: Boolean(mentorProfile) || acceptedMentorships >= 2 || communityPosts.length >= 5
  };
  const badges = BADGES.map((badge) => ({
    ...badge,
    earned: Boolean(badgeChecks[badge.key as keyof typeof badgeChecks]),
    reason: Boolean(badgeChecks[badge.key as keyof typeof badgeChecks]) ? "Earned from real platform activity." : "Keep building activity to unlock this badge."
  }));

  return { profile, careerTwin, metrics, scores, overallScore, badges };
}

function fallbackInsights(bundle: Awaited<ReturnType<typeof collectMetrics>>) {
  const scoreEntries = Object.entries(bundle.scores).sort((left, right) => right[1] - left[1]);
  const top = scoreEntries[0];
  const low = [...scoreEntries].reverse()[0];
  return {
    strengths: [`Strongest dimension: ${top[0]} at ${top[1]}%.`, `${bundle.metrics.projects} project signals and ${bundle.metrics.skills} tracked skills are contributing to your score.`],
    weaknesses: [`Lowest dimension: ${low[0]} at ${low[1]}%.`, bundle.metrics.profileCompletion < 80 ? "Profile completion is limiting reputation confidence." : "Add deeper proof such as completed collaborations or mentor activity."],
    improvementPlan: [
      "Complete or update one project with measurable outcomes.",
      "Participate in community, mentorship, or skill exchange to raise collaboration reputation.",
      "Refresh Career Twin and Resume Analyzer after adding new evidence."
    ],
    explanation: `Your EngineerConnect Score is ${bundle.overallScore} because it combines skills, projects, collaboration, leadership, Career Twin readiness, startup signals, and research evidence.`
  };
}

async function aiInsights(bundle: Awaited<ReturnType<typeof collectMetrics>>) {
  const fallback = fallbackInsights(bundle);
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.25 } });
    const result = await model.generateContent(`
You are EngineerConnect AI Reputation Analyst.
Explain a student's dynamic innovation and reputation score using only this real platform data.
Return JSON:
{"strengths":[],"weaknesses":[],"improvementPlan":[],"explanation":""}
Scores: ${JSON.stringify(bundle.scores)}
Overall score: ${bundle.overallScore}
Metrics: ${JSON.stringify(bundle.metrics)}
Badges: ${JSON.stringify(bundle.badges.filter((badge) => badge.earned).map((badge) => badge.label))}
`);
    const parsed = JSON.parse(result.response.text()) as Partial<typeof fallback>;
    return {
      strengths: Array.isArray(parsed.strengths) && parsed.strengths.length ? parsed.strengths.slice(0, 6) : fallback.strengths,
      weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length ? parsed.weaknesses.slice(0, 6) : fallback.weaknesses,
      improvementPlan: Array.isArray(parsed.improvementPlan) && parsed.improvementPlan.length ? parsed.improvementPlan.slice(0, 6) : fallback.improvementPlan,
      explanation: parsed.explanation || fallback.explanation
    };
  } catch {
    return fallback;
  }
}

async function calculateAndStore(userId: any) {
  const bundle = await collectMetrics(userId);
  const insights = await aiInsights(bundle);
  const score = await InnovationScore.create({
    user: userId,
    profile: bundle.profile?._id,
    college: bundle.profile?.college ?? "",
    branch: bundle.profile?.branch ?? "",
    overallScore: bundle.overallScore,
    scores: bundle.scores,
    metrics: bundle.metrics,
    badges: bundle.badges,
    ...insights,
    calculatedAt: new Date()
  });
  return score;
}

async function latestOrCreate(userId: any) {
  const latest = await InnovationScore.findOne({ user: userId }).sort({ calculatedAt: -1 });
  if (latest && Date.now() - new Date(latest.calculatedAt).getTime() < 1000 * 60 * 15) return latest;
  return calculateAndStore(userId);
}

async function leaderboard(filter: Record<string, unknown> = {}) {
  const latestScores = await InnovationScore.aggregate([
    { $match: filter },
    { $sort: { calculatedAt: -1 } },
    { $group: { _id: "$user", score: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$score" } },
    { $sort: { overallScore: -1, calculatedAt: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: "profiles",
        localField: "profile",
        foreignField: "_id",
        as: "profile"
      }
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    { $project: { overallScore: 1, scores: 1, badges: 1, calculatedAt: 1, "profile.name": 1, "profile.college": 1, "profile.branch": 1, "profile.skills": 1 } }
  ]);
  return latestScores;
}

export const getInnovationScore = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const score = await latestOrCreate(user.id);
  const history = await InnovationScore.find({ user: user.id }).sort({ calculatedAt: -1 }).limit(10);
  const filters = typeof req.query.filter === "string" ? req.query.filter.toLowerCase() : "";
  const globalLeaderboard = await leaderboard(filters ? { $or: [{ "badges.label": new RegExp(filters, "i") }, { strengths: new RegExp(filters, "i") }] } : {});
  const collegeLeaderboard = score.college ? await leaderboard({ college: score.college }) : [];
  const branchLeaderboard = score.branch ? await leaderboard({ branch: score.branch }) : [];
  res.json({ success: true, score, history, leaderboards: { global: globalLeaderboard, college: collegeLeaderboard, branch: branchLeaderboard } });
});

export const refreshInnovationScore = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const score = await calculateAndStore(user.id);
  const history = await InnovationScore.find({ user: user.id }).sort({ calculatedAt: -1 }).limit(10);
  res.json({ success: true, refreshed: true, score, history });
});
