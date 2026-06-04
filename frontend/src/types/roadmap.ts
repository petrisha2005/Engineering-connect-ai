export interface LearningPathItem {
  phaseNumber?: number;
  title: string;
  duration: string;
  goal?: string;
  skills: string[];
  tools?: string[];
  weeklyPlan?: WeeklyPlanItem[];
  miniProjects?: string[];
  projects: string[];
  resourcesToSearch?: string[];
  resources: string[];
  milestoneChecklist?: string[];
}

export interface RecommendedProject {
  title: string;
  description: string;
  skills: string[];
}

export interface PortfolioProject {
  title: string;
  description: string;
  features: string[];
  skillsUsed: string[];
  difficulty: string;
  resumeValue: string;
}

export interface Certification {
  name: string;
  whyUseful: string;
}

export interface WeeklyPlanItem {
  week: number;
  tasks: string[];
}

export interface InterviewPreparation {
  technicalTopics: string[];
  codingTopics: string[];
  systemDesignBasics: string[];
  hrQuestions: string[];
}

export interface Final30DayPlanItem {
  dayRange: string;
  focus: string;
  actions: string[];
}

export interface Roadmap {
  _id: string;
  user: string;
  userId?: string;
  careerGoal: string;
  desiredCareer: string;
  overview: string;
  duration: string;
  difficulty: string;
  requiredMindset?: string[];
  phases: LearningPathItem[];
  recommendedProjects: RecommendedProject[];
  portfolioProjects?: PortfolioProject[];
  skills: string[];
  projects: string[];
  certifications: Array<string | Certification>;
  learningPath?: LearningPathItem[];
  interviewPreparation: string[] | InterviewPreparation;
  commonMistakes?: string[];
  final30DayPlan?: Final30DayPlanItem[];
  nextSteps: string[];
  rawAiResponse: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}
