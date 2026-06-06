import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { gemini } from "../config/gemini.js";
import { CareerTwinProfile } from "../models/CareerTwinProfile.js";
import { InnovationScore } from "../models/InnovationScore.js";
import { Notification } from "../models/Notification.js";
import { Opportunity } from "../models/Opportunity.js";
import { Profile } from "../models/Profile.js";
import { ResearchFacultyMentor } from "../models/ResearchFacultyMentor.js";
import { ResearchProfile, researchDomains } from "../models/ResearchProfile.js";
import { ResearchProject } from "../models/ResearchProject.js";
import { ResearchRequest } from "../models/ResearchRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function objectId(value: unknown) {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) throw new HttpError(StatusCodes.BAD_REQUEST, "INVALID_ID", "Invalid id");
  return new Types.ObjectId(value);
}

function list(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function overlap(left: string[] = [], right: string[] = []) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function cleanDomains(values: unknown) {
  const allowed = new Set(researchDomains);
  return Array.isArray(values) ? values.filter((value) => allowed.has(value)) : [];
}

async function readinessFor(userId: any) {
  const [researchProfile, studentProfile, careerTwin, innovationScore, projects] = await Promise.all([
    ResearchProfile.findOne({ user: userId }),
    Profile.findOne({ user: userId }),
    CareerTwinProfile.findOne({ user: userId }).sort({ updatedAt: -1 }),
    InnovationScore.findOne({ user: userId }).sort({ calculatedAt: -1 }),
    ResearchProject.find({ $or: [{ owner: userId }, { "members.user": userId }] })
  ]);
  const skills = list([...list(researchProfile?.skills), ...list(studentProfile?.skills)]);
  const publicationCount = Array.isArray(researchProfile?.publications) ? researchProfile.publications.length : 0;
  const domainCount = Array.isArray(researchProfile?.researchDomains) ? researchProfile.researchDomains.length : 0;
  const topicCount = Array.isArray(researchProfile?.preferredTopics) ? researchProfile.preferredTopics.length : 0;
  const researchSkillScore = clamp(skills.length * 7 + domainCount * 8);
  const publicationReadiness = clamp(publicationCount * 20 + projects.filter((project) => ["Publishing", "Completed"].includes(project.status)).length * 14 + (careerTwin?.portfolioQuality ?? 0) * 0.25);
  const collaborationReadiness = clamp(projects.length * 12 + (researchProfile?.availability === "high" ? 18 : 8) + (innovationScore?.scores?.collaboration ?? 0) * 0.35);
  const innovation = clamp((innovationScore?.scores?.innovation ?? 0) * 0.65 + topicCount * 6 + projects.length * 8);
  const overall = clamp((researchSkillScore + publicationReadiness + collaborationReadiness + innovation) / 4);
  return { researchSkillScore, publicationReadiness, collaborationReadiness, innovationScore: innovation, overall };
}

function scoreResearchMatch(me: any, other: any) {
  const domainOverlap = overlap(list(me?.researchDomains), list(other.researchDomains));
  const interestOverlap = overlap(list(me?.interests), list(other.interests));
  const skillOverlap = overlap(list(me?.skills), list(other.skills));
  const modeBonus = me?.preferredCollaborationMode === other.preferredCollaborationMode ? 8 : 0;
  const score = clamp(35 + domainOverlap.length * 14 + interestOverlap.length * 10 + skillOverlap.length * 6 + modeBonus);
  return {
    matchScore: score,
    compatibilityReason: domainOverlap.length || interestOverlap.length ? `Shared research fit across ${[...domainOverlap, ...interestOverlap].slice(0, 4).join(", ")}.` : "Potential collaborator with complementary research activity.",
    suggestedRole: skillOverlap.includes("python") || skillOverlap.includes("machine learning") ? "Research Engineer" : "Research Collaborator",
    collaborationPotential: score >= 75 ? "High" : score >= 55 ? "Medium" : "Early"
  };
}

function analyzeProject(project: any, profiles: any[], mentors: any[]) {
  const teamSkills = list(profiles.flatMap((profile) => profile.skills ?? []));
  const missingSkills = list(project.requiredSkills).filter((skill) => !teamSkills.includes(skill)).slice(0, 8);
  const missingRoles = missingSkills.map((skill) => `${skill} researcher`).slice(0, 5);
  const recommendedStudents = profiles
    .filter((profile) => String(profile.user?._id ?? profile.user) !== String(project.owner))
    .map((profile) => ({ profile, ...scoreResearchMatch({ researchDomains: [project.domain], interests: project.objectives, skills: project.requiredSkills }, profile) }))
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 5);
  const potentialMentors = mentors.filter((mentor) => list(mentor.researchAreas).includes(String(project.domain).toLowerCase()) || list(mentor.researchAreas).some((area) => list(project.requiredSkills).includes(area))).slice(0, 4);
  return { missingSkills, missingRoles, recommendedStudents, potentialMentors };
}

async function dashboard(userId: any) {
  const [researchProfile, projects, myProjects, mentors, opportunities, readiness, requests] = await Promise.all([
    ResearchProfile.findOne({ user: userId }).populate("user", "displayName email photoURL profile"),
    ResearchProject.find().populate("owner", "displayName email profile").populate("facultyMentor").sort({ updatedAt: -1 }).limit(60),
    ResearchProject.find({ $or: [{ owner: userId }, { "members.user": userId }] }).sort({ updatedAt: -1 }),
    ResearchFacultyMentor.find({ availability: { $ne: "unavailable" } }).sort({ updatedAt: -1 }).limit(50),
    Opportunity.find({ type: { $in: ["Research Program", "Competition", "Fellowship"] }, status: { $in: ["open", "rolling"] } }).sort({ deadline: 1 }).limit(20),
    readinessFor(userId),
    ResearchRequest.find({ $or: [{ requester: userId }, { recipient: userId }] }).sort({ updatedAt: -1 }).limit(20)
  ]);
  const profiles = await ResearchProfile.find({ user: { $ne: userId } }).populate("user", "displayName email photoURL profile").sort({ updatedAt: -1 }).limit(50);
  const collaboratorMatches = researchProfile ? profiles.map((profile) => ({ profile, ...scoreResearchMatch(researchProfile, profile) })).sort((left, right) => right.matchScore - left.matchScore).slice(0, 12) : [];
  const projectAnalyses = projects.slice(0, 12).map((project) => ({ project, ...analyzeProject(project, profiles, mentors) }));
  return { researchProfile, projects, myProjects, mentors, opportunities, readiness, requests, collaboratorMatches, projectAnalyses };
}

export const getResearchHub = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  res.json({ success: true, ...(await dashboard(user.id)) });
});

export const upsertResearchProfile = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const profile = await ResearchProfile.findOneAndUpdate(
    { user: user.id },
    {
      user: user.id,
      researchDomains: cleanDomains(req.body.researchDomains),
      interests: list(req.body.interests),
      publications: Array.isArray(req.body.publications) ? req.body.publications.slice(0, 20) : [],
      researchExperience: req.body.researchExperience || "beginner",
      preferredTopics: list(req.body.preferredTopics),
      researchGoals: list(req.body.researchGoals),
      preferredCollaborationMode: req.body.preferredCollaborationMode || "remote",
      availability: req.body.availability || "medium",
      skills: list(req.body.skills),
      bio: typeof req.body.bio === "string" ? req.body.bio.trim() : ""
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, profile });
});

export const createResearchProject = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const project = await ResearchProject.create({
    owner: user.id,
    title: req.body.title,
    abstract: req.body.abstract,
    domain: req.body.domain,
    problemStatement: req.body.problemStatement,
    objectives: list(req.body.objectives),
    requiredSkills: list(req.body.requiredSkills),
    teamSize: Number(req.body.teamSize || 4),
    duration: req.body.duration || "3-6 months",
    publicationGoal: req.body.publicationGoal || "Conference or journal submission",
    facultyMentor: req.body.facultyMentor || undefined,
    status: req.body.status || "Open",
    members: [{ user: user.id, role: "Research Lead" }]
  });
  res.status(StatusCodes.CREATED).json({ success: true, project });
});

export const createFacultyMentor = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const mentor = await ResearchFacultyMentor.create({
    name: req.body.name,
    department: req.body.department,
    expertise: req.body.expertise,
    researchAreas: list(req.body.researchAreas),
    publications: list(req.body.publications),
    availability: req.body.availability || "open",
    contactInformation: req.body.contactInformation || "",
    createdBy: user.id
  });
  res.status(StatusCodes.CREATED).json({ success: true, mentor });
});

export const requestResearchCollaboration = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const recipient = req.body.recipient ? objectId(req.body.recipient) : undefined;
  const project = req.body.project ? objectId(req.body.project) : undefined;
  const facultyMentor = req.body.facultyMentor ? objectId(req.body.facultyMentor) : undefined;
  const request = await ResearchRequest.create({
    requester: user.id,
    recipient,
    project,
    facultyMentor,
    type: req.body.type || "collaboration",
    message: req.body.message || "",
    matchScore: Number(req.body.matchScore || 0),
    matchingReasons: list(req.body.matchingReasons)
  });
  const notificationUser = recipient || (project ? (await ResearchProject.findById(project))?.owner : null);
  if (notificationUser) {
    await Notification.create({ user: notificationUser, type: "research_request", title: "New research request", body: `${user.displayName} sent a research collaboration request.`, metadata: { researchRequestId: request._id }, priority: "high" });
  }
  res.status(StatusCodes.CREATED).json({ success: true, request });
});

export const generateResearchTopics = asyncHandler(async (req, res) => {
  ensureUser(req);
  const domain = String(req.body.domain || "Machine Learning");
  const interests = list(req.body.interests).slice(0, 8);
  const fallback = interests.length ? interests : ["student research", "engineering innovation"];
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.35 } });
    const result = await model.generateContent(`
You are an AI research advisor for engineering students.
Generate 10 innovative research topics with difficulty level and impact score.
Return JSON: {"topics":[{"title":"","difficulty":"Beginner|Intermediate|Advanced","impactScore":0,"whyItMatters":"","suggestedDataset":""}]}
Domain: ${domain}
Interests: ${JSON.stringify(fallback)}
`);
    res.json({ success: true, ...(JSON.parse(result.response.text()) as object) });
  } catch {
    res.json({
      success: true,
      topics: fallback.slice(0, 10).map((interest, index) => ({
        title: `${domain} research on ${interest}`,
        difficulty: index % 3 === 0 ? "Advanced" : index % 2 === 0 ? "Intermediate" : "Beginner",
        impactScore: clamp(70 + index * 2),
        whyItMatters: "Aligned with your selected research interests.",
        suggestedDataset: "Use public academic datasets or university lab data where available."
      }))
    });
  }
});

export const askResearchAssistant = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const question = String(req.body.question || "").trim();
  if (!question) throw new HttpError(StatusCodes.BAD_REQUEST, "QUESTION_REQUIRED", "Ask a research question.");
  const data = await dashboard(user.id);
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.3 } });
    const result = await model.generateContent(`
You are EngineerConnect AI Research Assistant.
Answer concisely using this student's research data.
Question: ${question}
Research profile: ${JSON.stringify(data.researchProfile)}
Readiness: ${JSON.stringify(data.readiness)}
Projects: ${JSON.stringify(data.myProjects.slice(0, 5))}
`);
    res.json({ success: true, answer: result.response.text() });
  } catch {
    res.json({ success: true, answer: "Start by narrowing your research domain, choosing one problem statement, reading 5 recent papers, and forming a small team with complementary skills." });
  }
});
