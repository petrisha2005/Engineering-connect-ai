import { StatusCodes } from "http-status-codes";
import type { Types } from "mongoose";
import { Application } from "../models/Application.js";
import { Connection } from "../models/Connection.js";
import { Match } from "../models/Match.js";
import { Message } from "../models/Message.js";
import { ModerationLog } from "../models/ModerationLog.js";
import { Notification } from "../models/Notification.js";
import { Profile } from "../models/Profile.js";
import { Project } from "../models/Project.js";
import { Roadmap } from "../models/Roadmap.js";
import { getSkillsToImprove } from "../services/skillRecommendationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function ensureUser(req: Express.Request) {
  if (!req.user) throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  return req.user;
}

function lastSevenDays() {
  const days: Array<{ label: string; start: Date; end: Date }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 6; index >= 0; index -= 1) {
    const start = new Date(today);
    start.setDate(today.getDate() - index);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    days.push({ label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), start, end });
  }

  return days;
}

function requiredProfileCompletion(profile: any) {
  const items = [
    Boolean(profile?.name),
    Boolean(profile?.college),
    Boolean(profile?.branch),
    Boolean(profile?.year),
    Boolean(profile?.skills?.length),
    Boolean(profile?.interests?.length),
    Boolean(profile?.goals?.length),
    Boolean(profile?.github),
    Boolean(profile?.linkedin)
  ];

  return Math.round((items.filter(Boolean).length / items.length) * 100);
}

function countByStatus(items: Array<{ status?: string }>) {
  return {
    pending: items.filter((item) => item.status === "pending").length,
    accepted: items.filter((item) => item.status === "accepted").length,
    rejected: items.filter((item) => item.status === "rejected").length
  };
}

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const days = lastSevenDays();

  const [profile, connections, applications, messagesCount, roadmaps, matches, skillsToImprove] = await Promise.all([
    Profile.findOne({ user: user.id }),
    Connection.find({ $or: [{ requesterId: user.id }, { recipientId: user.id }] }).select("status requesterId recipientId createdAt"),
    Application.find({ applicant: user.id, targetType: "project" }).select("status createdAt"),
    Message.countDocuments({ senderId: user.id }),
    Roadmap.find({ user: user.id }).select("createdAt skills phases duration"),
    Match.find({ sourceUser: user.id }).sort({ matchScore: -1 }).limit(8),
    getSkillsToImprove(user.id).catch(() => [])
  ]);

  const userProjects = await Project.find({ owner: user.id }).select("_id createdAt");
  const receivedApplications = await Application.find({ project: { $in: userProjects.map((project) => project._id) }, targetType: "project" }).select("status createdAt");

  const weeklyActivity = await Promise.all(
    days.map(async (day) => {
      const [profileUpdates, connectionCount, applicationCount, messageCount, roadmapCount] = await Promise.all([
        Profile.countDocuments({ user: user.id, updatedAt: { $gte: day.start, $lt: day.end } }),
        Connection.countDocuments({ $or: [{ requesterId: user.id }, { recipientId: user.id }], createdAt: { $gte: day.start, $lt: day.end } }),
        Application.countDocuments({
          $or: [{ applicant: user.id }, { project: { $in: userProjects.map((project) => project._id) } }],
          createdAt: { $gte: day.start, $lt: day.end }
        }),
        Message.countDocuments({ senderId: user.id, createdAt: { $gte: day.start, $lt: day.end } }),
        Roadmap.countDocuments({ user: user.id, createdAt: { $gte: day.start, $lt: day.end } })
      ]);
      return {
        day: day.label,
        profileUpdates,
        connections: connectionCount,
        applications: applicationCount,
        messages: messageCount,
        roadmaps: roadmapCount,
        total: profileUpdates + connectionCount + applicationCount + messageCount + roadmapCount
      };
    })
  );

  const skillMatchChart = matches
    .flatMap((match: any) => match.sharedSkills.map((skill: string) => ({ skill, score: match.matchScore })))
    .reduce<Array<{ skill: string; score: number; count: number }>>((items, item) => {
      const existing = items.find((entry) => entry.skill === item.skill);
      if (existing) {
        existing.score = Math.round((existing.score * existing.count + item.score) / (existing.count + 1));
        existing.count += 1;
      } else {
        items.push({ skill: item.skill, score: item.score, count: 1 });
      }
      return items;
    }, [])
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  res.json({
    success: true,
    profileCompletion: requiredProfileCompletion(profile),
    connectionsCount: connections.filter((connection: any) => String(connection.requesterId) === String(user.id)).length,
    acceptedConnectionsCount: connections.filter((connection) => connection.status === "accepted").length,
    projectApplicationsCount: applications.length,
    projectApplicationsReceivedCount: receivedApplications.length,
    messagesCount,
    roadmapsCount: roadmaps.length,
    weeklyActivity,
    skillMatchChart,
    skillsToImprove
  });
});

export const getActivityAnalytics = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const ownedProjects = await Project.find({ owner: user.id }).select("_id");
  const [sentConnections, myApplications, notifications] = await Promise.all([
    Connection.find({ requesterId: user.id }).select("status createdAt"),
    Application.find({ applicant: user.id, targetType: "project" }).select("status createdAt"),
    Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(12)
  ]);

  const receivedApplications = await Application.find({ project: { $in: ownedProjects.map((project) => project._id) }, targetType: "project" }).select("status createdAt");

  res.json({
    success: true,
    connectionRequestStatus: countByStatus(sentConnections),
    projectApplicationStatus: countByStatus(myApplications),
    receivedApplicationStatus: countByStatus(receivedApplications),
    recentActivityTimeline: notifications.map((notification) => ({
      id: notification._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt
    }))
  });
});

export const getProjectsAnalytics = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const projects = await Project.find({ owner: user.id }).select("title members maxMembers requiredSkills createdAt");
  const applications = await Application.find({ project: { $in: projects.map((project) => project._id) }, targetType: "project" }).select("status project");

  res.json({
    success: true,
    userProjects: projects,
    applicationStats: countByStatus(applications),
    teamCompletionStats: projects.map((project: any) => ({
      projectId: project._id,
      title: project.title,
      currentMembers: project.members.length,
      maxMembers: project.maxMembers,
      percent: Math.min(100, Math.round((project.members.length / Math.max(project.maxMembers, 1)) * 100)),
      skills: project.requiredSkills
    }))
  });
});

function parseDurationWeeks(duration = "") {
  const lower = duration.toLowerCase();
  const firstNumber = Number(lower.match(/\d+/)?.[0] ?? 0);
  if (!firstNumber) return 0;
  if (lower.includes("month")) return firstNumber * 4;
  return firstNumber;
}

export const getRoadmapsAnalytics = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const roadmaps = await Roadmap.find({ user: user.id }).sort({ createdAt: -1 }).limit(10);
  const latest = roadmaps[0] as any;

  const phases = latest?.phases ?? [];
  const roadmapProgress = phases.map((phase: any, index: number) => ({
    phase: phase.title || `Phase ${index + 1}`,
    duration: phase.duration || "",
    checklistItems: phase.milestoneChecklist?.length ?? 0,
    skills: phase.skills?.length ?? 0,
    projects: (phase.miniProjects?.length ?? 0) + (phase.projects?.length ?? 0),
    progress: Math.min(100, Math.round((((phase.skills?.length ?? 0) + (phase.milestoneChecklist?.length ?? 0)) / 10) * 100))
  }));

  const allSkills = roadmaps.flatMap((roadmap: any) => roadmap.skills ?? []);
  const skillPriorityBreakdown = [...new Set(allSkills)].slice(0, 12).map((skill, index) => ({
    skill,
    priority: index < 4 ? "High" : index < 8 ? "Medium" : "Low",
    value: index < 4 ? 90 : index < 8 ? 60 : 35
  }));

  const roadmapDurationBreakdown = phases.map((phase: any, index: number) => ({
    name: phase.title || `Phase ${index + 1}`,
    weeks: parseDurationWeeks(phase.duration) || 1
  }));

  res.json({ success: true, roadmapProgress, skillPriorityBreakdown, roadmapDurationBreakdown });
});

export const getMessageHealthAnalytics = asyncHandler(async (req, res) => {
  const user = ensureUser(req);
  const logs = await ModerationLog.find({ userId: user.id }).sort({ createdAt: -1 }).limit(200);
  res.json({
    success: true,
    messageHealth: {
      allowed: logs.filter((log) => log.action === "allowed").length,
      warned: logs.filter((log) => log.action === "warned").length,
      blocked: logs.filter((log) => log.action === "blocked" || log.action === "restricted").length
    }
  });
});
