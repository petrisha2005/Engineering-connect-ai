export type PortfolioType = "Student Portfolio" | "Job Portfolio" | "Startup Founder Portfolio" | "Research Portfolio" | "Freelancer Portfolio";
export type PortfolioThemeName = "Modern Developer" | "AI Engineer" | "Data Scientist" | "Startup Founder" | "Researcher";

export interface PortfolioProject {
  title: string;
  description: string;
  skills: string[];
  impactScore: number;
  links: string[];
}

export interface PortfolioSections {
  heroTitle: string;
  heroSubtitle: string;
  professionalSummary: string;
  aboutMe: string;
  recruiterSummary: string;
  skills: string[];
  projects: PortfolioProject[];
  certifications: string[];
  achievements: string[];
  hackathons: string[];
  research: string[];
  experience: string[];
  careerGoals: string[];
  contact: {
    email?: string;
    github?: string;
    linkedin?: string;
  };
}

export interface PortfolioImprovementEngine {
  missingSections: string[];
  betterProjectDescriptions: string[];
  missingSkills: string[];
  missingCertifications: string[];
  portfolioImprovements: string[];
}

export interface PortfolioProfile {
  _id: string;
  username: string;
  publicPath: string;
  type: PortfolioType;
  theme: PortfolioThemeName;
  published: boolean;
  sections: PortfolioSections;
  improvementEngine: PortfolioImprovementEngine;
  recruiterMode: {
    technicalScore: number;
    innovationScore: number;
    leadershipScore: number;
    careerReadiness: number;
    overallScore: number;
  };
  sourceSummary: {
    skillsCount: number;
    projectsCount: number;
    hackathonsCount: number;
    achievementsCount: number;
    lastGeneratedAt: string;
  };
  updatedAt: string;
}

export interface PortfolioAnalytics {
  portfolioViews: number;
  recruiterViews: number;
  profileClicks: number;
  resumeDownloads: number;
  projectClicks: number;
  events: Array<{ type: string; projectTitle?: string; occurredAt: string }>;
}

export interface PortfolioTheme {
  key: string;
  name: PortfolioThemeName;
  description: string;
  accentColor: string;
}

export interface PortfolioResponse {
  success: boolean;
  portfolio: PortfolioProfile | null;
  analytics?: PortfolioAnalytics | null;
  themes?: PortfolioTheme[];
}
