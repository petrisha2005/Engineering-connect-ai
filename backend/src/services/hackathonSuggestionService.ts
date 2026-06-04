import type { Types } from "mongoose";
import { HackathonTeam } from "../models/HackathonTeam.js";
import { Profile } from "../models/Profile.js";

interface RoleSuggestion {
  role: string;
  candidates: Array<{
    profile: unknown;
    score: number;
    matchingSkills: string[];
    reasons: string[];
  }>;
}

interface LeanRole {
  role: string;
  skills: string[];
}

interface LeanTeam {
  _id: unknown;
  name: string;
  members: Array<{ user: unknown }>;
  requiredRoles: LeanRole[];
  skillsNeeded: string[];
}

interface LeanProfile {
  skills: string[];
  interests: string[];
  availability: "open" | "selective" | "unavailable";
}

function shared(left: string[] = [], right: string[] = []) {
  const rightSet = new Set(right.map((value) => value.toLowerCase()));
  return [...new Set(left.map((value) => value.toLowerCase()).filter((value) => rightSet.has(value)))];
}

export async function suggestHackathonRoles(teamId: string, currentUserId: Types.ObjectId, limit = 5) {
  const team = (await HackathonTeam.findById(teamId).lean()) as LeanTeam | null;

  if (!team) {
    return null;
  }

  const memberIds = new Set(team.members.map((member) => String(member.user)));
  memberIds.add(String(currentUserId));

  const roleSkillPool = team.requiredRoles.flatMap((role) => role.skills);
  const candidateSkills = [...new Set([...team.skillsNeeded, ...roleSkillPool])];

  const profiles = (await Profile.find({
    user: { $nin: [...memberIds] },
    availability: { $ne: "unavailable" },
    ...(candidateSkills.length ? { skills: { $in: candidateSkills } } : {})
  })
    .limit(200)
    .populate("user", "displayName email photoURL")
    .lean()) as unknown as Array<LeanProfile & { [key: string]: unknown }>;

  const roles = team.requiredRoles.length ? team.requiredRoles : [{ role: "Team Member", skills: team.skillsNeeded }];

  const suggestions: RoleSuggestion[] = roles.map((role) => {
    const desiredSkills = [...new Set([...role.skills, ...team.skillsNeeded])];
    const candidates = profiles
      .map((profile) => {
        const matchingSkills = shared(profile.skills, desiredSkills);
        const sharedInterests = shared(profile.interests, team.skillsNeeded);
        const score = Math.min(100, matchingSkills.length * 18 + sharedInterests.length * 6 + (profile.availability === "open" ? 10 : 4));
        const reasons = [
          matchingSkills.length ? `Matches ${matchingSkills.slice(0, 5).join(", ")}` : "",
          sharedInterests.length ? `Related interests: ${sharedInterests.slice(0, 3).join(", ")}` : "",
          profile.availability === "open" ? "Open to collaboration" : ""
        ].filter(Boolean);

        return { profile, score, matchingSkills, reasons };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return { role: role.role, candidates };
  });

  return { team, suggestions };
}
