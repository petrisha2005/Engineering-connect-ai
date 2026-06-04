import type { Types } from "mongoose";
import { Profile } from "../models/Profile.js";
import { Project } from "../models/Project.js";
import { Roadmap } from "../models/Roadmap.js";

export interface SkillSuggestion {
  skill: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  source: "Career Goal" | "Career Roadmap" | "Project Marketplace";
}

interface LeanProfileForSkills {
  skills?: string[];
  goals?: string[];
}

interface LeanProjectForSkills {
  requiredSkills?: string[];
}

interface LeanRoadmapForSkills {
  careerGoal?: string;
  desiredCareer?: string;
  skills?: string[];
  phases?: Array<{
    skills?: string[];
    tools?: string[];
    miniProjects?: string[];
    resourcesToSearch?: string[];
  }>;
  portfolioProjects?: Array<{
    skillsUsed?: string[];
  }>;
}

const GENERIC_SKILLS = new Set([
  "core fundamentals",
  "problem solving",
  "technical communication",
  "project planning",
  "implementation",
  "debugging",
  "portfolio storytelling",
  "interview practice",
  "system thinking",
  "research",
  "documentation",
  "communication",
  "teamwork",
  "leadership",
  "collaboration"
]);

const SKILL_ALIASES = new Map<string, string>([
  ["js", "JavaScript"],
  ["javascript", "JavaScript"],
  ["reactjs", "React"],
  ["react.js", "React"],
  ["react", "React"],
  ["node", "Node.js"],
  ["nodejs", "Node.js"],
  ["node.js", "Node.js"],
  ["express", "Express.js"],
  ["expressjs", "Express.js"],
  ["express.js", "Express.js"],
  ["mongo", "MongoDB"],
  ["mongodb", "MongoDB"],
  ["rest", "REST APIs"],
  ["rest api", "REST APIs"],
  ["rest apis", "REST APIs"],
  ["api", "REST APIs"],
  ["apis", "REST APIs"],
  ["auth", "Authentication"],
  ["authentication", "Authentication"],
  ["github", "GitHub"],
  ["git hub", "GitHub"],
  ["git", "Git"],
  ["postgres", "PostgreSQL"],
  ["postgresql", "PostgreSQL"],
  ["tailwind", "Tailwind CSS"],
  ["tailwindcss", "Tailwind CSS"],
  ["ml", "Machine Learning"],
  ["machine learning", "Machine Learning"],
  ["sklearn", "Scikit-learn"],
  ["scikit learn", "Scikit-learn"],
  ["scikit-learn", "Scikit-learn"],
  ["numpy", "NumPy"],
  ["pandas", "Pandas"],
  ["sql", "SQL"],
  ["owasp", "OWASP"],
  ["siem", "SIEM"],
  ["linux", "Linux"],
  ["aws", "AWS"],
  ["gcp", "Google Cloud"],
  ["google cloud", "Google Cloud"],
  ["ci cd", "CI/CD"],
  ["ci/cd", "CI/CD"],
  ["ui ux", "UI/UX"],
  ["ui/ux", "UI/UX"]
]);

const ROLE_SKILL_MAP: Array<{ patterns: RegExp[]; skills: string[] }> = [
  {
    patterns: [/full\s*stack/i],
    skills: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Node.js", "Express.js", "MongoDB", "REST APIs", "Authentication", "Git", "GitHub", "Deployment"]
  },
  {
    patterns: [/front\s*end/i, /frontend/i],
    skills: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Tailwind CSS", "Responsive Design", "API Integration", "Git", "UI Components"]
  },
  {
    patterns: [/back\s*end/i, /backend/i],
    skills: ["Node.js", "Express.js", "REST APIs", "MongoDB", "PostgreSQL", "Authentication", "JWT", "API Security", "Docker", "Deployment"]
  },
  {
    patterns: [/data\s*scientist/i, /data\s*science/i],
    skills: ["Python", "NumPy", "Pandas", "Statistics", "Probability", "SQL", "Data Visualization", "Machine Learning", "Scikit-learn", "Model Evaluation"]
  },
  {
    patterns: [/ai\s*engineer/i, /ml\s*engineer/i, /machine\s*learning\s*engineer/i],
    skills: ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "NLP", "Computer Vision", "Model Deployment", "MLOps"]
  },
  {
    patterns: [/cyber/i, /security/i, /soc/i],
    skills: ["Networking", "Linux", "OWASP", "Vulnerability Assessment", "Burp Suite", "Nmap", "SIEM", "Threat Detection", "Incident Response"]
  },
  {
    patterns: [/cloud/i],
    skills: ["Linux", "Networking", "AWS", "Azure", "Google Cloud", "IAM", "Docker", "Kubernetes", "Serverless", "CI/CD"]
  },
  {
    patterns: [/ui\/ux/i, /ui\s*ux/i, /ux\s*designer/i, /product\s*designer/i],
    skills: ["Figma", "Wireframing", "Prototyping", "User Research", "Design Systems", "Usability Testing", "Accessibility", "Portfolio Case Studies"]
  },
  {
    patterns: [/mobile/i, /app\s*developer/i],
    skills: ["Flutter", "Dart", "React Native", "Firebase", "REST APIs", "Mobile UI Design", "State Management", "App Deployment"]
  }
];

function canonicalKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeSkill(value: string) {
  const key = canonicalKey(value);
  if (!key || GENERIC_SKILLS.has(key)) return null;
  return SKILL_ALIASES.get(key) ?? value.trim().replace(/\s+/g, " ");
}

function addCandidate(
  candidates: Map<string, SkillSuggestion & { score: number }>,
  skillValue: string,
  source: SkillSuggestion["source"],
  score: number,
  reason: string
) {
  const skill = normalizeSkill(skillValue);
  if (!skill) return;

  const key = canonicalKey(skill);
  if (!key || GENERIC_SKILLS.has(key)) return;

  const existing = candidates.get(key);
  if (!existing || score > existing.score) {
    candidates.set(key, {
      skill,
      reason,
      priority: score >= 90 ? "High" : score >= 55 ? "Medium" : "Low",
      source,
      score
    });
  }
}

function roleSkillsFor(goals: string[]) {
  const text = goals.join(" ");
  const skills: string[] = [];

  ROLE_SKILL_MAP.forEach((role) => {
    if (role.patterns.some((pattern) => pattern.test(text))) {
      skills.push(...role.skills);
    }
  });

  return skills;
}

function roadmapSkills(roadmap: any) {
  const phaseSkills = (roadmap?.phases ?? []).flatMap((phase: any) => [
    ...(phase.skills ?? []),
    ...(phase.tools ?? []),
    ...(phase.miniProjects ?? []),
    ...(phase.resourcesToSearch ?? [])
  ]);
  const projectSkills = (roadmap?.portfolioProjects ?? []).flatMap((project: any) => project.skillsUsed ?? []);
  return [...(roadmap?.skills ?? []), ...phaseSkills, ...projectSkills];
}

export async function getSkillsToImprove(userId: Types.ObjectId): Promise<SkillSuggestion[]> {
  const [profile, latestRoadmap, projects] = await Promise.all([
    Profile.findOne({ user: userId }).lean(),
    Roadmap.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    Project.find({ status: "open" }).sort({ createdAt: -1 }).limit(12).lean()
  ]);
  const profileData = profile as LeanProfileForSkills | null;
  const roadmapData = latestRoadmap as LeanRoadmapForSkills | null;
  const projectData = projects as LeanProjectForSkills[];

  const profileSkills = new Set((profileData?.skills ?? []).map((skill) => canonicalKey(normalizeSkill(skill) ?? skill)));
  const careerGoals = [...(profileData?.goals ?? []), roadmapData?.careerGoal, roadmapData?.desiredCareer].filter(Boolean) as string[];
  const candidates = new Map<string, SkillSuggestion & { score: number }>();

  roleSkillsFor(careerGoals).forEach((skill, index) => {
    addCandidate(
      candidates,
      skill,
      "Career Goal",
      100 - index,
      `${skill} is important for your ${careerGoals[0] ?? "career"} goal and is missing from your profile.`
    );
  });

  roadmapSkills(roadmapData).forEach((skill, index) => {
    addCandidate(
      candidates,
      skill,
      "Career Roadmap",
      85 - Math.min(index, 35),
      `${skill} appears in your latest career roadmap and is not yet listed in your profile.`
    );
  });

  projectData.flatMap((project) => project.requiredSkills ?? []).forEach((skill, index) => {
    addCandidate(
      candidates,
      skill,
      "Project Marketplace",
      45 - Math.min(index, 20),
      `${skill} is requested by open projects in the marketplace and could help you join more teams.`
    );
  });

  return [...candidates.values()]
    .filter((suggestion) => !profileSkills.has(canonicalKey(suggestion.skill)))
    .sort((left, right) => right.score - left.score || left.skill.localeCompare(right.skill))
    .slice(0, 10)
    .map(({ score: _score, ...suggestion }) => suggestion);
}
