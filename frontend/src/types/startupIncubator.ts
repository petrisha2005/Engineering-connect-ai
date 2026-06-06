export type StartupStage = "Idea" | "Validation" | "MVP" | "Beta" | "Launch" | "Growth";

export interface StartupProfile {
  _id: string;
  startupName: string;
  industry: string;
  stage: StartupStage;
  problemStatement: string;
  solution: string;
  targetAudience: string;
  businessModel: string;
  founderIds: string[];
  currentProgress: number;
  fundingStatus: "Bootstrapped" | "Seeking" | "Funded" | "Not Needed";
  requiredSkills: string[];
  missingRoles: string[];
  activityLog: Array<{ type: string; message: string; createdAt: string }>;
}

export interface StartupMilestone {
  _id: string;
  phase: "Research" | "Prototype" | "MVP" | "Beta Testing" | "Launch";
  title: string;
  tasks: string[];
  timeline: string;
  requiredSkills: string[];
  progress: number;
  completed: boolean;
}

export interface IdeaValidation {
  validationScore: number;
  marketPotential: number;
  innovationScore: number;
  technicalDifficulty: number;
  risks: string[];
  recommendations: string[];
  competitors: Array<{ name: string; positioning: string; differentiator: string }>;
  opportunities: string[];
}

export interface StartupReadiness {
  startupReadiness: number;
  executionReadiness: number;
  marketReadiness: number;
  teamReadiness: number;
  investorReadinessScore: number;
  overallStartupScore: number;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  nextSteps: string[];
}

export interface PitchDeck {
  slides: Array<{ title: string; content: string; speakerNotes: string }>;
  exportText: string;
}

export interface StartupDetail {
  startup: StartupProfile;
  validation: IdeaValidation | null;
  milestones: StartupMilestone[];
  readiness: StartupReadiness | null;
  pitchDeck: PitchDeck | null;
  recommendedFounders: Array<{ founder: { _id: string; userId?: { _id: string; displayName?: string; email?: string }; founderType: string; skills: string[] }; matchScore: number; suggestedRole: string; reason: string }>;
}

export interface StartupIncubatorResponse {
  success: boolean;
  startups: StartupProfile[];
  details: StartupDetail[];
}
