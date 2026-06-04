import { z } from "zod";
import { env } from "../config/env.js";
import { gemini } from "../config/gemini.js";
import { Roadmap } from "../models/Roadmap.js";

const weeklyPlanSchema = z.object({
  week: z.number().int().min(1).max(26),
  tasks: z.array(z.string().min(1).max(240)).min(2).max(12)
});

const phaseSchema = z.object({
  phaseNumber: z.number().int().min(1).max(12),
  title: z.string().min(1).max(140),
  duration: z.string().min(1).max(80),
  goal: z.string().min(1).max(800),
  skills: z.array(z.string().min(1).max(100)).min(3).max(30),
  tools: z.array(z.string().min(1).max(100)).min(2).max(30),
  weeklyPlan: z.array(weeklyPlanSchema).min(1).max(8),
  miniProjects: z.array(z.string().min(1).max(240)).min(1).max(20),
  resourcesToSearch: z.array(z.string().min(1).max(240)).min(2).max(20),
  milestoneChecklist: z.array(z.string().min(1).max(240)).min(2).max(20)
});

const portfolioProjectSchema = z.object({
  title: z.string().min(1).max(180),
  description: z.string().min(1).max(1200),
  features: z.array(z.string().min(1).max(200)).min(2).max(20),
  skillsUsed: z.array(z.string().min(1).max(100)).min(2).max(30),
  difficulty: z.string().min(1).max(80),
  resumeValue: z.string().min(1).max(80)
});

const certificationSchema = z.object({
  name: z.string().min(1).max(180),
  whyUseful: z.string().min(1).max(800)
});

const interviewPreparationSchema = z.object({
  technicalTopics: z.array(z.string().min(1).max(200)).min(3).max(30),
  codingTopics: z.array(z.string().min(1).max(200)).min(3).max(30),
  systemDesignBasics: z.array(z.string().min(1).max(200)).min(2).max(30),
  hrQuestions: z.array(z.string().min(1).max(240)).min(2).max(30)
});

const finalPlanSchema = z.object({
  dayRange: z.string().min(1).max(80),
  focus: z.string().min(1).max(240),
  actions: z.array(z.string().min(1).max(240)).min(2).max(12)
});

const generatedRoadmapSchema = z.object({
  careerGoal: z.string().min(1).max(160),
  overview: z.string().min(1).max(2000),
  duration: z.string().min(1).max(80),
  difficulty: z.string().min(1).max(80),
  requiredMindset: z.array(z.string().min(1).max(160)).min(2).max(20),
  phases: z.array(phaseSchema).min(4).max(8),
  portfolioProjects: z.array(portfolioProjectSchema).min(3).max(8),
  certifications: z.array(certificationSchema).max(12).default([]),
  interviewPreparation: interviewPreparationSchema,
  commonMistakes: z.array(z.string().min(1).max(240)).min(3).max(20),
  final30DayPlan: z.array(finalPlanSchema).min(3).max(8),
  nextSteps: z.array(z.string().min(1).max(240)).min(3).max(20)
});

type GeneratedRoadmap = z.infer<typeof generatedRoadmapSchema>;

function extractJson(text: string) {
  const withoutFence = text.replace(/```json/gi, "```").replace(/```JSON/g, "```");
  const fenced = withoutFence.match(/```\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? withoutFence;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Gemini response did not contain JSON");
  }

  return candidate.slice(firstBrace, lastBrace + 1);
}

function normalizeCareerGoal(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function rolePreset(careerGoal: string) {
  const lower = careerGoal.toLowerCase();

  if (lower.includes("data") || lower.includes("scientist") || lower.includes("machine learning") || lower.includes("ml")) {
    return {
      skills: ["Python", "NumPy", "Pandas", "Statistics", "Probability", "SQL", "Matplotlib", "Scikit-learn", "Feature engineering", "Model evaluation"],
      tools: ["Jupyter Notebook", "Google Colab", "Kaggle", "GitHub", "PostgreSQL", "Scikit-learn"],
      projects: ["Exploratory data analysis on a real dataset", "Customer churn prediction model", "Interactive analytics dashboard"],
      interview: ["SQL joins and aggregations", "Bias-variance tradeoff", "Model metrics", "Feature engineering choices", "Explaining projects with business impact"],
      certifications: ["Google Data Analytics Professional Certificate", "IBM Data Science Professional Certificate"]
    };
  }

  if (lower.includes("cyber") || lower.includes("security") || lower.includes("soc")) {
    return {
      skills: ["Networking basics", "Linux commands", "Security fundamentals", "OWASP Top 10", "Vulnerability assessment", "SIEM basics", "Threat detection", "Incident response"],
      tools: ["Linux", "Wireshark", "Nmap", "Burp Suite", "TryHackMe", "Splunk Community", "OWASP Juice Shop"],
      projects: ["Home lab network scan report", "OWASP Juice Shop vulnerability writeups", "SIEM alert investigation portfolio"],
      interview: ["TCP/IP basics", "OWASP vulnerabilities", "Log analysis", "Incident response steps", "Risk and vulnerability prioritization"],
      certifications: ["Google Cybersecurity Professional Certificate", "CompTIA Security+ fundamentals"]
    };
  }

  return {
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Node.js", "Express.js", "REST APIs", "Authentication", "MongoDB", "PostgreSQL", "Git/GitHub", "Deployment"],
    tools: ["VS Code", "Git", "GitHub", "Chrome DevTools", "Postman", "Vercel", "Render", "MongoDB Atlas"],
    projects: ["Responsive portfolio website", "Student project collaboration platform", "Full-stack dashboard with authentication"],
    interview: ["JavaScript closures", "React hooks", "REST API design", "Database schema design", "Authentication flow", "Basic system design"],
    certifications: ["Meta Front-End Developer Professional Certificate", "freeCodeCamp JavaScript Algorithms and Data Structures"]
  };
}

function fallbackRoadmap(careerGoal: string): GeneratedRoadmap {
  const preset = rolePreset(careerGoal);

  return {
    careerGoal,
    overview: `A detailed 6-month roadmap for becoming a ${careerGoal}, focused on role-specific skills, tools, weekly execution, practical portfolio projects, and interview readiness.`,
    duration: "6 months",
    difficulty: "Beginner to Intermediate",
    requiredMindset: ["Build every week", "Learn through projects", "Document work on GitHub", "Practice explaining technical decisions"],
    phases: [
      {
        phaseNumber: 1,
        title: "Role Foundations",
        duration: "Weeks 1-4",
        goal: `Build the core foundations needed for ${careerGoal} work.`,
        skills: preset.skills.slice(0, 6),
        tools: preset.tools.slice(0, 4),
        weeklyPlan: [
          { week: 1, tasks: [`Study ${preset.skills[0]} and ${preset.skills[1]}`, "Create a notes repo on GitHub", "Complete two small exercises"] },
          { week: 2, tasks: [`Practice ${preset.skills[2]} with mini tasks`, "Document mistakes and fixes", "Share progress in your profile"] },
          { week: 3, tasks: [`Learn ${preset.skills[3]} and ${preset.skills[4]}`, "Build a small guided project"] },
          { week: 4, tasks: ["Revise foundations", "Create a clean README", "Prepare a short demo explanation"] }
        ],
        miniProjects: [preset.projects[0], `Beginner ${careerGoal} practice lab`],
        resourcesToSearch: [`${careerGoal} beginner roadmap`, `${preset.skills[0]} official docs`, `${preset.skills[1]} practice exercises`],
        milestoneChecklist: ["Can explain the role basics", "Can use core tools", "Has one small project pushed to GitHub"]
      },
      {
        phaseNumber: 2,
        title: "Core Tools and Workflows",
        duration: "Weeks 5-8",
        goal: "Become comfortable with the tools and workflows used in real projects.",
        skills: preset.skills.slice(4, 10),
        tools: preset.tools,
        weeklyPlan: [
          { week: 5, tasks: [`Learn ${preset.skills[4]} deeply`, "Rebuild a small example without copying"] },
          { week: 6, tasks: [`Practice ${preset.skills[5]} and ${preset.skills[6]}`, "Write clear commit messages"] },
          { week: 7, tasks: [`Apply ${preset.skills[7]} in a project`, "Ask for peer feedback"] },
          { week: 8, tasks: ["Refactor the project", "Add documentation", "Record a demo walkthrough"] }
        ],
        miniProjects: [preset.projects[1]],
        resourcesToSearch: [`${careerGoal} tools tutorial`, `${preset.tools[0]} workflow`, `${preset.skills[5]} project tutorial`],
        milestoneChecklist: ["Can set up the role workflow", "Can debug common issues", "Has a documented project"]
      },
      {
        phaseNumber: 3,
        title: "Portfolio Project Sprint",
        duration: "Weeks 9-16",
        goal: "Build career-specific projects that prove practical ability.",
        skills: preset.skills.slice(6),
        tools: preset.tools,
        weeklyPlan: [
          { week: 9, tasks: ["Choose a portfolio project", "Write feature list", "Create GitHub issues"] },
          { week: 10, tasks: ["Build the first working version", "Test core functionality"] },
          { week: 11, tasks: ["Add advanced features", "Clean the UI or report"] },
          { week: 12, tasks: ["Deploy or publish the project", "Write README and lessons learned"] }
        ],
        miniProjects: preset.projects,
        resourcesToSearch: [`${careerGoal} portfolio projects`, `${careerGoal} GitHub examples`, `${careerGoal} project README`],
        milestoneChecklist: ["Has one strong portfolio project", "Can explain technical choices", "Can show measurable outcome"]
      },
      {
        phaseNumber: 4,
        title: "Interview and Internship Readiness",
        duration: "Weeks 17-24",
        goal: "Prepare for interviews, applications, and real collaboration.",
        skills: preset.interview,
        tools: ["GitHub", "LinkedIn", "Resume", "Mock interview platforms"],
        weeklyPlan: [
          { week: 17, tasks: ["Revise core technical topics", "Create flashcards"] },
          { week: 18, tasks: ["Practice coding or role-specific questions", "Explain one project out loud"] },
          { week: 19, tasks: ["Do one mock interview", "Improve weak areas"] },
          { week: 20, tasks: ["Apply to internships or teams", "Post project progress online"] }
        ],
        miniProjects: ["Project walkthrough deck", "Interview question notebook"],
        resourcesToSearch: [`${careerGoal} interview questions`, `${careerGoal} resume projects`, "mock interview practice"],
        milestoneChecklist: ["Can explain two projects", "Has a polished resume", "Has applied to relevant opportunities"]
      }
    ],
    portfolioProjects: preset.projects.map((title, index) => ({
      title,
      description: `A ${careerGoal}-specific portfolio project that demonstrates practical use of ${preset.skills.slice(index, index + 4).join(", ")}.`,
      features: ["Clear problem statement", "Documented implementation", "GitHub README", "Demo or screenshots"],
      skillsUsed: preset.skills.slice(index, index + 5),
      difficulty: index === 0 ? "Beginner" : "Intermediate",
      resumeValue: "High"
    })),
    certifications: preset.certifications.map((name) => ({ name, whyUseful: `Builds structured, recognized knowledge for ${careerGoal} roles.` })),
    interviewPreparation: {
      technicalTopics: preset.interview,
      codingTopics: ["Arrays", "Strings", "Hash maps", "Recursion", "Basic dynamic programming"],
      systemDesignBasics: ["Client-server architecture", "API design", "Data modeling", "Caching basics"],
      hrQuestions: ["Tell me about yourself", "Explain your best project", "How do you handle team conflicts?", "Why this role?"]
    },
    commonMistakes: ["Watching tutorials without building", "Not documenting projects", "Skipping fundamentals", "Applying without a clear portfolio"],
    final30DayPlan: [
      { dayRange: "Days 1-7", focus: "Choose and scope one strong project", actions: ["Write the problem statement", "Create GitHub repo", "Plan features"] },
      { dayRange: "Days 8-21", focus: "Build and document the project", actions: ["Implement core features", "Test edge cases", "Write README"] },
      { dayRange: "Days 22-30", focus: "Publish and prepare interviews", actions: ["Deploy or publish", "Record demo", "Practice project explanation"] }
    ],
    nextSteps: ["Pick one project and start this week", "Push progress to GitHub", "Update your profile", "Apply after two strong projects"]
  };
}

function buildPrompt(careerGoal: string) {
  return `
You are an expert career mentor for engineering students.

Create a detailed, practical, role-specific career roadmap for the target career: ${careerGoal}.

Important rules:
1. Do NOT give generic advice.
2. Do NOT reuse the same roadmap for all careers.
3. Make the roadmap specific to the target role.
4. Include exact skills, tools, technologies, concepts, projects, milestones, and interview topics.
5. Assume the user is an engineering student starting from beginner/intermediate level.
6. Give a realistic 6-month roadmap.
7. Break the roadmap into phases.
8. Each phase must include phaseNumber, title, duration, goal, skills, tools, weeklyPlan, miniProjects, resourcesToSearch, and milestoneChecklist.
9. Include 3-5 portfolio projects specific to the career.
10. Include certifications if relevant.
11. Include interview preparation topics.
12. Include common mistakes to avoid.
13. Include final 30-day action plan.
14. Output only valid JSON.
15. Do not use markdown.
16. Do not wrap JSON in \`\`\`json.

Return this exact JSON structure:
{
  "careerGoal": "${careerGoal}",
  "overview": "Detailed explanation of the role and what the student will learn.",
  "duration": "6 months",
  "difficulty": "Beginner to Intermediate",
  "requiredMindset": ["Build consistently", "Learn by projects", "Document everything on GitHub"],
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Role-specific phase title",
      "duration": "Weeks 1-4",
      "goal": "Specific goal of this phase.",
      "skills": ["Exact skill 1", "Exact skill 2"],
      "tools": ["Exact tool 1", "Exact tool 2"],
      "weeklyPlan": [
        { "week": 1, "tasks": ["Specific task", "Specific task"] }
      ],
      "miniProjects": ["Specific mini project"],
      "resourcesToSearch": ["Specific resource search phrase"],
      "milestoneChecklist": ["Specific milestone"]
    }
  ],
  "portfolioProjects": [
    {
      "title": "Career-specific project title",
      "description": "What to build and why it matters.",
      "features": ["Feature 1", "Feature 2"],
      "skillsUsed": ["Skill 1", "Tool 1"],
      "difficulty": "Intermediate",
      "resumeValue": "High"
    }
  ],
  "certifications": [
    { "name": "Relevant certification name", "whyUseful": "Why it helps this role." }
  ],
  "interviewPreparation": {
    "technicalTopics": ["Role-specific technical topic"],
    "codingTopics": ["Arrays", "Strings", "Hash maps"],
    "systemDesignBasics": ["Role-relevant system design basic"],
    "hrQuestions": ["Tell me about yourself"]
  },
  "commonMistakes": ["Role-specific mistake to avoid"],
  "final30DayPlan": [
    { "dayRange": "Days 1-7", "focus": "Specific focus", "actions": ["Specific action"] }
  ],
  "nextSteps": ["Specific next step"]
}

Make the content obviously different for ${careerGoal}. Use real technologies and practical projects for this exact target career.
`;
}

function parseRoadmap(rawAiResponse: string, careerGoal: string) {
  try {
    const parsedJson = JSON.parse(extractJson(rawAiResponse));
    return generatedRoadmapSchema.parse({
      ...parsedJson,
      careerGoal: parsedJson.careerGoal || careerGoal
    });
  } catch {
    return fallbackRoadmap(careerGoal);
  }
}

export async function generateAndSaveRoadmap(userId: unknown, careerGoalInput: string) {
  const careerGoal = normalizeCareerGoal(careerGoalInput);

  if (!careerGoal) {
    throw new Error("Career goal is required");
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing");
  }

  const modelName = "gemini-1.5-flash";
  let rawAiResponse = "";

  try {
    const model = gemini.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.72,
        topP: 0.9
      }
    });

    const result = await model.generateContent(buildPrompt(careerGoal));
    rawAiResponse = result.response.text();
  } catch {
    rawAiResponse = JSON.stringify(fallbackRoadmap(careerGoal));
  }

  const roadmapData = parseRoadmap(rawAiResponse, careerGoal);
  const skills = [...new Set(roadmapData.phases.flatMap((phase) => [...phase.skills, ...phase.tools]))];
  const projects = roadmapData.portfolioProjects.map((project) => project.title);
  const recommendedProjects = roadmapData.portfolioProjects.map((project) => ({
    title: project.title,
    description: project.description,
    skills: project.skillsUsed
  }));

  const roadmap = await Roadmap.create({
    user: userId,
    userId,
    careerGoal: roadmapData.careerGoal,
    desiredCareer: roadmapData.careerGoal,
    overview: roadmapData.overview,
    duration: roadmapData.duration,
    difficulty: roadmapData.difficulty,
    requiredMindset: roadmapData.requiredMindset,
    phases: roadmapData.phases.map((phase) => ({
      ...phase,
      projects: phase.miniProjects,
      resources: phase.resourcesToSearch
    })),
    portfolioProjects: roadmapData.portfolioProjects,
    recommendedProjects,
    skills,
    projects,
    certifications: roadmapData.certifications,
    interviewPreparation: roadmapData.interviewPreparation,
    commonMistakes: roadmapData.commonMistakes,
    final30DayPlan: roadmapData.final30DayPlan,
    nextSteps: roadmapData.nextSteps,
    rawAiResponse,
    model: modelName
  });

  return roadmap;
}
